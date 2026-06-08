import type { AxialHex, Terrain } from "./types";

// Pointy-top axial hex coords
export const HEX_SIZE = 44; // px radius

export function axialToPixel(h: AxialHex, size = HEX_SIZE) {
  const x = size * Math.sqrt(3) * (h.q + h.r / 2);
  const y = size * 1.5 * h.r;
  return { x, y };
}

export function hexKey(h: AxialHex) { return `${h.q},${h.r}`; }

export function axialDistance(a: AxialHex, b: AxialHex) {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.q + a.r - b.q - b.r) +
      Math.abs(a.r - b.r)) /
    2
  );
}

export const HEX_DIRS: AxialHex[] = [
  { q: +1, r: 0 }, { q: +1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: +1 }, { q: 0, r: +1 },
];

export function neighbors(h: AxialHex): AxialHex[] {
  return HEX_DIRS.map((d) => ({ q: h.q + d.q, r: h.r + d.r }));
}

// Placeholder demo movement costs — these are NOT official Mage Knight values.
// Replace via imported rules data.
export const DEMO_TERRAIN_COST: Record<Terrain, { day: number; night: number } | null> = {
  plains: { day: 2, night: 2 },
  hills: { day: 3, night: 3 },
  forest: { day: 3, night: 5 },
  wasteland: { day: 4, night: 4 },
  desert: { day: 3, night: 5 },
  swamp: { day: 5, night: 3 },
  lake: null,
  mountain: null,
  city: { day: 2, night: 2 },
};
