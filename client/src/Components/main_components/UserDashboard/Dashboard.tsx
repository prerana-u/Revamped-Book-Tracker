/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/axios-instance";
import NavBar from "../../common_components/Navbar";
import { useAuth } from "../../../context/useAuth";
import BookCarousel from "../../common_components/BookCarousel";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ShelfDropdown, type ShelfOption } from "../DetailsPage/ShelfDropdown";
import { ReadingProgressModal } from "../DetailsPage/ReadingProgressModal";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */
interface BookData {
  whyRecommended?: string;
  bookid: string;
  title: string;
  cover: string;
  genre: string;
  author: string;
}

interface CurrentlyReadingBook {
  id: string;
  bookid: string;
  title: string;
  author: string;
  cover?: string;
  googleId?: string;
  current_page?: number;
  page_count?: number;
}

interface UserBookData {
  error: string | null;
  message: string;
  data: {
    currently_reading: CurrentlyReadingBook[];
    want_to_read: any[];
    books_read: any[];
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

/** Skeleton pulse block */
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-ink/8 rounded-lg ${className ?? ""}`} />
  );
}

/* ─── Main Dashboard ────────────────────────────────────────── */
export default function UserDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [readingPage, setReadingPage] = useState(0);

  const [coverMap, setCoverMap] = useState<
    Record<string, { thumbnail: string; googleId: string }>
  >({});

  const [activeTab, setActiveTab] = useState<
    "reading" | "want" | "recs" | "read"
  >("want");
  const [selectedRecommendationShelves, setSelectedRecommendationShelves] =
    useState<Record<string, ShelfOption>>({});
  const [progressModalBook, setProgressModalBook] =
    useState<CurrentlyReadingBook | null>(null);

  const fetchCurrentlyReading = (): Promise<UserBookData> =>
    api.get(`/user-books/${user.id}`).then((r) => r.data);

  const { data: stats } = useQuery({
    queryKey: ["userStats"],
    queryFn: fetchUserStats,
  });

  const {
    data: yourBookData = {} as UserBookData,
    isLoading: readingLoading,
    isError: readingError,
  } = useQuery({
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

  const fetchCoverForBook = async (title: string, author?: string) => {
    const res = await axios.get("http://localhost:3001/getbookdata", {
      params: {
        title,
        ...(author && { author }),
      },
    });
    return res.data;
  };

  const shelfMapping: Record<
    ShelfOption,
    "want_to_read" | "currently_reading" | "books_read"
  > = {
    "Want to Read": "want_to_read",
    "Currently Reading": "currently_reading",
    Read: "books_read",
  };

  const toSecureCoverUrl = (url?: string) =>
    (url ? url.replace(/^http:/i, "https:") : "") ||
    "https://via.placeholder.com/150x220?text=No+Cover";

  const refreshRecommendations = async () => {
    await api.post("/user/recommendations/refresh");
    await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
  };

  const addBookToShelf = async (book: BookData, shelf: ShelfOption) => {
    if (!user?.id) {
      return;
    }

    const payload = {
      shelf: shelfMapping[shelf],
      book: {
        id: book.bookid,
        title: book.title,
        author: book.author,
        bookid: book.bookid,
      },
    };

    await api.post("/user-shelf", payload);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["userBookData"] }),
      queryClient.invalidateQueries({ queryKey: ["userStats"] }),
      queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
    ]);
    setSelectedRecommendationShelves((prev) => ({
      ...prev,
      [book.bookid]: shelf,
    }));
  };

  const saveReadingProgress = async (
    book: CurrentlyReadingBook,
    currentPage: number,
  ) => {
    await api.post("/user-books/progress", {
      bookId: book.id ?? book.bookid,
      currentPage,
      pageCount: book.page_count,
      title: book.title,
      author: book.author,
      bookid: book.bookid,
    });
  };

  const handleSaveProgress = async (currentPage: number) => {
    if (!progressModalBook) return;

    const book = progressModalBook;

    await toast.promise(
      saveReadingProgress(book, currentPage).then(() =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["userBookData"] }),
          queryClient.invalidateQueries({ queryKey: ["userStats"] }),
        ]),
      ),
      {
        loading: "Saving progress...",
        success: <b>Progress saved!</b>,
        error: <b>Could not save your progress.</b>,
      },
    );
  };

  useEffect(() => {
    const books = yourBookData.data?.currently_reading || [];
    const missingCoverBooks = books.filter(
      (book: any) => !book.cover || book.cover === "",
    );

    if (!missingCoverBooks.length) return;

    let isMounted = true;

    const loadCovers = async () => {
      const coverEntries = await Promise.all(
        missingCoverBooks.map(async (book: any) => {
          const title = book.title ?? book.title;
          try {
            const data = await fetchCoverForBook(title, book.author);

            if (data?.thumbnail) {
              return [book.bookid, data.thumbnail, data.googleId] as const;
            }
          } catch (err) {
            console.error("Failed to fetch cover for", title, err);
          }
          return null;
        }),
      );

      if (!isMounted) return;

      const newCoverMap = coverEntries.reduce(
        (acc, entry) => {
          if (entry)
            acc[entry[0]] = { thumbnail: entry[1], googleId: entry[2] };
          return acc;
        },
        {} as Record<string, { thumbnail: string; googleId: string }>,
      );

      setCoverMap((prev) => ({ ...prev, ...newCoverMap }));
    };

    loadCovers();

    return () => {
      isMounted = false;
    };
  }, [yourBookData.data?.currently_reading]);

  const tabs = [
    {
      key: "want" as const,
      label: "Want to Read",
      count: yourBookData.data?.want_to_read?.length,
    },
    {
      key: "read" as const,
      label: "Books Read",
      count: yourBookData.data?.books_read?.length,
    },
    { key: "recs" as const, label: "For You", count: null },
  ];

  useEffect(() => {
    console.log(yourBookData.data, "Book Data");
  }, [yourBookData.data]);

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
              Welcome, {user.username || "reader"}!{" "}
            </h1>
            <p className="mt-1.5 text-white/40 font-dm text-[0.9rem]">
              {yourBookData.data?.currently_reading?.length > 0
                ? `You're reading ${yourBookData.data?.currently_reading.length} book${yourBookData.data?.currently_reading.length > 1 ? "s" : ""} right now.`
                : "Pick up where you left off, or start something new."}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 sm:gap-8">
            {readingLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <Skeleton className="w-12 h-6" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                ))
              : [
                  {
                    value: yourBookData.data?.books_read?.length ?? 0,
                    label: "Books read",
                  },
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
          ) : yourBookData.data?.currently_reading?.length === 0 ||
            readingError ? (
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
            (() => {
              const CARDS_PER_PAGE = 3;
              const books = yourBookData.data?.currently_reading || [];
              const pageCount = Math.ceil(books.length / CARDS_PER_PAGE);
              const clampedPage = Math.min(
                readingPage,
                Math.max(pageCount - 1, 0),
              );

              return (
                <div className="">
                  <div className="overflow-hidden">
                    <div
                      className="flex transition-transform duration-500 ease-out"
                      style={{
                        transform: `translateX(-${clampedPage * 100}%)`,
                      }}
                    >
                      {Array.from({ length: pageCount }).map((_, pageIdx) => (
                        <div
                          key={pageIdx}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full shrink-0"
                        >
                          {books
                            .slice(
                              pageIdx * CARDS_PER_PAGE,
                              pageIdx * CARDS_PER_PAGE + CARDS_PER_PAGE,
                            )
                            .map((book) => {
                              const bookPageCount = book.page_count;
                              const currentPage = book.current_page ?? 0;
                              const percent =
                                bookPageCount && bookPageCount > 0
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        (currentPage / bookPageCount) * 100,
                                      ),
                                    )
                                  : null;

                              return (
                                <div
                                  key={book.bookid}
                                  className="group rounded-2xl border border-ink/8 bg-white/70 hover:bg-white hover:shadow-xl hover:shadow-ink/6 transition-all duration-300 p-5 flex gap-4 cursor-pointer"
                                >
                                  {/* Cover */}
                                  <div className="relative shrink-0">
                                    <Link
                                      to={`/book-details/${coverMap[book.bookid]?.googleId || book.googleId}`}
                                    >
                                      <img
                                        src={toSecureCoverUrl(
                                          coverMap[book.bookid]?.thumbnail ??
                                            book.cover,
                                        )}
                                        alt={book.title}
                                        className="w-20 h-28 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
                                      />
                                    </Link>
                                    {/* Progress overlay ring */}
                                    {percent !== null && (
                                      <div className="absolute -bottom-2 -right-2 bg-cream-deep rounded-full p-0.5 shadow">
                                        <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white">
                                          <span className="text-[0.62rem] font-dm font-semibold text-sienna">
                                            {percent}%
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                                    <div>
                                      <Link
                                        to={`/book-details/${coverMap[book.bookid]?.googleId || book.googleId}`}
                                        className="font-lora font-medium text-[1rem] text-ink leading-snug line-clamp-2 hover:underline"
                                      >
                                        {book.title}
                                      </Link>
                                      <p className="mt-1 text-[0.78rem] font-dm text-ink/45">
                                        {book.author}
                                      </p>
                                    </div>

                                    <div className="mt-3">
                                      {/* Progress bar */}
                                      <div className="w-full h-1 bg-ink/8 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-sienna rounded-full transition-all duration-700"
                                          style={{
                                            width: `${percent ?? 0}%`,
                                          }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between mt-1.5">
                                        <span className="text-[0.72rem] font-dm text-ink/35">
                                          {bookPageCount
                                            ? `p. ${currentPage} of ${bookPageCount}`
                                            : `p. 0 of ${bookPageCount}`}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setProgressModalBook(book);
                                          }}
                                          className="text-[0.72rem] font-dm font-medium text-sienna hover:underline"
                                        >
                                          Update Progress →
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Carousel controls */}
                  {pageCount > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-5">
                      <button
                        onClick={() =>
                          setReadingPage((p) => Math.max(p - 1, 0))
                        }
                        disabled={clampedPage === 0}
                        aria-label="Previous books"
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-ink/10 text-ink/50 hover:text-ink hover:border-ink/25 disabled:opacity-30 disabled:hover:text-ink/50 disabled:hover:border-ink/10 transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: pageCount }).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setReadingPage(idx)}
                            aria-label={`Go to page ${idx + 1}`}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              idx === clampedPage
                                ? "w-5 bg-sienna"
                                : "w-1.5 bg-ink/15 hover:bg-ink/25"
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          setReadingPage((p) => Math.min(p + 1, pageCount - 1))
                        }
                        disabled={clampedPage === pageCount - 1}
                        aria-label="Next books"
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-ink/10 text-ink/50 hover:text-ink hover:border-ink/25 disabled:opacity-30 disabled:hover:text-ink/50 disabled:hover:border-ink/10 transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </section>

        {/* ── Tabbed lower sections ────────────────────────────── */}
        <section>
          {/* Tab bar */}
          <div className="flex items-end gap-0 border-b border-ink/8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "relative px-5 py-3 text-[0.875rem] font-dm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ",
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
                errorMessage="Failed to load books."
                emptyMessage="No books found."
                heightClass="h-122"
                gapClass="gap-x-12"
                showDots
                className="mt-2"
              />
            </div>
          )}

          {activeTab === "read" && (
            <div>
              <BookCarousel
                books={yourBookData.data?.books_read || []}
                isLoading={readingLoading}
                isError={false}
                errorMessage="Failed to load books."
                emptyMessage="No books found."
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
              <div className="flex items-center justify-between border-b border-ink/8 pb-3">
                <p className="text-[0.875rem] font-dm text-ink -mt-2">
                  AI Curated picks based on what you've loved.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    toast.promise(refreshRecommendations(), {
                      loading: "Refreshing recommendations...",
                      success: <b>Fresh recommendations loaded.</b>,
                      error: <b>Could not refresh recommendations.</b>,
                    });
                  }}
                  disabled={recsLoading}
                  className="bg-sienna p-4 text-white text-sm font-dm rounded-md flex items-center gap-2 hover:opacity-90 transition-opacity justify-center"
                >
                  <RefreshCcw size={20} /> Refresh Recs
                </button>
              </div>

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
                        src={toSecureCoverUrl(recommendations[0].cover)}
                        alt={recommendations[0].title}
                        className="w-24 h-34 object-cover rounded-xl shadow-md shrink-0 group-hover:shadow-lg transition-shadow"
                      />
                      <div className="flex flex-col justify-between min-w-0 flex-1">
                        <div>
                          <span className="text-[0.68rem] uppercase tracking-widest font-medium text-sienna font-dm block mb-2">
                            Top pick for you
                          </span>
                          <Link
                            to={`/book-details/${recommendations[0].bookid}`}
                            className="font-lora font-medium text-[1.1rem] text-ink leading-snug line-clamp-2 hover:underline hover:text-sienna transition-colors duration-200"
                          >
                            {recommendations[0].title}
                          </Link>
                          <p className="mt-1.5 text-[0.8rem] font-dm text-ink/45">
                            {recommendations[0].author}
                          </p>
                          <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-ink/5 text-ink/40 text-[0.7rem] font-dm">
                            {recommendations[0].genre}
                          </span>
                          <p className="mt-2 text-[0.85rem] font-dm text-ink/45">
                            {recommendations[0].whyRecommended}
                          </p>
                        </div>
                        <div className="mt-4 self-start w-52">
                          <ShelfDropdown
                            selected={
                              selectedRecommendationShelves[
                                recommendations[0].bookid
                              ] ?? "Want to Read"
                            }
                            onSelect={(shelf) => {
                              toast.promise(
                                addBookToShelf(recommendations[0], shelf),
                                {
                                  loading: "Saving...",
                                  success: <b>Saved to shelf!</b>,
                                  error: <b>Could not save this book.</b>,
                                },
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rest of recs as compact list */}
                    <div className="lg:col-span-3 flex flex-col gap-3">
                      {recommendations.slice(1).map((book) => (
                        <div
                          key={book.bookid}
                          className="group rounded-xl border border-ink/8 bg-white/60 hover:bg-white hover:shadow-md hover:shadow-ink/5 transition-all duration-200 px-4 py-3 flex items-center gap-4 cursor-pointer"
                        >
                          <img
                            src={toSecureCoverUrl(book.cover)}
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded-lg shadow-sm shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/book-details/${book.bookid}`}
                              className="font-dm font-medium text-[0.875rem] text-ink line-clamp-1 hover:underline hover:text-sienna transition-colors duration-200"
                            >
                              {book.title}
                            </Link>
                            <p className="text-[0.78rem] font-dm text-ink/40 mt-0.5">
                              {book.author}
                            </p>
                          </div>
                          <span className="hidden sm:block text-[0.72rem] font-dm text-ink/30 bg-ink/5 px-2.5 py-1 rounded-full shrink-0">
                            {book.genre}
                          </span>
                          <div className="shrink-0 w-32">
                            <ShelfDropdown
                              compact
                              selected={
                                selectedRecommendationShelves[book.bookid] ??
                                "Want to Read"
                              }
                              onSelect={(shelf) => {
                                toast.promise(addBookToShelf(book, shelf), {
                                  loading: "Saving...",
                                  success: <b>Saved to shelf!</b>,
                                  error: <b>Could not save this book.</b>,
                                });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
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

      {progressModalBook && (
        <ReadingProgressModal
          title={progressModalBook.title}
          author={progressModalBook.author}
          pageCount={progressModalBook.page_count}
          initialCurrentPage={progressModalBook.current_page ?? 0}
          onClose={() => setProgressModalBook(null)}
          onSave={handleSaveProgress}
        />
      )}
    </div>
  );
}
