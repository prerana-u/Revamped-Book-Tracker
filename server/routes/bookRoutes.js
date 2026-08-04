const express = require("express");
const router = express.Router();
const {
  createSampleBook,
  getRandomBooks,
  getBooksByGenre,
  getGenreCount,
  getBookData,
  searchBookData,
  getBookById,
  refreshBookCoverHandler,
} = require("../controllers/bookController");
const { getBooksByTheme } = require("../services/themeService");

router.post("/api/endpoint", createSampleBook);
router.get("/getbooks", getRandomBooks);
router.get("/getbooksbygenre", getBooksByGenre);
router.get("/genrecount", getGenreCount);
router.get("/getbookdata", getBookData);
router.get("/searchbookdata", searchBookData);
router.get("/getbookbyid", getBookById);
router.get("/refresh-book-cover", refreshBookCoverHandler);

async function getThemeBooks(req, res) {
  const { theme, description } = req.query;
  const forceRefresh = req.query.refresh === "true";

  try {
    const books = await getBooksByTheme(theme, description, { forceRefresh });
    res.json(books); // send array directly, no wrapper object
  } catch (err) {
    console.error("Error fetching theme books:", err);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
}

// routes/themes.js
router.get("/getbooksbytheme", getThemeBooks);
module.exports = router;
