import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/mk/AppShell";
import { useGame } from "@/lib/mk/store";
import { useState } from "react";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Component Library · Mage Knight Companion" }] }),
  component: LibraryPage,
});

const TABS = ["cards","heroes","enemies","sites","tiles","scenarios","tactics"] as const;

function LibraryPage() {
  const { library } = useGame();
  const [tab, setTab] = useState<typeof TABS[number]>("cards");
  const [q, setQ] = useState("");

  const items = (Object.values((library as any)[tab]) as any[])
    .filter((x: any) => !q || (x.name?.toLowerCase().includes(q.toLowerCase())));

  return (
    <AppShell>
      <div className="max-w-6xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-4xl text-gold">Component Library</h1>
            <p className="text-muted-foreground mt-1">Everything the rules engine can use. Only demo placeholders are shown until you import real data.</p>
          </div>
          <Link to="/community" className="text-sm text-gold hover:underline self-start">Community Source Importer →</Link>
        </div>
        <div className="mt-5 flex items-center gap-2 border-b border-border">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm border-b-2 -mb-px capitalize ${tab === t ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t} <span className="text-[10px] text-muted-foreground">({Object.keys((library as any)[t]).length})</span>
            </button>
          ))}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
            className="ml-auto rounded border border-border bg-input px-3 py-1.5 text-sm w-60" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {items.length === 0 && (
            <div className="col-span-3 panel-steel rounded-lg p-8 text-center text-muted-foreground text-sm">
              Needs imported Mage Knight data — no items in this category yet.
            </div>
          )}
          {items.map((x: any) => (
            <div key={x.id} className="panel-steel rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="font-display text-base text-gold">{x.name}</div>
                {x.source === "demo" && <span className="text-[9px] tracking-widest uppercase text-gold-muted">Demo</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-1 capitalize">{x.type ?? x.kind ?? x.siteType ?? tab}</div>
              <div className="mt-2 text-xs whitespace-pre-wrap line-clamp-4">{x.normalEffect ?? x.description ?? x.objective ?? x.rewardRules ?? ""}</div>
              {x.needsReview && <div className="mt-2 text-[10px] text-destructive">Needs review</div>}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
