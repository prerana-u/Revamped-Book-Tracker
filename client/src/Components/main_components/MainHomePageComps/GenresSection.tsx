/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import horrorIcon from "../../../assets/png/horrorIcon.png";
import romanceIcon from "../../../assets/png/romanceIcon.png";
import fantasyIcon from "../../../assets/png/fantasyIcon.png";
import fictionIcon from "../../../assets/png/fictionIcon.png";
import mysteryIcon from "../../../assets/png/mysteryIcon.png";
import thrillerIcon from "../../../assets/png/thrillerIcon.png";
import scienceFictionIcon from "../../../assets/png/scienceFictionIcon.png";
import historicalFictionIcon from "../../../assets/png/historicalFictionIcon.png";
import nonFictionIcon from "../../../assets/png/nonFictionIcon.png";
import SvgIcon from "../../common_components/SvgIcon";
import { api } from "../../../lib/axios-instance";
import BookComp from "../../common_components/BookComp";

interface Genre {
  image: React.ReactNode;
  label: string;
  value: string;
}

interface BookData {
  name: string;
  cover: string;
  genre: string;
  author: string;
}

const GENRES: Genre[] = [
  {
    value: "horror",
    label: "Horror",
    image: (
      <SvgIcon
        src={horrorIcon}
        alt={"Horror Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
  },
  {
    value: "romance",
    label: "Romance",
    image: (
      <SvgIcon
        src={romanceIcon}
        alt={"Romance Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
  },
  {
    value: "fantasy",
    label: "Fantasy",
    image: (
      <SvgIcon
        src={fantasyIcon}
        alt={"Fantasy Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
  },
  {
    value: "fiction",
    label: "Fiction",
    image: (
      <SvgIcon
        src={fictionIcon}
        alt={"Fiction Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
  },
  {
    value: "mystery",
    label: "Mystery",
    image: (
      <SvgIcon
        src={mysteryIcon}
        alt={"Mystery Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
  },
  {
    value: "thriller",
    label: "Thriller",
    image: (
      <SvgIcon
        src={thrillerIcon}
        alt={"Thriller Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
  },
  {
    value: "science fiction",
    label: "Science Fiction",
    image: (
      <SvgIcon
        src={scienceFictionIcon}
        alt={"Science Fiction Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
  },
  {
    value: "historical fiction",
    label: "Historical Fiction",
    image: (
      <SvgIcon
        src={historicalFictionIcon}
        alt={"Historical Fiction Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
  },
  {
    value: "non fiction",
    label: "Non Fiction",
    image: (
      <SvgIcon
        src={nonFictionIcon}
        alt={"Non Fiction Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
  },
  {
    value: "fantasy romance",
    label: "Fantasy Romance",
    image: (
      <SvgIcon
        src={romanceIcon}
        alt={"Fantasy Romance Icon"}
        className="w-6 h-6 text-sienna"
      />
    ),
  },
];

/** Returns the number of visible columns based on current container width. */
function useVisibleColumns(
  containerRef: React.RefObject<HTMLDivElement>,
): number {
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w >= 1280)
        setCols(4); // xl
      else if (w >= 1024)
        setCols(3); // lg
      else if (w >= 768)
        setCols(2); // md
      else setCols(1); // sm
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  return cols;
}

export default function GenresSection() {
  const [activeGenre, setActiveGenre] = useState("horror");
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null!);
  const visibleCols = useVisibleColumns(containerRef);

  const {
    data: bookdatabyGenre = [],
    isLoading,
    isError,
  } = useQuery<BookData[], Error>({
    queryKey: ["booksByGenre", activeGenre],
    queryFn: async () => {
      const response = await api.get<BookData[]>("/getbooksbygenre", {
        params: {
          genre: activeGenre.replace(/\b\w/g, (char) => char.toUpperCase()),
        },
      });
      return response.data;
    },
  });

  const {
    data: genreCounts = [],
    isLoading: isGenreCountsLoading,
    isError: isGenreCountsError,
  } = useQuery<any[], Error>({
    queryKey: ["genreCounts"],
    queryFn: async () => {
      const response = await api.get<any[]>("/genrecount");
      return response.data;
    },
  });
  console.log("Genre counts:", genreCounts);

  // Reset carousel page whenever genre or visible column count changes
  useEffect(() => {
    setPage(0);
  }, [activeGenre, visibleCols]);

  const totalPages = Math.ceil(bookdatabyGenre.length / visibleCols);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  const visibleBooks = useMemo(() => {
    const start = safePage * visibleCols;
    return bookdatabyGenre.slice(start, start + visibleCols);
  }, [bookdatabyGenre, safePage, visibleCols]);

  const canGoPrev = safePage > 0;
  const canGoNext = safePage < totalPages - 1;

  const handleGenreChange = (value: string) => {
    setActiveGenre(value);
    setPage(0);
  };

  // Column class driven by visibleCols so the grid always matches
  const gridColsClass =
    visibleCols === 4
      ? "grid-cols-4"
      : visibleCols === 3
        ? "grid-cols-3"
        : visibleCols === 2
          ? "grid-cols-2"
          : "grid-cols-1";

  return (
    <div className="bg-cream-deep py-16 px-6 lg:px-16 flex flex-col h-fit">
      <div className=" mx-auto w-full">
        <span className="text-[0.75rem] uppercase tracking-[0.08em] font-medium text-sienna block mb-4">
          Browse by genre
        </span>
        <h2 className="font-lora font-medium text-[clamp(1.8rem,3vw,2.8rem)] leading-[1.2] tracking-tight text-ink">
          Whatever you're in the mood for
        </h2>

        {/* Genre pill buttons */}
        <div className="flex flex-wrap gap-3 mt-8">
          {GENRES.map(({ value, label, image }) => (
            <button
              key={label}
              onClick={() => handleGenreChange(value)}
              className={[
                "flex items-center gap-2 px-5 py-2.5 rounded-[40px] text-[0.875rem] cursor-pointer whitespace-nowrap transition-all duration-200 border font-dm",
                activeGenre === value
                  ? "bg-sienna text-white border-sienna"
                  : "bg-white text-ink-soft border-ink/10 hover:bg-sienna hover:text-white hover:border-sienna hover:-translate-y-0.5",
              ].join(" ")}
            >
              {image} {label}{" "}
              {genreCounts.find((g) => g._id === label)?.count || 0}
            </button>
          ))}
        </div>

        {/* Carousel */}
        <div className="flex items-center gap-4 mt-8" ref={containerRef}>
          {/* Prev arrow */}
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!canGoPrev || isLoading || isError}
            aria-label="Previous books"
            className={[
              "shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200",
              canGoPrev && !isLoading && !isError
                ? "border-sienna text-sienna hover:bg-sienna hover:text-white cursor-pointer"
                : "border-ink/10 text-ink/20 cursor-not-allowed",
            ].join(" ")}
          >
            {/* Left chevron */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 3L5 8L10 13"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Book grid — fixed height so the section doesn't shift */}
          <div className="flex-1 min-w-0">
            <div className={`grid ${gridColsClass} gap-x-12 h-122`}>
              {isLoading ? (
                <div className="col-span-full flex items-center justify-center text-ink-soft">
                  Loading books...
                </div>
              ) : isError ? (
                <div className="col-span-full flex items-center justify-center text-red-600">
                  Failed to load books for this genre.
                </div>
              ) : bookdatabyGenre.length === 0 ? (
                <div className="col-span-full flex items-center justify-center text-ink-soft">
                  No books found for this genre.
                </div>
              ) : (
                visibleBooks.map((data: BookData, index: number) => (
                  <BookComp
                    key={`${data.name}-${index}`}
                    className="place-items-center"
                    name={data.name}
                    cover={data.cover}
                    genre={data.genre}
                    author={data.author}
                  />
                ))
              )}
            </div>
          </div>

          {/* Next arrow */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={!canGoNext || isLoading || isError}
            aria-label="Next books"
            className={[
              "flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200",
              canGoNext && !isLoading && !isError
                ? "border-sienna text-sienna hover:bg-sienna hover:text-white cursor-pointer"
                : "border-ink/10 text-ink/20 cursor-not-allowed",
            ].join(" ")}
          >
            {/* Right chevron */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 3L11 8L6 13"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Dot indicators */}
        {totalPages > 1 && !isLoading && !isError && (
          <div className="flex justify-center gap-2 mt-10">
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
    </div>
  );
}
