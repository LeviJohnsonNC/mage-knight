import { useGame } from "@/lib/mk/store";
import { Shield, Heart, Hand as HandIcon, Crown, Sparkles, Swords } from "lucide-react";

export function HeroPanel() {
  const { state, library } = useGame();
  if (!state.hero) return <div className="panel-steel rounded-lg p-4 text-sm text-muted-foreground">No hero in play</div>;
  const h = state.hero;
  const hero = library.heroes[h.heroId];

  return (
    <div className="panel-steel rounded-lg p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded bg-gold-gradient grid place-items-center text-primary-foreground font-display text-2xl shadow">
          {(hero?.name ?? "?").slice(0, 1)}
        </div>
        <div>
          <div className="font-display text-lg text-gold leading-tight">{hero?.name ?? "Hero"}</div>
          <div className="text-[10px] uppercase tracking-widest text-gold-muted">Level {h.level}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Stat icon={<Shield className="h-4 w-4" />} label="Armor" value={h.armor} />
        <Stat icon={<HandIcon className="h-4 w-4" />} label="Hand" value={h.handLimit} />
        <Stat icon={<Crown className="h-4 w-4" />} label="Command" value={h.commandLimit} />
        <Stat icon={<Heart className="h-4 w-4 text-destructive" />} label="Wounds" value={h.wounds} />
        <Stat icon={<Sparkles className="h-4 w-4 text-gold" />} label="Fame" value={h.fame} />
        <Stat icon={<Swords className="h-4 w-4" />} label="Reputation" value={`${h.reputation > 0 ? "+" : ""}${h.reputation}`} />
      </div>

      <Section title="Crystals">
        <div className="flex gap-1 flex-wrap">
          {(["red","blue","green","white","gold","black"] as const).map((c) => (
            <div key={c} className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px]">
              <span className="h-3 w-3 rounded-sm" style={{ background: `var(--color-mana-${c})`, boxShadow: `0 0 6px var(--color-mana-${c})` }} />
              <span className="text-muted-foreground">{h.crystals[c] ?? 0}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Skills">
        {h.skills.length === 0 ? <Hint>No skills yet</Hint> : h.skills.map((id) => <Pill key={id}>{library.skills[id]?.name ?? id}</Pill>)}
      </Section>
      <Section title="Units">
        {h.units.length === 0 ? <Hint>No units recruited</Hint> : h.units.map((id) => <Pill key={id}>{library.units[id]?.name ?? id}</Pill>)}
      </Section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-2 rounded border border-border bg-card/40 px-2 py-1.5">
      {icon}
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="font-display text-base">{value}</div>
      </div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-gold-muted mb-1">{title}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}
function Hint({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-muted-foreground italic">{children}</span>;
}
function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded border border-border bg-card px-2 py-0.5 text-[11px]">{children}</span>;
}
