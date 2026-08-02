function normalize(str) {
  return String(str || "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/gi, "")
    .trim();
}

function normalizeWhitespace(str) {
  return String(str || "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripEditionQualifiers(title) {
  // Remove any parenthetical content from the end (e.g., "(Movie Tie-In)", "(Hardcover)", etc.)
  let cleaned = String(title || "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .trim();

  // Remove content after colon if it contains qualifier keywords
  // (e.g., ": Reese's Book Club", ": Deluxe Edition", ": Special Edition")
  const colonIndex = cleaned.indexOf(":");
  if (colonIndex !== -1) {
    const afterColon = cleaned.substring(colonIndex + 1).toLowerCase();
    if (
      afterColon.includes("book club") ||
      afterColon.includes("edition") ||
      afterColon.includes("tie-in") ||
      afterColon.includes("special") ||
      afterColon.includes("deluxe") ||
      afterColon.includes("anniversary")
    ) {
      cleaned = cleaned.substring(0, colonIndex).trim();
    }
  }

  return cleaned;
}

function normalizeThumbnailUrl(url) {
  if (!url || typeof url !== "string") return "";
  return url.replace(/^http:/i, "https:");
}

module.exports = {
  normalize,
  normalizeWhitespace,
  escapeRegex,
  stripEditionQualifiers,
  normalizeThumbnailUrl,
};
