const { UserBook } = require("../schemas");
const {
  refreshUserRecommendationsForUser,
  buildGeminiRecommendationPayload,
  storeRecommendationsForUser,
} = require("../services/geminiRecommendationService");

const refreshUserRecommendations = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const recommendations = await refreshUserRecommendationsForUser(userId);
    return res.json(recommendations);
  } catch (err) {
    console.error("Failed to refresh recommendations:", err);
    return res.status(500).json({
      error: "Failed to refresh recommendations",
      details: err.message,
    });
  }
};

const getUserRecommendations = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userBooks = await UserBook.findOne({ user_id: userId });

    if (
      Array.isArray(userBooks?.recommendations) &&
      userBooks.recommendations.length > 0
    ) {
      return res.json(userBooks.recommendations);
    }

    const booksRead = userBooks?.books_read || [];

    if (!booksRead.length) {
      return res.json([]);
    }

    const recommendations = await buildGeminiRecommendationPayload(booksRead);
    await storeRecommendationsForUser(userId, recommendations);
    return res.json(recommendations);
  } catch (err) {
    console.error("Failed to generate recommendations:", err);
    return res.status(500).json({
      error: "Failed to generate recommendations",
      details: err.message,
    });
  }
};

module.exports = { refreshUserRecommendations, getUserRecommendations };
