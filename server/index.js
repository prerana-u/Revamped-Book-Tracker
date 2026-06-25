/* eslint-disable no-unused-vars */
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
// const { createMongoUser } = require("./userController");
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
require("dotenv").config(); // at the top of your main file
const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
const hapibooksapiKey = process.env.HAPI_BOOKS_API_KEY;
const HARDCOVER_API_KEY = process.env.HARDCOVER_API_KEY;
mongoose.set("strictQuery", false);

app.use(express.json());
// Connect to the MongoDB database
mongoose.connect("mongodb://0.0.0.0:27017/BookDatabase", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;

connection.once("open", () => {
  console.log("MongoDB connection established successfully");
});

connection.on("error", (error) => {
  console.error(error);
});

const { Book, CachedBook, User, UserBook } = require("./schemas");

const getBooks = async () => {
  try {
    // using async-await to get the data from the URL
    const response = await axios.get(
      "https://hapi-books.p.rapidapi.com/nominees/romance/2024",
      {
        headers: {
          "X-RapidAPI-Key": hapibooksapiKey,
          "X-RapidAPI-Host": "hapi-books.p.rapidapi.com",
        },
      },
    );

    for (let i = 0; i < response.data.length; i++) {
      const post = new Book({
        name: response.data[i]["name"],
        cover: response.data[i]["cover"],
        bookid: response.data[i]["book_id"],
        author: response.data[i]["author"],
        genre: "Romance",
      });
      post
        .save()
        .then(() => {
          // res.send("Successfully saved form data to the database");
          console.log("Sucess");
        })
        .catch((error) => {
          console.error("Error", error);
          //  res.send("Error saving form data to the database");
        });
    }
  } catch (err) {
    if (err.response) {
      console.log(err.response.status);
      console.log(err.response.statusText);
      console.log(err.response.data);
    }
  }
};
// getBooks();
function normalize(str) {
  return String(str || "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/gi, "")
    .trim();
}

function normalizeWhitespace(str) {
  return String(str || "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripEditionQualifiers(title) {
  // Remove any parenthetical content from the end (e.g., "(Movie Tie-In)", "(Hardcover)", etc.)
  let cleaned = String(title || "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .trim();

  // Remove content after colon if it contains qualifier keywords
  // (e.g., ": Reese's Book Club", ": Deluxe Edition", ": Special Edition")
  const colonIndex = cleaned.indexOf(":");
  if (colonIndex !== -1) {
    const afterColon = cleaned.substring(colonIndex + 1).toLowerCase();
    if (
      afterColon.includes("book club") ||
      afterColon.includes("edition") ||
      afterColon.includes("tie-in") ||
      afterColon.includes("special") ||
      afterColon.includes("deluxe") ||
      afterColon.includes("anniversary")
    ) {
      cleaned = cleaned.substring(0, colonIndex).trim();
    }
  }

  return cleaned;
}

function isMatch(volumeInfo, title, author) {
  const cleanVolumeTitle = stripEditionQualifiers(volumeInfo.title);
  const cleanTargetTitle = stripEditionQualifiers(title);
  const normalizedTitle = normalize(cleanVolumeTitle);
  const normalizedAuthorList = (volumeInfo.authors || []).map(normalize);

  const targetTitle = normalize(cleanTargetTitle);
  const targetAuthor = normalize(author);

  const titleMatch =
    normalizedTitle.includes(targetTitle) ||
    targetTitle.includes(normalizedTitle);
  const authorMatch =
    !author || normalizedAuthorList.some((a) => a.includes(targetAuthor));

  return titleMatch && authorMatch;
}

async function fetchBook(title, author) {
  // First, try to find it in the local DB
  console.log(
    "Searching for book in cache with title:",
    title,
    "and author:",
    author,
  );
  const strippedTitle = stripEditionQualifiers(title);
  const cleanedTitle = normalizeWhitespace(strippedTitle);
  const cleanedAuthor = normalizeWhitespace(author);
  const normalizedTitle = normalize(strippedTitle);
  const normalizedAuthor = normalize(author);
  console.log(
    "Cleaned title:",
    cleanedTitle,
    "stripped title:",
    strippedTitle,
    title,
    'normalized title:"',
    normalizedTitle,
  );
  const legacyQuery = {
    title: new RegExp(`^${escapeRegex(cleanedTitle)}`, "i"),
  };

  if (cleanedAuthor) {
    // Handle flexible spacing and dots in author names (e.g., "J. R." vs "J.R." vs "J R")
    let authorPattern;

    if (/^[A-Za-z]{2,}$/.test(cleanedAuthor.replace(/\./g, ""))) {
      // "EL", "JR", "JRR"
      authorPattern =
        cleanedAuthor.replace(/\./g, "").split("").join("\\.?\\s*") + "\\.?";
    } else {
      // "E L", "J. R.", "George R. R."
      authorPattern =
        cleanedAuthor
          .split(/\s+/)
          .map((part) =>
            part.replace(/\./g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          )
          .join("\\.?\\s*") + "\\.?";
    }
    legacyQuery.authors = {
      $elemMatch: {
        $regex: authorPattern,
        $options: "i",
      },
    };
  }

  const normalizedQuery = {
    normalizedTitle,
  };
  if (cleanedAuthor) {
    normalizedQuery.normalizedAuthors = {
      $in: [normalizedAuthor],
    };
  }
  console.log(
    "Querying cache with:",
    normalizedAuthor,
    normalizedQuery,
    legacyQuery,
  );
  const existingBook = await CachedBook.findOne(
    cleanedAuthor
      ? { $or: [normalizedQuery, legacyQuery] }
      : { $or: [normalizedQuery, legacyQuery] },
  );

  if (existingBook) {
    console.log(title, "Found From Cache");
    return existingBook;
  }

  // Fetch from Google Books

  let query = `intitle:"${cleanedTitle}"`;

  if (cleanedAuthor) query += `+inauthor:"${cleanedAuthor}"`;

  const response = await axios.get(
    `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(
      query,
    )}&langRestrict=en&printType=books&maxResults=5&key=${apiKey}`,
  );

  const items = response.data.items || [];

  const validItems = items.filter(
    (item) =>
      item.volumeInfo?.description && item.volumeInfo?.language === "en",
  );
  // Find the best match from the results
  const bestMatch = validItems.find((item) =>
    isMatch(item.volumeInfo, title, author),
  );
  if (!bestMatch) return null;

  const info = bestMatch.volumeInfo;

  // Prepare data
  const bookData = {
    googleId: bestMatch.id,
    title: info.title,
    normalizedTitle: normalize(info.title),
    authors: info.authors || [],
    normalizedAuthors: (info.authors || []).map(normalize),
    description: info.description || "",
    thumbnail: info.imageLinks?.thumbnail || "",
    publishedDate: info.publishedDate || "",
    pageCount: info.pageCount || 0,
    publisher: info.publisher || "",
    averageRating: info.averageRating || 0,
  };

  // Save with upsert
  const savedBook = await CachedBook.findOneAndUpdate(
    { googleId: bestMatch.id },
    { $set: bookData },
    { new: true, upsert: true, setDefaultsOnInsert: true, strict: false },
  );
  console.log(info.title, " Saved to DB");
  return savedBook;
}

// Fetch a book by its Google Books volume id. If cached, return cached entry; otherwise fetch from Google and upsert.
async function fetchBookByGoogleId(googleId) {
  if (!googleId) return null;

  // Try cache first
  const existing = await CachedBook.findOne({ googleId });
  if (existing) {
    const hasPublishedDate = !!existing.publishedDate;
    const hasPageCount =
      Number.isInteger(existing.pageCount) && existing.pageCount > 0;
    const hasLanguage =
      !!existing._doc.language && existing._doc.language !== "unknown";

    if (hasPublishedDate && hasPageCount && hasLanguage) {
      console.log(googleId, "Found From Cache");
      return existing;
    }

    console.log(
      googleId,
      `Found From Cache but missing publishedDate:${hasPublishedDate} or pageCount:${hasPageCount} or language:${hasLanguage}, fetching from Google Books`,
    );
  }

  try {
    const response = await axios.get(
      `${GOOGLE_BOOKS_API}/${encodeURIComponent(googleId)}?key=${apiKey}`,
    );

    const item = response.data;
    if (!item || !item.volumeInfo) return null;
    const info = item.volumeInfo;
    const searchInfo = item?.searchInfo || {};
    if (searchInfo.textSnippet && !info.description) {
      info.description = searchInfo.textSnippet;
    }
    const bookData = {
      googleId: item.id || googleId,
      title: info.title || "",
      authors: info.authors || [],
      description: info.description || "",
      thumbnail: info.imageLinks?.large
        ? info.imageLinks?.large
        : info.imageLinks?.thumbnail || "",
      publishedDate: info.publishedDate || "",
      pageCount: info.pageCount || 0,
      publisher: info.publisher || "",
      averageRating: info.averageRating || 0,
      textSnippet: searchInfo.textSnippet || "",
      isbn10:
        (info.industryIdentifiers || []).find((id) => id.type === "ISBN_10")
          ?.identifier || "",
      isbn13:
        (info.industryIdentifiers || []).find((id) => id.type === "ISBN_13")
          ?.identifier || "",
      categories: info.categories || [],
      language: info.language || "",
    };

    // Delete duplicates with same title and first author but different googleId
    if (bookData.title && bookData.authors.length > 0) {
      const firstAuthor = bookData.authors[0];
      const duplicates = await CachedBook.deleteMany({
        title: new RegExp(
          `^${bookData.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
        authors: {
          $elemMatch: {
            $regex: firstAuthor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        },
        googleId: { $ne: bookData.googleId },
      });
      if (duplicates.deletedCount > 0) {
        console.log(
          `Deleted ${duplicates.deletedCount} duplicate(s) for "${bookData.title}"`,
        );
      }
    }

    const savedBook = await CachedBook.findOneAndUpdate(
      { googleId: bookData.googleId },
      { $set: bookData },
      { new: true, upsert: true, setDefaultsOnInsert: true, strict: false },
    );
    console.log(info.title, " Saved to DB");
    return savedBook;
  } catch (err) {
    console.error(
      "Error fetching from Google Books by id:",
      err.message || err,
    );
    return null;
  }
}

async function refreshBookCover(googleId) {
  const existing = await CachedBook.findOne({ googleId });
  const response = await axios.get(
    `${GOOGLE_BOOKS_API}/${encodeURIComponent(googleId)}?key=${apiKey}`,
  );

  console.log(
    response.data.volumeInfo?.imageLinks?.large !== existing.thumbnail,
    response.data.volumeInfo?.imageLinks?.large,
    existing.thumbnail,
    "new vs existing thumbnail",
  );

  const newThumbnail =
    response.data.volumeInfo?.imageLinks?.large ||
    response.data.volumeInfo?.imageLinks?.thumbnail;

  if (newThumbnail && newThumbnail !== existing.thumbnail) {
    console.log(
      existing.thumbnail ===
        "http://books.google.com/books/publisher/content?id=97FmEAAAQBAJ&printsec=frontcover&img=1&zoom=4&edge=curl&imgtk=AFLRE704jBhw6uBE5hjEg763qvk1DS-YXf3k3dvWJMbPXI9-pE6rFb_0Y5pGS_mKJJKFNaaMsB-e5sfx4Og0nWAaMiVnoWIdER9I77LcdQafQKeZyOo32AFhzlJjg3xaNgMb0VxM7vuT&source=gbs_api",
    );
    existing.thumbnail = newThumbnail;
    await existing.save();
    console.log(`Updated cover for ${existing.title}`);
  }
}

// Wrapper that searches cached records by several id forms (googleId, Mongo _id, or bookid).
// If not found locally, it will attempt to fetch from Google Books using the provided id as a volume id.

// const getNewBooks = async () => {
//   try {
//     // using async-await to get the data from the URL
//     const response = await axios.get(
//       "https://www.googleapis.com/books/v1/volumes?q=subject:fiction&orderBy=newest&maxResults=10&key="
//     );
//     console.log(response);
//     for (let i = 0; i < response.items.length; i++) {
//       const post = new Book({
//         name: response.data[i]["name"],
//         cover: response.data[i]["cover"],
//         bookid: response.data[i]["book_id"],
//         author: response.data[i]["author"],
//         genre: "",
//       });
//       post
//         .save()
//         .then(() => {
//           // res.send("Successfully saved form data to the database");
//           console.log("Sucess");
//         })
//         .catch((error) => {
//           console.error(error);
//           //  res.send("Error saving form data to the database");
//         });
//     }
//   } catch (err) {
//     if (err.response) {
//       console.log(err.response.status);
//       console.log(err.response.statusText);
//       console.log(err.response.data);
//     }
//   }
// };

const insertUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const newUser = new User({ username, password });
    await newUser.save();
    res
      .status(201)
      .json({ message: "User inserted into users collection", data: newUser });
  } catch (err) {
    console.error("Insert failed:", err);
    res.status(500).json({ error: "Insert failed", details: err.message });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = password === user.password;
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    // const token = user._id + user.username;
    res.json({
      message: "Login successful",
      token,
      expiresIn: "1h",
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ error: "Invalid or expired token", details: err.message });
    }
    req.user = decoded;
    next();
  });
};

const getUserBookLists = async (req, res) => {
  const { userId } = req.params;
  const cleanUserId = String(userId).trim();
  //console.log(mongoose.connection.name, "connection name");
  try {
    const userBooks = await UserBook.findOne({ user_id: cleanUserId });
    // console.log("User Books for userId", cleanUserId, ":", userBooks);
    if (!userBooks) {
      return res.status(404).json({
        error: "No book lists found for this user",
      });
    }

    res.json({
      message: "User book lists retrieved successfully",
      data: {
        currently_reading: userBooks.currently_reading,
        want_to_read: userBooks.want_to_read,
        books_read: userBooks.books_read || [],
      },
    });
  } catch (err) {
    console.error("Failed to fetch user books:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch user books", details: err.message });
  }
};

const getPopularBooks = async (req, res) => {
  try {
    const popularCollection = mongoose.connection.collection(
      "PopularBooksByMonth",
    );
    const books = await popularCollection.find({}).toArray();

    res.json({
      message: "Popular books retrieved successfully",
      count: books.length,
      data: books,
    });
  } catch (err) {
    console.error("Failed to fetch popular books by month:", err);
    res.status(500).json({
      error: "Failed to fetch popular books",
      details: err.message,
    });
  }
};

// ...existing code...
const GetBooksFromHardcover = async (bookname) => {
  const query = `query SearchBooks {
      search(
          query: "${bookname}",
          query_type: "Book",
          per_page: 1,
          page: 1
      ) {
          results
      }
  }`;

  const response = await fetch("https://api.hardcover.app/v1/graphql", {
    headers: {
      "content-type": "application/json",
      authorization: HARDCOVER_API_KEY,
    },
    body: JSON.stringify({ query }),
    method: "POST",
  });

  const { data } = await response.json();
  console.log("data", data.search?.results);
};
// ...existing code...

// GetBooksFromHardcover("Beach Read");g
// getBooks();

// ---------------------------------------------- api endpoints ----------------------------------------------
app.use(cors());
app.use(bodyParser.json());

// POST request handler for the API endpoint
app.post("/api/endpoint", (req, res) => {
  // Create a new FormData object with the request body data
  const formData = new Book({
    name: "Percy Jackson",
  });

  // Save the form data to the database
  formData
    .save()
    .then(() => {
      res.send("Successfully saved form data to the database");
      console.log("Sucess");
    })
    .catch((error) => {
      console.error(error);
      res.send("Error saving form data to the database");
    });
});

app.get("/getbooks", async (req, res) => {
  try {
    const users = await Book.aggregate([{ $sample: { size: 4 } }]);
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});
app.get("/getbooksbygenre", async (req, res) => {
  const { genre } = req.query;
  try {
    const books = await Book.find({ genre: genre });

    res.send(books);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/genrecount", async (req, res) => {
  try {
    const genreCounts = await Book.aggregate([
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(genreCounts);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/getbookdata", async (req, res) => {
  const { title, author } = req.query;
  if (!title) return res.status(400).json({ error: "Missing title" });

  try {
    let book = await fetchBook(title, author);
    if (!book && author) {
      const firstAuthorWord = author.trim().split(/\s+/)[0];
      if (firstAuthorWord && firstAuthorWord !== author) {
        console.log("Retrying with first word of author:", firstAuthorWord);
        book = await fetchBook(title, firstAuthorWord);
      }
    }
    if (!book) return res.status(404).json({ error: "Book Not Found" });

    res.json(book);
  } catch (err) {
    res.status(500).json({ error: "Server error" + err });
  }
});

app.get("/searchbookdata", async (req, res) => {
  const q = req.query.q || req.query.title;
  if (!q || String(q).trim().length < 2) {
    return res.json({ data: [] });
  }

  const query = normalizeWhitespace(String(q));
  try {
    const response = await axios.get(
      `${GOOGLE_BOOKS_API}?q=intitle:"${encodeURIComponent(query)}"&langRestrict=en&printType=books&orderBy=newest&maxResults=5&key=${apiKey}`,
    );
    const items = response.data.items || [];
    const suggestions = items
      .filter((item) => item.volumeInfo)
      .map((item) => ({
        googleId: item.id,
        title: item.volumeInfo.title || "",
        authors: item.volumeInfo.authors || [],
        thumbnail: item.volumeInfo.imageLinks?.thumbnail || "",
      }));

    return res.json({ data: suggestions });
  } catch (err) {
    console.error("Search failed:", err.message || err);
    return res.status(500).json({ data: [], error: "Search failed" });
  }
});

// GET book by id (google volume id, mongo _id, or provider bookid)
app.get("/getbookbyid", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });
  try {
    const book = await fetchBookByGoogleId(id);
    if (!book) return res.status(404).json({ error: "Book Not Found" });

    res.json(book);
  } catch (err) {
    res.status(500).json({ error: "Server error" + err });
  }
});

app.get("/refresh-book-cover", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });
  try {
    await refreshBookCover(id);
    res.json({ message: "Book cover refreshed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" + err });
  }
});

app.post("/create-user", insertUser);
app.post("/login", loginUser);
app.get("/user-books/:userId", getUserBookLists);
app.get("/popular-books", getPopularBooks);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
