const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  refreshUserRecommendations,
  getUserRecommendations,
} = require("../controllers/recommendationController");

router.post(
  "/user/recommendations/refresh",
  authenticateToken,
  refreshUserRecommendations,
);
router.get("/user/recommendations", authenticateToken, getUserRecommendations);

module.exports = router;
