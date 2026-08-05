// controllers/contentWarningController.js
const { getContentWarnings } = require("../services/contentWarningService");

async function getBookContentWarnings(req, res) {
  const { googleId, title, author, description } = req.query;
  const forceRefresh = req.query.refresh === "true";

  if (!title || !author) {
    return res.status(400).json({ error: "title and author are required" });
  }

  try {
    const warnings = await getContentWarnings(
      { googleId, title, author, description },
      { forceRefresh },
    );
    res.json({ warnings });
  } catch (err) {
    console.error("Error fetching content warnings:", err);
    res.status(500).json({ error: "Failed to fetch content warnings" });
  }
}

module.exports = { getBookContentWarnings };
