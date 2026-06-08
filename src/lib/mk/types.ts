// Mage Knight digital — core data models.
// IMPORTANT: This app ships with ONLY clearly-labeled demo placeholder data.
// Real Mage Knight content must be brought in via the Import Center.

export type ID = string;

export type ManaColor = "red" | "blue" | "green" | "white" | "gold" | "black";
export type Terrain =
  | "plains"
  | "hills"
  | "forest"
  | "wasteland"
  | "desert"
  | "swamp"
  | "lake"
  | "mountain"
  | "city";

export type DayNight = "day" | "night";

export type CardType =
  | "basic-action"
  | "advanced-action"
  | "spell"
  | "artifact"
  | "wound";

export type CardEffectTag =
  | "move"
  | "attack"
  | "ranged"
  | "siege"
  | "block"
  | "influence"
  | "heal"
  | "draw"
  | "mana"
  | "special"
  | "fame"
  | "reputation";

export interface SourceReference {
  documentId?: ID;
  documentName?: string;
  page?: number;
  section?: string;
  quote?: string;
}

export interface ParsedEffect {
  tag: CardEffectTag;
  value?: number;
  note?: string;
}

export interface Card {
  id: ID;
  name: string;
  type: CardType;
  source: "demo" | "imported" | "manual";
  manaColorRequired?: ManaColor;
  normalEffect: string;
  strongEffect?: string;
  timing?: string;
  tags: CardEffectTag[];
  rawRulesText?: string;
  parsedEffects?: ParsedEffect[];
  sourceReference?: SourceReference;
  needsReview?: boolean;
}

export interface Hero {
  id: ID;
  name: string;
  source: "demo" | "imported" | "manual";
  portraitColor?: string;
  startingDeck: ID[];
  startingArmor: number;
  startingHandLimit: number;
  startingCommand: number;
  description?: string;
  sourceReference?: SourceReference;
  needsReview?: boolean;
}

export interface Enemy {
  id: ID;
  name: string;
  source: "demo" | "imported" | "manual";
  attack: number;
  armor: number;
  fame: number;
  abilities: string[];
  resistances?: string[];
  sourceReference?: SourceReference;
  needsReview?: boolean;
}

export interface Site {
  id: ID;
  name: string;
  siteType: string;
  source: "demo" | "imported" | "manual";
  visibilityRules?: string;
  entryRules?: string;
  interactionOptions?: string[];
  combatOptions?: string[];
  rewardRules?: string;
  reputationEffects?: string;
  refreshRules?: string;
  sourceReference?: SourceReference;
  needsReview?: boolean;
}

export interface Skill {
  id: ID;
  name: string;
  heroId?: ID;
  description: string;
  source: "demo" | "imported" | "manual";
  needsReview?: boolean;
}

export interface UnitDef {
  id: ID;
  name: string;
  level: number;
  cost: number;
  armor: number;
  abilities: string[];
  source: "demo" | "imported" | "manual";
  needsReview?: boolean;
}

export interface TileDef {
  id: ID;
  name: string;
  kind: "starting" | "countryside" | "core" | "city";
  source: "demo" | "imported" | "manual";
  // 7-hex tile, axial offsets relative to tile center
  hexes: Array<{ q: number; r: number; terrain: Terrain; siteId?: ID }>;
  needsReview?: boolean;
}

export interface Scenario {
  id: ID;
  name: string;
  playerCount: number;
  soloCompatible: boolean;
  setupRules: string;
  mapTileRules?: string;
  objective: string;
  roundLimit?: number;
  specialRules?: string;
  winCondition?: string;
  lossCondition?: string;
  scoringRules?: string;
  source: "demo" | "imported" | "manual";
  sourceReference?: SourceReference;
  needsReview?: boolean;
}

export interface TacticsCard {
  id: ID;
  name: string;
  daynight: DayNight;
  description: string;
  source: "demo" | "imported" | "manual";
  needsReview?: boolean;
}

export interface RuleEntry {
  id: ID;
  title: string;
  category: string;
  fullText: string;
  sourceDocument?: string;
  pageNumber?: number;
  section?: string;
  relatedComponents?: ID[];
  keywords: string[];
  needsReview?: boolean;
}

// ---------- Game state ----------

export interface AxialHex { q: number; r: number; }

export interface PlacedTile {
  tileId: ID;
  center: AxialHex; // axial coords of tile center on global map
  rotation: 0 | 1 | 2 | 3 | 4 | 5;
  revealed: boolean;
}

export interface HeroState {
  heroId: ID;
  location: AxialHex;
  hand: ID[];
  deck: ID[];
  discard: ID[];
  wounds: number;
  skills: ID[];
  units: ID[];
  fame: number;
  reputation: number; // -7..+7
  armor: number;
  handLimit: number;
  commandLimit: number;
  level: number;
  crystals: Partial<Record<ManaColor, number>>;
  manaTokens: ManaColor[];
}

export type Phase =
  | "scenario-setup"
  | "round-setup"
  | "tactics-selection"
  | "turn-start"
  | "movement"
  | "exploration"
  | "interaction"
  | "combat"
  | "end-turn"
  | "end-round"
  | "game-end";

export interface CombatState {
  active: boolean;
  step: "ranged" | "block" | "damage" | "attack" | "rewards" | "done";
  enemies: ID[];
  totals: { attack: number; block: number; damageTaken: number; fameGained: number };
}

export interface GameState {
  schemaVersion: 1;
  scenarioId: ID | null;
  round: number;
  daynight: DayNight;
  phase: Phase;
  hero: HeroState | null;
  manaSource: ManaColor[]; // dice faces currently up
  manaSourceUsed: number;  // how many used this turn
  placedTiles: PlacedTile[];
  tileStack: ID[];
  enemiesOnMap: Array<{ id: ID; enemyId: ID; hex: AxialHex }>;
  siteStates: Record<string, { exhausted?: boolean; defeated?: boolean; note?: string }>;
  combat: CombatState;
  log: GameEvent[];
  undoStack: GameEvent[];
  warnings: string[];
}

// ---------- Events ----------

export type GameEvent =
  | { type: "START_GAME"; scenarioId: ID; heroId: ID; timestamp: number }
  | { type: "START_ROUND"; round: number; daynight: DayNight; timestamp: number }
  | { type: "SELECT_TACTIC"; tacticId: ID; timestamp: number }
  | { type: "DRAW_CARD"; count: number; timestamp: number }
  | { type: "PLAY_CARD"; cardId: ID; mode: "normal" | "strong" | "sideways"; assignTo?: CardEffectTag; timestamp: number }
  | { type: "POWER_CARD_WITH_MANA"; cardId: ID; mana: ManaColor; timestamp: number }
  | { type: "GAIN_MOVE_POINTS"; amount: number; timestamp: number }
  | { type: "MOVE_TO_HEX"; hex: AxialHex; cost: number; timestamp: number }
  | { type: "REVEAL_TILE"; tileId: ID; center: AxialHex; timestamp: number }
  | { type: "START_COMBAT"; enemyInstanceIds: ID[]; timestamp: number }
  | { type: "ASSIGN_BLOCK"; cardId: ID; amount: number; timestamp: number }
  | { type: "ASSIGN_DAMAGE"; amount: number; timestamp: number }
  | { type: "ASSIGN_ATTACK"; cardId: ID; amount: number; kind: "melee" | "ranged" | "siege"; timestamp: number }
  | { type: "DEFEAT_ENEMY"; enemyInstanceId: ID; timestamp: number }
  | { type: "GAIN_FAME"; amount: number; timestamp: number }
  | { type: "GAIN_REPUTATION"; amount: number; timestamp: number }
  | { type: "GAIN_CRYSTAL"; color: ManaColor; timestamp: number }
  | { type: "USE_MANA_DIE"; color: ManaColor; index: number; timestamp: number }
  | { type: "END_TURN"; timestamp: number }
  | { type: "END_ROUND"; timestamp: number }
  | { type: "MANUAL_OVERRIDE"; description: string; patch: Partial<GameState>; ruleNote?: string; timestamp: number }
  | { type: "UNDO_EVENT"; timestamp: number };

export interface LogEntry {
  event: GameEvent;
  summary: string;
  ruleRefs?: SourceReference[];
}

// ---------- Imported library ----------

export interface ComponentLibrary {
  cards: Record<ID, Card>;
  heroes: Record<ID, Hero>;
  enemies: Record<ID, Enemy>;
  sites: Record<ID, Site>;
  skills: Record<ID, Skill>;
  units: Record<ID, UnitDef>;
  tiles: Record<ID, TileDef>;
  scenarios: Record<ID, Scenario>;
  tactics: Record<ID, TacticsCard>;
  rules: Record<ID, RuleEntry>;
}

export interface ImportedDocument {
  id: ID;
  filename: string;
  uploadedAt: number;
  kind: "rulebook" | "walkthrough" | "faq" | "cards" | "csv" | "json" | "manual" | "other";
  sizeBytes: number;
  textChunks?: Array<{ page?: number; section?: string; text: string; approved?: boolean; needsReview?: boolean }>;
  note?: string;
}

export interface SavedGame {
  id: ID;
  name: string;
  scenarioName: string;
  heroName: string;
  round: number;
  phase: Phase;
  savedAt: number;
  state: GameState;
}
