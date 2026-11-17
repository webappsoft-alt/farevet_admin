// Helpers for reading the logged-in admin's session safely.
// A malformed value here used to throw during render and blank the whole app.

const STORAGE_KEY = "login_farevet_formData";

/** Returns the stored admin object, or {} if missing/corrupt. */
export function getStoredAdmin() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return {};
    // Some login responses wrap the record (e.g. { result, data: {...} } or data: [{...}])
    if (!parsed.admin_type && parsed.data) {
      const inner = Array.isArray(parsed.data) ? parsed.data[0] : parsed.data;
      if (inner && typeof inner === "object") return { ...parsed, ...inner };
    }
    return parsed;
  } catch (err) {
    console.error("[adminSession] Could not read stored admin data:", err);
    return {};
  }
}

/**
 * Normalizes a sub-admin's `pages` permission value into an array of labels.
 * Accepts: an array, a JSON string ('["Dashboard"]'), a double-encoded JSON
 * string, a comma-separated string, or null/""/"undefined"/"null".
 */
export function parsePermittedPages(pages) {
  if (Array.isArray(pages)) return pages.map((p) => String(p).trim()).filter(Boolean);
  if (pages == null) return [];

  const str = String(pages).trim();
  if (!str || str === "undefined" || str === "null") return [];

  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed) || typeof parsed === "string") {
      return parsePermittedPages(parsed);
    }
    return [];
  } catch {
    // Not JSON: treat as comma-separated list
    return str.split(",").map((p) => p.replace(/[[\]"']/g, "").trim()).filter(Boolean);
  }
}
