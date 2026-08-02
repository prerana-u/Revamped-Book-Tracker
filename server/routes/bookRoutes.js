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

router.post("/api/endpoint", createSampleBook);
router.get("/getbooks", getRandomBooks);
router.get("/getbooksbygenre", getBooksByGenre);
router.get("/genrecount", getGenreCount);
router.get("/getbookdata", getBookData);
router.get("/searchbookdata", searchBookData);
router.get("/getbookbyid", getBookById);
router.get("/refresh-book-cover", refreshBookCoverHandler);

module.exports = router;
