const mongoose = require("mongoose");
const { UserBook } = require("../schemas");
const {
  sortBooksReadMostRecent,
  buildGeminiRecommendationPayload,
  storeRecommendationsForUser,
} = require("../services/geminiRecommendationService");

const getUserBookLists = async (req, res) => {
  const { userId } = req.params;
  const cleanUserId = String(userId).trim();
  try {
    const userBooks = await UserBook.findOne({ user_id: cleanUserId });
    if (!userBooks) {
      return res.status(404).json({
        error: "No book lists found for this user",
      });
    }

    res.json({
      message: "User book lists retrieved successfully",
      data: {
        currently_reading: userBooks.currently_reading,
        want_to_read: userBooks.want_to_read,
        books_read: userBooks.books_read || [],
      },
    });
  } catch (err) {
    console.error("Failed to fetch user books:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch user books", details: err.message });
  }
};

const addBookToUserShelf = async (req, res) => {
  const { shelf, book } = req.body;
  const allowedShelves = ["want_to_read", "currently_reading", "books_read"];

  if (!shelf || !allowedShelves.includes(shelf)) {
    return res.status(400).json({
      error:
        "Invalid shelf. Use want_to_read, currently_reading, or books_read.",
    });
  }

  if (!book || !book.id || !book.title) {
    return res.status(400).json({
      error: "Book data is required and must include id and title.",
    });
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const normalizedRating = Number(book.rating);
  const shelfEntry = {
    title: book.title,
    author: book.author || "",
    id: book.id,
    bookid: book.bookid || book.id,
    updated_at: new Date(),
    ...(shelf === "books_read" && Number.isFinite(normalizedRating)
      ? { rating: normalizedRating }
      : {}),
    ...(shelf === "currently_reading" && Number.isFinite(book.page_count)
      ? { page_count: book.page_count }
      : {}),
    ...(shelf === "currently_reading" && Number.isFinite(book.current_page)
      ? { current_page: book.current_page }
      : {}),
  };

  try {
    await UserBook.findOneAndUpdate(
      { user_id: userId },
      {
        $setOnInsert: {
          user_id: userId,
          currently_reading: [],
          want_to_read: [],
          books_read: [],
        },
      },
      {
        upsert: true,
      },
    );

    const existingUserBooks = await UserBook.findOne({ user_id: userId });
    const existingReadEntry = existingUserBooks?.books_read?.find(
      (entry) => entry.id === book.id,
    );

    if (shelf === "books_read" && existingReadEntry) {
      const updated = await UserBook.findOneAndUpdate(
        { user_id: userId, "books_read.id": book.id },
        {
          $set: {
            "books_read.$.title": shelfEntry.title,
            "books_read.$.author": shelfEntry.author,
            "books_read.$.bookid": shelfEntry.bookid,
            "books_read.$.updated_at": shelfEntry.updated_at,
            "books_read.$.rating": shelfEntry.rating,
          },
        },
        {
          new: true,
        },
      );

      return res.json({
        message: "Book rating updated on shelf",
        data: updated,
      });
    }

    await UserBook.updateOne(
      { user_id: userId },
      {
        $pull: {
          want_to_read: { id: book.id },
          currently_reading: { id: book.id },
          books_read: { id: book.id },
        },
      },
    );

    const updated = await UserBook.findOneAndUpdate(
      { user_id: userId },
      {
        $push: {
          [shelf]: shelfEntry,
        },
      },
      {
        new: true,
      },
    );

    if (shelf === "books_read") {
      const refreshedUserBooks = await UserBook.findOne({ user_id: userId });
      const recentBooksRead = sortBooksReadMostRecent(
        refreshedUserBooks?.books_read || [],
      ).slice(0, 5);
      const recommendations =
        await buildGeminiRecommendationPayload(recentBooksRead);
      await storeRecommendationsForUser(userId, recommendations);
    }

    res.json({ message: "Book added to shelf", data: updated });
  } catch (err) {
    console.error("Failed to add book to shelf:", err);
    res
      .status(500)
      .json({ error: "Failed to add book to shelf", details: err.message });
  }
};

/**
 * Removes a book from whichever shelf it's currently on for the
 * authenticated user. Expects `bookId` as a route param.
 * Returns 404 if the book isn't found on any of the user's shelves.
 */
const removeBookFromUserShelf = async (req, res) => {
  const { bookId } = req.params;

  if (!bookId) {
    return res.status(400).json({ error: "bookId is required." });
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const existingUserBooks = await UserBook.findOne({ user_id: userId });

    if (!existingUserBooks) {
      return res.status(404).json({
        error: "No book lists found for this user",
      });
    }

    const shelves = ["want_to_read", "currently_reading", "books_read"];
    const foundOnShelf = shelves.find((shelf) =>
      (existingUserBooks[shelf] || []).some((entry) => entry.id === bookId),
    );

    if (!foundOnShelf) {
      return res.status(404).json({
        error: "Book not found on any of the user's shelves",
      });
    }

    const updated = await UserBook.findOneAndUpdate(
      { user_id: userId },
      {
        $pull: {
          want_to_read: { id: bookId },
          currently_reading: { id: bookId },
          books_read: { id: bookId },
        },
      },
      {
        new: true,
      },
    );

    res.json({
      message: "Book removed from shelf",
      removed_from: foundOnShelf,
      data: updated,
    });
  } catch (err) {
    console.error("Failed to remove book from shelf:", err);
    res.status(500).json({
      error: "Failed to remove book from shelf",
      details: err.message,
    });
  }
};

/**
 * Saves the user's reading progress (current page) for a book under the
 * `currently_reading` shelf. If the book isn't already on that shelf, it's
 * moved there (and pulled off any other shelf), since tracking progress
 * implies the user is now reading it.
 */
const updateReadingProgress = async (req, res) => {
  const { bookId, currentPage, pageCount, title, author, bookid } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!bookId) {
    return res.status(400).json({ error: "bookId is required." });
  }

  const normalizedCurrentPage = Number(currentPage);
  if (!Number.isFinite(normalizedCurrentPage) || normalizedCurrentPage < 0) {
    return res
      .status(400)
      .json({ error: "currentPage must be a non-negative number." });
  }

  const normalizedPageCount = Number(pageCount);
  const hasPageCount =
    Number.isFinite(normalizedPageCount) && normalizedPageCount > 0;

  try {
    const existingUserBooks = await UserBook.findOne({ user_id: userId });
    const alreadyCurrentlyReading = existingUserBooks?.currently_reading?.some(
      (entry) => entry.id === bookId,
    );

    if (alreadyCurrentlyReading) {
      const setFields = {
        "currently_reading.$.current_page": normalizedCurrentPage,
        "currently_reading.$.updated_at": new Date(),
      };
      if (hasPageCount) {
        setFields["currently_reading.$.page_count"] = normalizedPageCount;
      }

      const updated = await UserBook.findOneAndUpdate(
        { user_id: userId, "currently_reading.id": bookId },
        { $set: setFields },
        { new: true },
      );

      return res.json({ message: "Reading progress updated", data: updated });
    }

    // Not on the currently_reading shelf yet — need enough info to add it.
    if (!title) {
      return res.status(400).json({
        error:
          "Book title is required to start tracking progress for this book.",
      });
    }

    await UserBook.findOneAndUpdate(
      { user_id: userId },
      {
        $setOnInsert: {
          user_id: userId,
          currently_reading: [],
          want_to_read: [],
          books_read: [],
        },
      },
      { upsert: true },
    );

    await UserBook.updateOne(
      { user_id: userId },
      {
        $pull: {
          want_to_read: { id: bookId },
          currently_reading: { id: bookId },
          books_read: { id: bookId },
        },
      },
    );

    const entry = {
      id: bookId,
      bookid: bookid || bookId,
      title,
      author: author || "",
      current_page: normalizedCurrentPage,
      updated_at: new Date(),
      ...(hasPageCount ? { page_count: normalizedPageCount } : {}),
    };

    const updated = await UserBook.findOneAndUpdate(
      { user_id: userId },
      { $push: { currently_reading: entry } },
      { new: true },
    );

    res.json({ message: "Reading progress saved", data: updated });
  } catch (err) {
    console.error("Failed to update reading progress:", err);
    res.status(500).json({
      error: "Failed to update reading progress",
      details: err.message,
    });
  }
};

const getPopularBooks = async (req, res) => {
  try {
    const popularCollection = mongoose.connection.collection(
      "PopularBooksByMonth",
    );
    const books = await popularCollection.find({}).toArray();

    res.json({
      message: "Popular books retrieved successfully",
      count: books.length,
      data: books,
    });
  } catch (err) {
    console.error("Failed to fetch popular books by month:", err);
    res.status(500).json({
      error: "Failed to fetch popular books",
      details: err.message,
    });
  }
};

module.exports = {
  getUserBookLists,
  addBookToUserShelf,
  removeBookFromUserShelf,
  updateReadingProgress,
  getPopularBooks,
};
