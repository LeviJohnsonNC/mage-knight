import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  BASE_GAME_EXPECTED,
  seedPresets,
  seedSources,
  type CommunityState,
  type DatasetMode,
  type ExpectedCounts,
  type ImportedDraftRecord,
  type QueueItem,
  type SourcePreset,
  type SourceRecord,
} from "./community";

// Local-only personal settings; the shared dataset lives in Lovable Cloud.
const LS_SETTINGS_KEY = "mk.community.settings.v2";

interface PersonalSettings {
  datasetMode: DatasetMode;
  expectedCounts: ExpectedCounts;
  playMode: "strict" | "assisted";
  presets: SourcePreset[];
  hiddenSeedSourceIds: string[];
}

const defaultSettings: PersonalSettings = {
  datasetMode: "demo_placeholder",
  expectedCounts: BASE_GAME_EXPECTED,
  playMode: "assisted",
  presets: seedPresets(),
  hiddenSeedSourceIds: [],
};

function loadSettings(): PersonalSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const v = localStorage.getItem(LS_SETTINGS_KEY);
    if (!v) return defaultSettings;
    const parsed = JSON.parse(v) as Partial<PersonalSettings>;
    return {
      ...defaultSettings,
      ...parsed,
      expectedCounts: { ...defaultSettings.expectedCounts, ...(parsed.expectedCounts ?? {}) },
      presets: parsed.presets?.length ? parsed.presets : defaultSettings.presets,
      hiddenSeedSourceIds: parsed.hiddenSeedSourceIds ?? [],
    };
  } catch { return defaultSettings; }
}

interface DraftRow { id: string; data: ImportedDraftRecord; published: boolean; created_by: string | null }
interface SourceRow { id: string; data: SourceRecord; created_by: string | null }
interface QueueRow { id: string; data: QueueItem; created_by: string | null }

interface Ctx {
  state: CommunityState;
  // auth
  user: User | null;
  session: Session | null;
  isCurator: boolean;
  signOut: () => Promise<void>;
  // sources
  addSource: (s: SourceRecord) => void;
  updateSource: (id: string, patch: Partial<SourceRecord>) => void;
  removeSource: (id: string) => void;
  // queue
  enqueue: (item: QueueItem) => void;
  enqueueMany: (items: QueueItem[]) => void;
  updateQueue: (id: string, patch: Partial<QueueItem>) => void;
  removeQueue: (id: string) => void;
  // drafts
  addDrafts: (drafts: ImportedDraftRecord[]) => void;
  updateDraft: (id: string, patch: Partial<ImportedDraftRecord>) => void;
  removeDraft: (id: string) => void;
  mergeDrafts: (primaryId: string, secondaryId: string) => void;
  publishDraft: (id: string, published: boolean) => Promise<void>;
  // draft metadata from server
  draftMeta: Record<string, { published: boolean; createdBy: string | null }>;
  // settings
  setDatasetMode: (m: DatasetMode) => void;
  setExpected: (e: Partial<ExpectedCounts>) => void;
  setPlayMode: (m: "strict" | "assisted") => void;
  // presets
  updatePreset: (id: string, patch: Partial<SourcePreset>) => void;
  // util
  exportAll: () => CommunityState;
  importAll: (s: Partial<CommunityState>) => void;
  resetAll: () => void;
  // status
  loading: boolean;
}

const CommunityCtx = createContext<Ctx | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PersonalSettings>(() => loadSettings());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isCurator, setIsCurator] = useState(false);

  const [dbSources, setDbSources] = useState<SourceRecord[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [drafts, setDrafts] = useState<ImportedDraftRecord[]>([]);
  const [draftMeta, setDraftMeta] = useState<Record<string, { published: boolean; createdBy: string | null }>>({});
  const [loading, setLoading] = useState(true);

  // Persist settings
  useEffect(() => {
    try { localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  }, [settings]);

  // Auth
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Curator check
  useEffect(() => {
    let cancelled = false;
    if (!user) { setIsCurator(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      if (cancelled) return;
      setIsCurator((data ?? []).some((r) => r.role === "curator"));
    });
    return () => { cancelled = true; };
  }, [user]);

  // Initial data load + realtime
  const reload = useCallback(async () => {
    setLoading(true);
    const [s, q, d] = await Promise.all([
      supabase.from("community_sources").select("*").order("created_at", { ascending: false }),
      supabase.from("community_queue").select("*").order("created_at", { ascending: false }),
      supabase.from("community_drafts").select("*").order("created_at", { ascending: false }),
    ]);
    const sRows = (s.data ?? []) as unknown as SourceRow[];
    const qRows = (q.data ?? []) as unknown as QueueRow[];
    const dRows = (d.data ?? []) as unknown as DraftRow[];
    setDbSources(sRows.map((r) => r.data));
    setQueue(qRows.map((r) => r.data));
    setDrafts(dRows.map((r) => r.data));
    const meta: Record<string, { published: boolean; createdBy: string | null }> = {};
    for (const r of dRows) meta[r.id] = { published: r.published, createdBy: r.created_by };
    setDraftMeta(meta);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const ch = supabase
      .channel("community_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_sources" }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_queue" }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_drafts" }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [reload]);

  // Merge seeds with DB sources (seeds shown to all; not stored in DB).
  const sources = useMemo<SourceRecord[]>(() => {
    const visibleSeeds = seedSources().filter((s) => !settings.hiddenSeedSourceIds.includes(s.id));
    const dbIds = new Set(dbSources.map((s) => s.id));
    return [...dbSources, ...visibleSeeds.filter((s) => !dbIds.has(s.id))];
  }, [dbSources, settings.hiddenSeedSourceIds]);

  const state: CommunityState = useMemo(() => ({
    sources, queue, drafts,
    datasetMode: settings.datasetMode,
    expectedCounts: settings.expectedCounts,
    presets: settings.presets,
    playMode: settings.playMode,
  }), [sources, queue, drafts, settings]);

  // Helpers
  const requireAuth = useCallback((): boolean => {
    if (!user) {
      if (typeof window !== "undefined") {
        // Best-effort hint to consumers. They can call signIn via the /auth route.
        import("sonner").then(({ toast }) => toast.error("Sign in to contribute to the community dataset.", {
          action: { label: "Sign in", onClick: () => { window.location.href = "/auth"; } },
        }));
      }
      return false;
    }
    return true;
  }, [user]);

  const isSeed = useCallback((id: string) => seedSources().some((s) => s.id === id), []);

  // Mutators -------------------------------------------------------------
  const addSource = useCallback((s: SourceRecord) => {
    if (!requireAuth()) return;
    setDbSources((p) => [s, ...p.filter((x) => x.id !== s.id)]);
    supabase.from("community_sources").upsert({ id: s.id, data: s as unknown as never, created_by: user!.id });
  }, [requireAuth, user]);

  const updateSource = useCallback((id: string, patch: Partial<SourceRecord>) => {
    if (isSeed(id)) {
      // Seed source updates are local-only (e.g. toggling enabled or hiding).
      if (patch.enabled === false) {
        setSettings((p) => ({ ...p, hiddenSeedSourceIds: [...new Set([...p.hiddenSeedSourceIds, id])] }));
      } else if (patch.enabled === true) {
        setSettings((p) => ({ ...p, hiddenSeedSourceIds: p.hiddenSeedSourceIds.filter((x) => x !== id) }));
      }
      return;
    }
    if (!requireAuth()) return;
    const next = sources.find((s) => s.id === id);
    if (!next) return;
    const merged = { ...next, ...patch };
    setDbSources((p) => p.map((s) => s.id === id ? merged : s));
    supabase.from("community_sources").update({ data: merged as unknown as never }).eq("id", id);
  }, [isSeed, requireAuth, sources]);

  const removeSource = useCallback((id: string) => {
    if (isSeed(id)) {
      setSettings((p) => ({ ...p, hiddenSeedSourceIds: [...new Set([...p.hiddenSeedSourceIds, id])] }));
      return;
    }
    if (!requireAuth()) return;
    setDbSources((p) => p.filter((s) => s.id !== id));
    supabase.from("community_sources").delete().eq("id", id);
  }, [isSeed, requireAuth]);

  const enqueue = useCallback((item: QueueItem) => {
    if (!requireAuth()) return;
    setQueue((p) => [item, ...p]);
    supabase.from("community_queue").upsert({ id: item.id, data: item as unknown as never, created_by: user!.id });
  }, [requireAuth, user]);

  const enqueueMany = useCallback((items: QueueItem[]) => {
    if (!requireAuth()) return;
    setQueue((p) => [...items, ...p]);
    supabase.from("community_queue").upsert(items.map((it) => ({ id: it.id, data: it as unknown as never, created_by: user!.id })));
  }, [requireAuth, user]);

  const updateQueue = useCallback((id: string, patch: Partial<QueueItem>) => {
    setQueue((p) => {
      const next = p.map((q) => q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q);
      const updated = next.find((q) => q.id === id);
      if (updated && user) supabase.from("community_queue").update({ data: updated as unknown as never }).eq("id", id);
      return next;
    });
  }, [user]);

  const removeQueue = useCallback((id: string) => {
    setQueue((p) => p.filter((q) => q.id !== id));
    supabase.from("community_queue").delete().eq("id", id);
  }, []);

  const addDrafts = useCallback((newDrafts: ImportedDraftRecord[]) => {
    if (!requireAuth()) return;
    setDrafts((p) => [...newDrafts, ...p]);
    const rows = newDrafts.map((d) => ({ id: d.id, data: d as unknown as never, created_by: user!.id, published: false }));
    setDraftMeta((p) => {
      const next = { ...p };
      for (const d of newDrafts) next[d.id] = { published: false, createdBy: user!.id };
      return next;
    });
    supabase.from("community_drafts").upsert(rows);
  }, [requireAuth, user]);

  const updateDraft = useCallback((id: string, patch: Partial<ImportedDraftRecord>) => {
    setDrafts((p) => {
      const next = p.map((d) => d.id === id ? { ...d, ...patch, modifiedByUser: true, lastReviewedAt: Date.now() } : d);
      const updated = next.find((d) => d.id === id);
      if (updated && user) supabase.from("community_drafts").update({ data: updated as unknown as never }).eq("id", id);
      return next;
    });
  }, [user]);

  const removeDraft = useCallback((id: string) => {
    setDrafts((p) => p.filter((d) => d.id !== id));
    setDraftMeta((p) => { const n = { ...p }; delete n[id]; return n; });
    supabase.from("community_drafts").delete().eq("id", id);
  }, []);

  const mergeDrafts = useCallback((primaryId: string, secondaryId: string) => {
    setDrafts((p) => {
      const primary = p.find((d) => d.id === primaryId);
      const secondary = p.find((d) => d.id === secondaryId);
      if (!primary || !secondary) return p;
      const merged: ImportedDraftRecord = {
        ...primary,
        fields: { ...secondary.fields, ...primary.fields },
        warnings: [...primary.warnings, `Merged from ${secondary.id} (${secondary.sourceUrl ?? secondary.sourceTitle ?? "manual"})`],
        mergedFrom: [...(primary.mergedFrom ?? []), secondary.id],
        needsReview: true, modifiedByUser: true,
      };
      const next = p.filter((d) => d.id !== secondaryId).map((d) => d.id === primaryId ? merged : d);
      if (user) {
        supabase.from("community_drafts").delete().eq("id", secondaryId);
        supabase.from("community_drafts").update({ data: merged as unknown as never }).eq("id", primaryId);
      }
      return next;
    });
  }, [user]);

  const publishDraft = useCallback(async (id: string, published: boolean) => {
    if (!user) return;
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    if (published && (!draft.textApproved || !draft.automationApproved)) {
      const { toast } = await import("sonner");
      toast.error("Approve text and automation before publishing.");
      return;
    }
    setDraftMeta((p) => ({ ...p, [id]: { ...(p[id] ?? { createdBy: user.id }), published } }));
    const { error } = await supabase.from("community_drafts").update({ published }).eq("id", id);
    if (error) {
      const { toast } = await import("sonner");
      toast.error(error.message);
    }
  }, [drafts, user]);

  // Settings ------------------------------------------------------------
  const setDatasetMode = useCallback((m: DatasetMode) => setSettings((p) => ({ ...p, datasetMode: m })), []);
  const setExpected = useCallback((e: Partial<ExpectedCounts>) =>
    setSettings((p) => ({ ...p, expectedCounts: { ...p.expectedCounts, ...e } })), []);
  const setPlayMode = useCallback((m: "strict" | "assisted") => setSettings((p) => ({ ...p, playMode: m })), []);
  const updatePreset = useCallback((id: string, patch: Partial<SourcePreset>) =>
    setSettings((p) => ({ ...p, presets: p.presets.map((x) => x.id === id ? { ...x, ...patch } : x) })), []);

  // Util ----------------------------------------------------------------
  const exportAll = useCallback((): CommunityState => state, [state]);
  const importAll = useCallback((s: Partial<CommunityState>) => {
    // Bulk import. Sources/drafts go to DB if signed in; otherwise no-op with toast.
    if (!user) {
      import("sonner").then(({ toast }) => toast.error("Sign in to import into the shared dataset."));
      return;
    }
    (async () => {
      if (s.sources?.length) {
        const rows = s.sources.filter((src) => !seedSources().some((seed) => seed.id === src.id))
          .map((src) => ({ id: src.id, data: src as unknown as never, created_by: user.id }));
        if (rows.length) await supabase.from("community_sources").upsert(rows);
      }
      if (s.queue?.length) {
        await supabase.from("community_queue").upsert(s.queue.map((q) => ({ id: q.id, data: q as unknown as never, created_by: user.id })));
      }
      if (s.drafts?.length) {
        await supabase.from("community_drafts").upsert(s.drafts.map((d) => ({ id: d.id, data: d as unknown as never, created_by: user.id, published: false })));
      }
      if (s.datasetMode) setDatasetMode(s.datasetMode);
      if (s.expectedCounts) setExpected(s.expectedCounts);
      if (s.playMode) setPlayMode(s.playMode);
      await reload();
    })();
  }, [user, reload, setDatasetMode, setExpected, setPlayMode]);

  const resetAll = useCallback(() => {
    if (!user) {
      import("sonner").then(({ toast }) => toast.error("Sign in to reset the shared dataset."));
      return;
    }
    (async () => {
      // Only delete rows the user can delete per RLS — owner or curator.
      await Promise.all([
        supabase.from("community_drafts").delete().neq("id", ""),
        supabase.from("community_queue").delete().neq("id", ""),
        supabase.from("community_sources").delete().neq("id", ""),
      ]);
      setSettings(defaultSettings);
      await reload();
    })();
  }, [user, reload]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const apiRef = useRef<Ctx | null>(null);
  apiRef.current = {
    state, user, session, isCurator, signOut,
    addSource, updateSource, removeSource,
    enqueue, enqueueMany, updateQueue, removeQueue,
    addDrafts, updateDraft, removeDraft, mergeDrafts, publishDraft, draftMeta,
    setDatasetMode, setExpected, setPlayMode, updatePreset,
    exportAll, importAll, resetAll, loading,
  };

  return <CommunityCtx.Provider value={apiRef.current}>{children}</CommunityCtx.Provider>;
}

export function useCommunity() {
  const c = useContext(CommunityCtx);
  if (!c) throw new Error("useCommunity must be used within CommunityProvider");
  return c;
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
