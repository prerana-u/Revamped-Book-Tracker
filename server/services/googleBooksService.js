const axios = require("axios");
const { CachedBook } = require("../schemas");
const { googleBooksApiKey: apiKey } = require("../config/env");
const {
  normalizeWhitespace,
  escapeRegex,
  normalize,
  normalizeThumbnailUrl,
} = require("../utils/textUtils");
const { isMatch } = require("../utils/bookMatching");

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

// Import required for stripEditionQualifiers used below
const { stripEditionQualifiers } = require("../utils/textUtils");

async function fetchBook(title, author) {
  // First, try to find it in the local DB
  console.log(
    "Searching for book in cache with title:",
    title,
    "and author:",
    author,
  );
  const strippedTitle = stripEditionQualifiers(title);
  const cleanedTitle = normalizeWhitespace(strippedTitle);
  const cleanedAuthor = normalizeWhitespace(author);
  const normalizedTitle = normalize(strippedTitle);
  const normalizedAuthor = normalize(author);
  console.log(
    "Cleaned title:",
    cleanedTitle,
    "stripped title:",
    strippedTitle,
    title,
    'normalized title:"',
    normalizedTitle,
  );
  const legacyQuery = {
    title: new RegExp(`^${escapeRegex(cleanedTitle)}`, "i"),
  };

  if (cleanedAuthor) {
    // Handle flexible spacing and dots in author names (e.g., "J. R." vs "J.R." vs "J R")
    let authorPattern;

    if (/^[A-Za-z]{2,}$/.test(cleanedAuthor.replace(/\./g, ""))) {
      // "EL", "JR", "JRR"
      authorPattern =
        cleanedAuthor.replace(/\./g, "").split("").join("\\.?\\s*") + "\\.?";
    } else {
      // "E L", "J. R.", "George R. R."
      authorPattern =
        cleanedAuthor
          .split(/\s+/)
          .map((part) =>
            part.replace(/\./g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          )
          .join("\\.?\\s*") + "\\.?";
    }
    legacyQuery.authors = {
      $elemMatch: {
        $regex: authorPattern,
        $options: "i",
      },
    };
  }

  const normalizedQuery = {
    normalizedTitle,
  };
  if (cleanedAuthor) {
    normalizedQuery.normalizedAuthors = {
      $in: [normalizedAuthor],
    };
  }
  console.log(
    "Querying cache with:",
    normalizedAuthor,
    normalizedQuery,
    legacyQuery,
  );
  const existingBook = await CachedBook.findOne(
    cleanedAuthor
      ? { $or: [normalizedQuery, legacyQuery] }
      : { $or: [normalizedQuery, legacyQuery] },
  );

  if (existingBook) {
    console.log(title, "Found From Cache");
    existingBook.thumbnail = normalizeThumbnailUrl(existingBook.thumbnail);
    return existingBook;
  }

  // Fetch from Google Books

  let query = `intitle:"${cleanedTitle}"`;

  if (cleanedAuthor) query += `+inauthor:"${cleanedAuthor}"`;

  const response = await axios.get(
    `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(
      query,
    )}&langRestrict=en&printType=books&maxResults=5&key=${apiKey}`,
  );

  const items = response.data.items || [];

  const validItems = items.filter(
    (item) =>
      item.volumeInfo?.description && item.volumeInfo?.language === "en",
  );
  // Find the best match from the results
  const bestMatch = validItems.find((item) =>
    isMatch(item.volumeInfo, title, author),
  );
  if (!bestMatch) return null;

  const info = bestMatch.volumeInfo;

  // Prepare data
  const bookData = {
    googleId: bestMatch.id,
    title: info.title,
    normalizedTitle: normalize(info.title),
    authors: info.authors || [],
    normalizedAuthors: (info.authors || []).map(normalize),
    description: info.description || "",
    thumbnail: normalizeThumbnailUrl(info.imageLinks?.thumbnail || ""),
    publishedDate: info.publishedDate || "",
    pageCount: info.pageCount || 0,
    publisher: info.publisher || "",
    averageRating: info.averageRating || 0,
  };

  // Save with upsert
  const savedBook = await CachedBook.findOneAndUpdate(
    { googleId: bestMatch.id },
    { $set: bookData },
    { new: true, upsert: true, setDefaultsOnInsert: true, strict: false },
  );
  console.log(info.title, " Saved to DB");
  return savedBook;
}

// Fetch a book by its Google Books volume id. If cached, return cached entry; otherwise fetch from Google and upsert.
async function fetchBookByGoogleId(googleId) {
  if (!googleId) return null;

  // Try cache first
  const existing = await CachedBook.findOne({ googleId });
  if (existing) {
    const hasPublishedDate = !!existing.publishedDate;
    const hasPageCount =
      Number.isInteger(existing.pageCount) && existing.pageCount > 0;
    const hasLanguage =
      !!existing._doc.language && existing._doc.language !== "unknown";

    if (hasPublishedDate && hasPageCount && hasLanguage) {
      console.log(googleId, "Found From Cache");
      existing.thumbnail = normalizeThumbnailUrl(existing.thumbnail);
      return existing;
    }

    console.log(
      googleId,
      `Found From Cache but missing publishedDate:${hasPublishedDate} or pageCount:${hasPageCount} or language:${hasLanguage}, fetching from Google Books`,
    );
  }

  try {
    const response = await axios.get(
      `${GOOGLE_BOOKS_API}/${encodeURIComponent(googleId)}?key=${apiKey}`,
    );

    const item = response.data;
    if (!item || !item.volumeInfo) return null;
    const info = item.volumeInfo;
    const searchInfo = item?.searchInfo || {};
    if (searchInfo.textSnippet && !info.description) {
      info.description = searchInfo.textSnippet;
    }
    const bookData = {
      googleId: item.id || googleId,
      title: info.title || "",
      authors: info.authors || [],
      description: info.description || "",
      thumbnail: normalizeThumbnailUrl(
        info.imageLinks?.large || info.imageLinks?.thumbnail || "",
      ),
      publishedDate: info.publishedDate || "",
      pageCount: info.pageCount || 0,
      publisher: info.publisher || "",
      averageRating: info.averageRating || 0,
      textSnippet: searchInfo.textSnippet || "",
      isbn10:
        (info.industryIdentifiers || []).find((id) => id.type === "ISBN_10")
          ?.identifier || "",
      isbn13:
        (info.industryIdentifiers || []).find((id) => id.type === "ISBN_13")
          ?.identifier || "",
      categories: info.categories || [],
      language: info.language || "",
    };

    // Delete duplicates with same title and first author but different googleId
    if (bookData.title && bookData.authors.length > 0) {
      const firstAuthor = bookData.authors[0];
      const duplicates = await CachedBook.deleteMany({
        title: new RegExp(
          `^${bookData.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
        authors: {
          $elemMatch: {
            $regex: firstAuthor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        },
        googleId: { $ne: bookData.googleId },
      });
      if (duplicates.deletedCount > 0) {
        console.log(
          `Deleted ${duplicates.deletedCount} duplicate(s) for "${bookData.title}"`,
        );
      }
    }

    const savedBook = await CachedBook.findOneAndUpdate(
      { googleId: bookData.googleId },
      { $set: bookData },
      { new: true, upsert: true, setDefaultsOnInsert: true, strict: false },
    );
    console.log(info.title, " Saved to DB");
    return savedBook;
  } catch (err) {
    console.error(
      "Error fetching from Google Books by id:",
      err.message || err,
    );
    return null;
  }
}

async function refreshBookCover(googleId) {
  const existing = await CachedBook.findOne({ googleId });
  const response = await axios.get(
    `${GOOGLE_BOOKS_API}/${encodeURIComponent(googleId)}?key=${apiKey}`,
  );

  console.log(
    response.data.volumeInfo?.imageLinks?.large !== existing.thumbnail,
    response.data.volumeInfo?.imageLinks?.large,
    existing.thumbnail,
    "new vs existing thumbnail",
  );

  const newThumbnail = normalizeThumbnailUrl(
    response.data.volumeInfo?.imageLinks?.large ||
      response.data.volumeInfo?.imageLinks?.thumbnail,
  );

  if (
    newThumbnail &&
    newThumbnail !== normalizeThumbnailUrl(existing.thumbnail)
  ) {
    existing.thumbnail = newThumbnail;
    await existing.save();
    console.log(`Updated cover for ${existing.title}`);
  }
}

module.exports = {
  GOOGLE_BOOKS_API,
  fetchBook,
  fetchBookByGoogleId,
  refreshBookCover,
};
