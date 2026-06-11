import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import type { ComponentLibrary, GameEvent, GameState, ImportedDocument, SavedGame, TileDef as LibTileDef, Terrain as LibTerrain } from "./types";
import { applyEvent, newGameState, undo } from "./engine";
import { demoLibrary } from "./demoData";
import { TILES as OFFICIAL_TILES, TILE_ORDER } from "./tileData";

const LS_LIB = "mk.library.v1";
const LS_GAME = "mk.game.v1";
const LS_DOCS = "mk.docs.v1";
const LS_SAVES = "mk.saves.v1";

function loadLS<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function saveLS(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }

// 2-3-2 hex tile position → axial (q,r) offsets relative to tile center.
const POS_TO_AXIAL: Record<number, { q: number; r: number }> = {
  0: { q: 0, r: -1 }, 1: { q: 1, r: -1 },
  2: { q: -1, r: 0 }, 3: { q: 0, r: 0 }, 4: { q: 1, r: 0 },
  5: { q: -1, r: 1 }, 6: { q: 0, r: 1 },
};

function officialTileToLib(t: typeof OFFICIAL_TILES[string]): LibTileDef {
  const kind: LibTileDef["kind"] = t.kind === "portal" ? "starting" : t.kind;
  const terrainMap = (terr: string): LibTerrain =>
    (terr === "sea" ? "lake" : terr) as LibTerrain;
  return {
    id: t.id,
    name: t.label,
    kind,
    source: "imported",
    hexes: t.hexes.map((h) => ({
      q: POS_TO_AXIAL[h.pos].q,
      r: POS_TO_AXIAL[h.pos].r,
      terrain: terrainMap(h.terrain as string),
    })),
    needsReview: t.hexes.some((h) => h.needsReview),
  };
}

function mergeOfficialTiles(lib: ComponentLibrary): ComponentLibrary {
  const tiles = { ...lib.tiles };
  for (const id of TILE_ORDER) {
    const t = OFFICIAL_TILES[id];
    if (t) tiles[id] = officialTileToLib(t);
  }
  return { ...lib, tiles };
}

interface Ctx {
  library: ComponentLibrary;
  setLibrary: (l: ComponentLibrary) => void;
  state: GameState;
  dispatch: (e: GameEvent) => void;
  doUndo: () => void;
  resetGame: () => void;
  docs: ImportedDocument[];
  setDocs: (d: ImportedDocument[]) => void;
  saves: SavedGame[];
  saveGame: (name: string) => void;
  loadGame: (id: string) => void;
  deleteSave: (id: string) => void;
}

const GameCtx = createContext<Ctx | null>(null);

type Action = { type: "dispatch"; event: GameEvent } | { type: "set"; state: GameState } | { type: "reset" };

function reducer(state: { game: GameState; library: ComponentLibrary }, action: Action): { game: GameState; library: ComponentLibrary } {
  switch (action.type) {
    case "dispatch": return { ...state, game: applyEvent(state.game, action.event, state.library).state };
    case "set": return { ...state, game: action.state };
    case "reset": return { ...state, game: newGameState() };
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [library, setLibraryState] = useState<ComponentLibrary>(() => mergeOfficialTiles(loadLS(LS_LIB, demoLibrary)));
  const [{ game }, rdispatch] = useReducer(reducer, undefined, () => ({
    game: loadLS<GameState>(LS_GAME, newGameState()),
    library: mergeOfficialTiles(loadLS<ComponentLibrary>(LS_LIB, demoLibrary)),
  }));
  const [docs, setDocsState] = useState<ImportedDocument[]>(() => loadLS(LS_DOCS, [] as ImportedDocument[]));
  const [saves, setSaves] = useState<SavedGame[]>(() => loadLS(LS_SAVES, [] as SavedGame[]));

  useEffect(() => { saveLS(LS_LIB, library); }, [library]);
  useEffect(() => { saveLS(LS_GAME, game); }, [game]);
  useEffect(() => { saveLS(LS_DOCS, docs); }, [docs]);
  useEffect(() => { saveLS(LS_SAVES, saves); }, [saves]);

  const ctx = useMemo<Ctx>(() => ({
    library,
    setLibrary: (l) => setLibraryState(l),
    state: game,
    dispatch: (e) => rdispatch({ type: "dispatch", event: e }),
    doUndo: () => rdispatch({ type: "set", state: undo(game, library) }),
    resetGame: () => rdispatch({ type: "reset" }),
    docs,
    setDocs: (d) => setDocsState(d),
    saves,
    saveGame: (name) => {
      const heroName = game.hero ? (library.heroes[game.hero.heroId]?.name ?? "Hero") : "—";
      const scenarioName = game.scenarioId ? (library.scenarios[game.scenarioId]?.name ?? "—") : "—";
      const save: SavedGame = {
        id: `save-${Date.now()}`, name, scenarioName, heroName,
        round: game.round, phase: game.phase, savedAt: Date.now(), state: game,
      };
      setSaves((s) => [save, ...s]);
    },
    loadGame: (id) => {
      const s = saves.find(x => x.id === id);
      if (s) rdispatch({ type: "set", state: s.state });
    },
    deleteSave: (id) => setSaves((s) => s.filter(x => x.id !== id)),
  }), [library, game, docs, saves]);

  return <GameCtx.Provider value={ctx}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const c = useContext(GameCtx);
  if (!c) throw new Error("useGame must be used within GameProvider");
  return c;
}
