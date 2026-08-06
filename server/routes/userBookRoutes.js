const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getUserBookLists,
  addBookToUserShelf,
  getPopularBooks,
  removeBookFromUserShelf,
  updateReadingProgress,
} = require("../controllers/userBookController");

router.post("/user-shelf", authenticateToken, addBookToUserShelf);
router.get("/user-books/:userId", getUserBookLists);
router.get("/popular-books", getPopularBooks);
router.delete(
  "/user-books/:bookId",
  authenticateToken,
  removeBookFromUserShelf,
);
router.post("/user-books/progress", authenticateToken, updateReadingProgress);
module.exports = router;
