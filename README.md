# PageBind

PageBind is a full-stack book tracking and recommendation app built for readers who want to organize their library, follow their current shelves, and discover new books from their reading history.

The project combines:

- a React + Vite frontend for the reading experience and dashboard
- an Express + MongoDB API for auth, shelf persistence, and recommendations
- Google Books integration for cover metadata and book lookup
- Gemini-powered recommendation prompting for AI-curated reading suggestions

## Quick Start for Contributors

If you are new to the repo, the fastest path to a working local setup is:

```bash
cd client && npm install
cd ../server && npm install
```

Then start your MongoDB instance, add the required server environment variables, and run both services in separate terminals:

```bash
cd server && node server.js
cd client && npm run dev
```

The backend listens on `http://localhost:3001` and the frontend usually runs on `http://localhost:5173`.

## Features

- Sign up / login with JWT-backed authentication
- Maintain book shelves for:
  - Want to Read
  - Currently Reading
  - Read
- Browse and inspect book details from Google Books metadata
- View a personalized dashboard with user stats and saved shelves
- Generate recommendations from the user’s most recently read books
- Persist recommendation results alongside the user shelf document
- Refresh recommendations on demand from the latest read-shelf data

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- React Query
- Tailwind CSS
- React Hot Toast
- Lucide icons

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- Axios for third-party API calls
- Google GenAI SDK for Gemini recommendations

## Project Structure

- `client/` — React frontend application
- `server/` — Express API, organized by responsibility rather than one entry file:
  - `server.js` — entry point; connects to MongoDB and starts the HTTP server
  - `app.js` — Express app setup and route mounting
  - `schemas.js` — MongoDB schemas for cached books, users, and user shelf data
  - `config/` — environment variables (`env.js`), MongoDB connection (`database.js`), and the Gemini client (`gemini.js`)
  - `utils/` — shared helpers for text normalization (`textUtils.js`) and title/author matching (`bookMatching.js`)
  - `services/` — business logic: Google Books lookups and caching (`googleBooksService.js`), Gemini prompt building and recommendation storage (`geminiRecommendationService.js`), plus two standalone import helpers not wired to any route (`hapiImportService.js`, `hardcoverService.js`)
  - `middleware/` — JWT auth middleware (`auth.js`)
  - `controllers/` — request handlers, grouped by API area (`bookController.js`, `authController.js`, `userBookController.js`, `recommendationController.js`)
  - `routes/` — one router per controller, each mounted in `app.js`

## Prerequisites

Before running the app locally, make sure you have:

- Node.js 18+
- MongoDB running locally on `mongodb://0.0.0.0:27017/BookDatabase`
- A valid Google Books API key
- A Gemini API key for AI recommendations
- A JWT secret configured for auth

## Environment Variables

Create a `.env` file in the `server/` directory with the variables used by the API, for example:

```env
PORT=3001
JWT_SECRET=your_jwt_secret
GOOGLE_BOOKS_API_KEY=your_google_books_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
HAPI_BOOKS_API_KEY=your_hapi_books_key
HARDCOVER_API_KEY=your_hardcover_key
```

All of these are read in one place at `server/config/env.js`.

## Getting Started

### 1. Install dependencies

From the project root:

```bash
cd client
npm install

cd ../server
npm install
```

### 2. Start MongoDB

Make sure your MongoDB instance is running locally and reachable at the configured connection string.

### 3. Run the backend server

```bash
cd server
node server.js
```

The API runs on `http://localhost:3001` by default.

### 4. Run the frontend

In a separate terminal:

```bash
cd client
npm run dev
```

The client typically runs on the Vite default development URL, usually `http://localhost:5173`.

## Main API Endpoints

Some of the primary endpoints used by the app include:

- `POST /create-user` — `routes/authRoutes.js`
- `POST /login` — `routes/authRoutes.js`
- `POST /user-shelf` — `routes/userBookRoutes.js`
- `GET /user-books/:userId` — `routes/userBookRoutes.js`
- `GET /popular-books` — `routes/userBookRoutes.js`
- `GET /user/recommendations` — `routes/recommendationRoutes.js`
- `POST /user/recommendations/refresh` — `routes/recommendationRoutes.js`
- `GET /getbookdata` — `routes/bookRoutes.js`
- `GET /searchbookdata` — `routes/bookRoutes.js`
- `GET /getbookbyid` — `routes/bookRoutes.js`
- `GET /refresh-book-cover` — `routes/bookRoutes.js`

## Recommendation Flow

The recommendation system (`services/geminiRecommendationService.js`):

1. Reads the user’s `books_read` shelf
2. Sorts the newest entries first
3. Uses the five most recent books to assemble a Gemini prompt
4. Stores the resulting recommendation list back into the user’s shelf document
5. Allows the user to refresh recommendations on demand

Any recommended title that cannot be matched to a valid Google Books record is skipped from the returned recommendation list. If the Gemini API rate-limits the request, the service falls back to books from the `PopularBooksByMonth` collection.

## Notes

- The server normalizes Google Books cover URLs to `https` so browser mixed-content blocking does not prevent thumbnails from rendering.
- Recommendation generation falls back gracefully if the Gemini API rate limits or returns an error.
- The frontend uses React Query caching and invalidation so shelf changes and recommendation refreshes update the dashboard promptly.
- `services/hapiImportService.js` and `services/hardcoverService.js` are standalone helper scripts kept for reference; they aren't called by any route and can be run manually if needed.

## License

This project is currently unlicensed and is intended for local app development and experimentation.
