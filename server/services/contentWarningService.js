const { CachedBook } = require("../schemas");
const { requestGroq } = require("./groqRecommendationService");

/**
 * Builds the prompt sent to the model. Keeps warnings short and
 * spoiler-safe since these render directly to users deciding whether
 * to read the book — not a full plot breakdown.
 */
function buildPrompt({ title, author, description }) {
  return `You are a content warning assistant for a book discovery app. Given the book below, identify content warnings a sensitive reader would want to know about before reading.

Title: ${title}
Author: ${author}
Description: ${description || "No description provided."}

Return ONLY valid JSON in this exact shape:
[
  {
    "category": "Short category name (e.g. Violence, Sexual Content, Self-Harm, Substance Abuse, Death, Abuse, Mental Health)",
    "severity": "mild" | "moderate" | "severe",
    "description": "One short sentence describing the warning, without major spoilers"
  }
]

Requirements:
- Only return a JSON array. No markdown fences, no extra text.
- Base warnings on the book's known content/themes — do not invent warnings that don't fit the book.
- If the book is genuinely light/clean with nothing notable, return an empty array: []
- Keep each description to one sentence, spoiler-safe (no plot twists or endings).
- Do not exceed 8 warnings — prioritize the most relevant ones if there are many.`;
}

/**
 * Checks the cache for previously-generated warnings for this book.
 * Returns null if never generated (vs. [] which means "generated, no warnings found").
 */
async function findCachedWarnings(googleId) {
  if (!googleId) return null;

  const cached = await CachedBook.findOne({ googleId })
    .select("contentWarnings")
    .lean();

  return cached?.contentWarnings ?? null;
}

/**
 * Persists generated warnings against the book so future lookups hit cache.
 * Uses upsert in case the book isn't in CachedBook yet (e.g. warnings requested
 * before the book was ever pulled through the themes/recommendation flow).
 */
async function cacheWarnings(googleId, warnings) {
  if (!googleId) return;

  await CachedBook.findOneAndUpdate(
    { googleId },
    { $set: { contentWarnings: warnings } },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

/**
 * @param {object} book
 * @param {string} book.googleId
 * @param {string} book.title
 * @param {string} book.author
 * @param {string} [book.description]
 * @param {object} [options]
 * @param {boolean} [options.forceRefresh] - skip cache and regenerate
 * @returns {Promise<Array<{category: string, severity: string, description: string}>>}
 */
async function getContentWarnings(book, options = {}) {
  const { googleId, title, author, description } = book || {};
  const { forceRefresh = false } = options;

  if (!title || !author) {
    console.warn("getContentWarnings called without title/author — skipping");
    return [];
  }

  if (!forceRefresh) {
    const cached = await findCachedWarnings(googleId);
    if (cached !== null) {
      console.log(`Found cached content warnings for "${title}"`);
      return cached;
    }
  }

  const prompt = buildPrompt({ title, author, description });
  const warnings = await requestGroq(prompt);

  // requestGroq already handles retry + fallback model internally and
  // returns [] if every attempt failed to parse — treat that as "unknown",
  // not "confirmed no warnings", so we don't cache a false negative
  if (warnings.length === 0) {
    console.warn(`No content warnings resolved for "${title}" — not caching`);
    return [];
  }

  await cacheWarnings(googleId, warnings);

  return warnings;
}

module.exports = {
  getContentWarnings,
  findCachedWarnings,
  cacheWarnings,
};
