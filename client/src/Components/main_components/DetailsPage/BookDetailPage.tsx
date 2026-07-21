/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ShelfDropdown, type ShelfOption } from "./ShelfDropdown";
import { StarRating } from "./StarRating";
import { BookDetailsGrid } from "./BookDetailsGrid";
import { EditionTable } from "./EditionTable";
import DOMPurify from "dompurify";
import { api } from "../../../lib/axios-instance";
import { useAuth } from "../../../context/useAuth";
import { useParams } from "react-router-dom";
import { PenTool, Share } from "lucide-react";
import NavBar from "../../common_components/Navbar";
import { RatingDisplay } from "./RatingDisplay";
import toast from "react-hot-toast";

interface BookDetail {
  title: string;
  author: string;
  rating: number;
  totalRatings: string;
  descriptionShort: string;
  descriptionFull: string;
  genres: string[];
  language?: string;
  isbn10?: string;
  isbn13?: string;
  textSnippet?: string;
  publisher: string;
  published_date: string;
  pageCount?: number;
}

interface ApiBookResponse {
  title?: string;
  authors?: string[];
  description?: string;
  thumbnail?: string;
  publishedDate?: string;
  pageCount?: number;
  publisher?: string;
  averageRating?: number;
  [key: string]: any;
}

const BOOK = {
  title: "The Shippers",
  author: "Katherine Center",
  authorTag: "New York Times Bestselling Author",
  rating: 3.94,
  totalRatings: "20,562",
  totalReviews: "7,467",
  descriptionShort: `After a whole lifetime of being bad at love, JoJo Burton decides to solve her intimacy issues once and for all at her sister's destination wedding on a cruise ship. Armed with pop psychology, she enlists the help of her best friend — charming, infuriatingly perceptive Ben — to coach her into falling for someone new. What could possibly go wrong?`,
  descriptionFull: `What could possibly go wrong? Quite a lot, it turns out — especially when the line between friendship and something more begins to blur against the backdrop of ocean sunsets, terrible karaoke, and a wedding that refuses to go to plan.

Funny, warm, and unexpectedly moving, The Shippers is Katherine Center at her very best: a story about the courage it takes to stop running from love, and the joy of finding it exactly where you weren't looking.`,
  genres: [
    "Romance",
    "Contemporary",
    "Friends To Lovers",
    "Fiction",
    "Rom-Com",
    "Audiobook",
    "Humor",
  ],
  detailCells: [
    { key: "Format", value: "336 pages, Hardcover" },
    { key: "First published", value: "May 19, 2026" },
    { key: "Original title", value: "The Shippers" },
    { key: "ISBN", value: "9781250408051" },
  ],
  metaRows: [
    { key: "Pages", value: "336" },
    { key: "Format", value: "Hardcover" },
    { key: "Published", value: "May 19, 2026" },
    { key: "Publisher", value: "St. Martin's Press" },
  ],
  editionRows: [
    { key: "Format", value: "336 pages, Hardcover" },
    { key: "Published", value: "May 19, 2026 by St. Martin's Press" },
    { key: "ISBN", value: "9781250408051 (ISBN10: 1250408059)" },
    { key: "Language", value: "English" },
  ],
};

const fetchBookData = (id: string): Promise<ApiBookResponse> =>
  api.get(`/getbookbyid?id=${id}`).then((r) => r.data);

export const BookDetailPage: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const { id } = useParams();
  const { user } = useAuth();
  const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

  const { data, isLoading, isError } = useQuery<ApiBookResponse>({
    queryKey: ["book-details", id],
    queryFn: () => fetchBookData(id as string),
    enabled: !!id,
  });

  const book: BookDetail = {
    title: data?.title ?? BOOK.title,
    author: data?.authors?.[0] ?? BOOK.author,
    rating: data?.averageRating ?? BOOK.rating,
    descriptionShort: data?.description ?? BOOK.descriptionShort,
    descriptionFull: data?.description ?? BOOK.descriptionFull,
    totalRatings: data?.averageRating ? data.averageRating.toString() : "0",
    publisher: data?.publisher ?? "Unknown Publisher",
    published_date: data?.publishedDate ?? "Unknown Date",
    pageCount: data?.pageCount ?? undefined,
    language: data?.language ?? "",
    isbn10: data?.isbn10 ?? "",
    isbn13: data?.isbn13 ?? "",
    textSnippet: data?.textSnippet ?? "",
    genres: data?.categories ?? BOOK.genres,
  };

  const [selectedShelfOverride, setSelectedShelfOverride] =
    useState<ShelfOption | null>(null);

  const fetchUserShelf = async () => {
    if (!user?.id)
      return {
        currently_reading: [],
        want_to_read: [],
        books_read: [],
      };

    try {
      const response = await api.get(`/user-books/${user.id}`);
      return response.data.data as {
        currently_reading: any[];
        want_to_read: any[];
        books_read: any[];
      };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return {
          currently_reading: [],
          want_to_read: [],
          books_read: [],
        };
      }
      throw error;
    }
  };

  const { data: userShelfData } = useQuery({
    queryKey: ["user-shelf", user?.id],
    queryFn: fetchUserShelf,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const initialSelectedShelf = useMemo<ShelfOption>(() => {
    if (!id || !userShelfData) {
      return "Want to Read";
    }

    const matchingShelf = [
      ["currently_reading", "Currently Reading"],
      ["want_to_read", "Want to Read"],
      ["books_read", "Read"],
    ] as const;

    const found = matchingShelf.find(([key]) =>
      userShelfData[key].some(
        (item: any) => item.id === id || item.bookid === id,
      ),
    );

    return found ? found[1] : "Want to Read";
  }, [id, userShelfData]);

  const selectedShelf = selectedShelfOverride ?? initialSelectedShelf;

  console.log("Fetched book data:", selectedShelf, userShelfData, book, data);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream font-dm text-ink p-10">
        Loading book details...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-cream font-dm text-ink p-10">
        Unable to load book details.
      </div>
    );
  }

  const shelfMapping: Record<
    ShelfOption,
    "want_to_read" | "currently_reading" | "books_read"
  > = {
    "Want to Read": "want_to_read",
    "Currently Reading": "currently_reading",
    Read: "books_read",
  };

  const saveBookToShelf = async (shelf: ShelfOption) => {
    if (!id) throw new Error("Missing book id");

    const payload = {
      shelf: shelfMapping[shelf],
      book: {
        id,
        title: book.title,
        author: book.author,
        bookid: data?.googleId || id,
      },
    };

    await api.post("/user-shelf", payload);
  };

  const handleShelfSelect = (shelf: ShelfOption) => {
    setSelectedShelfOverride(shelf);
    toast.promise(saveBookToShelf(shelf), {
      loading: "Saving...",
      success: <b>Saved to shelf!</b>,
      error: <b>Could not save this book.</b>,
    });
  };

  const handleRate = () => {
    // showToast("You rated this book");
  };

  const handleShare = () => {
    // showToast("Link copied!");
  };

  return (
    <div className="min-h-screen bg-cream font-dm text-ink">
      {/* <Navbar />
      <Breadcrumb crumbs={BREADCRUMBS} /> */}
      <NavBar />

      {/* Main layout */}
      <main className="max-w-270 mx-auto mt-16  px-8 py-10 pb-20 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-14 items-start">
        {/* ── Left column ── */}
        <aside className="flex flex-col items-center gap-4">
          {/* <BookCover title={BOOK.title} author={BOOK.author} badge="New" /> */}
          <img
            src={data?.thumbnail}
            alt={`${book.title} cover`}
            className="w-60 h-90 object-cover rounded-lg shadow"
          />
          {/* <button
            onClick={() => refreshBookCover(id as string)}
            className="bg-sienna border border-border-ink text-ink hover:bg-cream-hover hover:text-ink-hover transition-all duration-200"
          >
            Refresh Cover
          </button> */}
          <ShelfDropdown
            selected={selectedShelf}
            onSelect={handleShelfSelect}
          />
          <StarRating onRate={handleRate} />
          {/* <MetaCard rows={book.metaRows} /> */}
        </aside>

        {/* ── Right column ── */}
        <section className="pt-1">
          {/* Title + share */}
          <div className="flex items-start justify-between mb-1">
            <h1 className="font-lora text-[2.2rem] font-semibold text-ink leading-[1.15] tracking-tight">
              {book.title}
            </h1>
            <button
              onClick={handleShare}
              aria-label="Share this book"
              className="shrink-0 ml-4 mt-1 bg-transparent border border-border-ink rounded-lg px-2.5 py-2 text-ink-muted hover:border-border-ink-hover hover:text-ink transition-all duration-200 cursor-pointer"
            >
              <Share size={16} />
            </button>
          </div>

          {/* Author */}
          <div className="flex items-center gap-2 mb-4.5">
            <PenTool size={18} className="text-ink-muted" />
            <a
              href="#"
              className="font-lora text-base text-sienna no-underline hover:underline cursor-pointer"
            >
              {book.author}
            </a>
          </div>

          {/* Rating */}
          <RatingDisplay
            score={Number(book.totalRatings)}
            totalRatings={book.totalRatings}
          />

          {/* Description */}
          <div
            className={`book-description ${expanded ? "expanded" : "collapsed"}`}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(book.descriptionFull),
            }}
          />

          <button
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1 text-[0.875rem] text-sienna font-medium font-dm bg-transparent border-none cursor-pointer p-0 mb-7 hover:underline"
          >
            {expanded ? "Show less" : "Show more"}
            <i
              className={`ti ${expanded ? "ti-chevron-up" : "ti-chevron-down"} text-[14px]`}
              aria-hidden="true"
            />
          </button>

          {/* Genres */}
          {/* <GenrePills genres={book.genres} /> */}

          {/* Detail grid */}
          <h3 className="font-lora text-[1.1rem] font-semibold text-ink mb-3.5">
            More Details
          </h3>
          <BookDetailsGrid
            cells={[
              {
                key: "Language",
                value: languageNames.of(book.language || "") ?? "Unknown",
              },
              { key: "ISBN-10", value: book.isbn10 ?? "Unknown" },
              { key: "ISBN-13", value: book.isbn13 ?? "Unknown" },
              {
                key: "Page Count",
                value: book.pageCount?.toString() ?? "Unknown",
              },
            ]}
          />

          {/* Edition table */}
          <EditionTable
            rows={[
              { key: "Publisher", value: book.publisher },
              { key: "Published Date", value: book.published_date },
            ]}
          />
        </section>
      </main>

      {/* Toast */}
      {/* <Toast message={toast.message} visible={toast.visible} /> */}
    </div>
  );
};
