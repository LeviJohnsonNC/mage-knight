// Event-sourced rules engine. The UI must never mutate state directly —
// it dispatches GameEvents through `applyEvent`.
//
// This engine is intentionally conservative: it enforces structural state
// transitions and demo movement costs only. Real Mage Knight rule logic
// must be layered on top once official data is imported.

import type {
  AxialHex,
  CardEffectTag,
  ComponentLibrary,
  GameEvent,
  GameState,
  HeroState,
  ManaColor,
  PlacedTile,
  Phase,
} from "./types";
import { axialDistance, DEMO_TERRAIN_COST, neighbors, hexKey } from "./hex";

export interface ApplyResult {
  state: GameState;
  summary: string;
  warnings: string[];
}

export function newGameState(): GameState {
  return {
    schemaVersion: 1,
    scenarioId: null,
    round: 0,
    daynight: "day",
    phase: "scenario-setup",
    hero: null,
    manaSource: [],
    manaSourceUsed: 0,
    placedTiles: [],
    tileStack: [],
    enemiesOnMap: [],
    siteStates: {},
    combat: { active: false, step: "ranged", enemies: [], totals: { attack: 0, block: 0, damageTaken: 0, fameGained: 0 } },
    log: [],
    undoStack: [],
    warnings: [],
  };
}

function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rollManaSource(count: number): ManaColor[] {
  const faces: ManaColor[] = ["red", "blue", "green", "white", "gold", "black"];
  return Array.from({ length: count }, () => faces[Math.floor(Math.random() * 6)]);
}

function findHexTerrain(state: GameState, lib: ComponentLibrary, h: AxialHex) {
  for (const pt of state.placedTiles) {
    if (!pt.revealed) continue;
    const tile = lib.tiles[pt.tileId];
    if (!tile) continue;
    for (const cell of tile.hexes) {
      const gh = { q: pt.center.q + cell.q, r: pt.center.r + cell.r };
      if (gh.q === h.q && gh.r === h.r) return { terrain: cell.terrain, siteId: cell.siteId, tile };
    }
  }
  return null;
}

// Legal-action helpers (UI calls these to render legal options)
export const legal = {
  canStartGame(state: GameState) {
    return state.phase === "scenario-setup" && state.scenarioId === null;
  },
  canEndTurn(state: GameState) {
    return state.phase === "movement" || state.phase === "interaction" || state.phase === "exploration";
  },
  movableHexes(state: GameState, lib: ComponentLibrary, movePoints: number): Array<{ hex: AxialHex; cost: number }> {
    if (!state.hero) return [];
    const out: Array<{ hex: AxialHex; cost: number }> = [];
    for (const n of neighbors(state.hero.location)) {
      const t = findHexTerrain(state, lib, n);
      if (!t) continue;
      const c = DEMO_TERRAIN_COST[t.terrain];
      if (!c) continue;
      const cost = state.daynight === "night" ? c.night : c.day;
      if (cost <= movePoints) out.push({ hex: n, cost });
    }
    return out;
  },
};

export interface DerivedSnapshot {
  movePoints: number;
  blockPoints: number;
  attackPoints: number;
  influencePoints: number;
  legalEndTurn: boolean;
}

export function deriveTurnTotals(state: GameState): DerivedSnapshot {
  // Sum from event log within current turn (since last END_TURN or START_GAME)
  let mp = 0, bp = 0, ap = 0, ip = 0;
  for (let i = state.log.length - 1; i >= 0; i--) {
    const e = state.log[i];
    if (e.type === "END_TURN" || e.type === "START_ROUND" || e.type === "START_GAME") break;
    if (e.type === "GAIN_MOVE_POINTS") mp += e.amount;
    if (e.type === "MOVE_TO_HEX") mp -= e.cost;
    if (e.type === "PLAY_CARD") {
      // demo heuristic — replaced by real parsed effects later
      // intentional no-op; real logic comes from parsedEffects
    }
    if (e.type === "ASSIGN_BLOCK") bp += e.amount;
    if (e.type === "ASSIGN_ATTACK") ap += e.amount;
  }
  return {
    movePoints: Math.max(0, mp),
    blockPoints: bp,
    attackPoints: ap,
    influencePoints: ip,
    legalEndTurn: legal.canEndTurn(state),
  };
}

export function summarize(event: GameEvent, lib: ComponentLibrary): string {
  switch (event.type) {
    case "START_GAME": {
      const s = lib.scenarios[event.scenarioId]?.name ?? event.scenarioId;
      const h = lib.heroes[event.heroId]?.name ?? event.heroId;
      return `Game begins — ${h} in “${s}”.`;
    }
    case "START_ROUND": return `Round ${event.round} (${event.daynight}) begins.`;
    case "SELECT_TACTIC": return `Tactic chosen: ${lib.tactics[event.tacticId]?.name ?? event.tacticId}.`;
    case "DRAW_CARD": return `Drew ${event.count} card(s).`;
    case "PLAY_CARD": {
      const c = lib.cards[event.cardId];
      return `Played ${c?.name ?? event.cardId} (${event.mode}${event.assignTo ? ` → ${event.assignTo}` : ""}).`;
    }
    case "POWER_CARD_WITH_MANA": return `Powered card with ${event.mana} mana.`;
    case "GAIN_MOVE_POINTS": return `Gained ${event.amount} Move.`;
    case "MOVE_TO_HEX": return `Moved to (${event.hex.q},${event.hex.r}) — cost ${event.cost}.`;
    case "REVEAL_TILE": return `Revealed tile ${lib.tiles[event.tileId]?.name ?? event.tileId}.`;
    case "START_COMBAT": return `Combat begins (${event.enemyInstanceIds.length} foe).`;
    case "ASSIGN_BLOCK": return `Assigned block ${event.amount}.`;
    case "ASSIGN_DAMAGE": return `Took ${event.amount} damage.`;
    case "ASSIGN_ATTACK": return `Attacked for ${event.amount} (${event.kind}).`;
    case "DEFEAT_ENEMY": return `Enemy defeated.`;
    case "GAIN_FAME": return `Gained ${event.amount} Fame.`;
    case "GAIN_REPUTATION": return `Reputation ${event.amount > 0 ? "+" : ""}${event.amount}.`;
    case "GAIN_CRYSTAL": return `Gained ${event.color} crystal.`;
    case "USE_MANA_DIE": return `Used ${event.color} die.`;
    case "END_TURN": return `Turn ended.`;
    case "END_ROUND": return `Round ended.`;
    case "MANUAL_OVERRIDE": return `Manual override: ${event.description}`;
    case "UNDO_EVENT": return `Undo.`;
  }
}

export function applyEvent(state: GameState, event: GameEvent, lib: ComponentLibrary): ApplyResult {
  const warnings: string[] = [];
  let s: GameState = structuredClone(state);

  const dealHand = (hero: HeroState, count: number) => {
    for (let i = 0; i < count && hero.deck.length > 0; i++) hero.hand.push(hero.deck.shift()!);
  };

  switch (event.type) {
    case "START_GAME": {
      const scenario = lib.scenarios[event.scenarioId];
      const heroDef = lib.heroes[event.heroId];
      if (!scenario || !heroDef) {
        warnings.push("Needs imported Mage Knight data — using available demo definitions.");
      }
      s.scenarioId = event.scenarioId;
      s.round = 1;
      s.daynight = "day";
      s.phase = "tactics-selection";
      s.placedTiles = [{
        tileId: "demo-tile-start",
        center: { q: 0, r: 0 },
        rotation: 0,
        revealed: true,
      }];
      s.tileStack = ["demo-tile-country"];
      s.manaSource = rollManaSource(3);
      const deck = heroDef ? shuffle(heroDef.startingDeck) : [];
      s.hero = {
        heroId: event.heroId,
        location: { q: 0, r: 0 },
        hand: [],
        deck,
        discard: [],
        wounds: 0,
        skills: [],
        units: [],
        fame: 0,
        reputation: 0,
        armor: heroDef?.startingArmor ?? 2,
        handLimit: heroDef?.startingHandLimit ?? 5,
        commandLimit: heroDef?.startingCommand ?? 1,
        level: 1,
        crystals: {},
        manaTokens: [],
      };
      if (s.hero) dealHand(s.hero, s.hero.handLimit);
      break;
    }
    case "SELECT_TACTIC": {
      s.phase = "turn-start";
      break;
    }
    case "DRAW_CARD": {
      if (!s.hero) break;
      dealHand(s.hero, event.count);
      break;
    }
    case "PLAY_CARD": {
      if (!s.hero) break;
      const idx = s.hero.hand.indexOf(event.cardId);
      if (idx === -1) { warnings.push("Card not in hand."); break; }
      s.hero.hand.splice(idx, 1);
      s.hero.discard.push(event.cardId);
      // Apply demo parsed effects
      const card = lib.cards[event.cardId];
      if (card) {
        for (const tag of card.tags) {
          if (tag === "move" && (s.phase === "turn-start" || s.phase === "movement")) {
            s.phase = "movement";
            const amt = event.mode === "strong" ? 4 : 2;
            s.log.push({ type: "GAIN_MOVE_POINTS", amount: amt, timestamp: event.timestamp });
          }
        }
      }
      break;
    }
    case "GAIN_MOVE_POINTS": {
      if (s.phase === "turn-start") s.phase = "movement";
      break;
    }
    case "MOVE_TO_HEX": {
      if (!s.hero) break;
      s.hero.location = event.hex;
      const t = findHexTerrain(s, lib, event.hex);
      if (t && t.siteId) {
        s.phase = "interaction";
      }
      break;
    }
    case "REVEAL_TILE": {
      const next = s.tileStack.shift();
      if (!next) { warnings.push("No tiles remain in stack."); break; }
      s.placedTiles.push({ tileId: next, center: event.center, rotation: 0, revealed: true });
      s.phase = "movement";
      break;
    }
    case "START_COMBAT": {
      s.phase = "combat";
      s.combat = {
        active: true, step: "ranged",
        enemies: event.enemyInstanceIds,
        totals: { attack: 0, block: 0, damageTaken: 0, fameGained: 0 },
      };
      break;
    }
    case "ASSIGN_BLOCK": s.combat.totals.block += event.amount; break;
    case "ASSIGN_DAMAGE": {
      s.combat.totals.damageTaken += event.amount;
      if (s.hero) s.hero.wounds += Math.max(0, event.amount - s.hero.armor);
      break;
    }
    case "ASSIGN_ATTACK": s.combat.totals.attack += event.amount; break;
    case "DEFEAT_ENEMY": {
      s.combat.enemies = s.combat.enemies.filter((e) => e !== event.enemyInstanceId);
      if (s.combat.enemies.length === 0) { s.combat.active = false; s.combat.step = "done"; s.phase = "interaction"; }
      break;
    }
    case "GAIN_FAME": if (s.hero) s.hero.fame += event.amount; break;
    case "GAIN_REPUTATION": if (s.hero) s.hero.reputation = Math.max(-7, Math.min(7, s.hero.reputation + event.amount)); break;
    case "GAIN_CRYSTAL": if (s.hero) s.hero.crystals[event.color] = (s.hero.crystals[event.color] ?? 0) + 1; break;
    case "USE_MANA_DIE": s.manaSourceUsed += 1; break;
    case "END_TURN": {
      if (s.hero) {
        s.hero.discard.push(...s.hero.hand); s.hero.hand = [];
        dealHand(s.hero, s.hero.handLimit);
      }
      s.manaSourceUsed = 0;
      s.phase = "turn-start";
      break;
    }
    case "END_ROUND": {
      s.round += 1;
      s.daynight = s.daynight === "day" ? "night" : "day";
      s.phase = "tactics-selection";
      s.manaSource = rollManaSource(3);
      break;
    }
    case "MANUAL_OVERRIDE": {
      Object.assign(s, event.patch);
      warnings.push(`Manual override applied: ${event.description}`);
      break;
    }
    case "UNDO_EVENT": break;
  }

  s.log = [...s.log, event];
  return { state: s, summary: summarize(event, lib), warnings };
}

// Undo: replay all events except the last reversible one.
export function undo(state: GameState, lib: ComponentLibrary): GameState {
  if (state.log.length === 0) return state;
  const trimmed = state.log.slice(0, -1);
  let s = newGameState();
  for (const e of trimmed) s = applyEvent(s, e, lib).state;
  return s;
}

export function phaseTitle(p: Phase): string {
  const map: Record<Phase, string> = {
    "scenario-setup": "Scenario Setup",
    "round-setup": "Round Setup",
    "tactics-selection": "Tactics Selection",
    "turn-start": "Turn Start",
    "movement": "Movement",
    "exploration": "Exploration",
    "interaction": "Interaction",
    "combat": "Combat",
    "end-turn": "End of Turn",
    "end-round": "End of Round",
    "game-end": "Game End",
  };
  return map[p];
}

// silence unused
void axialDistance; void hexKey; void neighbors;
