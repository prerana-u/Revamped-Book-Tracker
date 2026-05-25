/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
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
import BookCarousel, {
  type BookCarouselItem,
} from "../../common_components/BookCarousel";

interface Genre {
  image: React.ReactNode;
  label: string;
  value: string;
}

const GENRES: Genre[] = [
  {
    value: "horror",
    label: "Horror",
    image: (
      <SvgIcon
        src={horrorIcon}
        alt="Horror Icon"
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
        alt="Romance Icon"
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
        alt="Fantasy Icon"
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
        alt="Fiction Icon"
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
        alt="Mystery Icon"
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
        alt="Thriller Icon"
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
        alt="Science Fiction Icon"
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
        alt="Historical Fiction Icon"
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
        alt="Non Fiction Icon"
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
        alt="Fantasy Romance Icon"
        className="w-6 h-6 text-sienna"
      />
    ),
  },
];

export default function GenresSection() {
  const [activeGenre, setActiveGenre] = useState("horror");

  const {
    data: books = [],
    isLoading,
    isError,
  } = useQuery<BookCarouselItem[], Error>({
    queryKey: ["booksByGenre", activeGenre],
    queryFn: async () => {
      const response = await api.get<BookCarouselItem[]>("/getbooksbygenre", {
        params: {
          genre: activeGenre.replace(/\b\w/g, (char) => char.toUpperCase()),
        },
      });
      return response.data;
    },
  });

  const { data: genreCounts = [] } = useQuery<any[], Error>({
    queryKey: ["genreCounts"],
    queryFn: async () => {
      const response = await api.get<any[]>("/genrecount");
      return response.data;
    },
  });

  return (
    <div className="bg-cream-deep py-16 px-6 lg:px-16 flex flex-col h-fit">
      <div className="mx-auto w-full">
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
              key={value}
              onClick={() => setActiveGenre(value)}
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

        {/* Drop-in BookCarousel — zero carousel logic lives here anymore */}
        <BookCarousel
          books={books}
          isLoading={isLoading}
          isError={isError}
          errorMessage="Failed to load books for this genre."
          emptyMessage="No books found for this genre."
          heightClass="h-122"
          gapClass="gap-x-12"
          showDots
          className="mt-8"
        />
      </div>
    </div>
  );
}
