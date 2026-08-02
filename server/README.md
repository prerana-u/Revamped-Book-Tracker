# Backend structure

This is the original single `index.js` split up by responsibility so each API group
lives in its own file. Nothing in the request/response logic was changed — only
where the code lives.

```
backend/
├── server.js                 # entry point: connects DB, starts the HTTP server
├── app.js                    # express app setup + route mounting
├── schemas.js                 # <- copy your existing schemas.js here (Book, CachedBook, User, UserBook)
├── config/
│   ├── env.js                # all process.env reads in one place
│   ├── database.js           # mongoose connection
│   └── gemini.js              # GoogleGenAI client setup
├── utils/
│   ├── textUtils.js          # normalize, normalizeWhitespace, escapeRegex, stripEditionQualifiers, normalizeThumbnailUrl
│   └── bookMatching.js        # isMatch (title/author fuzzy matching)
├── services/
│   ├── googleBooksService.js  # fetchBook, fetchBookByGoogleId, refreshBookCover
│   ├── geminiRecommendationService.js  # Gemini prompt building + recommendation storage
│   ├── hapiImportService.js   # getBooks() - manual one-off import script (unused by routes, kept for reference)
│   └── hardcoverService.js    # GetBooksFromHardcover() - manual helper (unused by routes, kept for reference)
├── middleware/
│   └── auth.js                # authenticateToken JWT middleware
├── controllers/
│   ├── bookController.js      # /getbooks, /getbooksbygenre, /genrecount, /getbookdata, /searchbookdata, /getbookbyid, /refresh-book-cover, /api/endpoint
│   ├── authController.js      # /create-user, /login
│   ├── userBookController.js  # /user-shelf, /user-books/:userId, /popular-books
│   └── recommendationController.js  # /user/recommendations, /user/recommendations/refresh
└── routes/
    ├── bookRoutes.js
    ├── authRoutes.js
    ├── userBookRoutes.js
    └── recommendationRoutes.js
```

## What changed vs. the original (behavior-preserving cleanup)

- Removed the large blocks of commented-out dead code (old `getNewBooks`, earlier
  attempts, stray debug comparisons) since they added no value split across files.
- Renamed the local `isMatch` variable inside `loginUser` to `isPasswordMatch` so it
  doesn't shadow the book-matching `isMatch` function name now that both live in the
  same project.
- `buildGeminiRecommendationPayload` now checks `if (!genAI)` instead of
  `if (!GEMINI_API_KEY)` — equivalent, since `genAI` is only created when the key
  exists, but keeps the Gemini client as the single source of truth.
- Everything else — endpoint paths, request/response shapes, query logic, and
  console logging — is unchanged.

## Wiring it up

1. Drop your existing `schemas.js` at `backend/schemas.js`.
2. Keep your `.env` at the project root (same variables as before: `PORT`,
   `GOOGLE_BOOKS_API_KEY`, `HAPI_BOOKS_API_KEY`, `HARDCOVER_API_KEY`,
   `GEMINI_API_KEY`/`GOOGLE_GEMINI_API_KEY`, `GEMINI_MODEL`, `JWT_SECRET`).
3. Run with `node server.js` instead of the old `index.js`.
