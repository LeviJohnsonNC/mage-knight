import { useGame } from "@/lib/mk/store";
import type { Card } from "@/lib/mk/types";

export function Hand() {
  const { state, library, dispatch } = useGame();
  if (!state.hero) return null;
  const cards = state.hero.hand.map((id) => library.cards[id]).filter(Boolean) as Card[];

  return (
    <div className="flex items-end gap-3 h-full">
      {cards.length === 0 && <div className="text-sm text-muted-foreground self-center px-3">No cards in hand</div>}
      {cards.map((c, i) => (
        <div
          key={`${c.id}-${i}`}
          className="group relative h-44 w-32 shrink-0 rounded-lg panel-parchment gold-trim cursor-pointer transition-all hover:-translate-y-3 hover:shadow-[var(--shadow-gold)]"
          style={{ transform: `rotate(${(i - (cards.length - 1) / 2) * 2}deg)` }}
        >
          <div className="absolute inset-0 p-3 flex flex-col">
            <div className="font-display text-[12px] leading-tight text-[var(--parchment-ink)] truncate">{c.name}</div>
            <div className="text-[9px] uppercase tracking-widest text-[var(--gold-muted)] mt-1">{c.type.replace("-", " ")}</div>
            <div className="mt-2 text-[10px] text-[var(--parchment-ink)]/80 leading-tight line-clamp-3">{c.normalEffect}</div>
            {c.strongEffect && (
              <div className="mt-1 text-[10px] text-[var(--parchment-ink)] leading-tight line-clamp-3">
                <span className="text-[9px] tracking-widest uppercase text-mana-blue">Strong</span><br />
                {c.strongEffect}
              </div>
            )}
            <div className="mt-auto flex gap-1">
              <button
                onClick={() => dispatch({ type: "PLAY_CARD", cardId: c.id, mode: "normal", timestamp: Date.now() })}
                className="flex-1 rounded bg-[var(--parchment-ink)] text-[10px] text-[var(--parchment)] py-1 hover:opacity-90">Play</button>
              <button
                onClick={() => dispatch({ type: "PLAY_CARD", cardId: c.id, mode: "strong", timestamp: Date.now() })}
                className="flex-1 rounded bg-gold-gradient text-[10px] text-primary-foreground py-1 hover:opacity-90">Power</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
