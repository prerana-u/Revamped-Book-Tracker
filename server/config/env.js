require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3001,
  googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY,
  hapiBooksApiKey: process.env.HAPI_BOOKS_API_KEY,
  hardcoverApiKey: process.env.HARDCOVER_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  jwtSecret: process.env.JWT_SECRET,
  mongoUri: "mongodb://0.0.0.0:27017/BookDatabase",
};
