import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import type { ComponentLibrary, GameEvent, GameState, ImportedDocument, SavedGame } from "./types";
import { applyEvent, newGameState, undo } from "./engine";
import { demoLibrary } from "./demoData";

const LS_LIB = "mk.library.v1";
const LS_GAME = "mk.game.v1";
const LS_DOCS = "mk.docs.v1";
const LS_SAVES = "mk.saves.v1";

function loadLS<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function saveLS(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }

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
  const [library, setLibraryState] = useState<ComponentLibrary>(() => loadLS(LS_LIB, demoLibrary));
  const [{ game }, rdispatch] = useReducer(reducer, undefined, () => ({
    game: loadLS<GameState>(LS_GAME, newGameState()),
    library: loadLS<ComponentLibrary>(LS_LIB, demoLibrary),
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
