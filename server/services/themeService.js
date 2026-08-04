const { CachedBook } = require("../schemas");
const { normalize, mapWithRateLimit } = require("../utils/textUtils");
const { fetchBook } = require("./googleBooksService");
const { requestGroq } = require("./groqRecommendationService");

const BOOKS_PER_THEME = 8;

function normalizeThemeName(theme) {
  return normalize(String(theme || "").trim());
}

function toCarouselItem(book) {
  return {
    title: book.title,
    author: (book.authors || [])[0] || "",
    bookid: book.googleId,
    cover: book.thumbnail || "",
    genre: (book.categories || [])[0] || "",
  };
}

async function findCachedBooksForTheme(theme) {
  const normalizedTheme = normalizeThemeName(theme);
  if (!normalizedTheme) return [];
  console.log(
    `Searching for cached books with normalized theme: "${normalizedTheme}"`,
  );
  return CachedBook.find({ normalizedThemes: normalizedTheme })
    .limit(BOOKS_PER_THEME)
    .lean();
}

async function tagBookWithTheme(googleId, theme) {
  const normalizedTheme = normalizeThemeName(theme);
  if (!googleId || !normalizedTheme) return;

  await CachedBook.findOneAndUpdate(
    { googleId },
    {
      $addToSet: {
        themes: theme,
        normalizedThemes: normalizedTheme,
      },
    },
  );
}

function buildPrompt(theme, description, excludeTitles = []) {
  const exclusionBlock =
    excludeTitles.length > 0
      ? `\n\nDo NOT recommend any of these titles (already shown to the user):\n${excludeTitles
          .map((t) => `- ${t}`)
          .join("\n")}`
      : "";

  return `You are a highly curated book recommendation engine. Recommend ${BOOKS_PER_THEME} books that strongly embody the following reading theme/trope.

Theme: ${theme}
Theme description: ${description || "No description provided."}${exclusionBlock}

Return ONLY valid JSON in this exact shape:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "whyRecommended": "Short explanation of how this book fits the theme"
  }
]

Requirements:
- Only return a JSON array.
- Do not include markdown fences.
- Keep titles and author names realistic and well-formed.
- Give exactly ${BOOKS_PER_THEME} recommendations.
- Prioritize well-known, findable books that clearly embody this theme.`;
}

async function fetchBooksForThemeFromGroq(
  theme,
  description,
  excludeTitles = [],
) {
  const prompt = buildPrompt(theme, description, excludeTitles);
  return requestGroq(prompt);
}

/**
 * @param {string} theme
 * @param {string} description
 * @param {object} [options]
 * @param {boolean} [options.forceRefresh] - if true, skips the cache-first
 *   lookup and asks Groq for a fresh batch, excluding titles already cached
 *   for this theme so the user actually sees new recommendations.
 */
async function getBooksByTheme(theme, description, options = {}) {
  const { forceRefresh = false } = options;

  if (!theme) return [];

  // Cache read is skipped entirely on refresh — otherwise we'd just hand
  // back the exact same cached set the user is trying to get away from
  if (!forceRefresh) {
    const cachedBooks = await findCachedBooksForTheme(theme);
    if (cachedBooks.length > 0) {
      console.log(
        `Found ${cachedBooks.length} cached book(s) for theme "${theme}"`,
      );
      return cachedBooks.map(toCarouselItem);
    }
  }

  // On refresh, pull existing cached titles for this theme so we can tell
  // Groq to avoid repeating them
  let excludeTitles = [];
  if (forceRefresh) {
    const existing = await findCachedBooksForTheme(theme);
    excludeTitles = existing.map((b) => b.title).filter(Boolean);
  }

  const parsed = await fetchBooksForThemeFromGroq(
    theme,
    description,
    excludeTitles,
  );

  if (parsed.length === 0) {
    console.warn(
      `No books resolved for theme "${theme}" after all retries/fallback`,
    );
    return [];
  }

  const fetchedBooks = await mapWithRateLimit(
    parsed,
    (item) => fetchBook(item.title, item.author),
    { concurrency: 2, delayMs: 300 },
  );

  const validBooks = fetchedBooks.filter((book) => book?.googleId);

  await Promise.all(
    validBooks.map((book) => tagBookWithTheme(book.googleId, theme)),
  );

  return validBooks.slice(0, BOOKS_PER_THEME).map(toCarouselItem);
}

module.exports = {
  getBooksByTheme,
  findCachedBooksForTheme,
  tagBookWithTheme,
};
