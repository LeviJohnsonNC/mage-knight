import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/mk/AppShell";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/mk/store";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Mage Knight Companion" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { resetGame, setLibrary, setDocs } = useGame();
  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl text-gold">Settings</h1>
        <p className="text-muted-foreground mt-1">Local-only fan project. No accounts, no networking.</p>

        <div className="mt-6 space-y-3">
          <div className="panel-steel rounded-lg p-5">
            <h2 className="font-display text-lg text-gold">About</h2>
            <p className="text-sm text-muted-foreground mt-2">
              This is a fan-made digital companion for the Mage Knight Board Game. It ships only with
              clearly-labeled demo placeholder content. To play with real Mage Knight rules and components,
              import your own data through the Import Center.
            </p>
          </div>

          <div className="panel-steel rounded-lg p-5">
            <h2 className="font-display text-lg text-gold">Danger zone</h2>
            <div className="mt-3 flex gap-2 flex-wrap">
              <Button variant="destructive" onClick={() => { resetGame(); toast.success("Game reset"); }}>Reset current game</Button>
              <Button variant="destructive" onClick={() => { setDocs([]); toast.success("Documents cleared"); }}>Clear imported documents</Button>
              <Button variant="destructive" onClick={() => {
                localStorage.clear();
                toast.success("All local data cleared. Reload.");
              }}>Clear ALL local data</Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
