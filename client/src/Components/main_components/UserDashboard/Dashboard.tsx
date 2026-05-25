/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/axios-instance";
import NavBar from "../../common_components/Navbar";
import { useAuth } from "../../../context/useAuth";
import BookCarousel from "../../common_components/BookCarousel";

/* ─── Types ─────────────────────────────────────────────────── */
interface BookData {
  id: string;
  name: string;
  cover: string;
  genre: string;
  author: string;
}

interface UserBookData {
  message: string;
  data: {
    currently_reading: any[];
    want_to_read: any[];
  };
}

interface UserStats {
  booksRead: number;
  pagesRead: number;
  currentStreak: number;
  favoriteGenre: string;
}

/* ─── API calls ─────────────────────────────────────────────── */

// const fetchWantToRead = (): Promise<BookData[]> =>
//   api.get("/user/want-to-read").then((r) => r.data);

const fetchRecommendations = (): Promise<BookData[]> =>
  api.get("/user/recommendations").then((r) => r.data);

const fetchUserStats = (): Promise<UserStats> =>
  api.get("/user/stats").then((r) => r.data);

// const removeFromWantToRead = (bookId: string) =>
//   api.delete(`/user/want-to-read/${bookId}`).then((r) => r.data);

// const addToWantToRead = (bookId: string) =>
//   api.post("/user/want-to-read", { bookId }).then((r) => r.data);

/* ─── Sub-components ────────────────────────────────────────── */

/** Circular progress ring for currently-reading cards */
// function ProgressRing({
//   progress,
//   size = 44,
//   stroke = 3,
// }: {
//   progress: number;
//   size?: number;
//   stroke?: number;
// }) {
//   const r = (size - stroke) / 2;
//   const circ = 2 * Math.PI * r;
//   const offset = circ - (progress / 100) * circ;
//   return (
//     <svg width={size} height={size} className="-rotate-90">
//       <circle
//         cx={size / 2}
//         cy={size / 2}
//         r={r}
//         fill="none"
//         stroke="currentColor"
//         strokeWidth={stroke}
//         className="text-ink/10"
//       />
//       <circle
//         cx={size / 2}
//         cy={size / 2}
//         r={r}
//         fill="none"
//         stroke="currentColor"
//         strokeWidth={stroke}
//         strokeDasharray={circ}
//         strokeDashoffset={offset}
//         strokeLinecap="round"
//         className="text-sienna transition-all duration-700"
//       />
//     </svg>
//   );
// }

/** Skeleton pulse block */
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-ink/8 rounded-lg ${className ?? ""}`} />
  );
}

/** Horizontal scrollable book row */
// function BookShelf({
//   books,
//   isLoading,
//   onAction,
//   actionLabel,
//   actionIcon,
// }: {
//   books: BookData[];
//   isLoading: boolean;
//   onAction?: (book: BookData) => void;
//   actionLabel?: string;
//   actionIcon?: React.ReactNode;
// }) {
//   if (isLoading) {
//     return (
//       <div className="flex gap-6 pb-3 overflow-x-auto scrollbar-none">
//         {Array.from({ length: 4 }).map((_, i) => (
//           <div key={i} className="shrink-0 w-36 flex flex-col gap-2">
//             <Skeleton className="w-36 h-52" />
//             <Skeleton className="w-28 h-3" />
//             <Skeleton className="w-20 h-2.5" />
//           </div>
//         ))}
//       </div>
//     );
//   }

//   if (!books.length) {
//     return (
//       <div className="flex flex-col items-center justify-center py-10 text-ink/30 gap-2">
//         <svg
//           width="36"
//           height="36"
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="1.5"
//         >
//           <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
//           <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
//         </svg>
//         <span className="text-[0.85rem] font-dm">No books here yet</span>
//       </div>
//     );
//   }

//   return (
//     <div className="flex gap-5 pb-3 overflow-x-auto scrollbar-none">
//       {books.map((book) => (
//         <div
//           key={book.id}
//           className="shrink-0 w-36 group relative flex flex-col gap-2"
//         >
//           <div className="relative overflow-hidden rounded-xl shadow-md">
//             <img
//               src={book.cover}
//               alt={book.name}
//               className="w-36 h-52 object-cover transition-transform duration-300 group-hover:scale-105"
//             />
//             {onAction && (
//               <button
//                 onClick={() => onAction(book)}
//                 className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
//               >
//                 <div className="flex flex-col items-center gap-1.5 text-white">
//                   {actionIcon}
//                   <span className="text-[0.72rem] font-dm font-medium">
//                     {actionLabel}
//                   </span>
//                 </div>
//               </button>
//             )}
//           </div>
//           <p className="text-[0.82rem] font-dm font-medium text-ink leading-tight line-clamp-2">
//             {book.name}
//           </p>
//           <p className="text-[0.75rem] font-dm text-ink/45 leading-tight">
//             {book.author}
//           </p>
//         </div>
//       ))}
//     </div>
//   );
// }

/* ─── Main Dashboard ────────────────────────────────────────── */
export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"reading" | "want" | "recs">(
    "reading",
  );

  const fetchCurrentlyReading = (): Promise<UserBookData> =>
    api.get(`/user-books/${user.id}`).then((r) => r.data);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["userStats"],
    queryFn: fetchUserStats,
  });

  const { data: yourBookData = {} as UserBookData, isLoading: readingLoading } =
    useQuery({
      queryKey: ["userBookData"],
      queryFn: fetchCurrentlyReading,
    });

  //   const { data: wantToRead = [], isLoading: wantLoading } = useQuery({
  //     queryKey: ["wantToRead"],
  //     queryFn: fetchWantToRead,
  //   });

  const { data: recommendations = [], isLoading: recsLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
  });

  //

  const tabs = [
    {
      key: "reading" as const,
      label: "Currently Reading",
      count: yourBookData.data?.currently_reading?.length,
    },
    {
      key: "want" as const,
      label: "Want to Read",
      count: yourBookData.data?.want_to_read?.length,
    },
    { key: "recs" as const, label: "For You", count: null },
  ];

  return (
    <div className="min-h-screen bg-cream-deep">
      <NavBar />
      {/* ── Top greeting banner ─────────────────────────────── */}
      <div className="bg-ink relative overflow-hidden mt-16">
        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px",
          }}
        />
        <div className="absolute bottom-0 left-1/4 w-96 h-48 bg-sienna/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-sienna/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-16 py-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            {/* <span className="text-[0.72rem] uppercase tracking-[0.1em] font-medium text-sienna font-dm block mb-2">
              Your library
            </span> */}
            <h1 className="font-lora font-medium text-[clamp(1.8rem,3vw,2.6rem)] text-white leading-tight tracking-tight">
              Good morning, {user.username || "reader"}!
            </h1>
            <p className="mt-1.5 text-white/40 font-dm text-[0.9rem]">
              {yourBookData.data?.currently_reading?.length > 0
                ? `You're reading ${yourBookData.data?.currently_reading.length} book${yourBookData.data?.currently_reading.length > 1 ? "s" : ""} right now.`
                : "Pick up where you left off, or start something new."}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 sm:gap-8">
            {statsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <Skeleton className="w-12 h-6" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                ))
              : [
                  { value: stats?.booksRead ?? 0, label: "Books read" },
                  { value: stats?.currentStreak ?? 0, label: "Day streak" },
                  { value: stats?.pagesRead ?? 0, label: "Pages read" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="font-lora text-2xl font-medium text-white">
                      {value.toLocaleString()}
                    </span>
                    <span className="text-white/35 text-[0.72rem] font-dm uppercase tracking-[0.07em]">
                      {label}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-16 py-10 flex flex-col gap-12">
        {/* ── Currently Reading — featured cards ─────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[0.72rem] uppercase tracking-widest font-medium text-sienna font-dm block mb-1">
                In progress
              </span>
              <h2 className="font-lora font-medium text-[1.5rem] text-ink tracking-tight">
                Currently Reading
              </h2>
            </div>
          </div>

          {readingLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : yourBookData.data?.currently_reading?.length === 0 ? (
            <div className="rounded-2xl border border-ink/8 bg-white/60 py-12 flex flex-col items-center gap-3 text-ink/30">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <p className="font-dm text-[0.9rem]">
                You're not reading anything right now.
              </p>
              <button className="mt-1 px-5 py-2 rounded-[40px] bg-sienna text-white text-[0.82rem] font-dm font-medium hover:-translate-y-0.5 transition-all hover:shadow-md hover:shadow-sienna/20">
                Browse books
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {yourBookData.data?.currently_reading?.map((book) => (
                <div
                  key={book.id}
                  className="group rounded-2xl border border-ink/8 bg-white/70 hover:bg-white hover:shadow-xl hover:shadow-ink/6 transition-all duration-300 p-5 flex gap-4 cursor-pointer"
                >
                  {/* Cover */}
                  <div className="relative shrink-0">
                    {/* <img
                      src={book.cover}
                      alt={book.name}
                      className="w-20 h-28 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
                    /> */}
                    {/* Progress overlay ring */}
                    <div className="absolute -bottom-2 -right-2 bg-cream-deep rounded-full p-0.5 shadow">
                      <div className="relative flex items-center justify-center">
                        {/* <ProgressRing
                          progress={book.progress}
                          size={36}
                          stroke={3}
                        />
                        <span className="absolute text-[0.6rem] font-dm font-semibold text-sienna">
                          {book.progress}%
                        </span> */}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                    <div>
                      <p className="font-lora font-medium text-[1rem] text-ink leading-snug line-clamp-2">
                        {book.name}
                      </p>
                      <p className="mt-1 text-[0.78rem] font-dm text-ink/45">
                        {book.author}
                      </p>
                    </div>

                    <div className="mt-3">
                      {/* Progress bar */}
                      <div className="w-full h-1 bg-ink/8 rounded-full overflow-hidden">
                        {/* <div
                          className="h-full bg-sienna rounded-full transition-all duration-700"
                          style={{ width: `${book.progress}%` }}
                        /> */}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        {/* <span className="text-[0.72rem] font-dm text-ink/35">
                          p. {book.currentPage} of {book.totalPages}
                        </span> */}
                        <button className="text-[0.72rem] font-dm font-medium text-sienna hover:underline">
                          Continue →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Tabbed lower sections ────────────────────────────── */}
        <section>
          {/* Tab bar */}
          <div className="flex items-end gap-0 border-b border-ink/8 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "relative px-5 py-3 text-[0.875rem] font-dm font-medium transition-all duration-200 whitespace-nowrap",
                  activeTab === tab.key
                    ? "text-ink after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-sienna after:rounded-full"
                    : "text-ink/40 hover:text-ink/70",
                ].join(" ")}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span
                    className={[
                      "ml-2 px-2 py-0.5 rounded-full text-[0.68rem] font-medium transition-colors",
                      activeTab === tab.key
                        ? "bg-sienna/10 text-sienna"
                        : "bg-ink/6 text-ink/35",
                    ].join(" ")}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Want to Read */}
          {activeTab === "want" && (
            <div>
              <BookCarousel
                books={yourBookData.data?.want_to_read || []}
                isLoading={readingLoading}
                isError={false}
                errorMessage="Failed to load books for this genre."
                emptyMessage="No books found for this genre."
                heightClass="h-122"
                gapClass="gap-x-12"
                showDots
                className="mt-8"
              />
            </div>
          )}

          {/* Recommendations */}
          {activeTab === "recs" && (
            <div className="flex flex-col gap-6">
              <p className="text-[0.875rem] font-dm text-ink/50 -mt-2">
                Curated picks based on what you've loved.
              </p>

              {recsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                  ))}
                </div>
              ) : recommendations.length === 0 ? (
                <div className="rounded-2xl border border-ink/8 bg-white/60 py-10 flex flex-col items-center gap-2 text-ink/30">
                  <span className="font-dm text-[0.875rem]">
                    Read a few books and we'll suggest more.
                  </span>
                </div>
              ) : (
                <>
                  {/* Featured rec — first book larger */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    {/* Hero rec */}
                    <div className="lg:col-span-2 group rounded-2xl border border-ink/8 bg-white/70 hover:bg-white hover:shadow-xl hover:shadow-ink/6 transition-all duration-300 p-6 flex gap-5 cursor-pointer">
                      <img
                        src={recommendations[0].cover}
                        alt={recommendations[0].name}
                        className="w-24 h-34 object-cover rounded-xl shadow-md shrink-0 group-hover:shadow-lg transition-shadow"
                      />
                      <div className="flex flex-col justify-between min-w-0 flex-1">
                        <div>
                          <span className="text-[0.68rem] uppercase tracking-widest font-medium text-sienna font-dm block mb-2">
                            Top pick for you
                          </span>
                          <p className="font-lora font-medium text-[1.1rem] text-ink leading-snug line-clamp-2">
                            {recommendations[0].name}
                          </p>
                          <p className="mt-1.5 text-[0.8rem] font-dm text-ink/45">
                            {recommendations[0].author}
                          </p>
                          <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-ink/5 text-ink/40 text-[0.7rem] font-dm">
                            {recommendations[0].genre}
                          </span>
                        </div>
                        <button
                          //   onClick={() => addBook(recommendations[0].id)}
                          className="mt-4 self-start flex items-center gap-1.5 px-4 py-2 rounded-[40px] bg-sienna text-white text-[0.78rem] font-dm font-medium hover:-translate-y-0.5 transition-all hover:shadow-md hover:shadow-sienna/25"
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          Add to list
                        </button>
                      </div>
                    </div>

                    {/* Rest of recs as compact list */}
                    <div className="lg:col-span-3 flex flex-col gap-3">
                      {recommendations.slice(1).map((book) => (
                        <div
                          key={book.id}
                          className="group rounded-xl border border-ink/8 bg-white/60 hover:bg-white hover:shadow-md hover:shadow-ink/5 transition-all duration-200 px-4 py-3 flex items-center gap-4 cursor-pointer"
                        >
                          <img
                            src={book.cover}
                            alt={book.name}
                            className="w-10 h-14 object-cover rounded-lg shadow-sm shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-dm font-medium text-[0.875rem] text-ink line-clamp-1">
                              {book.name}
                            </p>
                            <p className="text-[0.78rem] font-dm text-ink/40 mt-0.5">
                              {book.author}
                            </p>
                          </div>
                          <span className="hidden sm:block text-[0.72rem] font-dm text-ink/30 bg-ink/5 px-2.5 py-1 rounded-full shrink-0">
                            {book.genre}
                          </span>
                          <button
                            // onClick={() => addBook(book.id)}
                            className="shrink-0 w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center text-ink/30 hover:border-sienna hover:text-sienna hover:bg-sienna/5 transition-all duration-200"
                            aria-label="Add to want to read"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Currently Reading tab (scrollable shelf version) */}
          {activeTab === "reading" && (
            <>
              <BookCarousel
                books={yourBookData.data?.currently_reading || []}
                isLoading={readingLoading}
                isError={false}
                errorMessage="Failed to load books for this genre."
                emptyMessage="No books found for this genre."
                heightClass="h-122"
                gapClass="gap-x-12"
                showDots
                className="mt-8"
              />
            </>
          )}
        </section>

        {/* ── Favourite genre badge ────────────────────────────── */}
        {stats?.favoriteGenre && (
          <section className="rounded-2xl bg-ink relative overflow-hidden py-8 px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: "200px",
              }}
            />
            <div className="absolute right-0 top-0 w-48 h-48 bg-sienna/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[0.72rem] uppercase tracking-widest font-dm text-sienna font-medium block mb-1.5">
                Your favourite genre
              </span>
              <h3 className="font-lora text-2xl font-medium text-white">
                {stats.favoriteGenre}
              </h3>
              <p className="mt-1 text-white/40 text-[0.85rem] font-dm">
                Most of your reading this year has been{" "}
                {stats.favoriteGenre.toLowerCase()}.
              </p>
            </div>
            <button className="relative z-10 shrink-0 px-6 py-3 rounded-[40px] border border-white/15 text-white/80 text-[0.85rem] font-dm font-medium hover:bg-white/10 hover:border-white/30 hover:-translate-y-0.5 transition-all duration-200">
              Explore {stats.favoriteGenre} →
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
