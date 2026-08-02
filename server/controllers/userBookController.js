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

module.exports = { getUserBookLists, addBookToUserShelf, getPopularBooks };
