import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/mk/AppShell";
import { useGame } from "@/lib/mk/store";
import { useState } from "react";

export const Route = createFileRoute("/rules")({
  head: () => ({ meta: [{ title: "Rules Library · Mage Knight Companion" }] }),
  component: RulesPage,
});

function RulesPage() {
  const { library } = useGame();
  const [q, setQ] = useState("");
  const entries = Object.values(library.rules).filter((r) =>
    !q || r.title.toLowerCase().includes(q.toLowerCase()) || r.fullText.toLowerCase().includes(q.toLowerCase()) || r.keywords.some((k) => k.includes(q.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="max-w-4xl">
        <h1 className="font-display text-4xl text-gold">Rules Library</h1>
        <p className="text-muted-foreground mt-1">Search imported rule entries. Cite source document, page and section where available.</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rules, FAQ, keywords…"
          className="mt-4 w-full rounded border border-border bg-input px-3 py-2 text-sm" />

        <div className="mt-5 space-y-3">
          {entries.length === 0 && (
            <div className="panel-steel rounded-lg p-8 text-center text-muted-foreground text-sm">
              Needs imported Mage Knight rules data. Upload the rulebook, walkthrough, or FAQ in the Import Center.
            </div>
          )}
          {entries.map((r) => (
            <article key={r.id} className="panel-parchment rounded-lg p-5">
              <header className="flex items-baseline justify-between">
                <h2 className="font-display text-lg">{r.title}</h2>
                <span className="text-[10px] uppercase tracking-widest text-[var(--gold-muted)]">{r.category}</span>
              </header>
              <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{r.fullText}</p>
              {(r.sourceDocument || r.pageNumber || r.section) && (
                <div className="mt-3 text-[11px] text-[var(--parchment-ink)]/70">
                  Source: {r.sourceDocument ?? "—"}{r.pageNumber ? `, p. ${r.pageNumber}` : ""}{r.section ? `, §${r.section}` : ""}
                </div>
              )}
              {r.needsReview && <div className="mt-2 text-[10px] text-destructive">Needs review</div>}
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
