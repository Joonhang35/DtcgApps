import fs from "node:fs/promises";
import path from "node:path";
import {
  OUT, TMP, writeJson, sha256File, extractRecords, attrsOf,
  cardNumberOf, imageUrlOf, first, asString, asNumber
} from "./lib.mjs";

const API = "https://api.heroi.cc/bulk-data";
const LANGUAGES = (process.env.LANGUAGES || "en,ja,ko,zh-Hans")
  .split(",").map(x => x.trim()).filter(Boolean);
const UA = "DtcgApps-Database/2.0 (community card database importer)";

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/vnd.api+json, application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}
async function download(url, file) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const bytes = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(file, bytes);
  return bytes.length;
}
function pickLanguageBulk(items, lang) {
  const aliases = {
    "en": ["english cards", "english"],
    "ja": ["japanese cards", "japanese"],
    "ko": ["korean cards", "korean"],
    "zh-Hans": ["chinese (simplified) cards", "simplified chinese"]
  };
  const names = aliases[lang] || [lang.toLowerCase()];
  return items.find(item => names.some(n => String(item.attributes?.name || "").toLowerCase() === n));
}
function normalize(record, lang) {
  const data = record?.data ?? record;
  const a = attrsOf(data);
  const cardId = cardNumberOf(data, a);
  const sourceRecordId = asString(data?.id);

  if (!cardId || !sourceRecordId) {
    return {
      warning: "missing-card-number-or-source-record-id",
      sourceRecordId,
      lang
    };
  }

  const colors = [
  ...(Array.isArray(a.color) ? a.color : [a.color]),
  ...(Array.isArray(a.color2) ? a.color2 : [a.color2]),
  ...(Array.isArray(a.colors) ? a.colors : [a.colors])
]
  .filter(Boolean)
  .map(String);
  const localized = {
    language: lang,
    name: asString(first(a.name, a.card_name)) ?? cardId,
   mainEffect: asString(first(a.effect, a.main_effect, a.mainEffect)),
sourceEffect: asString(first(a["inherited-effect"], a.source_effect, a.sourceEffect)),
alternateEffect: asString(first(a["alternate-effect"], a.alt_effect, a.alternate_effect, a.altEffect)),
    sourceAttributes: {
      type: a.type ?? null,
      color: a.color ?? null,
      color2: a.color2 ?? null,
      level: a.level ?? null,
     play_cost:a["play-cost"] ?? a.play_cost ?? null,
evolution_cost:a["evolution-cost"] ?? a.evolution_cost ?? null,
      dp: a.dp ?? null,
      rarity: a.rarity ?? null,
      form: a.form ?? null,
      attribute: a.attribute ?? null,
      blockIcon: a["block-icon"] ?? null,
      digivolutionRequirements: a["digivolution-requirements"] ?? [],
      faqs: a.faqs ?? [],
      set_name: a.set_name ?? null
    }
  };
  const canonical = {
    cardId,
    sourceRecordIds: {
      [lang]: sourceRecordId
    },
    names: {
      [lang]: localized.name
    },
    cardType: asString(a.category),
    colors: [...new Set(colors)],
    level: asNumber(a.level),
    playCost:asNumber(first(a["play-cost"], a.play_cost)),
    evolutionCost:asNumber(first(a["evolution-cost"], a.evolution_cost)),
    dp: asNumber(a.dp),
    rarity: asString(a.rarity)?.toUpperCase() ?? null,
    source: "Heroicc",
    sourceUpdatedAt: null
  };
  
const parallelId = asNumber(a["parallel-id"]);

const variant = {
  variantId: `${cardId}-${lang}-${sourceRecordId}`,
  cardId,
  sourceRecordId,
  language: lang,
  region: "unknown",
  printing: parallelId > 0 ? "parallel" : "standard",
  parallelId,
  sourceNotes: asString(a.notes),
  localized
};

  const imageUrl = imageUrlOf(a);
  
const image = imageUrl ? {
  imageId: `${cardId}-${lang}-${sourceRecordId}`,
  cardId,
  variantId: variant.variantId,
  sourceRecordId,
  language: lang,
  region: "unknown",
  printing: variant.printing,
  parallelId: variant.parallelId,
  url: imageUrl,
  source: "Heroicc",
  verified: false
} : null;
  return { canonical, variant, image };
}

await fs.mkdir(TMP, { recursive: true });
const catalog = await getJson(API);
const bulkItems = catalog.data ?? [];
if (!Array.isArray(bulkItems)) throw new Error("Heroicc bulk catalogue has no data[] array");

const cards = new Map();
const variants = new Map();
const images = new Map();
const report = { startedAt: new Date().toISOString(), source: API, languages: {}, warnings: [] };

for (const lang of LANGUAGES) {
  const item = pickLanguageBulk(bulkItems, lang);
if (!item?.links?.download) {
  throw new Error(`No bulk download found for required language: ${lang}`);
}
  const file = path.join(TMP, `${lang.replace(/[^a-zA-Z0-9-]/g, "_")}.json`);
  const bytes = await download(item.links.download, file);
  const payload = await (async () => JSON.parse(await fs.readFile(file, "utf8")))();
  const records = extractRecords(payload);
  if (!records.length) {
  throw new Error(`No card records found for language ${lang}`);
}
  let accepted = 0, missingIds = 0, duplicateVariants = 0, imageCount = 0;

  for (const record of records) {
    const normalized = normalize(record, lang);
    if (normalized.warning) {
      missingIds++;
      report.warnings.push({
        language: lang,
        reason: normalized.warning,
        sourceRecordId: normalized.sourceRecordId ?? null
      });
      continue;
    }
    const { canonical, variant, image } = normalized;
    
if (!cards.has(canonical.cardId)) {
  cards.set(canonical.cardId, canonical);
} else {
  const existing = cards.get(canonical.cardId);

  existing.names = {
    ...(existing.names || {}),
    ...canonical.names
  };

  existing.sourceRecordIds = {
  ...(existing.sourceRecordIds || {}),
  ...canonical.sourceRecordIds
};

  for (const key of ["cardType", "level", "playCost", "evolutionCost", "dp", "rarity"]) {
    if (existing[key] == null && canonical[key] != null) {
      existing[key] = canonical[key];
    }
  }

  existing.colors = [...new Set([
    ...(existing.colors || []),
    ...canonical.colors
  ])];
}
    if (variants.has(variant.variantId)) duplicateVariants++;
    else variants.set(variant.variantId, variant);
    if (image) {
  if (!images.has(image.imageId)) {
    images.set(image.imageId, image);
    imageCount++;
  }
}
accepted++;
}

  report.languages[lang] = {
    sourceName: item.attributes?.name ?? lang,
    sourceUpdatedAt: item.attributes?.["updated-at"] ?? null,
    downloadUrl: item.links.download,
    bytes,
    sourceRecords: records.length,
    accepted,
    missingCardNumbers: missingIds,
    duplicateVariantIds: duplicateVariants,
    imageUrlsFound: imageCount,
    sha256: await sha256File(file)
  };
  console.log(`${lang}: ${accepted}/${records.length} rows normalized`);
}

if (!Object.keys(report.languages).length) {
  throw new Error("No language bulk files were imported. Check the Heroicc bulk catalogue.");
}

const sorted = values => [...values].sort((a,b) => String(a.cardId).localeCompare(String(b.cardId)));
const cardList = sorted(cards.values());
const variantList = sorted(variants.values());
const imageList = sorted(images.values());

await writeJson(path.join(OUT, "cards.json"), cardList);
await writeJson(path.join(OUT, "variants.json"), variantList);
await writeJson(path.join(OUT, "images.json"), imageList);

const manifest = {
  schemaVersion: "2.0.0",
  generatedAt: new Date().toISOString(),
  source: "Heroicc bulk data",
  sourceDocs: "https://heroi.cc/docs/api",
  attribution: "Heroicc API; Digimon/Bandai card names and artwork remain their respective rights holders' property.",
  counts: { cards: cardList.length, variants: variantList.length, images: imageList.length },
  languages: Object.keys(report.languages),
  sourceFiles: report.languages,
  limitations: [
    "Region is unknown unless independently verified; language does not prove distribution region.",
    "Printing is classified using Heroicc parallel-id; physical release details are not independently verified.",
    "Images are source URLs only and may be absent for some records.",
    "Bulk data coverage is limited to languages exposed by the source catalogue."
  ]
};
await writeJson(path.join(OUT, "manifest.json"), manifest);
report.finishedAt = new Date().toISOString();
report.outputCounts = manifest.counts;
await writeJson(path.join(OUT, "reports", "import-report.json"), report);
console.log("Import complete:", manifest.counts);
console.log("Review v2/reports/import-report.json before committing.");
