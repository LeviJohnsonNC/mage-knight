// Community Source Importer — types, source registry, parsers.
// Nothing in this file embeds official or community game data. It only
// provides scaffolding to ingest, parse, review and approve user-supplied
// or fetched content.

export type ID = string;

export type SourceType =
  | "fandom_wiki"
  | "boardgamegeek_file"
  | "boardgamegeek_thread"
  | "uploaded_file"
  | "manual"
  | "other";

export type ImportCategory =
  | "basic_action_cards"
  | "advanced_action_cards"
  | "spells"
  | "artifacts"
  | "heroes"
  | "skills"
  | "enemies"
  | "units"
  | "map_tiles"
  | "tactics"
  | "cities"
  | "sites"
  | "rules"
  | "unknown";

export const CATEGORY_LABELS: Record<ImportCategory, string> = {
  basic_action_cards: "Basic Action Cards",
  advanced_action_cards: "Advanced Action Cards",
  spells: "Spells",
  artifacts: "Artifacts",
  heroes: "Heroes",
  skills: "Skills",
  enemies: "Enemy Units",
  units: "Units",
  map_tiles: "Map Tiles",
  tactics: "Tactics Cards",
  cities: "Cities",
  sites: "Sites / Map Features",
  rules: "Rules",
  unknown: "Unclassified",
};

export interface SourceRecord {
  id: ID;
  sourceName: string;
  sourceType: SourceType;
  baseUrl?: string;
  license?: string;
  attributionRequired: boolean;
  attributionText?: string;
  notes?: string;
  enabled: boolean;
  createdAt: number;
}

export type QueueStatus =
  | "pending"
  | "fetching"
  | "fetched"
  | "parsed"
  | "failed"
  | "needs_review"
  | "approved"
  | "rejected";

export interface QueueItem {
  id: ID;
  sourceId: ID;
  url?: string;
  uploadedFilename?: string;
  rawText?: string; // manually pasted or fetched
  rawHtml?: string;
  category: ImportCategory;
  importMode: "single_page" | "index_page" | "uploaded_file" | "manual_paste";
  status: QueueStatus;
  error?: string;
  childLinks: string[];
  draftIds: ID[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type DraftKind =
  | "card"
  | "skill"
  | "site"
  | "tile"
  | "enemy"
  | "unit"
  | "hero"
  | "tactic"
  | "city"
  | "rule";

export interface ImportedDraftRecord {
  id: ID;
  kind: DraftKind;
  category: ImportCategory;
  name: string;
  // Structured fields are loosely typed because parsing confidence varies.
  fields: Record<string, string | number | boolean | string[] | undefined>;
  rawText: string;
  imageUrl?: string;
  sourceId: ID;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceLicense?: string;
  attributionText?: string;
  retrievedAt: number;
  importedBy: string;
  modifiedByUser: boolean;
  warnings: string[];
  needsReview: boolean;
  textApproved: boolean;
  automationApproved: boolean;
  parsedEffects?: ParsedEffectGuess[];
  reviewNotes?: string;
  lastReviewedAt?: number;
  duplicateOf?: ID;
  mergedFrom?: ID[];
  // Free-form linkage to existing library item
  linkedLibraryId?: ID;
}

export interface ParsedEffectGuess {
  tag:
    | "move" | "influence" | "attack" | "ranged_attack" | "siege_attack"
    | "block" | "heal" | "mana_gain" | "crystal_gain" | "draw" | "discard"
    | "fame" | "reputation" | "recruit" | "unit_ready" | "source_use"
    | "conditional" | "once_per_turn" | "end_of_turn" | "special";
  value?: number;
  note?: string;
  confidence: number;
}

export interface ParsedImportResult {
  sourceId: ID;
  sourceUrl?: string;
  detectedCategory: ImportCategory;
  confidence: number;
  records: ImportedDraftRecord[];
  childLinks: string[];
  warnings: string[];
  errors: string[];
  rawText: string;
}

export type DatasetMode =
  | "demo_placeholder"
  | "community_imported"
  | "personal_manual"
  | "hybrid";

export interface ExpectedCounts {
  basic_action_cards: number;
  advanced_action_cards: number;
  spells: number;
  artifacts: number;
  wounds: number;
  regular_units: number;
  elite_units: number;
  day_tactics: number;
  night_tactics: number;
  heroes: number;
  skill_description_cards: number;
  hero_skill_tokens: number;
  site_description_cards: number;
  city_cards: number;
  map_tiles: number;
  enemy_groups: number;
}

export const BASE_GAME_EXPECTED: ExpectedCounts = {
  basic_action_cards: 64,
  advanced_action_cards: 28,
  spells: 20,
  artifacts: 16,
  wounds: 40,
  regular_units: 20,
  elite_units: 20,
  day_tactics: 6,
  night_tactics: 6,
  heroes: 4,
  skill_description_cards: 4,
  hero_skill_tokens: 40,
  site_description_cards: 7,
  city_cards: 4,
  map_tiles: 20,
  enemy_groups: 5,
};

export interface CommunityState {
  sources: SourceRecord[];
  queue: QueueItem[];
  drafts: ImportedDraftRecord[];
  datasetMode: DatasetMode;
  expectedCounts: ExpectedCounts;
  presets: SourcePreset[];
  playMode: "strict" | "assisted";
}

export interface SourcePreset {
  id: ID;
  label: string;
  category: ImportCategory;
  sourceType: SourceType;
  url: string;
  importMode: QueueItem["importMode"];
}

// --------- Seed data (registry + presets, no game content) ---------

const now = () => Date.now();
const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function seedSources(): SourceRecord[] {
  return [
    {
      id: "src-fandom",
      sourceName: "Unofficial Mage Knight Fandom Wiki",
      sourceType: "fandom_wiki",
      baseUrl: "https://mageknight.fandom.com",
      license: "CC-BY-SA (unless otherwise noted on source page)",
      attributionRequired: true,
      attributionText:
        "Content imported from the Unofficial Mage Knight - The Boardgame Wiki on Fandom. Community content is listed there as CC-BY-SA unless otherwise noted. Review source pages for details.",
      notes:
        "Use imported content only after user review and approval. Pages may be inaccurate or non-canonical.",
      enabled: true,
      createdAt: now(),
    },
    {
      id: "src-bgg",
      sourceName: "BoardGameGeek user files",
      sourceType: "boardgamegeek_file",
      baseUrl: "https://boardgamegeek.com",
      license: "Unknown / user-provided",
      attributionRequired: true,
      attributionText:
        "Imported from user-supplied BoardGameGeek file. Verify the file's posted terms before redistribution.",
      notes:
        "Use only user-uploaded files or directly provided accessible URLs. Automated scraping is not assumed to work.",
      enabled: true,
      createdAt: now(),
    },
    {
      id: "src-manual",
      sourceName: "Manual user entry",
      sourceType: "manual",
      license: "User-provided",
      attributionRequired: false,
      attributionText:
        "Entered manually by the user from their own physical copy.",
      enabled: true,
      createdAt: now(),
    },
  ];
}

export function seedPresets(): SourcePreset[] {
  const fandom = "https://mageknight.fandom.com/wiki/";
  return [
    { id: uid("pre"), label: "Fandom: Main wiki", category: "rules", sourceType: "fandom_wiki", url: "https://mageknight.fandom.com/wiki/Mage_Knight_Wiki", importMode: "single_page" },
    { id: uid("pre"), label: "Fandom: Basic Action Cards", category: "basic_action_cards", sourceType: "fandom_wiki", url: `${fandom}Starting_Deck`, importMode: "index_page" },
    { id: uid("pre"), label: "Fandom: Advanced Action Cards", category: "advanced_action_cards", sourceType: "fandom_wiki", url: `${fandom}Advanced_Action_Cards`, importMode: "index_page" },
    { id: uid("pre"), label: "Fandom: Spells", category: "spells", sourceType: "fandom_wiki", url: `${fandom}Spells`, importMode: "index_page" },
    { id: uid("pre"), label: "Fandom: Artifacts", category: "artifacts", sourceType: "fandom_wiki", url: `${fandom}Artifacts`, importMode: "index_page" },
    { id: uid("pre"), label: "Fandom: Units", category: "units", sourceType: "fandom_wiki", url: `${fandom}Units`, importMode: "index_page" },
    { id: uid("pre"), label: "Fandom: Tactic Cards", category: "tactics", sourceType: "fandom_wiki", url: `${fandom}Tactic_Cards`, importMode: "index_page" },
    { id: uid("pre"), label: "Fandom: Skills", category: "skills", sourceType: "fandom_wiki", url: `${fandom}Skills`, importMode: "index_page" },
    { id: uid("pre"), label: "Fandom: Enemy Units", category: "enemies", sourceType: "fandom_wiki", url: `${fandom}Enemy_Units`, importMode: "index_page" },
    { id: uid("pre"), label: "Fandom: Map Tiles", category: "map_tiles", sourceType: "fandom_wiki", url: `${fandom}Map_Tiles`, importMode: "index_page" },
    { id: uid("pre"), label: "Fandom: Map Features (Sites)", category: "sites", sourceType: "fandom_wiki", url: `${fandom}Map_Features`, importMode: "index_page" },
    { id: uid("pre"), label: "Fandom: Cities", category: "cities", sourceType: "fandom_wiki", url: `${fandom}Cities`, importMode: "index_page" },
    { id: uid("pre"), label: "BGG: Main game page", category: "unknown", sourceType: "boardgamegeek_thread", url: "https://boardgamegeek.com/boardgame/96848/mage-knight-board-game", importMode: "single_page" },
    { id: uid("pre"), label: "BGG: Files page", category: "unknown", sourceType: "boardgamegeek_file", url: "https://boardgamegeek.com/boardgame/96848/mage-knight-board-game/files", importMode: "single_page" },
  ];
}

export function makeSource(partial: Partial<SourceRecord>): SourceRecord {
  return {
    id: uid("src"),
    sourceName: partial.sourceName ?? "New source",
    sourceType: partial.sourceType ?? "other",
    baseUrl: partial.baseUrl,
    license: partial.license,
    attributionRequired: partial.attributionRequired ?? true,
    attributionText: partial.attributionText,
    notes: partial.notes,
    enabled: partial.enabled ?? true,
    createdAt: now(),
  };
}

export function makeQueueItem(partial: Partial<QueueItem> & { sourceId: ID; category: ImportCategory; importMode: QueueItem["importMode"]; }): QueueItem {
  return {
    id: uid("q"),
    sourceId: partial.sourceId,
    url: partial.url,
    uploadedFilename: partial.uploadedFilename,
    rawText: partial.rawText,
    rawHtml: partial.rawHtml,
    category: partial.category,
    importMode: partial.importMode,
    status: partial.status ?? "pending",
    error: partial.error,
    childLinks: partial.childLinks ?? [],
    draftIds: partial.draftIds ?? [],
    notes: partial.notes,
    createdAt: now(),
    updatedAt: now(),
  };
}

// --------- HTML utilities ---------

function htmlToText(html: string): string {
  if (typeof window === "undefined") {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,noscript").forEach((n) => n.remove());
  return doc.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function parseDocument(html: string): Document | null {
  if (typeof DOMParser === "undefined") return null;
  return new DOMParser().parseFromString(html, "text/html");
}

function pickMainContent(doc: Document | null): HTMLElement | null {
  if (!doc) return null;
  return (
    doc.querySelector(".mw-parser-output") as HTMLElement | null ??
    doc.querySelector("#content") as HTMLElement | null ??
    doc.querySelector("main") as HTMLElement | null ??
    doc.body
  );
}

function absUrl(href: string, base?: string): string {
  try { return new URL(href, base ?? "https://mageknight.fandom.com/").toString(); }
  catch { return href; }
}

// --------- Fetch with graceful fallback ---------

export interface FetchResult { ok: boolean; html?: string; text?: string; error?: string; }

export async function fetchUrl(url: string): Promise<FetchResult> {
  const proxies = [
    (u: string) => `https://r.jina.ai/${u}`, // markdown reader proxy, often CORS-permissive
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => u,
  ];
  let lastErr = "";
  for (const wrap of proxies) {
    try {
      const res = await fetch(wrap(url), { method: "GET" });
      if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }
      const body = await res.text();
      if (!body) { lastErr = "Empty response"; continue; }
      if (body.trim().startsWith("<")) return { ok: true, html: body };
      return { ok: true, text: body };
    } catch (e) {
      lastErr = (e as Error).message;
    }
  }
  return { ok: false, error: lastErr || "Fetch failed (CORS or network)" };
}

// --------- Effect parser (heuristic) ---------

const EFFECT_PATTERNS: Array<{ re: RegExp; tag: ParsedEffectGuess["tag"]; confidence: number }> = [
  { re: /move\s*\+?\s*(\d+)/i, tag: "move", confidence: 0.8 },
  { re: /influence\s*\+?\s*(\d+)/i, tag: "influence", confidence: 0.8 },
  { re: /ranged\s+attack\s*\+?\s*(\d+)/i, tag: "ranged_attack", confidence: 0.85 },
  { re: /siege\s+attack\s*\+?\s*(\d+)/i, tag: "siege_attack", confidence: 0.85 },
  { re: /attack\s*\+?\s*(\d+)/i, tag: "attack", confidence: 0.75 },
  { re: /block\s*\+?\s*(\d+)/i, tag: "block", confidence: 0.8 },
  { re: /heal\s*\+?\s*(\d+)/i, tag: "heal", confidence: 0.8 },
  { re: /draw\s+(\d+|a)\s+cards?/i, tag: "draw", confidence: 0.75 },
  { re: /gain[^.]{0,30}crystal/i, tag: "crystal_gain", confidence: 0.7 },
  { re: /gain[^.]{0,30}mana/i, tag: "mana_gain", confidence: 0.7 },
  { re: /fame\s*\+?\s*(\d+)/i, tag: "fame", confidence: 0.7 },
  { re: /reputation/i, tag: "reputation", confidence: 0.5 },
  { re: /recruit/i, tag: "recruit", confidence: 0.6 },
  { re: /ready (a |an |one |another )?unit/i, tag: "unit_ready", confidence: 0.65 },
  { re: /once per turn/i, tag: "once_per_turn", confidence: 0.7 },
  { re: /end of (your )?turn/i, tag: "end_of_turn", confidence: 0.7 },
  { re: /\bif\b|\bwhen\b/i, tag: "conditional", confidence: 0.4 },
];

export function guessEffects(text: string): ParsedEffectGuess[] {
  const out: ParsedEffectGuess[] = [];
  for (const p of EFFECT_PATTERNS) {
    const m = text.match(p.re);
    if (m) {
      const v = m[1] ? Number(m[1]) : undefined;
      out.push({
        tag: p.tag,
        value: Number.isFinite(v) ? v : undefined,
        confidence: p.confidence,
        note: m[0],
      });
    }
  }
  if (!out.length) out.push({ tag: "special", confidence: 0.2, note: "No effects auto-detected" });
  return out;
}

// --------- Parsers ---------

const FANDOM_NAV_NOISE = /^(Categories|Edit|Source|History|Talk|Read|View|More|Categories:)/i;

function draftBase(opts: {
  kind: DraftKind;
  category: ImportCategory;
  name: string;
  rawText: string;
  imageUrl?: string;
  sourceId: ID;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceLicense?: string;
  attributionText?: string;
  warnings?: string[];
  fields?: ImportedDraftRecord["fields"];
}): ImportedDraftRecord {
  return {
    id: uid("draft"),
    kind: opts.kind,
    category: opts.category,
    name: opts.name,
    fields: opts.fields ?? {},
    rawText: opts.rawText,
    imageUrl: opts.imageUrl,
    sourceId: opts.sourceId,
    sourceUrl: opts.sourceUrl,
    sourceTitle: opts.sourceTitle,
    sourceLicense: opts.sourceLicense,
    attributionText: opts.attributionText,
    retrievedAt: now(),
    importedBy: "user",
    modifiedByUser: false,
    warnings: opts.warnings ?? [],
    needsReview: true,
    textApproved: false,
    automationApproved: false,
  };
}

const KIND_FOR_CATEGORY: Record<ImportCategory, DraftKind> = {
  basic_action_cards: "card",
  advanced_action_cards: "card",
  spells: "card",
  artifacts: "card",
  heroes: "hero",
  skills: "skill",
  enemies: "enemy",
  units: "unit",
  map_tiles: "tile",
  tactics: "tactic",
  cities: "city",
  sites: "site",
  rules: "rule",
  unknown: "rule",
};

export function parseFandomIndexPage(input: string, ctx: {
  sourceId: ID; sourceUrl?: string; category: ImportCategory;
  sourceLicense?: string; attributionText?: string;
}): ParsedImportResult {
  const isHtml = /<[a-z][\s\S]*>/i.test(input);
  const doc = isHtml ? parseDocument(input) : null;
  const main = pickMainContent(doc);
  const warnings: string[] = [];
  const errors: string[] = [];
  const childLinks: string[] = [];
  const records: ImportedDraftRecord[] = [];

  const title =
    doc?.querySelector("h1")?.textContent?.trim() ??
    doc?.title?.replace(/\s*\|.*$/, "").trim() ??
    "Index";

  if (main) {
    // Collect linked items inside lists or galleries.
    const anchors = Array.from(main.querySelectorAll("a")) as HTMLAnchorElement[];
    const seen = new Set<string>();
    for (const a of anchors) {
      const href = a.getAttribute("href") ?? "";
      const text = (a.textContent ?? "").trim();
      if (!text || FANDOM_NAV_NOISE.test(text)) continue;
      if (!href || href.startsWith("#")) continue;
      if (/Special:|Category:|File:|Help:|Template:|User:|action=/.test(href)) continue;
      const url = absUrl(href, ctx.sourceUrl);
      if (seen.has(url)) continue;
      seen.add(url);
      childLinks.push(url);
      records.push(
        draftBase({
          kind: KIND_FOR_CATEGORY[ctx.category],
          category: ctx.category,
          name: text,
          rawText: `Listed on index: ${title}`,
          sourceId: ctx.sourceId,
          sourceUrl: url,
          sourceTitle: text,
          sourceLicense: ctx.sourceLicense,
          attributionText: ctx.attributionText,
          warnings: ["Index entry — needs child page import"],
          fields: { needsChildPageImport: true },
        }),
      );
    }
  } else {
    // Plain-text fallback: take bullet-like lines.
    const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length < 2 || line.length > 80) continue;
      if (FANDOM_NAV_NOISE.test(line)) continue;
      records.push(
        draftBase({
          kind: KIND_FOR_CATEGORY[ctx.category],
          category: ctx.category,
          name: line.replace(/^[-•*]\s*/, "").trim(),
          rawText: `From pasted index list`,
          sourceId: ctx.sourceId,
          sourceUrl: ctx.sourceUrl,
          sourceLicense: ctx.sourceLicense,
          attributionText: ctx.attributionText,
          warnings: ["Pasted index — no child URL"],
          fields: { needsChildPageImport: false },
        }),
      );
    }
    if (!records.length) warnings.push("No list items detected on the pasted index page.");
  }

  return {
    sourceId: ctx.sourceId,
    sourceUrl: ctx.sourceUrl,
    detectedCategory: ctx.category,
    confidence: records.length > 3 ? 0.8 : 0.4,
    records, childLinks, warnings, errors,
    rawText: isHtml ? htmlToText(input).slice(0, 5000) : input.slice(0, 5000),
  };
}

function sectionMap(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const headers = [
    "Card Text", "Normal Effect", "Strong Effect",
    "Skill Description", "Effect", "Description",
    "Site Description", "Interaction", "Reward",
    "Additional Info", "Additional Info & Explanations", "Notes",
    "Abilities", "Resistances", "Attack", "Armor", "Fame",
  ];
  const lower = text;
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    const re = new RegExp(`(^|\\n|\\s)${h.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*[:\\-]?\\s*`, "i");
    const m = lower.match(re);
    if (!m) continue;
    const start = (m.index ?? 0) + m[0].length;
    // Find earliest next header position.
    let end = lower.length;
    for (const h2 of headers) {
      if (h2 === h) continue;
      const re2 = new RegExp(`(\\n|\\s)${h2.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*[:\\-]?\\s*`, "i");
      const m2 = lower.slice(start).match(re2);
      if (m2 && m2.index !== undefined) end = Math.min(end, start + m2.index);
    }
    sections[h] = lower.slice(start, end).trim();
  }
  return sections;
}

function extractTitleAndImage(input: string): { title: string; imageUrl?: string; text: string } {
  const isHtml = /<[a-z][\s\S]*>/i.test(input);
  if (!isHtml) {
    const firstLine = input.split(/\r?\n/).find(Boolean)?.trim() ?? "Untitled";
    return { title: firstLine.slice(0, 120), text: input };
  }
  const doc = parseDocument(input);
  const main = pickMainContent(doc);
  const title =
    doc?.querySelector("h1")?.textContent?.trim() ??
    doc?.title?.replace(/\s*\|.*$/, "").trim() ??
    "Untitled";
  const img = main?.querySelector("img") as HTMLImageElement | null;
  const imageUrl = img?.getAttribute("src") ?? undefined;
  const text = main ? (main.textContent ?? "").replace(/\s+/g, " ").trim() : htmlToText(input);
  return { title, imageUrl, text };
}

export function parseFandomCardPage(input: string, ctx: {
  sourceId: ID; sourceUrl?: string; category: ImportCategory;
  sourceLicense?: string; attributionText?: string;
}): ParsedImportResult {
  const { title, imageUrl, text } = extractTitleAndImage(input);
  const s = sectionMap(text);
  const normal = s["Normal Effect"] ?? s["Card Text"] ?? s["Effect"] ?? text.slice(0, 400);
  const strong = s["Strong Effect"] ?? undefined;
  const additional = s["Additional Info"] ?? s["Additional Info & Explanations"] ?? s["Notes"] ?? undefined;

  const draft = draftBase({
    kind: "card",
    category: ctx.category,
    name: title,
    rawText: text.slice(0, 8000),
    imageUrl,
    sourceId: ctx.sourceId,
    sourceUrl: ctx.sourceUrl,
    sourceTitle: title,
    sourceLicense: ctx.sourceLicense,
    attributionText: ctx.attributionText,
    fields: {
      normalEffectText: normal,
      strongEffectText: strong,
      additionalNotes: additional,
      rawRulesText: text.slice(0, 2000),
    },
  });
  draft.parsedEffects = guessEffects(`${normal} ${strong ?? ""}`);

  return {
    sourceId: ctx.sourceId,
    sourceUrl: ctx.sourceUrl,
    detectedCategory: ctx.category,
    confidence: normal ? 0.7 : 0.3,
    records: [draft], childLinks: [],
    warnings: normal ? [] : ["Could not isolate card effect text"],
    errors: [],
    rawText: text.slice(0, 5000),
  };
}

export function parseFandomSkillPage(input: string, ctx: {
  sourceId: ID; sourceUrl?: string; sourceLicense?: string; attributionText?: string;
}): ParsedImportResult {
  const { title, imageUrl, text } = extractTitleAndImage(input);
  const s = sectionMap(text);
  const effect = s["Effect"] ?? s["Skill Description"] ?? s["Description"] ?? text.slice(0, 400);
  const draft = draftBase({
    kind: "skill", category: "skills", name: title,
    rawText: text.slice(0, 8000), imageUrl,
    sourceId: ctx.sourceId, sourceUrl: ctx.sourceUrl, sourceTitle: title,
    sourceLicense: ctx.sourceLicense, attributionText: ctx.attributionText,
    fields: { effectText: effect, additionalNotes: s["Notes"] },
  });
  draft.parsedEffects = guessEffects(effect);
  return { sourceId: ctx.sourceId, sourceUrl: ctx.sourceUrl, detectedCategory: "skills", confidence: 0.6, records: [draft], childLinks: [], warnings: [], errors: [], rawText: text.slice(0, 5000) };
}

export function parseFandomSitePage(input: string, ctx: {
  sourceId: ID; sourceUrl?: string; sourceLicense?: string; attributionText?: string;
}): ParsedImportResult {
  const { title, imageUrl, text } = extractTitleAndImage(input);
  const s = sectionMap(text);
  const description = s["Site Description"] ?? s["Description"] ?? text.slice(0, 400);
  const draft = draftBase({
    kind: "site", category: "sites", name: title,
    rawText: text.slice(0, 8000), imageUrl,
    sourceId: ctx.sourceId, sourceUrl: ctx.sourceUrl, sourceTitle: title,
    sourceLicense: ctx.sourceLicense, attributionText: ctx.attributionText,
    fields: {
      siteDescriptionText: description,
      interactionRules: s["Interaction"],
      rewardRules: s["Reward"],
      additionalNotes: s["Additional Info"] ?? s["Notes"],
    },
  });
  return { sourceId: ctx.sourceId, sourceUrl: ctx.sourceUrl, detectedCategory: "sites", confidence: 0.6, records: [draft], childLinks: [], warnings: [], errors: [], rawText: text.slice(0, 5000) };
}

export function parseFandomMapTilePage(input: string, ctx: {
  sourceId: ID; sourceUrl?: string; sourceLicense?: string; attributionText?: string;
}): ParsedImportResult {
  const { title, imageUrl, text } = extractTitleAndImage(input);
  const tileType =
    /core/i.test(text) ? "core" :
    /city/i.test(text) ? "city" :
    /countryside/i.test(text) ? "countryside" : "unknown";
  const draft = draftBase({
    kind: "tile", category: "map_tiles", name: title,
    rawText: text.slice(0, 8000), imageUrl,
    sourceId: ctx.sourceId, sourceUrl: ctx.sourceUrl, sourceTitle: title,
    sourceLicense: ctx.sourceLicense, attributionText: ctx.attributionText,
    fields: { tileCode: title.replace(/\s+/g, "-"), tileType, rawLayoutText: text.slice(0, 2000) },
  });
  return { sourceId: ctx.sourceId, sourceUrl: ctx.sourceUrl, detectedCategory: "map_tiles", confidence: 0.5, records: [draft], childLinks: [], warnings: ["Hex layout requires manual review"], errors: [], rawText: text.slice(0, 5000) };
}

export function parseFandomEnemyPage(input: string, ctx: {
  sourceId: ID; sourceUrl?: string; sourceLicense?: string; attributionText?: string;
}): ParsedImportResult {
  const { title, imageUrl, text } = extractTitleAndImage(input);
  const num = (h: string) => {
    const m = text.match(new RegExp(`${h}\\s*[:\\-]?\\s*(\\d+)`, "i"));
    return m ? Number(m[1]) : undefined;
  };
  const family =
    /orc/i.test(text) ? "Marauding Orcs" :
    /draconum/i.test(text) ? "Draconum" :
    /dungeon/i.test(text) ? "Dungeon" :
    /city/i.test(text) ? "City" :
    /keep|mage tower/i.test(text) ? "Keep / Mage Tower" : "Unknown";
  const draft = draftBase({
    kind: "enemy", category: "enemies", name: title,
    rawText: text.slice(0, 8000), imageUrl,
    sourceId: ctx.sourceId, sourceUrl: ctx.sourceUrl, sourceTitle: title,
    sourceLicense: ctx.sourceLicense, attributionText: ctx.attributionText,
    fields: {
      family,
      attack: num("Attack"),
      armor: num("Armor"),
      fame: num("Fame"),
      abilitiesRaw: text.match(/Abilities[\s\S]{0,300}/i)?.[0],
      resistancesRaw: text.match(/Resistances?[\s\S]{0,200}/i)?.[0],
    },
  });
  return { sourceId: ctx.sourceId, sourceUrl: ctx.sourceUrl, detectedCategory: "enemies", confidence: 0.55, records: [draft], childLinks: [], warnings: [], errors: [], rawText: text.slice(0, 5000) };
}

export function parseChildByCategory(input: string, ctx: {
  sourceId: ID; sourceUrl?: string; category: ImportCategory;
  sourceLicense?: string; attributionText?: string;
}): ParsedImportResult {
  switch (ctx.category) {
    case "basic_action_cards":
    case "advanced_action_cards":
    case "spells":
    case "artifacts":
    case "tactics":
    case "cities":
      return parseFandomCardPage(input, ctx);
    case "skills":
      return parseFandomSkillPage(input, { ...ctx });
    case "sites":
      return parseFandomSitePage(input, { ...ctx });
    case "map_tiles":
      return parseFandomMapTilePage(input, { ...ctx });
    case "enemies":
      return parseFandomEnemyPage(input, { ...ctx });
    case "units":
      return parseFandomCardPage(input, { ...ctx, category: "units" });
    case "heroes":
      return parseFandomCardPage(input, { ...ctx, category: "heroes" });
    case "rules":
    case "unknown":
    default:
      return parseFandomCardPage(input, ctx);
  }
}

// --------- Uploaded file parsers ---------

export function parseUploadedCsv(text: string, ctx: {
  sourceId: ID; category: ImportCategory; sourceLicense?: string; attributionText?: string; filename?: string;
}): ParsedImportResult {
  const rows = text.split(/\r?\n/).filter((r) => r.trim().length > 0);
  if (!rows.length) return { sourceId: ctx.sourceId, detectedCategory: ctx.category, confidence: 0, records: [], childLinks: [], warnings: ["Empty file"], errors: [], rawText: "" };
  const header = rows[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const records: ImportedDraftRecord[] = [];
  const warnings: string[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].match(/("[^"]*"|[^,]+)/g)?.map((c) => c.replace(/^"|"$/g, "").trim()) ?? [];
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => { obj[h] = cells[idx] ?? ""; });
    const name = obj["name"] ?? obj["Name"] ?? obj["title"] ?? `Row ${i}`;
    records.push(draftBase({
      kind: KIND_FOR_CATEGORY[ctx.category],
      category: ctx.category,
      name,
      rawText: rows[i],
      sourceId: ctx.sourceId,
      sourceTitle: ctx.filename,
      sourceLicense: ctx.sourceLicense,
      attributionText: ctx.attributionText,
      fields: obj,
    }));
  }
  if (!records.length) warnings.push("No data rows found after header");
  return { sourceId: ctx.sourceId, detectedCategory: ctx.category, confidence: records.length ? 0.7 : 0.2, records, childLinks: [], warnings, errors: [], rawText: text.slice(0, 5000) };
}

export function parseUploadedJson(text: string, ctx: {
  sourceId: ID; category: ImportCategory; sourceLicense?: string; attributionText?: string; filename?: string;
}): ParsedImportResult {
  const errors: string[] = [];
  let json: unknown;
  try { json = JSON.parse(text); } catch (e) { errors.push((e as Error).message); }
  const records: ImportedDraftRecord[] = [];
  const items: any[] = Array.isArray(json) ? (json as any[]) : json && typeof json === "object" ? Object.values(json as object) : [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const name = (it as any).name ?? (it as any).title ?? "Unnamed";
    records.push(draftBase({
      kind: KIND_FOR_CATEGORY[ctx.category],
      category: ctx.category,
      name,
      rawText: JSON.stringify(it).slice(0, 4000),
      sourceId: ctx.sourceId,
      sourceTitle: ctx.filename,
      sourceLicense: ctx.sourceLicense,
      attributionText: ctx.attributionText,
      fields: it as Record<string, any>,
    }));
  }
  return { sourceId: ctx.sourceId, detectedCategory: ctx.category, confidence: records.length ? 0.75 : 0.2, records, childLinks: [], warnings: records.length ? [] : ["No items detected in JSON"], errors, rawText: text.slice(0, 5000) };
}

export function parseUploadedText(text: string, ctx: {
  sourceId: ID; category: ImportCategory; sourceLicense?: string; attributionText?: string; filename?: string;
}): ParsedImportResult {
  // Treat blank-line separated blocks as records, first non-empty line is name.
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const records = blocks.map((b) => {
    const lines = b.split(/\r?\n/);
    const name = lines[0].trim().slice(0, 120);
    return draftBase({
      kind: KIND_FOR_CATEGORY[ctx.category],
      category: ctx.category,
      name: name || "Block",
      rawText: b,
      sourceId: ctx.sourceId,
      sourceTitle: ctx.filename,
      sourceLicense: ctx.sourceLicense,
      attributionText: ctx.attributionText,
      fields: { body: lines.slice(1).join("\n") },
    });
  });
  return { sourceId: ctx.sourceId, detectedCategory: ctx.category, confidence: records.length ? 0.5 : 0.2, records, childLinks: [], warnings: records.length ? [] : ["No blocks detected"], errors: [], rawText: text.slice(0, 5000) };
}

// --------- Dataset readiness ---------

export function countByCategory(drafts: ImportedDraftRecord[], approvedOnly: boolean): Record<ImportCategory, number> {
  const out: Record<string, number> = {};
  for (const d of drafts) {
    if (approvedOnly && !d.textApproved) continue;
    out[d.category] = (out[d.category] ?? 0) + 1;
  }
  return out as Record<ImportCategory, number>;
}

export interface ChecklistRow {
  key: keyof ExpectedCounts;
  label: string;
  expected: number;
  have: number;
  ok: boolean;
}

export function buildChecklist(
  drafts: ImportedDraftRecord[],
  expected: ExpectedCounts,
  approvedOnly = true,
): ChecklistRow[] {
  const c = countByCategory(drafts, approvedOnly);
  const enemyFamilies = new Set<string>();
  for (const d of drafts) {
    if (d.category === "enemies" && (!approvedOnly || d.textApproved)) {
      const fam = String(d.fields["family"] ?? "");
      if (fam) enemyFamilies.add(fam);
    }
  }
  const rows: ChecklistRow[] = [
    row("basic_action_cards", "Basic Action Cards", expected.basic_action_cards, c.basic_action_cards ?? 0),
    row("advanced_action_cards", "Advanced Action Cards", expected.advanced_action_cards, c.advanced_action_cards ?? 0),
    row("spells", "Spell Cards", expected.spells, c.spells ?? 0),
    row("artifacts", "Artifact Cards", expected.artifacts, c.artifacts ?? 0),
    row("wounds", "Wound Cards", expected.wounds, 0),
    row("regular_units", "Regular Units", expected.regular_units, c.units ?? 0),
    row("elite_units", "Elite Units", expected.elite_units, 0),
    row("day_tactics", "Day Tactics", expected.day_tactics, c.tactics ?? 0),
    row("night_tactics", "Night Tactics", expected.night_tactics, 0),
    row("heroes", "Heroes", expected.heroes, c.heroes ?? 0),
    row("skill_description_cards", "Skill Description Cards", expected.skill_description_cards, 0),
    row("hero_skill_tokens", "Hero Skill Tokens", expected.hero_skill_tokens, c.skills ?? 0),
    row("site_description_cards", "Site Description Cards", expected.site_description_cards, c.sites ?? 0),
    row("city_cards", "City Cards", expected.city_cards, c.cities ?? 0),
    row("map_tiles", "Map Tiles", expected.map_tiles, c.map_tiles ?? 0),
    row("enemy_groups", "Enemy Groups (families)", expected.enemy_groups, enemyFamilies.size),
  ];
  return rows;
  function row(key: keyof ExpectedCounts, label: string, expected: number, have: number): ChecklistRow {
    return { key, label, expected, have, ok: have >= expected };
  }
}

export function detectDuplicates(drafts: ImportedDraftRecord[]): Record<string, ImportedDraftRecord[]> {
  const groups: Record<string, ImportedDraftRecord[]> = {};
  for (const d of drafts) {
    const k = `${d.category}::${d.name.toLowerCase().trim()}`;
    (groups[k] ??= []).push(d);
  }
  const dups: Record<string, ImportedDraftRecord[]> = {};
  for (const [k, arr] of Object.entries(groups)) if (arr.length > 1) dups[k] = arr;
  return dups;
}

export const utils = { uid, htmlToText, absUrl };
