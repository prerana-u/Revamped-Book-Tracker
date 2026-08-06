const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  cover: {
    type: String,
    required: true,
  },
  bookid: {
    type: String,
    required: true,
    unique: true,
  },
  author: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
});

const recommendationItemSchema = new mongoose.Schema(
  {
    title: String,
    author: String,
    genre: String,
    whyRecommended: String,
    cover: String,
    bookid: String,
    updated_at: Date,
  },
  { _id: false },
);

const BookSchema1 = new mongoose.Schema({
  googleId: { type: String, unique: true },
  title: String,
  normalizedTitle: String,
  authors: [String],
  normalizedAuthors: [String],
  description: String,
  thumbnail: String,
  publishedDate: String,
  pageCount: Number,
  publisher: String,
  averageRating: Number,
  summary: String,
  tone: String,
  themes: [String],
  summaryCachedAt: { type: Date, default: null },
  moreLikeThisRecommendations: [recommendationItemSchema],
  moreLikeThisRecommendationsCachedAt: { type: Date, default: null },
  cachedAt: { type: Date, default: Date.now },
  themes: { type: [String], default: [] },
  normalizedThemes: { type: [String], default: [], index: true },
  // schemas/CachedBook.js — add this field to the existing schema
  contentWarnings: {
    type: [
      {
        category: { type: String, required: true }, // e.g. "Violence", "Sexual Content"
        severity: {
          type: String,
          enum: ["mild", "moderate", "severe"],
          required: true,
        },
        description: { type: String, required: true }, // short, spoiler-safe explanation
      },
    ],
    default: undefined, // stays unset until first generated, so you can tell "never generated" apart from "generated, zero warnings"
  },
});

BookSchema1.index({ title: 1, authors: 1 });
BookSchema1.index({ normalizedTitle: 1, normalizedAuthors: 1 });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
userSchema.index({ username: 1 }, { unique: true });

const userBookItemSchema = new mongoose.Schema({
  title: String,
  name: String,
  id: String,
  bookid: String,
  updated_at: Date,
  author: String,
  rating: Number,
  current_page: Number,
  page_count: Number,
});

const userBookSchema = new mongoose.Schema({
  user_id: String,
  currently_reading: [userBookItemSchema],
  want_to_read: [userBookItemSchema],
  books_read: [userBookItemSchema],
  recommendations: [recommendationItemSchema],
});
userBookSchema.index({ user_id: 1 }, { unique: true });

const PopularBookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  id: {
    type: String,
    required: true,
    unique: true,
  },
  author: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: false,
  },
});

const Book = mongoose.model("Book", BookSchema);
const CachedBook = mongoose.model("CachedBook", BookSchema1);
const User = mongoose.model("User", userSchema);
const UserBook = mongoose.model("UserBookData", userBookSchema, "userBookData");
const popularBook = mongoose.model(
  "PopularBooksByMonth",
  PopularBookSchema,
  "PopularBooksByMonth",
);

module.exports = {
  Book,
  CachedBook,
  User,
  UserBook,
  popularBook,
};
