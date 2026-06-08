import { useGame } from "@/lib/mk/store";
import { summarize } from "@/lib/mk/engine";

export function EventLog() {
  const { state, library } = useGame();
  const entries = [...state.log].reverse();
  return (
    <div className="panel-steel rounded-lg h-full flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <div className="text-[10px] uppercase tracking-widest text-gold-muted">Event Log</div>
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin p-2 text-xs">
        {entries.length === 0 && <div className="text-muted-foreground px-2 py-3">No events yet.</div>}
        {entries.map((e, i) => (
          <div key={i} className="border-b border-border/40 py-1.5 px-1.5">
            <div className="text-foreground">{summarize(e, library)}</div>
            <div className="text-[10px] text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
