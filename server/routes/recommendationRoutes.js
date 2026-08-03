const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  refreshUserRecommendations,
  getUserRecommendations,
  getMoreLikeThisRecommendations,
} = require("../controllers/recommendationController");

router.post(
  "/user/recommendations/refresh",
  authenticateToken,
  refreshUserRecommendations,
);
router.get("/user/recommendations", authenticateToken, getUserRecommendations);
router.get("/morelikethis/:bookId", getMoreLikeThisRecommendations);

module.exports = router;
