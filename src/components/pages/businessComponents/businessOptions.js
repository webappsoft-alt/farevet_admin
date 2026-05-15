/* Shared filter / form options for Business profiles.
   Keep listing + create + update screens aligned by importing from here. */

export const CERTIFICATION_OPTIONS = [
  "AAHA Accredited",
  "Fear Free Certified",
  "Cat Friendly Practice (AAFP)",
  "Board Certified Specialist",
  "Emergency & Critical Care",
  "Low Cost / Non-Profit",
  "Exotic Animal Practice",
  "USDA Accredited",
  "Veterinary Teaching Hospital",
];

export const CLINIC_TYPE_OPTIONS = [
  "General Practice",
  "Emergency",
  "Specialty",
  "Mobile",
];

export const OWNERSHIP_OPTIONS = ["Corporate", "Independent"];

/** Stored under `trust_tags` as a single string (one of these exact values). */
export const TRUST_TAG_OPTIONS = [
  "Claimed by Clinic",
  "Verified by FareVet",
  "Based on User Bills",
];

/**
 * Try to JSON.parse a string. Returns the parsed value or `undefined`.
 * Handles values that were double-escaped before storage (e.g. \\" → ").
 */
function tryJsonParse(str) {
  if (typeof str !== "string") return undefined;
  const s = str.trim();
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    /* try one more pass after un-escaping */
  }
  try {
    return JSON.parse(s.replace(/\\"/g, '"'));
  } catch {
    return undefined;
  }
}

/**
 * Recursively unwrap a value that may have been JSON.stringify'd multiple times.
 * Stops when we reach an array, an object, or a plain (non-JSON) string.
 */
function deepDecode(value, depth = 0) {
  if (value == null || depth > 6) return value;
  if (Array.isArray(value)) {
    return value.map((v) => deepDecode(v, depth + 1));
  }
  if (typeof value !== "string") return value;
  const s = value.trim();
  if (!s) return s;
  if (s.startsWith("[") || s.startsWith("{") || s.startsWith('"')) {
    const parsed = tryJsonParse(s);
    if (parsed !== undefined && parsed !== s) {
      return deepDecode(parsed, depth + 1);
    }
  }
  return s;
}

/**
 * Strip junk characters (stray brackets, quotes, backslashes) that survive
 * partial JSON decoding of historically over-stringified values.
 */
function cleanItem(str) {
  if (typeof str !== "string") return "";
  let s = str.trim();
  // Repeatedly trim leading/trailing brackets, quotes, and backslashes.
  let prev;
  do {
    prev = s;
    s = s.replace(/^[\s\\"'[\]]+/, "").replace(/[\s\\"'[\]]+$/, "");
  } while (s !== prev);
  return s.trim();
}

/**
 * Deduplicate while preserving order.
 */
function uniq(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/**
 * Parse a value that may be JSON (possibly nested-stringified), CSV, or already
 * an array, into a clean string[]. Used to read `certifications` (and similar
 * list-like columns) from server rows reliably, including badly corrupted
 * historical data with multiple layers of stringify/escape.
 */
export function parseStringList(value) {
  if (value == null || value === "") return [];
  const decoded = deepDecode(value);
  let raw = [];
  if (Array.isArray(decoded)) {
    raw = decoded.map((x) =>
      typeof x === "string" ? x : x == null ? "" : String(x),
    );
  } else if (typeof decoded === "string") {
    const s = decoded.trim();
    if (!s) return [];
    raw = s.split(",");
  }
  const cleaned = raw.map(cleanItem).filter(Boolean);
  return uniq(cleaned);
}

/** First matching trust tag from API (JSON array, CSV, or plain string). */
export function pickTrustTagValue(raw) {
  if (raw == null || raw === "") return undefined;
  const s = String(raw).trim();
  if (TRUST_TAG_OPTIONS.includes(s)) return s;
  const list = parseStringList(raw);
  return list.find((t) => TRUST_TAG_OPTIONS.includes(t));
}
