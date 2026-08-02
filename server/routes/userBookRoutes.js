const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getUserBookLists,
  addBookToUserShelf,
  getPopularBooks,
} = require("../controllers/userBookController");

router.post("/user-shelf", authenticateToken, addBookToUserShelf);
router.get("/user-books/:userId", getUserBookLists);
router.get("/popular-books", getPopularBooks);

module.exports = router;
