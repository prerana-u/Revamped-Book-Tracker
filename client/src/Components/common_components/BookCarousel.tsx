/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useRef, useState } from "react";
import BookComp from "./BookComp";

/* ─── Types ──────────────────────────────────────────────────── */
export interface BookCarouselItem {
  name: string;
  cover: string;
  genre: string;
  author: string;
}

export interface BookCarouselProps {
  /** The array of books to display */
  books: BookCarouselItem[];
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Show error state */
  isError?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Custom empty-state message */
  emptyMessage?: string;
  /** Fixed height of the carousel grid area (Tailwind h-* class, e.g. "h-122") */
  heightClass?: string;
  /** Override column breakpoints. Defaults: xl→4, lg→3, md→2, sm→1 */
  colBreakpoints?: { xl?: number; lg?: number; md?: number; sm?: number };
  /** Horizontal gap between cards (Tailwind gap-x-* class, e.g. "gap-x-12") */
  gapClass?: string;
  /** Show dot page indicators below the carousel */
  showDots?: boolean;
  /** Extra className on the root wrapper */
  className?: string;
}

/* ─── Hook: responsive column count ─────────────────────────── */
function useVisibleColumns(
  containerRef: React.RefObject<HTMLDivElement>,
  breakpoints: { xl: number; lg: number; md: number; sm: number },
): number {
  const [cols, setCols] = useState(breakpoints.xl);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w >= 1280) setCols(breakpoints.xl);
      else if (w >= 1024) setCols(breakpoints.lg);
      else if (w >= 768) setCols(breakpoints.md);
      else setCols(breakpoints.sm);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    containerRef,
    breakpoints.xl,
    breakpoints.lg,
    breakpoints.md,
    breakpoints.sm,
  ]);

  return cols;
}

/* ─── Chevron arrow button ───────────────────────────────────── */
function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous books" : "Next books"}
      className={[
        "flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200",
        !disabled
          ? "border-sienna text-sienna hover:bg-sienna hover:text-white cursor-pointer"
          : "border-ink/10 text-ink/20 cursor-not-allowed",
      ].join(" ")}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {direction === "prev" ? (
          <path
            d="M10 3L5 8L10 13"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M6 3L11 8L6 13"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

/* ─── BookCarousel ───────────────────────────────────────────── */
export default function BookCarousel({
  books,
  isLoading = false,
  isError = false,
  errorMessage = "Failed to load books.",
  emptyMessage = "No books found.",
  heightClass = "h-122",
  colBreakpoints,
  gapClass = "gap-x-12",
  showDots = true,
  className = "",
}: BookCarouselProps) {
  const bp = useMemo(
    () => ({
      xl: colBreakpoints?.xl ?? 4,
      lg: colBreakpoints?.lg ?? 3,
      md: colBreakpoints?.md ?? 2,
      sm: colBreakpoints?.sm ?? 1,
    }),
    [colBreakpoints],
  );

  const containerRef = useRef<HTMLDivElement>(null!);
  const visibleCols = useVisibleColumns(containerRef, bp);
  const [page, setPage] = useState(0);

  // Reset to page 0 when books list or column count changes
  useEffect(() => {
    setPage(0);
  }, [books, visibleCols]);

  const totalPages = Math.ceil(books.length / visibleCols);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  const visibleBooks = useMemo(() => {
    const start = safePage * visibleCols;
    return books.slice(start, start + visibleCols);
  }, [books, safePage, visibleCols]);

  const canGoPrev = safePage > 0;
  const canGoNext = safePage < totalPages - 1;

  const gridColsClass =
    visibleCols === 4
      ? "grid-cols-4"
      : visibleCols === 3
        ? "grid-cols-3"
        : visibleCols === 2
          ? "grid-cols-2"
          : "grid-cols-1";

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Carousel row */}
      <div className="flex items-center gap-4" ref={containerRef}>
        <ArrowButton
          direction="prev"
          disabled={!canGoPrev || isLoading || isError}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        />

        <div className="flex-1 min-w-0">
          <div className={`grid ${gridColsClass} ${gapClass} ${heightClass}`}>
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center text-ink-soft font-dm text-sm">
                Loading books…
              </div>
            ) : isError ? (
              <div className="col-span-full flex items-center justify-center text-red-600 font-dm text-sm">
                {errorMessage}
              </div>
            ) : books.length === 0 ? (
              <div className="col-span-full flex items-center justify-center text-ink-soft font-dm text-sm">
                {emptyMessage}
              </div>
            ) : (
              visibleBooks.map((book, index) => (
                <BookComp
                  key={`${book.name}-${index}`}
                  className="place-items-center"
                  name={book.name}
                  cover={book.cover}
                  genre={book.genre}
                  author={book.author}
                />
              ))
            )}
          </div>
        </div>

        <ArrowButton
          direction="next"
          disabled={!canGoNext || isLoading || isError}
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        />
      </div>

      {/* Dot indicators */}
      {showDots && totalPages > 1 && !isLoading && !isError && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-label={`Go to page ${i + 1}`}
              className={[
                "rounded-full transition-all duration-200",
                i === safePage
                  ? "w-5 h-2 bg-sienna"
                  : "w-2 h-2 bg-ink/20 hover:bg-sienna/50",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
