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

router.get("/getbooksbytheme", async (req, res) => {
  try {
    const { theme, description } = req.query;
    if (!theme) {
      return res.status(400).json({ error: "theme query param is required" });
    }
    const books = await getBooksByTheme(theme, description);
    res.json(books);
  } catch (err) {
    console.error("Error fetching books by theme:", err);
    res.status(500).json({ error: "Failed to fetch books by theme" });
  }
});
module.exports = router;
