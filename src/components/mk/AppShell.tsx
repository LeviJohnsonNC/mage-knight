import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Upload, BookOpen, Library, ShieldAlert, Save, Settings, Swords } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", icon: Home, label: "Hall" },
  { to: "/new-game", icon: Swords, label: "New Game" },
  { to: "/import", icon: Upload, label: "Import" },
  { to: "/library", icon: Library, label: "Components" },
  { to: "/rules", icon: BookOpen, label: "Rules" },
  { to: "/validation", icon: ShieldAlert, label: "Validation" },
  { to: "/saves", icon: Save, label: "Saves" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

export function AppShell({ children, fullBleed = false }: { children: ReactNode; fullBleed?: boolean }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-16 panel-steel border-r border-border flex flex-col items-center py-4 gap-1">
        <Link to="/" className="mb-4 h-10 w-10 grid place-items-center rounded bg-gold-gradient text-primary-foreground font-display text-lg shadow">MK</Link>
        {NAV.map((n) => {
          const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`group relative grid h-11 w-11 place-items-center rounded transition-colors ${
                active ? "bg-accent text-gold glow-gold" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              title={n.label}
            >
              <Icon className="h-5 w-5" />
              <span className="pointer-events-none absolute left-12 z-50 whitespace-nowrap rounded border border-border bg-popover px-2 py-1 text-xs opacity-0 shadow-lg group-hover:opacity-100 transition">
                {n.label}
              </span>
            </Link>
          );
        })}
      </aside>
      <main className={`flex-1 overflow-auto scrollbar-thin ${fullBleed ? "" : "p-8"}`}>{children}</main>
    </div>
  );
}
