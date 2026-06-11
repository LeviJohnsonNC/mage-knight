// Tile data — official Mage Knight tile artwork (© WizKids / Vlaada Chvátil).
// Stored privately for fan use; NEVER included in the published community dataset.
//
// Hex position convention (2-3-2, printed label at the bottom-center):
//
//        0   1            <- top row
//       2  3  4           <- middle row
//        5   6            <- bottom row (label between 5 and 6)
//
// Per user decision (2026-06-11):
//   • Printed "Maraudering Orcs" enemy tokens on the artwork are STRIPPED
//     from tile data — enemy placement is randomized at setup.
//   • `needsReview: true` marks hexes I'm not 100% certain about; please
//     correct in plain English and I'll patch.

import portalA from "@/assets/tiles/portal-a.png.asset.json";
import portalB from "@/assets/tiles/portal-b.png.asset.json";
import country1 from "@/assets/tiles/country-1.png.asset.json";
import country2 from "@/assets/tiles/country-2.png.asset.json";
import country3 from "@/assets/tiles/country-3.png.asset.json";
import country4 from "@/assets/tiles/country-4.png.asset.json";
import country5 from "@/assets/tiles/country-5.png.asset.json";

export type Terrain =
  | "plains"
  | "forest"
  | "hills"
  | "wasteland"
  | "desert"
  | "swamp"
  | "mountain"
  | "lake"
  | "sea";

export type Feature =
  | { kind: "none" }
  | { kind: "magical_glade" }
  | { kind: "mine"; crystal: "white" | "red" | "blue" | "green" }
  | { kind: "village" }
  | { kind: "monastery" }
  | { kind: "keep" }
  | { kind: "mage_tower" }
  | { kind: "dungeon" }
  | { kind: "tomb" }
  | { kind: "monster_den" }
  | { kind: "spawning_grounds" }
  | { kind: "ruins" }
  | { kind: "city"; color: "red" | "green" | "blue" | "white" }
  | { kind: "portal_orb" };

export type HexPos = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TileHex {
  pos: HexPos;
  terrain: Terrain;
  feature: Feature;
  needsReview?: boolean;
  note?: string;
}

export type TileKind = "portal" | "countryside" | "core" | "city";

export interface TileDef {
  id: string;
  label: string;
  kind: TileKind;
  image: string;
  /** Source attribution. These tiles are official art; private fan use only. */
  source: "user-upload-official";
  hexes: [TileHex, TileHex, TileHex, TileHex, TileHex, TileHex, TileHex];
}

const N: Feature = { kind: "none" };

export const TILES: Record<string, TileDef> = {
  "portal-a": {
    id: "portal-a",
    label: "Portal A",
    kind: "portal",
    image: portalA.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "plains", feature: N },
      { pos: 1, terrain: "forest", feature: N },
      { pos: 2, terrain: "sea", feature: N, note: "rocky cliff edge" },
      { pos: 3, terrain: "plains", feature: { kind: "portal_orb" } },
      { pos: 4, terrain: "plains", feature: N, needsReview: true, note: "cliff edge to sea" },
      { pos: 5, terrain: "sea", feature: N },
      { pos: 6, terrain: "sea", feature: N, note: "rocky cliff edge; tile label A" },
    ],
  },

  "portal-b": {
    id: "portal-b",
    label: "Portal B",
    kind: "portal",
    image: portalB.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "plains", feature: N },
      { pos: 1, terrain: "forest", feature: N },
      { pos: 2, terrain: "plains", feature: N, needsReview: true, note: "cliff edge to sea" },
      { pos: 3, terrain: "plains", feature: { kind: "portal_orb" } },
      { pos: 4, terrain: "sea", feature: N, note: "rocky cliff edge" },
      { pos: 5, terrain: "sea", feature: N, note: "rocky cliff" },
      { pos: 6, terrain: "sea", feature: N, note: "tile label B" },
    ],
  },

  "country-1": {
    id: "country-1",
    label: "Countryside 1",
    kind: "countryside",
    image: country1.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "forest", feature: N, note: "printed orcs token stripped" },
      { pos: 1, terrain: "lake", feature: N },
      { pos: 2, terrain: "forest", feature: N },
      { pos: 3, terrain: "forest", feature: { kind: "magical_glade" } },
      { pos: 4, terrain: "plains", feature: { kind: "village" } },
      { pos: 5, terrain: "plains", feature: N },
      { pos: 6, terrain: "plains", feature: N, note: "tile label 1" },
    ],
  },

  "country-2": {
    id: "country-2",
    label: "Countryside 2",
    kind: "countryside",
    image: country2.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "hills", feature: N, note: "printed orcs token stripped" },
      { pos: 1, terrain: "forest", feature: { kind: "magical_glade" } },
      { pos: 2, terrain: "plains", feature: N },
      { pos: 3, terrain: "hills", feature: N },
      { pos: 4, terrain: "plains", feature: { kind: "village" } },
      { pos: 5, terrain: "hills", feature: { kind: "mine", crystal: "green" }, note: "tile label 2" },
      { pos: 6, terrain: "plains", feature: N },
    ],
  },

  "country-3": {
    id: "country-3",
    label: "Countryside 3",
    kind: "countryside",
    image: country3.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "plains", feature: N },
      { pos: 1, terrain: "hills", feature: { kind: "keep" } },
      { pos: 2, terrain: "forest", feature: N },
      { pos: 3, terrain: "forest", feature: N },
      { pos: 4, terrain: "hills", feature: N },
      { pos: 5, terrain: "plains", feature: { kind: "village" }, note: "tile label 3" },
      { pos: 6, terrain: "hills", feature: { kind: "mine", crystal: "white" } },
    ],
  },

  "country-4": {
    id: "country-4",
    label: "Countryside 4",
    kind: "countryside",
    image: country4.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "desert", feature: N, note: "printed orcs token stripped" },
      { pos: 1, terrain: "desert", feature: N },
      { pos: 2, terrain: "hills", feature: N, needsReview: true, note: "possible printed enemy stripped" },
      { pos: 3, terrain: "desert", feature: { kind: "mage_tower" }, needsReview: true, note: "mage tower on countryside tile is unusual — please confirm; could be art only" },
      { pos: 4, terrain: "mountain", feature: N },
      { pos: 5, terrain: "plains", feature: N, note: "tile label 4" },
      { pos: 6, terrain: "plains", feature: { kind: "village" } },
    ],
  },

  "country-5": {
    id: "country-5",
    label: "Countryside 5",
    kind: "countryside",
    image: country5.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "forest", feature: N },
      { pos: 1, terrain: "plains", feature: { kind: "monastery" } },
      { pos: 2, terrain: "forest", feature: { kind: "magical_glade" } },
      { pos: 3, terrain: "lake", feature: N },
      { pos: 4, terrain: "plains", feature: N, note: "printed orcs token stripped" },
      { pos: 5, terrain: "forest", feature: N, note: "tile label 5" },
      { pos: 6, terrain: "hills", feature: { kind: "mine", crystal: "blue" } },
    ],
  },
};

export const TILE_ORDER = [
  "portal-a",
  "portal-b",
  "country-1",
  "country-2",
  "country-3",
  "country-4",
  "country-5",
] as const;

export function getTile(id: string): TileDef | undefined {
  return TILES[id];
}

export function listTiles(kind?: TileKind): TileDef[] {
  const all = TILE_ORDER.map((id) => TILES[id]);
  return kind ? all.filter((t) => t.kind === kind) : all;
}
