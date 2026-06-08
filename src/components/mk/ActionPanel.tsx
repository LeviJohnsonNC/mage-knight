import { useGame } from "@/lib/mk/store";
import { deriveTurnTotals, legal, phaseTitle } from "@/lib/mk/engine";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

export function ActionPanel() {
  const { state, library, dispatch } = useGame();
  const totals = deriveTurnTotals(state);
  const [overrideText, setOverrideText] = useState("");

  return (
    <div className="panel-steel rounded-lg p-4 flex flex-col gap-3 h-full overflow-hidden">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-gold-muted">Current Phase</div>
        <div className="font-display text-lg text-gold">{phaseTitle(state.phase)}</div>
      </div>

      <Tabs defaultValue="actions" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid grid-cols-4 bg-secondary">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="combat">Combat</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="override">Override</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="flex-1 overflow-auto scrollbar-thin space-y-3 mt-3">
          <Totals movePoints={totals.movePoints} attackPoints={totals.attackPoints} blockPoints={totals.blockPoints} influencePoints={totals.influencePoints} />

          <Box title="Legal Actions">
            {state.phase === "tactics-selection" && (
              <>
                {Object.values(library.tactics)
                  .filter((t) => t.daynight === state.daynight)
                  .map((t) => (
                    <Button key={t.id} variant="secondary" size="sm" className="w-full justify-start"
                      onClick={() => dispatch({ type: "SELECT_TACTIC", tacticId: t.id, timestamp: Date.now() })}>
                      Choose: {t.name}
                    </Button>
                  ))}
              </>
            )}
            {state.phase !== "tactics-selection" && (
              <>
                {state.tileStack.length > 0 && (
                  <Button variant="secondary" size="sm" className="w-full justify-start"
                    onClick={() => {
                      // reveal next tile adjacent to hero approximately
                      const hero = state.hero!;
                      dispatch({ type: "REVEAL_TILE", tileId: state.tileStack[0], center: { q: hero.location.q + 2, r: hero.location.r }, timestamp: Date.now() });
                    }}>Reveal next tile</Button>
                )}
                <Button variant="secondary" size="sm" className="w-full justify-start"
                  disabled={state.combat.active}
                  onClick={() => dispatch({ type: "START_COMBAT", enemyInstanceIds: ["demo-enemy-1"], timestamp: Date.now() })}>
                  Begin demo combat
                </Button>
                <Button size="sm" className="w-full justify-start bg-gold-gradient text-primary-foreground"
                  disabled={!legal.canEndTurn(state)}
                  onClick={() => dispatch({ type: "END_TURN", timestamp: Date.now() })}>
                  End Turn
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start"
                  onClick={() => dispatch({ type: "END_ROUND", timestamp: Date.now() })}>End Round</Button>
              </>
            )}
          </Box>

          <Box title="Mana Source">
            <div className="flex gap-2 flex-wrap">
              {state.manaSource.map((c, i) => (
                <button key={i} onClick={() => dispatch({ type: "USE_MANA_DIE", color: c, index: i, timestamp: Date.now() })}
                  className="h-9 w-9 rounded grid place-items-center text-[10px] font-display gold-trim glow-mana"
                  style={{ background: `var(--color-mana-${c})`, color: c === "white" || c === "gold" ? "oklch(0.18 0.02 250)" : "white" }}>
                  {c[0].toUpperCase()}
                </button>
              ))}
              <div className="text-xs text-muted-foreground self-center">Used this turn: {state.manaSourceUsed}</div>
            </div>
          </Box>
        </TabsContent>

        <TabsContent value="combat" className="flex-1 overflow-auto scrollbar-thin mt-3">
          {!state.combat.active ? (
            <div className="text-sm text-muted-foreground">No active combat. Use “Begin demo combat” to walk the resolver.</div>
          ) : (
            <CombatResolver />
          )}
        </TabsContent>

        <TabsContent value="rules" className="flex-1 overflow-auto scrollbar-thin mt-3 text-sm">
          <div className="rounded border border-gold-muted/30 bg-accent/30 p-3">
            <div className="text-[10px] uppercase tracking-widest text-gold-muted">Rules Assistant</div>
            <p className="mt-1 text-muted-foreground">
              No imported rule references for the current selection. Import the rulebook and FAQ via{" "}
              <span className="text-gold">Import Center</span> to populate citations here.
            </p>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <strong className="text-gold">Why an action is legal:</strong> the rules engine derives legal
            actions from the current phase and hero state. Hover the End Turn or move-highlighted hexes
            to see the relevant phase.
          </div>
        </TabsContent>

        <TabsContent value="override" className="flex-1 overflow-auto scrollbar-thin mt-3 space-y-2">
          <div className="text-xs text-muted-foreground">Manual override is logged in the event log. Use it for edge cases the engine doesn’t cover.</div>
          <textarea value={overrideText} onChange={(e) => setOverrideText(e.target.value)}
            placeholder="Describe what you’re changing and cite a rule or FAQ entry if possible…"
            className="w-full h-24 rounded border border-border bg-input p-2 text-sm" />
          <Button size="sm" onClick={() => {
            if (!overrideText.trim()) return;
            dispatch({ type: "MANUAL_OVERRIDE", description: overrideText.trim(), patch: {}, timestamp: Date.now() });
            toast.success("Override logged");
            setOverrideText("");
          }}>Log override</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Totals({ movePoints, attackPoints, blockPoints, influencePoints }: { movePoints: number; attackPoints: number; blockPoints: number; influencePoints: number }) {
  const items = [
    { l: "Move", v: movePoints, c: "mana-green" },
    { l: "Attack", v: attackPoints, c: "mana-red" },
    { l: "Block", v: blockPoints, c: "mana-blue" },
    { l: "Influence", v: influencePoints, c: "mana-gold" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((i) => (
        <div key={i.l} className="rounded border border-border bg-card/40 p-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{i.l}</div>
          <div className="font-display text-xl" style={{ color: `var(--color-${i.c})` }}>{i.v}</div>
        </div>
      ))}
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-border bg-card/30 p-3">
      <div className="text-[10px] uppercase tracking-widest text-gold-muted mb-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CombatResolver() {
  const { state, library, dispatch } = useGame();
  const steps = ["ranged", "block", "damage", "attack", "rewards"] as const;
  const enemy = library.enemies["demo-enemy-brigand"];
  return (
    <div className="space-y-3">
      <div className="rounded panel-parchment p-3">
        <div className="font-display text-base text-[var(--parchment-ink)]">{enemy?.name ?? "Enemy"}</div>
        <div className="text-xs">Attack {enemy?.attack} · Armor {enemy?.armor} · Fame {enemy?.fame}</div>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {steps.map((s) => (
          <div key={s} className={`rounded p-2 text-[10px] text-center uppercase tracking-widest ${state.combat.step === s ? "bg-gold-gradient text-primary-foreground" : "bg-accent text-muted-foreground"}`}>{s}</div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Mini label="Attack" v={state.combat.totals.attack} />
        <Mini label="Block" v={state.combat.totals.block} />
        <Mini label="Damage Taken" v={state.combat.totals.damageTaken} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "ASSIGN_ATTACK", cardId: "manual", amount: 2, kind: "melee", timestamp: Date.now() })}>+2 Attack</Button>
        <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "ASSIGN_BLOCK", cardId: "manual", amount: 2, timestamp: Date.now() })}>+2 Block</Button>
        <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "ASSIGN_DAMAGE", amount: enemy?.attack ?? 0, timestamp: Date.now() })}>Take hit</Button>
      </div>
      <Button size="sm" className="w-full bg-gold-gradient text-primary-foreground"
        onClick={() => {
          dispatch({ type: "DEFEAT_ENEMY", enemyInstanceId: state.combat.enemies[0] ?? "demo-enemy-1", timestamp: Date.now() });
          dispatch({ type: "GAIN_FAME", amount: enemy?.fame ?? 0, timestamp: Date.now() });
        }}>Defeat enemy & collect Fame</Button>
    </div>
  );
}
function Mini({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded border border-border bg-card/40 p-2 text-center">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-lg">{v}</div>
    </div>
  );
}
