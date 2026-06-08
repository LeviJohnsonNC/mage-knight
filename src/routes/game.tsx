import { createFileRoute, Link } from "@tanstack/react-router";
import { useGame } from "@/lib/mk/store";
import { HexMap } from "@/components/mk/HexMap";
import { Hand } from "@/components/mk/Hand";
import { HeroPanel } from "@/components/mk/HeroPanel";
import { ActionPanel } from "@/components/mk/ActionPanel";
import { EventLog } from "@/components/mk/EventLog";
import { Button } from "@/components/ui/button";
import { deriveTurnTotals, phaseTitle } from "@/lib/mk/engine";
import { Moon, Sun, Save, Undo2, ScrollText, BookOpen, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/game")({
  head: () => ({ meta: [{ title: "Solo Game · Mage Knight Companion" }] }),
  component: GamePage,
});

function GamePage() {
  const { state, library, doUndo, saveGame } = useGame();
  const [logOpen, setLogOpen] = useState(true);
  const totals = deriveTurnTotals(state);

  if (state.scenarioId === null) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="panel-steel rounded-lg p-10 text-center max-w-md">
          <h1 className="font-display text-2xl text-gold">No game in progress</h1>
          <p className="text-muted-foreground mt-2">Start a new solo scenario from the setup wizard.</p>
          <Link to="/new-game" className="inline-block mt-4 rounded bg-gold-gradient px-4 py-2 text-sm text-primary-foreground">New Game</Link>
        </div>
      </div>
    );
  }

  const scenario = library.scenarios[state.scenarioId];
  const usingDemo = scenario?.source === "demo" || library.heroes[state.hero?.heroId ?? ""]?.source === "demo";

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 panel-steel border-b border-border flex items-center px-4 gap-4 shrink-0">
        <Link to="/" className="h-8 w-8 grid place-items-center rounded bg-gold-gradient text-primary-foreground font-display">MK</Link>
        <div className="flex items-center gap-1">
          <span className="font-display text-gold text-base">{scenario?.name ?? "Scenario"}</span>
          <span className="text-muted-foreground mx-2">·</span>
          <span className="text-xs text-muted-foreground">Round {state.round}</span>
        </div>
        <div className="flex items-center gap-1 rounded border border-border bg-card/40 px-2 py-1 text-xs">
          {state.daynight === "day" ? <Sun className="h-3.5 w-3.5 text-gold" /> : <Moon className="h-3.5 w-3.5 text-mana-blue" />}
          <span className="capitalize">{state.daynight}</span>
        </div>
        <div className="rounded border border-border bg-card/40 px-2 py-1 text-xs">
          Phase · <span className="text-gold">{phaseTitle(state.phase)}</span>
        </div>
        {state.hero && (
          <>
            <Badge label="Fame" value={state.hero.fame} />
            <Badge label="Reputation" value={`${state.hero.reputation > 0 ? "+" : ""}${state.hero.reputation}`} />
          </>
        )}
        {usingDemo && (
          <div className="ml-auto flex items-center gap-1 rounded border border-gold-muted/40 bg-accent/40 px-2 py-1 text-[10px] uppercase tracking-widest text-gold-muted">
            <AlertTriangle className="h-3 w-3" /> Demo data
          </div>
        )}
        <div className={`flex items-center gap-1 ${usingDemo ? "" : "ml-auto"}`}>
          <Button size="sm" variant="ghost" onClick={() => doUndo()} title="Undo last event"><Undo2 className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => { saveGame(`Save ${new Date().toLocaleString()}`); toast.success("Game saved"); }}><Save className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setLogOpen((x) => !x)}><ScrollText className="h-4 w-4" /></Button>
          <Link to="/rules"><Button size="sm" variant="ghost"><BookOpen className="h-4 w-4" /></Button></Link>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden gap-3 p-3">
        {/* Left */}
        <div className="w-72 shrink-0"><HeroPanel /></div>

        {/* Center */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex-1 min-h-0"><HexMap movePoints={totals.movePoints} /></div>
          <div className="h-52 panel-steel rounded-lg p-3 flex items-end overflow-x-auto scrollbar-thin">
            <div className="flex items-end gap-4 flex-1">
              <div className="flex flex-col items-center gap-1 text-xs">
                <div className="h-32 w-24 rounded-lg panel-parchment grid place-items-center">
                  <span className="font-display text-[var(--parchment-ink)] text-2xl">{state.hero?.deck.length ?? 0}</span>
                </div>
                <div className="text-muted-foreground">Deck</div>
              </div>
              <div className="flex-1 min-w-0"><Hand /></div>
              <div className="flex flex-col items-center gap-1 text-xs">
                <div className="h-32 w-24 rounded-lg bg-accent border border-border grid place-items-center">
                  <span className="font-display text-2xl">{state.hero?.discard.length ?? 0}</span>
                </div>
                <div className="text-muted-foreground">Discard</div>
              </div>
              <div className="flex flex-col items-center gap-1 text-xs">
                <div className="h-32 w-24 rounded-lg border border-destructive/40 bg-destructive/10 grid place-items-center">
                  <span className="font-display text-2xl text-destructive">{state.hero?.wounds ?? 0}</span>
                </div>
                <div className="text-muted-foreground">Wounds</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="w-80 shrink-0 flex flex-col gap-3">
          <div className="flex-1 min-h-0"><ActionPanel /></div>
          {logOpen && <div className="h-56"><EventLog /></div>}
        </div>
      </div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-border bg-card/40 px-2 py-1 text-xs flex items-center gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-display text-gold">{value}</span>
    </div>
  );
}
