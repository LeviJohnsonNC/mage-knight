import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/mk/AppShell";
import { useGame } from "@/lib/mk/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/saves")({
  head: () => ({ meta: [{ title: "Saved Games · Mage Knight Companion" }] }),
  component: SavesPage,
});

function SavesPage() {
  const { saves, loadGame, deleteSave } = useGame();
  const nav = useNavigate();
  return (
    <AppShell>
      <div className="max-w-4xl">
        <h1 className="font-display text-4xl text-gold">Saved Games</h1>
        <p className="text-muted-foreground mt-1">Local saves persist in your browser.</p>
        <div className="mt-6 space-y-2">
          {saves.length === 0 && (
            <div className="panel-steel rounded-lg p-8 text-center text-muted-foreground text-sm">No saves yet.</div>
          )}
          {saves.map((s) => (
            <div key={s.id} className="panel-steel rounded-lg p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-display text-base text-gold truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.scenarioName} · {s.heroName} · Round {s.round} · {new Date(s.savedAt).toLocaleString()}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => { loadGame(s.id); toast.success("Loaded"); nav({ to: "/game" }); }}>Load</Button>
              <Button size="sm" variant="ghost" onClick={() => {
                const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${s.name}.json`; a.click();
              }}>Export</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteSave(s.id)}>Delete</Button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
