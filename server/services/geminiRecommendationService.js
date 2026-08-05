const mongoose = require("mongoose");
const { genAI } = require("../config/gemini");
const { geminiModel: GEMINI_MODEL } = require("../config/env");
const { UserBook, CachedBook } = require("../schemas");
const {
  normalize,
  stripEditionQualifiers,
  mapWithRateLimit,
} = require("../utils/textUtils");
const { fetchBook } = require("./googleBooksService");

function extractJsonArray(text) {
  if (!text) return [];

  const cleaned = String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    return JSON.parse(match[0]);
  }

  return JSON.parse(cleaned);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestGemini(prompt, attempt = 0) {
  try {
    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    return response;
  } catch (error) {
    if (error?.status === 429 && attempt < 2) {
      const delayMs = 2000 * (attempt + 1);
      await sleep(delayMs);
      return requestGemini(prompt, attempt + 1);
    }

    throw error;
  }
}

async function buildFallbackRecommendations() {
  try {
    const popularCollection = mongoose.connection.collection(
      "PopularBooksByMonth",
    );
    const books = await popularCollection.find({}).limit(5).toArray();

    return books.map((book) => ({
      title: book.title,
      author: book.author || "",
      genre: book.genre || "Popular",
      cover: book.cover || "",
      bookid: book.id || book.bookid || book.title,
      whyRecommended:
        "Fallback recommendation while the Gemini model is temporarily rate-limited.",
    }));
  } catch (fallbackError) {
    console.error("Fallback recommendation lookup failed:", fallbackError);
    return [];
  }
}

async function buildFallbackSingleBookRecommendations(seedBook) {
  if (!seedBook?.title) {
    return [];
  }

  try {
    const popularCollection = mongoose.connection.collection(
      "PopularBooksByMonth",
    );
    const books = await popularCollection.find({}).limit(5).toArray();

    return books
      .filter(
        (book) =>
          String(book.title || "").toLowerCase() !==
          String(seedBook.title || "").toLowerCase(),
      )
      .slice(0, 5)
      .map((book) => ({
        title: book.title,
        author: book.author || "",
        genre: book.genre || "Popular",
        cover: book.cover || "",
        bookid: book.id || book.bookid || book.title,
        whyRecommended:
          "Fallback recommendation while the Gemini model is temporarily rate-limited.",
      }));
  } catch (fallbackError) {
    console.error(
      "Fallback single-book recommendation lookup failed:",
      fallbackError,
    );
    return [];
  }
}

function sortBooksReadMostRecent(booksRead) {
  return [...(booksRead || [])].sort(
    (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0),
  );
}

async function findCachedBookForSingleBookRecommendations(book) {
  if (!book?.title) {
    return null;
  }

  const googleId = book?.googleId || book?.bookid || book?.id;
  if (googleId) {
    const byGoogleId = await CachedBook.findOne({ googleId }).lean();
    if (byGoogleId) {
      console.log(
        "Found cached book for single-book recommendations by Google ID:",
        googleId,
      );
      return byGoogleId;
    }
  }

  const strippedTitle = stripEditionQualifiers(book.title);
  const normalizedTitle = normalize(strippedTitle);
  const normalizedAuthor = normalize(book.author);

  const canonicalQuery = {
    normalizedTitle,
  };

  if (normalizedAuthor) {
    canonicalQuery.normalizedAuthors = {
      $in: [normalizedAuthor],
    };
  }

  return CachedBook.findOne(canonicalQuery).lean();
}

async function storeRecommendationsForUser(userId, recommendations) {
  if (!userId) return;

  await UserBook.findOneAndUpdate(
    { user_id: userId },
    {
      $set: {
        recommendations: recommendations.map((item) => ({
          title: item.title,
          author: item.author || "",
          genre: item.genre || "Recommended",
          whyRecommended: item.whyRecommended || "",
          cover: item.cover || "",
          bookid: item.bookid || "",
          updated_at: new Date(),
        })),
      },
    },
    { new: true, upsert: true },
  );
}

async function buildGeminiRecommendationPayload(booksRead) {
  if (!Array.isArray(booksRead) || booksRead.length === 0) {
    return [];
  }

  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  const recentBooksRead = sortBooksReadMostRecent(booksRead).slice(0, 5);

  const libraryPrompt = recentBooksRead
    .map((book, index) => {
      const title = String(book.title || "").trim();
      const author = String(book.author || "").trim();
      return `${index + 1}. ${title}${author ? ` by ${author}` : ""}`;
    })
    .join("\n");

  const prompt = `You are a highly curated book recommendation engine. Based only on the user's library history below, recommend 5 books they are likely to enjoy next.

Return ONLY valid JSON in this exact shape:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "whyRecommended": "Short explanation"
  }
]

User library history:
${libraryPrompt}

Requirements:
- Only return a JSON array.
- Do not include markdown fences.
- Keep titles and author names realistic and well-formed.
- Keep suggestions varied, but still aligned with the user's past reading patterns.`;

  let response;
  try {
    response = await requestGemini(prompt);
  } catch (error) {
    if (error?.response?.status === 429) {
      return buildFallbackRecommendations();
    }

    throw error;
  }

  const contentText =
    response?.text ||
    response?.output_text ||
    response?.candidates?.[0]?.content ||
    "";

  const parsed = extractJsonArray(contentText);

  const fetchedBooks = await mapWithRateLimit(
    parsed,
    (item) => fetchBook(item.title, item.author),
    { concurrency: 2, delayMs: 300 }, // tune these two numbers to taste
  );

  const recommendations = parsed
    .map((item, i) => {
      const recommendationBook = fetchedBooks[i];
      if (!recommendationBook?.googleId) return null;

      return {
        title: item.title,
        author: item.author || "",
        genre: item.genre || recommendationBook?.genre || "Recommended",
        cover: recommendationBook?.thumbnail || recommendationBook?.cover || "",
        bookid: recommendationBook.googleId,
        whyRecommended: item.whyRecommended || "",
      };
    })
    .filter(Boolean)
    .slice(0, 5);
  return recommendations;
}

async function buildGeminiSingleBookRecommendations(book) {
  if (!book?.title) {
    return [];
  }

  const cachedBook = await findCachedBookForSingleBookRecommendations(book);

  if (Array.isArray(cachedBook?.moreLikeThisRecommendations)) {
    const existingRecommendations =
      cachedBook.moreLikeThisRecommendations.filter((item) => item?.title);

    if (existingRecommendations.length > 0) {
      return existingRecommendations;
    }
  }

  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  const seedTitle = String(book.title || "").trim();
  const seedAuthor = String(book.author || "").trim();
  const seedDescription = String(book.description || "").trim();
  const seedCategories = Array.isArray(book.categories)
    ? book.categories.join(", ")
    : String(book.genre || "").trim();

  const prompt = `You are a highly curated book recommendation engine. Based on the single book below, recommend at least 5 books that are similar in tone, theme, audience, or genre.

Return ONLY valid JSON in this exact shape:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre",
    "whyRecommended": "Short explanation"
  }
]

Seed book:
Title: ${seedTitle}
Author: ${seedAuthor || "Unknown author"}
Description: ${seedDescription || "No description available."}
Categories: ${seedCategories || "No categories available."}

Requirements:
- Only return a JSON array.
- Do not include markdown fences.
- Keep titles and author names realistic and well-formed.
- Give minimum 5 recommendations.
- Keep the suggestions strongly aligned with the seed book's style, themes, and reading mood.`;

  let response;
  try {
    response = await requestGemini(prompt);
  } catch (error) {
    if (error?.response?.status === 429) {
      const fallbackRecommendations =
        await buildFallbackSingleBookRecommendations(book);

      if (cachedBook?._id) {
        await CachedBook.findOneAndUpdate(
          { _id: cachedBook._id },
          {
            $set: {
              moreLikeThisRecommendations: fallbackRecommendations.map(
                (item) => ({
                  title: item.title,
                  author: item.author || "",
                  genre: item.genre || "Recommended",
                  whyRecommended: item.whyRecommended || "",
                  cover: item.cover || "",
                  bookid: item.bookid || "",
                  updated_at: new Date(),
                }),
              ),
              moreLikeThisRecommendationsCachedAt: new Date(),
            },
          },
        );
      }

      return fallbackRecommendations;
    }

    throw error;
  }

  const contentText =
    response?.text ||
    response?.output_text ||
    response?.candidates?.[0]?.content ||
    "";

  const parsed = extractJsonArray(contentText);

  const fetchedBooks = await mapWithRateLimit(
    parsed,
    (item) => fetchBook(item.title, item.author),
    { concurrency: 2, delayMs: 300 }, // tune these two numbers to taste
  );

  const recommendations = parsed
    .map((item, i) => {
      const recommendationBook = fetchedBooks[i];
      if (!recommendationBook?.googleId) return null;

      return {
        title: item.title,
        author: item.author || "",
        genre: item.genre || recommendationBook?.genre || "Recommended",
        cover: recommendationBook?.thumbnail || recommendationBook?.cover || "",
        bookid: recommendationBook.googleId,
        whyRecommended: item.whyRecommended || "",
      };
    })
    .filter(Boolean)
    .slice(0, 5);

  if (cachedBook?._id) {
    await CachedBook.findOneAndUpdate(
      { _id: cachedBook._id },
      {
        $set: {
          moreLikeThisRecommendations: recommendations.map((item) => ({
            title: item.title,
            author: item.author || "",
            genre: item.genre || "Recommended",
            whyRecommended: item.whyRecommended || "",
            cover: item.cover || "",
            bookid: item.bookid || "",
            updated_at: new Date(),
          })),
          moreLikeThisRecommendationsCachedAt: new Date(),
        },
      },
    );
  }

  return recommendations;
}

async function refreshUserRecommendationsForUser(userId) {
  const userBooks = await UserBook.findOne({ user_id: userId });
  const booksRead = sortBooksReadMostRecent(userBooks?.books_read || []).slice(
    0,
    5,
  );

  if (!booksRead.length) {
    await storeRecommendationsForUser(userId, []);
    return [];
  }

  const recommendations = await buildGeminiRecommendationPayload(booksRead);
  await storeRecommendationsForUser(userId, recommendations);
  return recommendations;
}

module.exports = {
  extractJsonArray,
  sleep,
  requestGemini,
  buildFallbackRecommendations,
  buildFallbackSingleBookRecommendations,
  findCachedBookForSingleBookRecommendations,
  sortBooksReadMostRecent,
  storeRecommendationsForUser,
  buildGeminiRecommendationPayload,
  buildGeminiSingleBookRecommendations,
  refreshUserRecommendationsForUser,
};
