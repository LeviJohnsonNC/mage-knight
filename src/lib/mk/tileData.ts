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
import core6 from "@/assets/tiles/core-6.png.asset.json";
import core7 from "@/assets/tiles/core-7.png.asset.json";
import core8 from "@/assets/tiles/core-8.png.asset.json";
import core9 from "@/assets/tiles/core-9.png.asset.json";
import core10 from "@/assets/tiles/core-10.png.asset.json";
import core11 from "@/assets/tiles/core-11.png.asset.json";
import city12 from "@/assets/tiles/city-12.png.asset.json";
import country13 from "@/assets/tiles/country-13.png.asset.json";
import country14 from "@/assets/tiles/country-14.png.asset.json";
import coreB1 from "@/assets/tiles/core-b1.png.asset.json";
import coreB2 from "@/assets/tiles/core-b2.png.asset.json";
import coreB3 from "@/assets/tiles/core-b3.png.asset.json";
import coreB4 from "@/assets/tiles/core-b4.png.asset.json";
import cityB5 from "@/assets/tiles/city-b5.png.asset.json";

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

  "core-6": {
    id: "core-6",
    label: "Core 6",
    kind: "core",
    image: core6.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "mountain", feature: N },
      { pos: 1, terrain: "forest", feature: N },
      { pos: 2, terrain: "wasteland", feature: { kind: "dungeon" } },
      { pos: 3, terrain: "wasteland", feature: { kind: "tomb" }, needsReview: true, note: "cave entrance with red crystal — tomb vs dungeon" },
      { pos: 4, terrain: "plains", feature: N },
      { pos: 5, terrain: "wasteland", feature: N, note: "tile label 6" },
      { pos: 6, terrain: "forest", feature: N, note: "printed orcs token stripped" },
    ],
  },

  "core-7": {
    id: "core-7",
    label: "Core 7",
    kind: "core",
    image: core7.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "lake", feature: N },
      { pos: 1, terrain: "forest", feature: N, note: "printed orcs token stripped" },
      { pos: 2, terrain: "plains", feature: { kind: "monastery" } },
      { pos: 3, terrain: "swamp", feature: N },
      { pos: 4, terrain: "forest", feature: { kind: "magical_glade" } },
      { pos: 5, terrain: "plains", feature: N, note: "tile label 7" },
      { pos: 6, terrain: "plains", feature: { kind: "ruins" }, needsReview: true, note: "white stone arrangement — ruins?" },
    ],
  },

  "core-8": {
    id: "core-8",
    label: "Core 8",
    kind: "core",
    image: core8.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "forest", feature: { kind: "magical_glade" } },
      { pos: 1, terrain: "forest", feature: { kind: "spawning_grounds" }, needsReview: true, note: "bone/stone circle — spawning grounds?" },
      { pos: 2, terrain: "forest", feature: N },
      { pos: 3, terrain: "swamp", feature: N, note: "printed orcs token stripped" },
      { pos: 4, terrain: "plains", feature: N },
      { pos: 5, terrain: "swamp", feature: N, note: "tile label 8" },
      { pos: 6, terrain: "swamp", feature: { kind: "village" } },
    ],
  },

  "core-9": {
    id: "core-9",
    label: "Core 9",
    kind: "core",
    image: core9.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "wasteland", feature: { kind: "ruins" }, note: "tile label 9 area" },
      { pos: 1, terrain: "mountain", feature: N },
      { pos: 2, terrain: "plains", feature: N },
      { pos: 3, terrain: "mountain", feature: N },
      { pos: 4, terrain: "wasteland", feature: { kind: "keep" } },
      { pos: 5, terrain: "wasteland", feature: { kind: "mage_tower" } },
      { pos: 6, terrain: "plains", feature: N },
    ],
  },

  "core-10": {
    id: "core-10",
    label: "Core 10",
    kind: "core",
    image: core10.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "wasteland", feature: { kind: "dungeon" } },
      { pos: 1, terrain: "forest", feature: N },
      { pos: 2, terrain: "wasteland", feature: N },
      { pos: 3, terrain: "mountain", feature: N },
      { pos: 4, terrain: "plains", feature: N },
      { pos: 5, terrain: "wasteland", feature: { kind: "keep" }, note: "tile label 10" },
      { pos: 6, terrain: "wasteland", feature: { kind: "spawning_grounds" }, needsReview: true, note: "bone circle — spawning grounds?" },
    ],
  },

  "core-11": {
    id: "core-11",
    label: "Core 11",
    kind: "core",
    image: core11.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "hills", feature: N },
      { pos: 1, terrain: "lake", feature: N },
      { pos: 2, terrain: "plains", feature: { kind: "spawning_grounds" }, needsReview: true, note: "bone circle — spawning grounds?" },
      { pos: 3, terrain: "plains", feature: { kind: "mage_tower" } },
      { pos: 4, terrain: "lake", feature: N },
      { pos: 5, terrain: "lake", feature: N, note: "tile label 11" },
      { pos: 6, terrain: "hills", feature: N, note: "printed orcs token stripped" },
    ],
  },

  "city-12": {
    id: "city-12",
    label: "City 12",
    kind: "city",
    image: city12.url,
    source: "user-upload-official",
    hexes: [
      { pos: 0, terrain: "mountain", feature: N },
      { pos: 1, terrain: "wasteland", feature: N, needsReview: true, note: "cracked-stone terrain — wasteland?" },
      { pos: 2, terrain: "plains", feature: { kind: "village" }, needsReview: true, note: "tents/camp — village or unique site?" },
      { pos: 3, terrain: "plains", feature: N, note: "central hex; printed orcs+walls are art, not a site" },
      { pos: 4, terrain: "plains", feature: { kind: "monastery" } },
      { pos: 5, terrain: "plains", feature: { kind: "city", color: "blue" }, needsReview: true, note: "tile label 12; city fame numbers 6/4/2 visible — confirm color" },
      { pos: 6, terrain: "mountain", feature: N },
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
  "core-6",
  "core-7",
  "core-8",
  "core-9",
  "core-10",
  "core-11",
  "city-12",
] as const;

export function getTile(id: string): TileDef | undefined {
  return TILES[id];
}

export function listTiles(kind?: TileKind): TileDef[] {
  const all = TILE_ORDER.map((id) => TILES[id]);
  return kind ? all.filter((t) => t.kind === kind) : all;
}
