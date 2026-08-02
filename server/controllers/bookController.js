const axios = require("axios");
const { Book } = require("../schemas");
const { googleBooksApiKey: apiKey } = require("../config/env");
const {
  normalizeWhitespace,
  normalizeThumbnailUrl,
} = require("../utils/textUtils");
const {
  GOOGLE_BOOKS_API,
  fetchBook,
  fetchBookByGoogleId,
  refreshBookCover,
} = require("../services/googleBooksService");

const createSampleBook = (req, res) => {
  const formData = new Book({
    name: "Percy Jackson",
  });

  formData
    .save()
    .then(() => {
      res.send("Successfully saved form data to the database");
      console.log("Sucess");
    })
    .catch((error) => {
      console.error(error);
      res.send("Error saving form data to the database");
    });
};

const getRandomBooks = async (req, res) => {
  try {
    const books = await Book.aggregate([{ $sample: { size: 4 } }]);
    res.send(books);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getBooksByGenre = async (req, res) => {
  const { genre } = req.query;
  try {
    const books = await Book.find({ genre: genre });
    res.send(books);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getGenreCount = async (req, res) => {
  try {
    const genreCounts = await Book.aggregate([
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(genreCounts);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getBookData = async (req, res) => {
  const { title, author } = req.query;
  if (!title) return res.status(400).json({ error: "Missing title" });

  try {
    let book = await fetchBook(title, author);
    if (!book && author) {
      const firstAuthorWord = author.trim().split(/\s+/)[0];
      if (firstAuthorWord && firstAuthorWord !== author) {
        console.log("Retrying with first word of author:", firstAuthorWord);
        book = await fetchBook(title, firstAuthorWord);
      }
    }
    if (!book) return res.status(404).json({ error: "Book Not Found" });

    res.json(book);
  } catch (err) {
    res.status(500).json({ error: "Server error" + err });
  }
};

const searchBookData = async (req, res) => {
  const q = req.query.q || req.query.title;
  if (!q || String(q).trim().length < 2) {
    return res.json({ data: [] });
  }

  const query = normalizeWhitespace(String(q));
  try {
    const response = await axios.get(
      `${GOOGLE_BOOKS_API}?q=intitle:"${encodeURIComponent(query)}"&langRestrict=en&printType=books&orderBy=newest&maxResults=5&key=${apiKey}`,
    );
    const items = response.data.items || [];
    const suggestions = items
      .filter((item) => item.volumeInfo)
      .map((item) => ({
        googleId: item.id,
        title: item.volumeInfo.title || "",
        authors: item.volumeInfo.authors || [],
        thumbnail: normalizeThumbnailUrl(
          item.volumeInfo.imageLinks?.thumbnail || "",
        ),
      }));

    return res.json({ data: suggestions });
  } catch (err) {
    console.error("Search failed:", err.message || err);
    return res.status(500).json({ data: [], error: "Search failed" });
  }
};

const getBookById = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });
  try {
    const book = await fetchBookByGoogleId(id);
    if (!book) return res.status(404).json({ error: "Book Not Found" });

    res.json(book);
  } catch (err) {
    res.status(500).json({ error: "Server error" + err });
  }
};

const refreshBookCoverHandler = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });
  try {
    await refreshBookCover(id);
    res.json({ message: "Book cover refreshed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" + err });
  }
};

module.exports = {
  createSampleBook,
  getRandomBooks,
  getBooksByGenre,
  getGenreCount,
  getBookData,
  searchBookData,
  getBookById,
  refreshBookCoverHandler,
};
