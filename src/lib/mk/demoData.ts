// DEMO PLACEHOLDER DATA — clearly labeled, not official Mage Knight content.
// These exist purely to prove the app works. Replace via Import Center.

import type { ComponentLibrary } from "./types";

export const DEMO_NOTICE =
  "Demo data — replace with imported Mage Knight data via the Import Center.";

export const demoLibrary: ComponentLibrary = {
  cards: {
    "demo-card-stride": {
      id: "demo-card-stride",
      name: "Demo: Stride",
      type: "basic-action",
      source: "demo",
      normalEffect: "Gain 2 Move points.",
      strongEffect: "Gain 4 Move points.",
      tags: ["move"],
      needsReview: false,
    },
    "demo-card-strike": {
      id: "demo-card-strike",
      name: "Demo: Strike",
      type: "basic-action",
      source: "demo",
      normalEffect: "Attack 2.",
      strongEffect: "Attack 4.",
      tags: ["attack"],
    },
    "demo-card-ward": {
      id: "demo-card-ward",
      name: "Demo: Ward",
      type: "basic-action",
      source: "demo",
      normalEffect: "Block 2.",
      strongEffect: "Block 4.",
      tags: ["block"],
    },
    "demo-card-parley": {
      id: "demo-card-parley",
      name: "Demo: Parley",
      type: "basic-action",
      source: "demo",
      normalEffect: "Influence 2.",
      strongEffect: "Influence 4.",
      tags: ["influence"],
    },
    "demo-card-meditate": {
      id: "demo-card-meditate",
      name: "Demo: Meditate",
      type: "basic-action",
      source: "demo",
      normalEffect: "Draw 1 card.",
      strongEffect: "Heal 1 wound.",
      tags: ["draw", "heal"],
    },
  },
  heroes: {
    "demo-hero": {
      id: "demo-hero",
      name: "Demo Hero",
      source: "demo",
      startingDeck: [
        "demo-card-stride","demo-card-stride","demo-card-stride",
        "demo-card-strike","demo-card-strike",
        "demo-card-ward","demo-card-ward",
        "demo-card-parley","demo-card-parley",
        "demo-card-meditate","demo-card-meditate",
      ],
      startingArmor: 2,
      startingHandLimit: 5,
      startingCommand: 1,
      description: "Generic placeholder hero used to validate the app vertical slice.",
    },
  },
  enemies: {
    "demo-enemy-brigand": {
      id: "demo-enemy-brigand",
      name: "Demo: Brigand",
      source: "demo",
      attack: 3,
      armor: 3,
      fame: 2,
      abilities: ["—"],
    },
  },
  sites: {
    "demo-site-village": {
      id: "demo-site-village",
      name: "Demo: Village",
      siteType: "settlement",
      source: "demo",
      interactionOptions: ["Recruit (placeholder)", "Heal (placeholder)"],
    },
    "demo-site-mine": {
      id: "demo-site-mine",
      name: "Demo: Mine",
      siteType: "resource",
      source: "demo",
      rewardRules: "Gain 1 crystal of the mine's color (placeholder).",
    },
  },
  skills: {},
  units: {},
  tiles: {
    "demo-tile-start": {
      id: "demo-tile-start",
      name: "Demo: Starting Tile",
      kind: "starting",
      source: "demo",
      hexes: [
        { q: 0, r: 0, terrain: "plains" },
        { q: 1, r: 0, terrain: "plains" },
        { q: -1, r: 0, terrain: "hills" },
        { q: 0, r: 1, terrain: "forest", siteId: "demo-site-village" },
        { q: 0, r: -1, terrain: "plains" },
        { q: 1, r: -1, terrain: "hills" },
        { q: -1, r: 1, terrain: "forest" },
      ],
    },
    "demo-tile-country": {
      id: "demo-tile-country",
      name: "Demo: Countryside",
      kind: "countryside",
      source: "demo",
      hexes: [
        { q: 0, r: 0, terrain: "forest" },
        { q: 1, r: 0, terrain: "hills", siteId: "demo-site-mine" },
        { q: -1, r: 0, terrain: "plains" },
        { q: 0, r: 1, terrain: "wasteland" },
        { q: 0, r: -1, terrain: "swamp" },
        { q: 1, r: -1, terrain: "mountain" },
        { q: -1, r: 1, terrain: "plains" },
      ],
    },
  },
  scenarios: {
    "demo-scenario-solo": {
      id: "demo-scenario-solo",
      name: "Demo: Solo Vertical Slice",
      playerCount: 1,
      soloCompatible: true,
      setupRules: "Placeholder solo setup used to validate engine plumbing.",
      objective: "Explore one countryside tile and resolve one combat.",
      roundLimit: 3,
      winCondition: "Defeat the demo brigand.",
      lossCondition: "Round limit reached.",
      source: "demo",
    },
  },
  tactics: {
    "demo-tactic-day": {
      id: "demo-tactic-day",
      name: "Demo: Early Bird (Day)",
      daynight: "day",
      description: "Placeholder day tactic.",
      source: "demo",
    },
    "demo-tactic-night": {
      id: "demo-tactic-night",
      name: "Demo: From the Dusk (Night)",
      daynight: "night",
      description: "Placeholder night tactic.",
      source: "demo",
    },
  },
  rules: {
    "demo-rule-turn": {
      id: "demo-rule-turn",
      title: "Placeholder: Turn structure",
      category: "Turn",
      fullText:
        "This is a placeholder rule. Import the official rulebook via the Import Center to populate real rule references.",
      keywords: ["turn", "phase"],
    },
  },
};
