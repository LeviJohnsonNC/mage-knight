import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/mk/AppShell";
import { useGame } from "@/lib/mk/store";
import type { ReactNode } from "react";

import heroBg from "@/assets/home/hero-bg.png.asset.json";
import textureHex from "@/assets/home/texture-hex.png.asset.json";
import crest from "@/assets/home/crest.png.asset.json";
import iconContinue from "@/assets/home/icon-continue.png.asset.json";
import iconNewGame from "@/assets/home/icon-newgame.png.asset.json";
import iconImport from "@/assets/home/icon-import.png.asset.json";
import iconRules from "@/assets/home/icon-rules.png.asset.json";
import iconSaved from "@/assets/home/icon-saved.png.asset.json";
import iconValidation from "@/assets/home/icon-validation.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mage Knight — Digital Companion" },
      { name: "description", content: "A cinematic solo digital companion for the Mage Knight board game. Fan project." },
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
        <AmbientBackground />

        <div className="relative z-10 mx-auto max-w-[1400px] px-12 pt-16 pb-10 grid grid-cols-[minmax(0,1.05fr)_minmax(560px,1fr)] gap-12 items-start">
          <HeroTitleBlock />
          <HomeActionGrid hasGame={hasGame} heroName={heroName} round={state.round} savesCount={saves.length} />
        </div>

        <LegalDisclaimer />
      </div>
    </AppShell>
  );
}

/* ============ Ambient Background ============ */
function AmbientBackground() {
  return (
    <>
      {/* Cinematic hero image */}
      <div
        className="absolute inset-0 -z-30 bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg.url})`, backgroundPosition: "30% center" }}
      />
      {/* Dark gradient overlays for readability */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.08 0.02 250 / 92%) 0%, oklch(0.08 0.02 250 / 70%) 35%, oklch(0.08 0.02 250 / 40%) 65%, oklch(0.08 0.02 250 / 80%) 100%)," +
            "linear-gradient(180deg, oklch(0.06 0.02 250 / 60%) 0%, transparent 35%, transparent 65%, oklch(0.06 0.02 250 / 90%) 100%)",
        }}
      />
      {/* Ember & arcane glows */}
      <div
        className="absolute inset-0 -z-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 12% 35%, oklch(0.45 0.18 285 / 18%) 0%, transparent 70%)," +
            "radial-gradient(ellipse 40% 30% at 88% 80%, oklch(0.55 0.16 50 / 14%) 0%, transparent 70%)",
        }}
      />
      {/* Parchment / hex texture overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.18] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url(${textureHex.url})`, backgroundSize: "640px 640px" }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, oklch(0 0 0 / 55%) 100%)",
        }}
      />
      {/* Drifting motes */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="mk-mote"
            style={{
              left: `${(i * 73) % 100}%`,
              top: `${(i * 41) % 100}%`,
              animationDelay: `${(i * 1.3) % 9}s`,
              animationDuration: `${10 + (i % 7)}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ============ Hero / Title ============ */
function HeroTitleBlock() {
  return (
    <div className="pt-6">
      <div className="mk-eyebrow">Fan Project · Solo Vertical Slice</div>
      <h1 className="mt-5 font-display text-[6.25rem] leading-[0.95] tracking-[0.02em] text-gold mk-title-glow">
        Mage Knight
      </h1>
      <div className="mt-2 font-display text-2xl tracking-[0.28em] uppercase text-foreground/75">
        Digital&nbsp;Companion
      </div>

      <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-foreground/80">
        Run a faithful solo campaign with guided automation, save/load, undo, and a
        rules-engine-first tabletop experience.
      </p>

      <FeatureBadgeStrip />
    </div>
  );
}

function FeatureBadgeStrip() {
  const badges = ["Solo Vertical Slice", "Rules Engine First", "Save / Undo", "Bring Your Own Data"];
  return (
    <div className="mt-8 flex flex-wrap gap-3 max-w-xl">
      {badges.map((b) => (
        <span key={b} className="mk-engraved-badge">{b}</span>
      ))}
    </div>
  );
}

/* ============ Action Grid ============ */
function HomeActionGrid({
  hasGame, heroName, round, savesCount,
}: { hasGame: boolean; heroName: string; round: number; savesCount: number }) {
  return (
    <div className="pt-4">
      <div className="grid grid-cols-2 gap-5">
        <HomeActionCard
          to="/game"
          icon={iconContinue.url}
          title="Continue Game"
          description={hasGame ? `${heroName} · Round ${round}` : "No campaign currently in progress"}
          status={hasGame ? "In Progress" : "No Active Save"}
          disabled={!hasGame}
        />
        <HomeActionCard
          to="/new-game"
          icon={iconNewGame.url}
          title="New Solo Game"
          description="Begin a guided solo scenario"
          status="Start Here"
          primary
        />
        <HomeActionCard
          to="/import"
          icon={iconImport.url}
          title="Import Center"
          description="Upload rulebooks, FAQs, cards, and component data"
          status="Bring Your Own Data"
        />
        <HomeActionCard
          to="/rules"
          icon={iconRules.url}
          title="Rules Library"
          description="Search imported rules with source references"
          status="Search & Cite"
        />
        <HomeActionCard
          to="/saves"
          icon={iconSaved.url}
          title="Saved Games"
          description="Load, duplicate, export, or import saves"
          status={`${savesCount} Save${savesCount === 1 ? "" : "s"}`}
        />
        <HomeActionCard
          to="/validation"
          icon={iconValidation.url}
          title="Data Validation"
          description="Review missing, duplicate, or unapproved data"
          status="Check Readiness"
        />
      </div>
    </div>
  );
}

function HomeActionCard({
  to, icon, title, description, status, primary, disabled,
}: {
  to: string; icon: string; title: string; description: string;
  status: string; primary?: boolean; disabled?: boolean;
}) {
  const inner: ReactNode = (
    <>
      <CornerTrim />
      <div className="relative flex gap-5 items-start">
        <div className="mk-motif-slot shrink-0">
          <img src={icon} alt="" className="h-[68px] w-[68px] object-contain" />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-[1.35rem] tracking-wide text-gold">{title}</h3>
            <span className={`mk-status-label ${primary ? "mk-status-primary" : ""}`}>{status}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">{description}</p>
        </div>
      </div>
    </>
  );

  const cls = `mk-adventure-card group ${primary ? "mk-adventure-card--primary" : ""} ${disabled ? "mk-adventure-card--disabled" : ""}`;

  if (disabled) {
    return <div className={cls} aria-disabled>{inner}</div>;
  }
  return <Link to={to} className={cls}>{inner}</Link>;
}

function CornerTrim() {
  return (
    <>
      <span className="mk-corner mk-corner--tl" />
      <span className="mk-corner mk-corner--tr" />
      <span className="mk-corner mk-corner--bl" />
      <span className="mk-corner mk-corner--br" />
    </>
  );
}

/* ============ Legal ============ */
function LegalDisclaimer() {
  return (
    <div className="relative z-10 mx-auto max-w-[1400px] px-12 pb-8">
      <p className="max-w-3xl text-[11px] leading-relaxed text-foreground/40 tracking-wide">
        Private fan companion. No official Mage Knight rules, card text, enemy stats, or scenario
        content are bundled. Import your own data. Demo content is clearly marked.
      </p>
    </div>
  );
}

/* Re-export crest for sidebar to consume */
export { crest };
