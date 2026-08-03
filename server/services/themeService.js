const { CachedBook } = require("../schemas");
const { normalize, mapWithRateLimit } = require("../utils/textUtils");
const { fetchBook } = require("./googleBooksService");

// Reuse the Gemini request/parsing helpers already built for recommendations
const {
  requestGemini,
  extractJsonArray,
} = require("./geminiRecommendationService");

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

  return CachedBook.find({ normalizedThemes: normalizedTheme })
    .limit(BOOKS_PER_THEME)
    .lean();
}

async function tagBookWithTheme(googleId, theme) {
  const normalizedTheme = normalizeThemeName(theme);
  if (!googleId || !normalizedTheme) return;

  // $addToSet avoids duplicate entries if the same book gets matched
  // to the same theme again later
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

async function fetchBooksForThemeFromGemini(theme, description) {
  const prompt = `You are a highly curated book recommendation engine. Recommend ${BOOKS_PER_THEME} books that strongly embody the following reading theme/trope.

Theme: ${theme}
Theme description: ${description || "No description provided."}

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

  const response = await requestGemini(prompt);

  const contentText =
    response?.text ||
    response?.output_text ||
    response?.candidates?.[0]?.content ||
    "";

  return extractJsonArray(contentText);
}

async function getBooksByTheme(theme, description) {
  if (!theme) return [];

  // 1. Try the DB first
  const cachedBooks = await findCachedBooksForTheme(theme);
  if (cachedBooks.length > 0) {
    console.log(
      `Found ${cachedBooks.length} cached book(s) for theme "${theme}"`,
    );
    return cachedBooks.map(toCarouselItem);
  }

  // 2. Cache miss -> ask Gemini for candidates
  const parsed = await fetchBooksForThemeFromGemini(theme, description);

  // 3. Resolve each candidate against Google Books / local cache,
  //    throttled to avoid 503s (see mapWithRateLimit)
  const fetchedBooks = await mapWithRateLimit(
    parsed,
    (item) => fetchBook(item.title, item.author),
    { concurrency: 2, delayMs: 300 },
  );

  const validBooks = fetchedBooks.filter((book) => book?.googleId);

  // 4. Tag every resolved book with this theme so future lookups hit the DB
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
