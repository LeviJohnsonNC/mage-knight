import { useMemo, useState } from "react";
import type { AxialHex, Terrain } from "@/lib/mk/types";
import { axialToPixel, HEX_SIZE } from "@/lib/mk/hex";
import { useGame } from "@/lib/mk/store";
import { legal } from "@/lib/mk/engine";

const TERRAIN_FILL: Record<Terrain, string> = {
  plains: "oklch(0.55 0.07 110)",
  hills: "oklch(0.48 0.06 80)",
  forest: "oklch(0.36 0.07 140)",
  wasteland: "oklch(0.40 0.04 60)",
  desert: "oklch(0.78 0.10 85)",
  swamp: "oklch(0.34 0.05 160)",
  lake: "oklch(0.42 0.08 230)",
  mountain: "oklch(0.32 0.02 250)",
  city: "oklch(0.50 0.10 30)",
};

export function HexMap({ movePoints }: { movePoints: number }) {
  const { state, library, dispatch } = useGame();
  const [zoom, setZoom] = useState(1);

  const hexes = useMemo(() => {
    const out: Array<{ h: AxialHex; terrain: Terrain; siteId?: string; revealed: boolean }> = [];
    for (const pt of state.placedTiles) {
      const tile = library.tiles[pt.tileId];
      if (!tile) continue;
      for (const cell of tile.hexes) {
        out.push({
          h: { q: pt.center.q + cell.q, r: pt.center.r + cell.r },
          terrain: cell.terrain, siteId: cell.siteId, revealed: pt.revealed,
        });
      }
    }
    return out;
  }, [state.placedTiles, library.tiles]);

  const movable = legal.movableHexes(state, library, movePoints);
  const movableSet = new Set(movable.map((m) => `${m.hex.q},${m.hex.r}`));

  const w = 900, h = 600;
  const cx = w / 2, cy = h / 2;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg panel-steel">
      <div className="absolute top-3 right-3 z-10 flex gap-1">
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="h-7 w-7 rounded bg-accent text-foreground">−</button>
        <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="h-7 w-7 rounded bg-accent text-foreground">+</button>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
        <defs>
          <radialGradient id="mapVignette" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="oklch(0.20 0.04 250)" />
            <stop offset="100%" stopColor="oklch(0.08 0.02 250)" />
          </radialGradient>
          <pattern id="parch" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="oklch(0.18 0.02 250)" />
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#mapVignette)" />
        <g transform={`translate(${cx} ${cy}) scale(${zoom})`}>
          {hexes.map(({ h, terrain, siteId, revealed }) => {
            const { x, y } = axialToPixel(h);
            const isHero = state.hero && state.hero.location.q === h.q && state.hero.location.r === h.r;
            const isMovable = movableSet.has(`${h.q},${h.r}`);
            const fill = revealed ? TERRAIN_FILL[terrain] : "url(#parch)";
            return (
              <g key={`${h.q},${h.r}`} transform={`translate(${x} ${y})`} className="cursor-pointer"
                 onClick={() => {
                   if (isMovable) {
                     const m = movable.find((mm) => mm.hex.q === h.q && mm.hex.r === h.r)!;
                     dispatch({ type: "MOVE_TO_HEX", hex: h, cost: m.cost, timestamp: Date.now() });
                   }
                 }}>
                <Hex fill={fill} stroke={isMovable ? "oklch(0.78 0.14 80)" : "oklch(0.30 0.02 250)"} strokeWidth={isMovable ? 2.5 : 1} glow={isMovable} />
                {revealed && siteId && (
                  <circle r={10} fill="oklch(0.30 0.05 60)" stroke="oklch(0.78 0.14 80)" strokeWidth={1.5} />
                )}
                {isHero && (
                  <g>
                    <circle r={14} fill="oklch(0.78 0.14 80)" stroke="oklch(0.20 0.02 250)" strokeWidth={2} />
                    <text textAnchor="middle" dy={5} fontSize={12} fontFamily="Cinzel" fill="oklch(0.18 0.02 250)">★</text>
                  </g>
                )}
              </g>
            );
          })}
          {/* Tile stack preview */}
          {state.tileStack.length > 0 && (
            <g transform={`translate(${HEX_SIZE * 4} 0)`}>
              <rect x={-40} y={-50} width={80} height={100} rx={6} fill="oklch(0.18 0.02 250)" stroke="oklch(0.55 0.09 70)" />
              <text textAnchor="middle" y={-10} fontFamily="Cinzel" fontSize={11} fill="oklch(0.78 0.14 80)">Tile Stack</text>
              <text textAnchor="middle" y={14} fontFamily="Cinzel" fontSize={22} fill="oklch(0.92 0.02 80)">{state.tileStack.length}</text>
              <text textAnchor="middle" y={36} fontSize={9} fill="oklch(0.65 0.02 80)">click in panel to reveal</text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

function Hex({ fill, stroke, strokeWidth, glow }: { fill: string; stroke: string; strokeWidth: number; glow?: boolean }) {
  const r = HEX_SIZE;
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${r * Math.cos(a)},${r * Math.sin(a)}`);
  }
  return (
    <polygon
      points={pts.join(" ")}
      fill={fill} stroke={stroke} strokeWidth={strokeWidth}
      style={glow ? { filter: "drop-shadow(0 0 8px oklch(0.78 0.14 80 / 0.6))" } : undefined}
    />
  );
}
