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
  cachedAt: { type: Date, default: Date.now },
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
});

const userBookSchema = new mongoose.Schema({
  user_id: String,
  currently_reading: [userBookItemSchema],
  want_to_read: [userBookItemSchema],
  books_read: [userBookItemSchema],
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
