import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/mk/AppShell";
import { useGame } from "@/lib/mk/store";
import { Swords, Upload, BookOpen, Save as SaveIcon, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mage Knight — Digital Companion" },
      { name: "description", content: "Solo digital companion for the Mage Knight board game. Fan project." },
    ],
  }),
  component: Home,
});

function Home() {
  const { state, library, saves } = useGame();
  const hasGame = state.scenarioId !== null;
  const heroName = state.hero ? library.heroes[state.hero.heroId]?.name ?? "—" : "—";

  return (
    <AppShell fullBleed>
      <div className="relative min-h-screen overflow-hidden">
        {/* Cinematic backdrop */}
        <div className="absolute inset-0 -z-10" style={{
          background:
            "radial-gradient(ellipse at 30% 20%, oklch(0.32 0.06 260) 0%, transparent 60%)," +
            "radial-gradient(ellipse at 80% 70%, oklch(0.30 0.12 60 / 30%) 0%, transparent 55%)," +
            "linear-gradient(180deg, oklch(0.12 0.02 250) 0%, oklch(0.08 0.02 250) 100%)",
        }} />
        <div className="absolute inset-0 -z-10 opacity-30 mix-blend-overlay" style={{
          backgroundImage:
            "repeating-linear-gradient(60deg, transparent 0 40px, oklch(1 0 0 / 2%) 40px 41px)," +
            "repeating-linear-gradient(-60deg, transparent 0 40px, oklch(1 0 0 / 2%) 40px 41px)",
        }} />

        <div className="mx-auto max-w-6xl px-10 pt-20 pb-12">
          <div className="text-xs tracking-[0.3em] text-gold-muted uppercase">Fan Project · Solo Vertical Slice</div>
          <h1 className="mt-3 font-display text-6xl text-gold leading-tight">Mage Knight</h1>
          <h2 className="font-display text-3xl text-foreground/80">Digital Companion</h2>
          <p className="mt-6 max-w-2xl text-muted-foreground">
            A rules-engine-first solo experience for the Mage Knight board game. Bring your own
            rulebook, FAQ and component data through the Import Center — the app ships with
            clearly-labeled <em>demo placeholder data</em> only.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-5 max-w-4xl">
            <HomeCard
              to="/game"
              title={hasGame ? "Continue Game" : "No game in progress"}
              subtitle={hasGame ? `${heroName} · Round ${state.round}` : "Start a new solo scenario to begin"}
              icon={<Sparkles className="h-6 w-6" />}
              primary
              disabled={!hasGame}
            />
            <HomeCard to="/new-game" title="New Solo Game" subtitle="Guided setup wizard" icon={<Swords className="h-6 w-6" />} />
            <HomeCard to="/import" title="Import Center" subtitle="Upload rulebooks, FAQs, cards" icon={<Upload className="h-6 w-6" />} />
            <HomeCard to="/rules" title="Rules Library" subtitle="Searchable, with source citations" icon={<BookOpen className="h-6 w-6" />} />
            <HomeCard to="/saves" title={`Saved Games · ${saves.length}`} subtitle="Load, duplicate, export" icon={<SaveIcon className="h-6 w-6" />} />
            <HomeCard to="/validation" title="Data Validation" subtitle="See what still needs imported data" icon={<Sparkles className="h-6 w-6" />} />
          </div>

          <p className="mt-12 text-xs text-muted-foreground/70 max-w-2xl">
            This is a fan-made companion. No official Mage Knight rules, card text, enemy stats, or
            scenario content are bundled — you must import them. All bundled content is generic
            placeholder data labeled <span className="text-gold-muted">“Demo”</span>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function HomeCard({ to, title, subtitle, icon, primary, disabled }: {
  to: string; title: string; subtitle: string; icon: React.ReactNode; primary?: boolean; disabled?: boolean;
}) {
  const cls = `group relative block rounded-lg p-6 transition-all ${
    primary ? "panel-steel gold-trim hover:glow-gold" : "panel-steel hover:border-gold-muted"
  } ${disabled ? "opacity-50 pointer-events-none" : ""}`;
  return (
    <Link to={to} className={cls}>
      <div className="flex items-start justify-between">
        <div className={`grid h-12 w-12 place-items-center rounded ${primary ? "bg-gold-gradient text-primary-foreground" : "bg-accent text-gold"}`}>
          {icon}
        </div>
        {primary && <span className="text-[10px] tracking-widest uppercase text-gold-muted">Continue</span>}
      </div>
      <div className="mt-4 font-display text-xl text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground">{subtitle}</div>
    </Link>
  );
}
