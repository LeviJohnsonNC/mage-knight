import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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

const LS_KEY = "mk.community.v1";

const initial: CommunityState = {
  sources: seedSources(),
  queue: [],
  drafts: [],
  datasetMode: "demo_placeholder",
  expectedCounts: BASE_GAME_EXPECTED,
  presets: seedPresets(),
  playMode: "assisted",
};

function load(): CommunityState {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (!v) return initial;
    const parsed = JSON.parse(v) as Partial<CommunityState>;
    return {
      ...initial,
      ...parsed,
      sources: parsed.sources?.length ? parsed.sources : initial.sources,
      presets: parsed.presets?.length ? parsed.presets : initial.presets,
      expectedCounts: { ...initial.expectedCounts, ...(parsed.expectedCounts ?? {}) },
    };
  } catch { return initial; }
}

interface Ctx {
  state: CommunityState;
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
}

const CommunityCtx = createContext<Ctx | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommunityState>(() => load());
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const api = useMemo<Ctx>(() => ({
    state,
    addSource: (s) => setState((p) => ({ ...p, sources: [s, ...p.sources] })),
    updateSource: (id, patch) => setState((p) => ({ ...p, sources: p.sources.map((s) => s.id === id ? { ...s, ...patch } : s) })),
    removeSource: (id) => setState((p) => ({ ...p, sources: p.sources.filter((s) => s.id !== id) })),
    enqueue: (item) => setState((p) => ({ ...p, queue: [item, ...p.queue] })),
    enqueueMany: (items) => setState((p) => ({ ...p, queue: [...items, ...p.queue] })),
    updateQueue: (id, patch) => setState((p) => ({ ...p, queue: p.queue.map((q) => q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q) })),
    removeQueue: (id) => setState((p) => ({ ...p, queue: p.queue.filter((q) => q.id !== id) })),
    addDrafts: (drafts) => setState((p) => ({ ...p, drafts: [...drafts, ...p.drafts] })),
    updateDraft: (id, patch) => setState((p) => ({ ...p, drafts: p.drafts.map((d) => d.id === id ? { ...d, ...patch, modifiedByUser: true, lastReviewedAt: Date.now() } : d) })),
    removeDraft: (id) => setState((p) => ({ ...p, drafts: p.drafts.filter((d) => d.id !== id) })),
    mergeDrafts: (primaryId, secondaryId) => setState((p) => {
      const primary = p.drafts.find((d) => d.id === primaryId);
      const secondary = p.drafts.find((d) => d.id === secondaryId);
      if (!primary || !secondary) return p;
      const merged: ImportedDraftRecord = {
        ...primary,
        fields: { ...secondary.fields, ...primary.fields },
        warnings: [...primary.warnings, `Merged from ${secondary.id} (${secondary.sourceUrl ?? secondary.sourceTitle ?? "manual"})`],
        mergedFrom: [...(primary.mergedFrom ?? []), secondary.id],
        needsReview: true, modifiedByUser: true,
      };
      return { ...p, drafts: p.drafts.filter((d) => d.id !== secondaryId).map((d) => d.id === primaryId ? merged : d) };
    }),
    setDatasetMode: (m) => setState((p) => ({ ...p, datasetMode: m })),
    setExpected: (e) => setState((p) => ({ ...p, expectedCounts: { ...p.expectedCounts, ...e } })),
    setPlayMode: (m) => setState((p) => ({ ...p, playMode: m })),
    updatePreset: (id, patch) => setState((p) => ({ ...p, presets: p.presets.map((x) => x.id === id ? { ...x, ...patch } : x) })),
    exportAll: () => state,
    importAll: (s) => setState((p) => ({ ...p, ...s })),
    resetAll: () => setState(initial),
  }), [state]);

  return <CommunityCtx.Provider value={api}>{children}</CommunityCtx.Provider>;
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

