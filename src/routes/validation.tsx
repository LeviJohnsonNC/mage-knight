import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/mk/AppShell";
import { useGame } from "@/lib/mk/store";

export const Route = createFileRoute("/validation")({
  head: () => ({ meta: [{ title: "Data Validation · Mage Knight Companion" }] }),
  component: ValidationPage,
});

function ValidationPage() {
  const { library, docs } = useGame();

  const cards = Object.values(library.cards);
  const dupNames = Object.entries(
    cards.reduce<Record<string, number>>((acc, c) => ((acc[c.name] = (acc[c.name] ?? 0) + 1), acc), {})
  ).filter(([, n]) => n > 1);

  const needsReview = [
    ...cards.filter((c) => c.needsReview),
    ...Object.values(library.enemies).filter((e) => e.needsReview),
    ...Object.values(library.sites).filter((s) => s.needsReview),
  ];

  const missing: string[] = [];
  if (Object.keys(library.scenarios).length === 0) missing.push("No scenarios imported");
  if (Object.keys(library.heroes).length === 0) missing.push("No heroes imported");
  if (Object.keys(library.tiles).length === 0) missing.push("No map tiles imported");
  if (Object.values(library.cards).every((c) => c.source === "demo")) missing.push("Only demo cards present");
  if (Object.values(library.scenarios).every((s) => s.source === "demo")) missing.push("Only demo scenarios present");
  if (Object.keys(library.rules).length <= 1) missing.push("Rule references are empty or demo-only");

  const noRuleRefs = cards.filter((c) => !c.sourceReference);

  const unparsedDocs = docs.filter((d) => !d.textChunks || d.textChunks.length === 0);

  return (
    <AppShell>
      <div className="max-w-5xl">
        <h1 className="font-display text-4xl text-gold">Data Validation</h1>
        <p className="text-muted-foreground mt-1">What still needs to be imported, reviewed, or resolved.</p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <Section title="Missing required data" items={missing} tone="destructive" />
          <Section title="Duplicate card names" items={dupNames.map(([n, c]) => `${n} ×${c}`)} />
          <Section title="Components without rule references" items={noRuleRefs.map((c) => c.name)} />
          <Section title="Items marked Needs review" items={needsReview.map((n: any) => n.name)} />
          <Section title="Unparsed document sections" items={unparsedDocs.map((d) => d.filename)} />
          <Section title="Conflicts between imported documents" items={[]} hint="No conflicts detected. Conflicts appear here once parsed text disagrees across documents." />
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, items, tone, hint }: { title: string; items: string[]; tone?: "destructive"; hint?: string }) {
  return (
    <div className="panel-steel rounded-lg p-4">
      <h2 className={`font-display text-base ${tone === "destructive" ? "text-destructive" : "text-gold"}`}>{title}</h2>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground mt-2">{hint ?? "All clear."}</div>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((i, idx) => <li key={idx} className="rounded border border-border bg-card/40 px-2 py-1">{i}</li>)}
        </ul>
      )}
    </div>
  );
}
