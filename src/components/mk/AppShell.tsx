import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Upload, BookOpen, Library, ShieldAlert, Save, Settings, Swords } from "lucide-react";
import type { ReactNode } from "react";
import crest from "@/assets/home/crest.png.asset.json";

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
      <aside className="mk-rail relative w-[72px] flex flex-col items-center py-5 gap-1.5">
        <Link to="/" className="mk-crest-slot mb-5" title="Mage Knight">
          <img src={crest.url} alt="MK" className="h-11 w-11 object-contain" />
        </Link>
        <div className="mk-rail-divider" />
        {NAV.map((n) => {
          const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`mk-rail-slot group ${active ? "mk-rail-slot--active" : ""}`}
              title={n.label}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              <span className="mk-rail-tooltip">{n.label}</span>
            </Link>
          );
        })}
      </aside>
      <main className={`flex-1 overflow-auto scrollbar-thin ${fullBleed ? "" : "p-8"}`}>{children}</main>
    </div>
  );
}
