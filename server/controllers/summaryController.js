const {
  buildGeminiSpoilerFreeSummary,
} = require("../services/geminiSummaryService");

const getSpoilerFreeBookSummary = async (req, res) => {
  const { title, author, googleId } = req.query;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: "Missing title" });
  }

  try {
    const summary = await buildGeminiSpoilerFreeSummary(
      title,
      author,
      googleId,
    );
    return res.json(summary);
  } catch (err) {
    console.error("Failed to generate spoiler-free summary:", err);
    return res.status(500).json({
      error: "Failed to generate spoiler-free summary",
      details: err.message,
    });
  }
};

module.exports = {
  getSpoilerFreeBookSummary,
};
