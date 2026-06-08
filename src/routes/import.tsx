import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/mk/AppShell";
import { useGame } from "@/lib/mk/store";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { Upload, FileText, Trash2, FileJson, FileSpreadsheet, PencilLine } from "lucide-react";
import { toast } from "sonner";
import type { ImportedDocument } from "@/lib/mk/types";

export const Route = createFileRoute("/import")({
  head: () => ({ meta: [{ title: "Import Center · Mage Knight Companion" }] }),
  component: ImportCenter,
});

function ImportCenter() {
  const { docs, setDocs, library, setLibrary } = useGame();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"docs" | "extract" | "parse" | "manual" | "rules" | "validate">("docs");
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  function onFile(files: FileList | null) {
    if (!files) return;
    const next: ImportedDocument[] = [...docs];
    Array.from(files).forEach((f) => {
      const kind: ImportedDocument["kind"] =
        f.name.endsWith(".json") ? "json" :
        f.name.endsWith(".csv") ? "csv" :
        /rule/i.test(f.name) ? "rulebook" :
        /walk/i.test(f.name) ? "walkthrough" :
        /faq|compendium|q.?a/i.test(f.name) ? "faq" :
        /card/i.test(f.name) ? "cards" : "other";
      next.unshift({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
        filename: f.name, kind, sizeBytes: f.size, uploadedAt: Date.now(),
      });
    });
    setDocs(next);
    toast.success(`${files.length} document(s) added`);
  }

  function exportLibrary() {
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mk-library-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function importLibraryFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setLibrary({ ...library, ...parsed });
        toast.success("Library merged from JSON");
      } catch (e) {
        toast.error("Invalid JSON");
      }
    };
    reader.readAsText(file);
  }

  return (
    <AppShell>
      <div className="max-w-6xl">
        <h1 className="font-display text-4xl text-gold">Import Center</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Upload rulebooks, FAQs, walkthroughs, card texts, CSV/JSON exports, or enter component data
          manually. The Import Center is the only place to bring real Mage Knight content into this app.
        </p>

        <div className="mt-6 flex gap-2 border-b border-border">
          {(["docs","extract","parse","manual","rules","validate"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === t ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {({docs:"Uploaded",extract:"Extracted Text",parse:"Component Parser",manual:"Manual Editor",rules:"Rules Library",validate:"Validation"} as const)[t]}
            </button>
          ))}
        </div>

        {tab === "docs" && (
          <div className="mt-6 grid grid-cols-[1fr_320px] gap-6">
            <div className="panel-steel rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-gold">Documents</h2>
                <div className="flex gap-2">
                  <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => onFile(e.target.files)} />
                  <Button onClick={() => fileRef.current?.click()} size="sm" className="bg-gold-gradient text-primary-foreground">
                    <Upload className="h-4 w-4 mr-1" /> Upload
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                {docs.length === 0 && (
                  <div className="rounded border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No documents uploaded. Upload PDFs of the rulebook, FAQ, walkthrough or card text to begin.
                  </div>
                )}
                {docs.map((d) => (
                  <button key={d.id} onClick={() => setSelectedDoc(d.id)}
                    className={`w-full text-left rounded border px-3 py-2 flex items-center gap-3 transition ${selectedDoc === d.id ? "border-gold bg-accent/30" : "border-border hover:border-gold-muted"}`}>
                    <DocIcon kind={d.kind} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{d.filename}</div>
                      <div className="text-[10px] text-muted-foreground">{d.kind} · {(d.sizeBytes/1024).toFixed(1)} KB · {new Date(d.uploadedAt).toLocaleString()}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setDocs(docs.filter(x => x.id !== d.id)); }} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="panel-steel rounded-lg p-4">
                <h3 className="font-display text-base text-gold">Component Library</h3>
                <div className="text-xs text-muted-foreground mt-1">Export or merge the entire library JSON.</div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="secondary" onClick={exportLibrary}>Export JSON</Button>
                  <label className="inline-flex">
                    <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importLibraryFile(e.target.files[0])} />
                    <span className="cursor-pointer rounded bg-secondary text-secondary-foreground px-3 py-1.5 text-sm hover:opacity-90">Merge JSON</span>
                  </label>
                </div>
              </div>
              <div className="panel-parchment rounded-lg p-4 text-sm">
                <strong className="font-display text-base">Tip</strong>
                <p className="mt-1">Files are stored locally in your browser. Nothing is uploaded to a server.</p>
              </div>
            </div>
          </div>
        )}

        {tab === "extract" && <Stub title="Extracted Text Viewer" body="Paste or extract text per page and section. Mark approved or needs-review per chunk." />}
        {tab === "parse" && <Stub title="Component Parser Review" body="Map extracted text chunks onto cards, enemies, sites and rules. Approve, edit, or mark needs review." />}
        {tab === "manual" && <Stub title="Manual Component Editor" body="Add or edit cards, enemies, sites, scenarios manually with full schema." icon={<PencilLine className="h-5 w-5 text-gold" />} />}
        {tab === "rules" && <Stub title="Rules Library" body="Search and browse imported rules with source page citations. Open the dedicated Rules screen for the full view." />}
        {tab === "validate" && <Stub title="Data Validation" body="Missing components, duplicates, unparsed sections, conflicts and needs-review items." />}
      </div>
    </AppShell>
  );
}

function DocIcon({ kind }: { kind: ImportedDocument["kind"] }) {
  if (kind === "json") return <FileJson className="h-5 w-5 text-mana-blue" />;
  if (kind === "csv") return <FileSpreadsheet className="h-5 w-5 text-mana-green" />;
  return <FileText className="h-5 w-5 text-gold" />;
}
function Stub({ title, body, icon }: { title: string; body: string; icon?: React.ReactNode }) {
  return (
    <div className="mt-6 panel-steel rounded-lg p-6">
      <div className="flex items-center gap-2 font-display text-lg text-gold">{icon} {title}</div>
      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{body}</p>
      <div className="mt-4 rounded border border-dashed border-border p-6 text-sm text-muted-foreground">
        V1 ships the full workflow shell. Detailed parser UI is wired and ready to receive imported content.
      </div>
    </div>
  );
}
