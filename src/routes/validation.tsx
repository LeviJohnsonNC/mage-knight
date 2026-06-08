import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/mk/AppShell";
import { useGame } from "@/lib/mk/store";
import { useCommunity } from "@/lib/mk/communityStore";
import { buildChecklist, detectDuplicates, CATEGORY_LABELS } from "@/lib/mk/community";
import { useMemo } from "react";
import { AlertTriangle, Check, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/validation")({
  head: () => ({ meta: [{ title: "Data Validation · Mage Knight Companion" }] }),
  component: ValidationPage,
});

function ValidationPage() {
  const { library, docs } = useGame();
  const { state: community } = useCommunity();

  const checklist = useMemo(() => buildChecklist(community.drafts, community.expectedCounts, true), [community.drafts, community.expectedCounts]);
  const textApprovedChecklist = useMemo(() => buildChecklist(community.drafts, community.expectedCounts, false), [community.drafts, community.expectedCounts]);
  const duplicates = useMemo(() => Object.values(detectDuplicates(community.drafts)), [community.drafts]);

  const needsReview = community.drafts.filter((d) => !d.textApproved);
  const noSource = community.drafts.filter((d) => !d.sourceUrl && !d.sourceTitle);
  const missingMsgs: string[] = [];
  if (Object.keys(library.scenarios).length === 0) missingMsgs.push("No scenarios in library");
  if (Object.keys(library.heroes).length === 0) missingMsgs.push("No heroes in library");
  if (Object.keys(library.tiles).length === 0) missingMsgs.push("No map tiles in library");

  const unparsedDocs = docs.filter((d) => !d.textChunks || d.textChunks.length === 0);

  return (
    <AppShell>
      <div className="max-w-6xl">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-4xl text-gold">Data Validation</h1>
            <p className="text-muted-foreground mt-1">Playability checklist, dataset gaps, conflicts and review queue.</p>
          </div>
          <Link to="/community" className="text-sm text-gold hover:underline flex items-center gap-1">
            Open Community Importer <ExternalLink className="h-3 w-3" />
          </Link>
        </header>

        <section className="mt-6 panel-steel rounded-lg p-5">
          <h2 className="font-display text-lg text-gold mb-3">Playability Checklist (base game)</h2>
          <p className="text-xs text-muted-foreground mb-3">Counts reflect <strong>automation-approved</strong> drafts from the Community Importer. Edit expected counts on the Dataset tab there for expansions / Ultimate Edition.</p>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr><th className="text-left py-1">Component</th><th className="text-right">Expected</th><th className="text-right">Automation</th><th className="text-right">Text-approved+</th><th className="text-right">Status</th></tr>
            </thead>
            <tbody>
              {checklist.map((r, i) => (
                <tr key={r.key} className="border-t border-border/50">
                  <td className="py-1.5">{r.label}</td>
                  <td className="text-right font-mono">{r.expected}</td>
                  <td className="text-right font-mono">{r.have}</td>
                  <td className="text-right font-mono text-muted-foreground">{textApprovedChecklist[i].have}</td>
                  <td className="text-right">
                    {r.ok ? <Check className="inline h-4 w-4 text-mana-green" /> : <AlertTriangle className="inline h-4 w-4 text-destructive" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <Section title="Library gaps" items={missingMsgs} tone="destructive" />
          <Section title="Drafts needing review"
            items={needsReview.slice(0, 30).map((d) => `${d.name} · ${CATEGORY_LABELS[d.category]}`)}
            empty={needsReview.length === 0 ? "All drafts have been reviewed." : `${needsReview.length} total`} />
          <Section title="Duplicate / conflicting names"
            items={duplicates.map((arr) => `${arr[0].name} ×${arr.length}`)}
            empty="No duplicates detected." />
          <Section title="Drafts missing source attribution"
            items={noSource.map((d) => d.name)}
            empty="Every draft has a source." />
          <Section title="Unparsed uploaded documents"
            items={unparsedDocs.map((d) => d.filename)}
            empty="All uploaded documents have parsed text." />
          <Section title="Dataset mode"
            items={[
              `Mode: ${community.datasetMode}`,
              `Play mode: ${community.playMode}`,
              `Total drafts: ${community.drafts.length}`,
              `Sources used: ${new Set(community.drafts.map((d) => d.sourceId)).size}`,
            ]} />
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, items, tone, empty }: { title: string; items: string[]; tone?: "destructive"; empty?: string }) {
  return (
    <div className="panel-steel rounded-lg p-4">
      <h2 className={`font-display text-base ${tone === "destructive" ? "text-destructive" : "text-gold"}`}>{title}</h2>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground mt-2">{empty ?? "All clear."}</div>
      ) : (
        <ul className="mt-2 space-y-1 text-sm max-h-64 overflow-auto">
          {items.map((i, idx) => <li key={idx} className="rounded border border-border bg-card/40 px-2 py-1">{i}</li>)}
        </ul>
      )}
    </div>
  );
}
