const express = require("express");
const router = express.Router();
const {
  getSpoilerFreeBookSummary,
} = require("../controllers/summaryController");

router.get("/summary", getSpoilerFreeBookSummary);

module.exports = router;
