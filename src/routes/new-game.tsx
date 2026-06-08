import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/mk/AppShell";
import { useGame } from "@/lib/mk/store";
import { useCommunity } from "@/lib/mk/communityStore";
import { buildChecklist } from "@/lib/mk/community";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check } from "lucide-react";

export const Route = createFileRoute("/new-game")({
  head: () => ({ meta: [{ title: "New Game · Mage Knight Companion" }] }),
  component: NewGame,
});

function NewGame() {
  const { library, dispatch } = useGame();
  const nav = useNavigate();
  const scenarios = Object.values(library.scenarios).filter((s) => s.soloCompatible);
  const heroes = Object.values(library.heroes);
  const [scenarioId, setScenarioId] = useState<string>(scenarios[0]?.id ?? "");
  const [heroId, setHeroId] = useState<string>(heroes[0]?.id ?? "");

  const scenario = library.scenarios[scenarioId];
  const hero = library.heroes[heroId];
  const checks = [
    { ok: !!scenario, label: "Scenario data present" },
    { ok: !!hero, label: "Hero data present" },
    { ok: hero ? hero.startingDeck.length > 0 : false, label: "Hero starting deck defined" },
    { ok: Object.keys(library.tiles).length > 0, label: "At least one map tile" },
  ];
  const allDemo = scenario?.source === "demo" || hero?.source === "demo";

  function start() {
    dispatch({ type: "START_GAME", scenarioId, heroId, timestamp: Date.now() });
    nav({ to: "/game" });
  }

  return (
    <AppShell>
      <div className="max-w-4xl">
        <h1 className="font-display text-4xl text-gold">New Solo Game</h1>
        <p className="text-muted-foreground mt-2">Choose a scenario and hero. The engine will check required data and warn before you begin.</p>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <Panel title="Solo Scenario">
            {scenarios.length === 0 && <Empty label="Needs imported Mage Knight scenario data" />}
            {scenarios.map((s) => (
              <Choice key={s.id} active={s.id === scenarioId} onClick={() => setScenarioId(s.id)}
                title={s.name} sub={s.objective} demo={s.source === "demo"} />
            ))}
          </Panel>
          <Panel title="Hero">
            {heroes.length === 0 && <Empty label="Needs imported hero data" />}
            {heroes.map((h) => (
              <Choice key={h.id} active={h.id === heroId} onClick={() => setHeroId(h.id)}
                title={h.name} sub={h.description ?? "—"} demo={h.source === "demo"} />
            ))}
          </Panel>
        </div>

        <Panel title="Data Readiness" className="mt-6">
          <ul className="space-y-2">
            {checks.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                {c.ok ? <Check className="h-4 w-4 text-mana-green" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
                <span className={c.ok ? "" : "text-destructive"}>{c.label}</span>
              </li>
            ))}
          </ul>
          {allDemo && (
            <div className="mt-4 rounded border border-gold-muted/40 bg-accent/30 p-3 text-sm">
              <span className="text-gold">Demo data selected.</span> You can play the vertical slice, but
              this is not official Mage Knight content. Import real data via the Import Center.
            </div>
          )}
        </Panel>

        <div className="mt-8 flex gap-3">
          <Button onClick={start} disabled={!scenario || !hero} className="bg-gold-gradient text-primary-foreground hover:opacity-90">
            Begin Scenario
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`panel-steel rounded-lg p-5 ${className}`}>
      <h2 className="font-display text-lg text-gold mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function Choice({ active, onClick, title, sub, demo }: { active: boolean; onClick: () => void; title: string; sub: string; demo?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full text-left rounded border p-3 transition ${active ? "border-gold bg-accent/40 glow-gold" : "border-border hover:border-gold-muted"}`}>
      <div className="flex justify-between items-center">
        <span className="font-medium">{title}</span>
        {demo && <span className="text-[10px] tracking-widest uppercase text-gold-muted">Demo</span>}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </button>
  );
}
function Empty({ label }: { label: string }) {
  return <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{label}</div>;
}
