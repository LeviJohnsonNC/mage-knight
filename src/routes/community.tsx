import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/mk/AppShell";
import { useCommunity, downloadJson } from "@/lib/mk/communityStore";
import {
  CATEGORY_LABELS,
  fetchUrl,
  guessEffects,
  makeQueueItem,
  makeSource,
  parseChildByCategory,
  parseFandomIndexPage,
  parseUploadedCsv,
  parseUploadedJson,
  parseUploadedText,
  buildChecklist,
  detectDuplicates,
  type ImportCategory,
  type ImportedDraftRecord,
  type QueueItem,
  type SourceRecord,
  type SourceType,
} from "@/lib/mk/community";
import { Button } from "@/components/ui/button";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, Check, Download, Eye, FileText, GitMerge, Library,
  Link as LinkIcon, ListTree, RefreshCw, Scale, Trash2, Upload, Wand2, X,
} from "lucide-react";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [{ title: "Community Source Importer · Mage Knight Companion" }] }),
  component: CommunityImporter,
});

type Tab =
  | "registry" | "url" | "presets" | "uploads" | "queue"
  | "review" | "attribution" | "conflicts" | "dataset" | "export";

function CommunityImporter() {
  const [tab, setTab] = useState<Tab>("url");

  return (
    <AppShell>
      <div className="max-w-7xl">
        <header className="flex items-start justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Component Data Workbench</div>
            <h1 className="font-display text-4xl text-gold mt-1">Community Source Importer</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Ingest, review, attribute and approve component data from the Unofficial Mage Knight Fandom wiki,
              BoardGameGeek files, and your own manual entries. Nothing imported here becomes playable until you
              approve it.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/import" className="text-xs text-muted-foreground hover:text-gold">← Import Center</Link>
            <Link to="/library" className="text-xs text-muted-foreground hover:text-gold">Components →</Link>
            <Link to="/validation" className="text-xs text-muted-foreground hover:text-gold">Validation →</Link>
          </div>
        </header>

        <nav className="mt-6 flex flex-wrap gap-1 border-b border-border">
          {([
            ["url", "URL Importer", LinkIcon],
            ["presets", "Source Presets", ListTree],
            ["uploads", "File Uploads", Upload],
            ["queue", "Batch Queue", RefreshCw],
            ["review", "Review Drafts", Eye],
            ["conflicts", "Conflicts", GitMerge],
            ["attribution", "Attribution", Scale],
            ["registry", "Source Registry", Library],
            ["dataset", "Dataset Modes", FileText],
            ["export", "Export", Download],
          ] as const).map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3 py-2 text-sm border-b-2 -mb-px flex items-center gap-1.5 ${tab === k ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === "url" && <UrlImporter />}
          {tab === "presets" && <PresetsPanel />}
          {tab === "uploads" && <UploadsPanel />}
          {tab === "queue" && <QueuePanel />}
          {tab === "review" && <ReviewPanel />}
          {tab === "conflicts" && <ConflictsPanel />}
          {tab === "attribution" && <AttributionPanel />}
          {tab === "registry" && <SourceRegistryPanel />}
          {tab === "dataset" && <DatasetPanel />}
          {tab === "export" && <ExportPanel />}
        </div>
      </div>
    </AppShell>
  );
}

// ============ URL Importer ============

const ALL_CATEGORIES: ImportCategory[] = [
  "basic_action_cards", "advanced_action_cards", "spells", "artifacts",
  "heroes", "skills", "enemies", "units", "map_tiles", "tactics",
  "cities", "sites", "rules", "unknown",
];

function UrlImporter() {
  const { state, enqueue, addDrafts, updateQueue, enqueueMany } = useCommunity();
  const [url, setUrl] = useState("");
  const [sourceId, setSourceId] = useState<string>(state.sources[0]?.id ?? "");
  const [category, setCategory] = useState<ImportCategory>("advanced_action_cards");
  const [mode, setMode] = useState<QueueItem["importMode"]>("single_page");
  const [notes, setNotes] = useState("");
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);

  const source = state.sources.find((s) => s.id === sourceId);

  async function runImport(rawTextOverride?: string) {
    if (!source) { toast.error("Pick a source"); return; }
    setBusy(true);
    const q = makeQueueItem({
      sourceId, url: url || undefined, category, importMode: mode,
      notes, status: "fetching", rawText: rawTextOverride,
    });
    enqueue(q);

    let input = rawTextOverride ?? "";
    if (!input && url) {
      const r = await fetchUrl(url);
      if (!r.ok) {
        updateQueue(q.id, { status: "failed", error: r.error });
        toast.error(`Fetch failed: ${r.error}. Paste page text below and retry.`);
        setBusy(false);
        return;
      }
      input = r.html ?? r.text ?? "";
      updateQueue(q.id, { rawHtml: r.html, rawText: r.text ?? "", status: "fetched" });
    }
    if (!input) {
      updateQueue(q.id, { status: "failed", error: "No URL or pasted content" });
      toast.error("Provide a URL or paste page content.");
      setBusy(false);
      return;
    }

    const ctx = {
      sourceId, sourceUrl: url || undefined, category,
      sourceLicense: source.license, attributionText: source.attributionText,
    };
    const result = mode === "index_page"
      ? parseFandomIndexPage(input, ctx)
      : parseChildByCategory(input, ctx);

    addDrafts(result.records);
    updateQueue(q.id, {
      status: result.records.length ? "needs_review" : "failed",
      error: result.errors.join("; ") || undefined,
      childLinks: result.childLinks,
      draftIds: result.records.map((r) => r.id),
    });

    if (mode === "index_page" && result.childLinks.length) {
      const childItems = result.childLinks.slice(0, 200).map((cu) =>
        makeQueueItem({
          sourceId, url: cu, category, importMode: "single_page",
          notes: `Queued from index: ${url}`,
        }),
      );
      enqueueMany(childItems);
      toast.success(`Index parsed. ${result.records.length} drafts, ${childItems.length} child pages queued.`);
    } else {
      toast.success(`${result.records.length} draft(s) created. Review in the Review tab.`);
    }
    setBusy(false);
    setPasted("");
  }

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6">
      <div className="panel-steel rounded-lg p-5 space-y-4">
        <h2 className="font-display text-lg text-gold">Import a URL</h2>

        <Field label="Source">
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="input">
            {state.sources.filter((s) => s.enabled).map((s) => (
              <option key={s.id} value={s.id}>{s.sourceName}</option>
            ))}
          </select>
        </Field>

        <Field label="URL">
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://mageknight.fandom.com/wiki/Advanced_Action_Cards"
            className="input" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Expected category">
            <select value={category} onChange={(e) => setCategory(e.target.value as ImportCategory)} className="input">
              {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </Field>
          <Field label="Import mode">
            <select value={mode} onChange={(e) => setMode(e.target.value as QueueItem["importMode"])} className="input">
              <option value="single_page">Single page</option>
              <option value="index_page">Index page (with child links)</option>
              <option value="manual_paste">Manual paste</option>
            </select>
          </Field>
        </div>

        <Field label="Notes">
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
        </Field>

        <details className="rounded border border-border bg-card/40 p-3">
          <summary className="cursor-pointer text-sm text-muted-foreground">Fetch blocked? Paste the page content manually</summary>
          <textarea value={pasted} onChange={(e) => setPasted(e.target.value)}
            rows={8} className="input mt-2 font-mono text-xs"
            placeholder="Paste HTML or plain text from the source page." />
          <Button size="sm" className="mt-2" variant="secondary"
            disabled={!pasted || busy}
            onClick={() => runImport(pasted)}>
            Use pasted content
          </Button>
        </details>

        <div className="flex gap-2 pt-2">
          <Button onClick={() => runImport()} disabled={busy || (!url && !pasted)}
            className="bg-gold-gradient text-primary-foreground">
            {busy ? "Working…" : "Fetch & parse"}
          </Button>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="panel-parchment rounded-lg p-4 text-sm">
          <strong className="font-display text-base">How it works</strong>
          <ol className="mt-2 space-y-1 list-decimal pl-4 text-xs">
            <li>Pick a source and paste a wiki/BGG URL.</li>
            <li>Index pages auto-queue child page imports.</li>
            <li>Drafts go to the Review tab — nothing is auto-approved.</li>
            <li>Approve text first, then optionally approve parsed effects for automation.</li>
          </ol>
        </div>
        <div className="panel-steel rounded-lg p-4 text-xs text-muted-foreground">
          <strong className="text-gold font-display text-sm">Attribution required</strong>
          <p className="mt-1">{source?.attributionText ?? "Pick a source to see its attribution."}</p>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

// ============ Presets ============

function PresetsPanel() {
  const { state, updatePreset } = useCommunity();
  return (
    <div className="panel-steel rounded-lg p-5">
      <h2 className="font-display text-lg text-gold mb-3">Source Presets</h2>
      <p className="text-xs text-muted-foreground mb-4">Edit URLs before importing. URLs may change on the wiki.</p>
      <div className="space-y-2">
        {state.presets.map((p) => (
          <div key={p.id} className="grid grid-cols-[1fr_2fr_140px_140px] gap-2 items-center rounded border border-border bg-card/40 px-3 py-2">
            <div className="text-sm">{p.label}</div>
            <input className="input text-xs" value={p.url} onChange={(e) => updatePreset(p.id, { url: e.target.value })} />
            <div className="text-xs text-muted-foreground">{CATEGORY_LABELS[p.category]}</div>
            <Link to="/community" className="text-xs text-gold hover:underline"
              onClick={() => {
                navigator.clipboard?.writeText(p.url);
                toast.success("URL copied. Paste in URL Importer.");
              }}>Copy URL</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Uploads ============

function UploadsPanel() {
  const { state, enqueue, addDrafts, updateQueue } = useCommunity();
  const fileRef = useRef<HTMLInputElement>(null);
  const [sourceId, setSourceId] = useState<string>(state.sources.find((s) => s.sourceType === "boardgamegeek_file")?.id ?? state.sources[0]?.id ?? "");
  const [category, setCategory] = useState<ImportCategory>("advanced_action_cards");

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const source = state.sources.find((s) => s.id === sourceId);
    if (!source) return;
    for (const file of Array.from(files)) {
      const text = await file.text();
      const q = makeQueueItem({
        sourceId, uploadedFilename: file.name, category,
        importMode: "uploaded_file", status: "fetched", rawText: text,
      });
      enqueue(q);
      const ctx = {
        sourceId, category, sourceLicense: source.license,
        attributionText: source.attributionText, filename: file.name,
      };
      const result = /\.csv$/i.test(file.name) ? parseUploadedCsv(text, ctx)
        : /\.json$/i.test(file.name) ? parseUploadedJson(text, ctx)
        : parseUploadedText(text, ctx);
      addDrafts(result.records);
      updateQueue(q.id, {
        status: result.records.length ? "needs_review" : "failed",
        error: result.errors.join("; ") || undefined,
        draftIds: result.records.map((r) => r.id),
      });
    }
    toast.success("Files parsed and queued");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="panel-steel rounded-lg p-5">
      <h2 className="font-display text-lg text-gold mb-3">Upload Community Files</h2>
      <p className="text-xs text-muted-foreground mb-4">
        CSV (with header row), JSON (array or keyed map), or plain text (blocks separated by blank lines).
        PDF/DOCX/XLSX are not parsed here — use the main Import Center for those.
      </p>
      <div className="grid grid-cols-[200px_220px_1fr] gap-3 items-end mb-4">
        <Field label="Source">
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="input">
            {state.sources.map((s) => <option key={s.id} value={s.id}>{s.sourceName}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as ImportCategory)} className="input">
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </Field>
        <div>
          <input ref={fileRef} type="file" multiple accept=".csv,.json,.txt,.tsv,.md"
            onChange={(e) => onFiles(e.target.files)} className="hidden" />
          <Button onClick={() => fileRef.current?.click()} className="bg-gold-gradient text-primary-foreground">
            <Upload className="h-4 w-4 mr-1" /> Pick files
          </Button>
        </div>
      </div>
      <div className="rounded border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Tip: Drop user-supplied BoardGameGeek inventory exports or community card spreadsheets here.
      </div>
    </div>
  );
}

// ============ Queue ============

const STATUS_COLORS: Record<string, string> = {
  pending: "text-muted-foreground",
  fetching: "text-mana-blue",
  fetched: "text-mana-blue",
  parsed: "text-mana-green",
  needs_review: "text-gold",
  approved: "text-mana-green",
  rejected: "text-destructive",
  failed: "text-destructive",
};

function QueuePanel() {
  const { state, updateQueue, removeQueue, addDrafts, enqueueMany } = useCommunity();
  const [filter, setFilter] = useState<string>("all");
  const filtered = state.queue.filter((q) => filter === "all" || q.status === filter);

  async function retry(q: QueueItem) {
    const source = state.sources.find((s) => s.id === q.sourceId);
    if (!source || !q.url) { toast.error("Need a URL to retry"); return; }
    updateQueue(q.id, { status: "fetching", error: undefined });
    const r = await fetchUrl(q.url);
    if (!r.ok) { updateQueue(q.id, { status: "failed", error: r.error }); return; }
    const input = r.html ?? r.text ?? "";
    const ctx = { sourceId: source.id, sourceUrl: q.url, category: q.category, sourceLicense: source.license, attributionText: source.attributionText };
    const result = q.importMode === "index_page" ? parseFandomIndexPage(input, ctx) : parseChildByCategory(input, ctx);
    addDrafts(result.records);
    updateQueue(q.id, { status: "needs_review", draftIds: result.records.map((d) => d.id), childLinks: result.childLinks });
    if (q.importMode === "index_page" && result.childLinks.length) {
      enqueueMany(result.childLinks.map((cu) => makeQueueItem({ sourceId: source.id, url: cu, category: q.category, importMode: "single_page" })));
    }
    toast.success(`Retried · ${result.records.length} drafts`);
  }

  function exportReport() {
    downloadJson(`queue-report-${Date.now()}.json`, state.queue);
  }

  return (
    <div className="panel-steel rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg text-gold">Batch Import Queue</h2>
        <div className="flex gap-2 items-center">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input text-xs py-1">
            <option value="all">All ({state.queue.length})</option>
            <option value="pending">Pending</option>
            <option value="fetched">Fetched</option>
            <option value="needs_review">Needs review</option>
            <option value="failed">Failed</option>
            <option value="approved">Approved</option>
          </select>
          <Button size="sm" variant="secondary" onClick={exportReport}><Download className="h-3 w-3 mr-1" /> Report</Button>
        </div>
      </div>
      {filtered.length === 0 && <Empty msg="Queue is empty. Import a URL or upload files to populate." />}
      <div className="space-y-1">
        {filtered.map((q) => {
          const source = state.sources.find((s) => s.id === q.sourceId);
          return (
            <div key={q.id} className="grid grid-cols-[1fr_120px_90px_60px_120px] gap-2 items-center rounded border border-border bg-card/40 px-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate">{q.url ?? q.uploadedFilename ?? "Manual paste"}</div>
                <div className="text-[10px] text-muted-foreground">{source?.sourceName} · {CATEGORY_LABELS[q.category]} · {q.importMode}</div>
                {q.error && <div className="text-[10px] text-destructive">{q.error}</div>}
              </div>
              <div className={`text-xs ${STATUS_COLORS[q.status]}`}>{q.status}</div>
              <div className="text-xs text-muted-foreground">{q.draftIds.length} drafts</div>
              <div className="text-xs text-muted-foreground">{q.childLinks.length} links</div>
              <div className="flex gap-1 justify-end">
                {q.url && <button title="Retry" onClick={() => retry(q)} className="p-1 hover:text-gold"><RefreshCw className="h-3.5 w-3.5" /></button>}
                {q.url && <a title="Open" href={q.url} target="_blank" rel="noreferrer" className="p-1 hover:text-gold"><LinkIcon className="h-3.5 w-3.5" /></a>}
                <button title="Remove" onClick={() => removeQueue(q.id)} className="p-1 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Review ============

function ReviewPanel() {
  const { state, updateDraft, removeDraft } = useCommunity();
  const [filterCat, setFilterCat] = useState<ImportCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "needs_review" | "text_approved" | "automation_approved">("needs_review");
  const [selected, setSelected] = useState<string | null>(null);

  const drafts = useMemo(() => state.drafts.filter((d) => {
    if (filterCat !== "all" && d.category !== filterCat) return false;
    if (filterStatus === "needs_review" && (d.textApproved || d.automationApproved)) return false;
    if (filterStatus === "text_approved" && !d.textApproved) return false;
    if (filterStatus === "automation_approved" && !d.automationApproved) return false;
    return true;
  }), [state.drafts, filterCat, filterStatus]);

  const draft = drafts.find((d) => d.id === selected) ?? drafts[0];

  return (
    <div className="grid grid-cols-[340px_1fr] gap-4 min-h-[60vh]">
      <div className="panel-steel rounded-lg p-3 flex flex-col">
        <div className="flex gap-2 mb-2">
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value as any)} className="input text-xs flex-1">
            <option value="all">All categories</option>
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="input text-xs">
            <option value="needs_review">Needs review</option>
            <option value="text_approved">Text approved</option>
            <option value="automation_approved">Automation approved</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="overflow-auto flex-1 space-y-1">
          {drafts.length === 0 && <Empty msg="No drafts match the filter." />}
          {drafts.map((d) => (
            <button key={d.id} onClick={() => setSelected(d.id)}
              className={`w-full text-left rounded border px-2 py-1.5 text-xs ${d.id === draft?.id ? "border-gold bg-accent/30" : "border-border hover:border-gold-muted"}`}>
              <div className="flex items-center justify-between">
                <span className="truncate">{d.name}</span>
                <span className="flex gap-1 ml-2">
                  {d.textApproved && <Check className="h-3 w-3 text-mana-green" />}
                  {d.automationApproved && <Wand2 className="h-3 w-3 text-gold" />}
                  {d.warnings.length > 0 && <AlertTriangle className="h-3 w-3 text-destructive" />}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[d.category]}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-steel rounded-lg p-5">
        {!draft ? <Empty msg="Select a draft to review." /> : (
          <DraftReview draft={draft}
            onChange={(p) => updateDraft(draft.id, p)}
            onDelete={() => { removeDraft(draft.id); setSelected(null); }} />
        )}
      </div>
    </div>
  );
}

function DraftReview({ draft, onChange, onDelete }: {
  draft: ImportedDraftRecord;
  onChange: (p: Partial<ImportedDraftRecord>) => void;
  onDelete: () => void;
}) {
  const { draftMeta, publishDraft, user } = useCommunity();
  const [name, setName] = useState(draft.name);
  const [fields, setFields] = useState<Record<string, any>>({ ...draft.fields });
  const [notes, setNotes] = useState(draft.reviewNotes ?? "");
  const published = draftMeta[draft.id]?.published ?? false;
  const canPublish = draft.textApproved && draft.automationApproved;

  function commit(p: Partial<ImportedDraftRecord> = {}) {
    onChange({ name, fields, reviewNotes: notes, ...p });
  }

  function reparseEffects() {
    const text = String(fields.normalEffectText ?? fields.effectText ?? draft.rawText);
    const parsed = guessEffects(text);
    onChange({ parsedEffects: parsed });
    toast.success(`${parsed.length} effect(s) parsed`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <input className="input font-display text-xl text-gold bg-transparent border-0 p-0 focus:ring-0"
            value={name} onChange={(e) => setName(e.target.value)} onBlur={() => commit()} />
          <div className="text-xs text-muted-foreground mt-1">
            {CATEGORY_LABELS[draft.category]} · {draft.kind} · retrieved {new Date(draft.retrievedAt).toLocaleString()}
            {published
              ? <span className="ml-2 text-mana-green">· Published to community</span>
              : <span className="ml-2 text-muted-foreground">· Private draft</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {draft.textApproved
            ? <span className="text-xs text-mana-green flex items-center gap-1"><Check className="h-3 w-3" /> Text approved</span>
            : <Button size="sm" variant="secondary" onClick={() => commit({ textApproved: true, needsReview: false })}>Approve text</Button>}
          {draft.automationApproved
            ? <span className="text-xs text-gold flex items-center gap-1"><Wand2 className="h-3 w-3" /> Automation approved</span>
            : <Button size="sm" className="bg-gold-gradient text-primary-foreground"
                onClick={() => commit({ textApproved: true, automationApproved: true, needsReview: false })}>
                Approve & automate
              </Button>}
          {user && (
            published
              ? <Button size="sm" variant="outline" onClick={() => publishDraft(draft.id, false)}>Unpublish</Button>
              : <Button size="sm" variant="outline" disabled={!canPublish}
                  title={canPublish ? "Make this available to everyone" : "Approve text and automation first"}
                  onClick={() => publishDraft(draft.id, true)}>
                  Publish to community
                </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDelete}><X className="h-4 w-4" /></Button>
        </div>
      </div>

      {draft.warnings.length > 0 && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {draft.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          {draft.imageUrl && (
            <img src={draft.imageUrl} alt={draft.name} className="rounded border border-border max-h-56 object-contain bg-black/30" />
          )}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Parsed fields</div>
            <div className="space-y-2">
              {Object.entries(fields).map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10px] text-muted-foreground">{k}</div>
                  <textarea
                    className="input text-xs font-mono"
                    rows={Math.min(6, Math.max(1, String(v ?? "").length / 60))}
                    value={String(v ?? "")}
                    onChange={(e) => setFields({ ...fields, [k]: e.target.value })}
                    onBlur={() => commit()}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Parsed effects (heuristic)</div>
              <Button size="sm" variant="ghost" onClick={reparseEffects}><Wand2 className="h-3 w-3 mr-1" /> Re-parse</Button>
            </div>
            <div className="rounded border border-border bg-card/40 p-2 text-xs space-y-1">
              {draft.parsedEffects?.length ? draft.parsedEffects.map((e, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gold">{e.tag}{e.value != null ? ` ${e.value}` : ""}</span>
                  <span className="text-muted-foreground">{Math.round(e.confidence * 100)}%</span>
                </div>
              )) : <div className="text-muted-foreground">None parsed yet.</div>}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Automation approval is required before the rules engine will execute these.
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Review notes</div>
            <textarea className="input text-xs" rows={3} value={notes}
              onChange={(e) => setNotes(e.target.value)} onBlur={() => commit()} />
          </div>

          <div className="rounded border border-border bg-card/40 p-3 text-xs text-muted-foreground">
            <div><strong className="text-foreground">Source:</strong> {draft.sourceTitle ?? "—"}</div>
            {draft.sourceUrl && <div><strong className="text-foreground">URL:</strong> <a href={draft.sourceUrl} target="_blank" rel="noreferrer" className="text-gold hover:underline break-all">{draft.sourceUrl}</a></div>}
            <div><strong className="text-foreground">License:</strong> {draft.sourceLicense ?? "—"}</div>
            {draft.attributionText && <div className="mt-1 italic">{draft.attributionText}</div>}
          </div>

          <details className="rounded border border-border bg-card/40 p-2 text-xs">
            <summary className="cursor-pointer text-muted-foreground">Raw imported text</summary>
            <pre className="mt-2 whitespace-pre-wrap text-[10px] leading-relaxed max-h-64 overflow-auto">{draft.rawText}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}

// ============ Conflicts ============

function ConflictsPanel() {
  const { state, mergeDrafts, removeDraft } = useCommunity();
  const dups = useMemo(() => detectDuplicates(state.drafts), [state.drafts]);
  const entries = Object.entries(dups);
  return (
    <div className="panel-steel rounded-lg p-5">
      <h2 className="font-display text-lg text-gold mb-3">Conflict Resolver</h2>
      {entries.length === 0 && <Empty msg="No duplicate names detected across drafts." />}
      <div className="space-y-3">
        {entries.map(([key, arr]) => (
          <div key={key} className="rounded border border-border bg-card/40 p-3">
            <div className="text-sm text-gold mb-2">{arr[0].name} <span className="text-xs text-muted-foreground">({CATEGORY_LABELS[arr[0].category]})</span></div>
            <div className="grid grid-cols-2 gap-2">
              {arr.map((d) => (
                <div key={d.id} className="rounded border border-border p-2 text-xs">
                  <div className="text-muted-foreground truncate">{d.sourceUrl ?? d.sourceTitle ?? "—"}</div>
                  <div className="mt-1 line-clamp-4">{String(d.fields.normalEffectText ?? d.fields.effectText ?? d.rawText).slice(0, 240)}</div>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="secondary" onClick={() => {
                      const other = arr.find((x) => x.id !== d.id);
                      if (other) mergeDrafts(d.id, other.id);
                      toast.success("Merged");
                    }}>Keep this · merge</Button>
                    <Button size="sm" variant="ghost" onClick={() => removeDraft(d.id)}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Attribution ============

function AttributionPanel() {
  const { state } = useCommunity();
  const used = new Set(state.drafts.map((d) => d.sourceId));
  const sources = state.sources.filter((s) => used.has(s.id));
  return (
    <div className="panel-steel rounded-lg p-5">
      <h2 className="font-display text-lg text-gold mb-3">Attribution / License Tracker</h2>
      <p className="text-xs text-muted-foreground mb-4">Every imported record stores its source, URL, license and attribution. This panel lists all sources contributing to the current dataset.</p>
      {sources.length === 0 && <Empty msg="No imported records yet." />}
      <div className="space-y-3">
        {sources.map((s) => {
          const count = state.drafts.filter((d) => d.sourceId === s.id).length;
          return (
            <div key={s.id} className="rounded border border-border bg-card/40 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-gold">{s.sourceName}</div>
                  <div className="text-xs text-muted-foreground">{s.sourceType} · {count} record(s) · {s.license ?? "license unknown"}</div>
                </div>
                {s.baseUrl && <a href={s.baseUrl} target="_blank" rel="noreferrer" className="text-xs text-gold hover:underline">Open source</a>}
              </div>
              {s.attributionText && <p className="text-xs italic mt-2">{s.attributionText}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Source Registry ============

function SourceRegistryPanel() {
  const { state, addSource, updateSource, removeSource } = useCommunity();
  return (
    <div className="panel-steel rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg text-gold">Source Registry</h2>
        <Button size="sm" variant="secondary" onClick={() => addSource(makeSource({ sourceName: "Custom source" }))}>+ Add source</Button>
      </div>
      <div className="space-y-3">
        {state.sources.map((s) => (
          <div key={s.id} className="rounded border border-border bg-card/40 p-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name"><input className="input text-xs" value={s.sourceName} onChange={(e) => updateSource(s.id, { sourceName: e.target.value })} /></Field>
              <Field label="Type">
                <select className="input text-xs" value={s.sourceType} onChange={(e) => updateSource(s.id, { sourceType: e.target.value as SourceType })}>
                  <option value="fandom_wiki">Fandom wiki</option>
                  <option value="boardgamegeek_file">BGG file</option>
                  <option value="boardgamegeek_thread">BGG thread</option>
                  <option value="uploaded_file">Uploaded file</option>
                  <option value="manual">Manual</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Base URL"><input className="input text-xs" value={s.baseUrl ?? ""} onChange={(e) => updateSource(s.id, { baseUrl: e.target.value })} /></Field>
              <Field label="License"><input className="input text-xs" value={s.license ?? ""} onChange={(e) => updateSource(s.id, { license: e.target.value })} /></Field>
              <Field label="Attribution text"><textarea className="input text-xs" rows={2} value={s.attributionText ?? ""} onChange={(e) => updateSource(s.id, { attributionText: e.target.value })} /></Field>
              <Field label="Notes"><textarea className="input text-xs" rows={2} value={s.notes ?? ""} onChange={(e) => updateSource(s.id, { notes: e.target.value })} /></Field>
            </div>
            <div className="flex items-center justify-between mt-2">
              <label className="text-xs flex items-center gap-2">
                <input type="checkbox" checked={s.enabled} onChange={(e) => updateSource(s.id, { enabled: e.target.checked })} />
                Enabled
              </label>
              <label className="text-xs flex items-center gap-2">
                <input type="checkbox" checked={s.attributionRequired} onChange={(e) => updateSource(s.id, { attributionRequired: e.target.checked })} />
                Attribution required
              </label>
              <Button size="sm" variant="ghost" onClick={() => removeSource(s.id)}><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Dataset Modes ============

function DatasetPanel() {
  const { state, setDatasetMode, setExpected, setPlayMode } = useCommunity();
  const checklist = useMemo(() => buildChecklist(state.drafts, state.expectedCounts, true), [state.drafts, state.expectedCounts]);
  const textApprovedChecklist = useMemo(() => buildChecklist(state.drafts, state.expectedCounts, false), [state.drafts, state.expectedCounts]);
  return (
    <div className="grid grid-cols-[1fr_360px] gap-4">
      <div className="panel-steel rounded-lg p-5 space-y-4">
        <h2 className="font-display text-lg text-gold">Playability Checklist</h2>
        <p className="text-xs text-muted-foreground">Counts shown are <strong>automation-approved</strong>. Expected counts are configurable below.</p>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr><th className="text-left py-1">Component</th><th className="text-right">Expected</th><th className="text-right">Have</th><th className="text-right">Approved (any)</th><th className="text-right">Status</th></tr>
          </thead>
          <tbody>
            {checklist.map((r, i) => (
              <tr key={r.key} className="border-t border-border/50">
                <td className="py-1.5">{r.label}</td>
                <td className="text-right">
                  <input type="number" className="input text-xs w-20 text-right" value={state.expectedCounts[r.key]}
                    onChange={(e) => setExpected({ [r.key]: Number(e.target.value) || 0 } as any)} />
                </td>
                <td className="text-right font-mono">{r.have}</td>
                <td className="text-right font-mono text-muted-foreground">{textApprovedChecklist[i].have}</td>
                <td className="text-right">
                  {r.ok
                    ? <Check className="h-4 w-4 text-mana-green inline" />
                    : <AlertTriangle className="h-4 w-4 text-destructive inline" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <aside className="space-y-3">
        <div className="panel-steel rounded-lg p-4">
          <h3 className="font-display text-base text-gold">Dataset Mode</h3>
          <div className="mt-2 space-y-2 text-sm">
            {(["demo_placeholder","community_imported","personal_manual","hybrid"] as const).map((m) => (
              <label key={m} className="flex items-start gap-2 text-xs cursor-pointer">
                <input type="radio" checked={state.datasetMode === m} onChange={() => setDatasetMode(m)} className="mt-0.5" />
                <span>
                  <div className="text-foreground">{({
                    demo_placeholder: "Demo Placeholder",
                    community_imported: "Community Imported",
                    personal_manual: "Personal Manual",
                    hybrid: "Hybrid (multi-source)",
                  })[m]}</div>
                  <div className="text-muted-foreground">{({
                    demo_placeholder: "Existing non-official placeholders.",
                    community_imported: "Imported from Fandom/BGG sources and approved.",
                    personal_manual: "Hand-entered from your physical copy.",
                    hybrid: "Multiple sources with per-item attribution.",
                  })[m]}</div>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="panel-steel rounded-lg p-4">
          <h3 className="font-display text-base text-gold">Play Mode</h3>
          <div className="mt-2 space-y-2 text-xs">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" checked={state.playMode === "strict"} onChange={() => setPlayMode("strict")} className="mt-0.5" />
              <span><div className="text-foreground">Strict Automation</div><div className="text-muted-foreground">Requires automation-approved data for all required components.</div></span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" checked={state.playMode === "assisted"} onChange={() => setPlayMode("assisted")} className="mt-0.5" />
              <span><div className="text-foreground">Assisted Manual</div><div className="text-muted-foreground">Allows text-approved data; ambiguous effects resolved manually.</div></span>
            </label>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ============ Export ============

function ExportPanel() {
  const { state } = useCommunity();
  const automationOnly = state.drafts.filter((d) => d.automationApproved);
  const textApproved = state.drafts.filter((d) => d.textApproved);
  const needsReview = state.drafts.filter((d) => !d.textApproved);
  const missing = buildChecklist(state.drafts, state.expectedCounts, true).filter((r) => !r.ok);

  const items: Array<{ label: string; sub: string; click: () => void }> = [
    { label: "Full dataset JSON", sub: `${state.drafts.length} drafts incl. queue + sources`, click: () => downloadJson(`mk-community-full-${Date.now()}.json`, state) },
    { label: "Community imported dataset", sub: `${textApproved.length} text-approved drafts`, click: () => downloadJson(`mk-community-approved-${Date.now()}.json`, textApproved) },
    { label: "Automation-approved only", sub: `${automationOnly.length} drafts`, click: () => downloadJson(`mk-community-automation-${Date.now()}.json`, automationOnly) },
    { label: "Attribution report", sub: `${state.sources.length} sources`, click: () => downloadJson(`mk-attribution-${Date.now()}.json`, state.sources) },
    { label: "Missing-data report", sub: `${missing.length} unmet expected counts`, click: () => downloadJson(`mk-missing-${Date.now()}.json`, missing) },
    { label: "Review-needed report", sub: `${needsReview.length} drafts`, click: () => downloadJson(`mk-review-needed-${Date.now()}.json`, needsReview) },
  ];

  return (
    <div className="panel-steel rounded-lg p-5">
      <h2 className="font-display text-lg text-gold mb-3">Export Dataset</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <button key={i.label} onClick={i.click} className="rounded border border-border bg-card/40 p-3 text-left hover:border-gold transition">
            <div className="font-display text-sm text-gold flex items-center gap-2"><Download className="h-3.5 w-3.5" /> {i.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{i.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="rounded border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{msg}</div>;
}
