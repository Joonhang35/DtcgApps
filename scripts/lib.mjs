import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const ROOT = process.cwd();
export const OUT = path.join(ROOT, "v2");
export const TMP = path.join(ROOT, ".tmp", "heroicc");

export async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}
export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}
export async function sha256File(file) {
  const data = await fs.readFile(file);
  return crypto.createHash("sha256").update(data).digest("hex");
}
export function first(...values) {
  return values.find(v => v !== undefined && v !== null && v !== "");
}
export function asString(v) {
  if (v === undefined || v === null) return null;
  return String(v).trim() || null;
}
export function asNumber(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
export function extractRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.cards)) return payload.cards;
  if (Array.isArray(payload?.results)) return payload.results;
  throw new Error("Unrecognized bulk-data shape: expected array or JSON:API data[]");
}
export function attrsOf(record) {
  return record?.attributes ?? record?.data?.attributes ?? record ?? {};
}
export function cardNumberOf(record, attrs) {
  // JSON:API record.id may be an opaque database key.
  // Accept printed card numbers and TOKEN records.
  const candidates = [
    attrs.card_number,
    attrs.cardNumber,
    attrs.cardnumber,
    attrs.number,
    attrs.id,
    record?.id
  ];

  for (const candidate of candidates) {
    const value = asString(candidate)?.toUpperCase();

    if (value && /^[A-Z0-9]+-[A-Z0-9]+$/.test(value)) {
      return value;
    }

    if (value === "TOKEN" || value?.endsWith("/TOKEN")) {
      return "TOKEN";
    }
  }

  return null;
}
export function imageUrlOf(attrs) {
  const candidates = [
    attrs.image_url, attrs.imageUrl, attrs.image,
    attrs.images?.large, attrs.images?.normal,
    attrs.image_urls?.large, attrs.image_urls?.normal,
    attrs.image?.url
  ];
  for (const candidate of candidates) {
    const value = typeof candidate === "string" ? candidate : candidate?.url;
    if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  }
  return null;
}
