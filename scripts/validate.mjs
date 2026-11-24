import path from "node:path";
import { OUT, readJson, writeJson } from "./lib.mjs";

const cards = await readJson(path.join(OUT, "cards.json"));
const variants = await readJson(path.join(OUT, "variants.json"));
const images = await readJson(path.join(OUT, "images.json"));
const manifest = await readJson(path.join(OUT, "manifest.json"));
const errors = [];
const warnings = [];
const cardIds = new Set();
const variantIds = new Set();
const cardMap = new Map();

if (!Array.isArray(cards) || !Array.isArray(variants) || !Array.isArray(images)) {
  throw new Error("cards.json, variants.json and images.json must all be arrays");
}
for (const card of cards) {
  if (!card.cardId) errors.push("Card missing cardId");
  else if (cardIds.has(card.cardId)) errors.push(`Duplicate canonical cardId: ${card.cardId}`);
  else cardIds.add(card.cardId);
  if (
  !card.names ||
  typeof card.names !== "object" ||
  Object.keys(card.names).length === 0 ||
  !Object.values(card.names).some(name => typeof name === "string" && name.trim())
) {
  errors.push(`Card ${card.cardId ?? "(unknown)"} missing names`);
}
  if (!card.source) errors.push(`Card ${card.cardId ?? "(unknown)"} missing source`);
  if (
  !card.sourceRecordIds ||
  typeof card.sourceRecordIds !== "object" ||
  Object.keys(card.sourceRecordIds).length === 0 ||
  !Object.values(card.sourceRecordIds).every(
    id => typeof id === "string" && id.trim()
  )
) {
  errors.push(`Card ${card.cardId ?? "(unknown)"} missing or invalid sourceRecordIds`);
}
  if (card.cardId) cardMap.set(card.cardId, card);
}
let unverifiedRegionCount = 0;
for (const variant of variants) {
  if (!variant.variantId) errors.push(`Variant for ${variant.cardId ?? "(unknown)"} missing variantId`);
  else if (variantIds.has(variant.variantId)) errors.push(`Duplicate variantId: ${variant.variantId}`);
  else variantIds.add(variant.variantId);
  if (!cardIds.has(variant.cardId)) errors.push(`Orphan variant ${variant.variantId}: card ${variant.cardId} not found`);
  if (!variant.language) errors.push(`Variant ${variant.variantId} missing language`);
  if (!variant.region || variant.region === "unknown") unverifiedRegionCount++;
  if (!variant.printing || variant.printing === "unspecified") warnings.push(`Unverified printing for ${variant.variantId}`);
}
if (unverifiedRegionCount > 0) {
  warnings.push(`${unverifiedRegionCount} variants have unverified region`);
}
for (const image of images) {
  if (!cardIds.has(image.cardId)) errors.push(`Orphan image ${image.imageId}: card ${image.cardId} not found`);
  if (!/^https?:\/\//i.test(image.url || "")) errors.push(`Invalid image URL for ${image.imageId}`);
  if (image.variantId && !variantIds.has(image.variantId)) errors.push(`Image ${image.imageId} references missing variant ${image.variantId}`);
}
if (manifest.counts?.cards !== cards.length) errors.push("Manifest card count does not match cards.json");
if (manifest.counts?.variants !== variants.length) errors.push("Manifest variant count does not match variants.json");
if (manifest.counts?.images !== images.length) errors.push("Manifest image count does not match images.json");

const report = {
  checkedAt: new Date().toISOString(),
  status: errors.length ? "failed" : "passed-with-warnings",
  counts: { cards: cards.length, variants: variants.length, images: images.length },
  errorCount: errors.length,
  warningCount: warnings.length,
  errors,
  warnings: warnings.slice(0, 500)
};
await writeJson(path.join(OUT, "reports", "validation-report.json"), report);
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
