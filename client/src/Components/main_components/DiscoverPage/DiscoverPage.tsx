/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import NavBar from "../../common_components/Navbar";
import BookCarousel from "../../common_components/BookCarousel";
import GenresSection from "../MainHomePageComps/GenresSection";
import { api } from "../../../lib/axios-instance";
import { useQuery } from "@tanstack/react-query";

type MockBook = {
  id: string;
  title: string;
  author: string;
  cover?: string;
  genre?: string;
  date?: string;
};

interface PopularBookData {
  error: string | null;
  message: string;
  data: any;
}

const DiscoverPage: React.FC = () => {
  const fetchPopularBooks = (): Promise<PopularBookData> =>
    api.get(`/popular-books`).then((r) => r.data);

  const { data: popularBooks, isLoading: popularLoading } = useQuery({
    queryKey: ["popularBooks"],
    queryFn: fetchPopularBooks,
  });

  // Convert to BookCarousel expected shape
  const toCarouselItems = (items: MockBook[]) =>
    items?.map((b) => ({
      name: b.title,
      cover: b.cover ?? "",
      genre: b.genre ?? "",
      author: b.author,
    }));

  return (
    <div className="min-h-screen bg-cream-deep">
      <NavBar />
      <div className=" py-10 mt-16 flex flex-col gap-10">
        <header className="px-6 lg:px-16">
          <h1 className="font-lora font-medium text-[clamp(1.6rem,3vw,2.2rem)] text-ink leading-tight">
            Discover New Books
          </h1>
          <p className="mt-2 text-[0.95rem] font-dm text-ink/50">
            Curated lists and trending picks across genres.
          </p>
        </header>

        {/* <section className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-lora text-[1.1rem] font-medium text-ink">
              Popular in {selectedGenre}
            </h3>
            <a
              href="#"
              className="text-[0.85rem] font-dm text-ink/40 hover:text-ink"
            >
              See all →
            </a>
          </div>
          <BookCarousel
            books={toCarouselItems(genreBooks[selectedGenre] || popularBooks)}
            gapClass="gap-x-8"
            heightClass="h-44"
          />
        </section> */}

        <section className="px-6 lg:px-16">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[0.75rem] uppercase tracking-[0.08em] font-medium text-sienna block mb-4 font-lora">
              Trending Now
            </h3>
            <a
              href="#"
              className="text-[0.85rem] font-dm text-ink/40 hover:text-ink"
            >
              View trending →
            </a>
          </div>
          <h2 className="font-lora font-medium text-[clamp(1.8rem,3vw,2.8rem)] leading-[1.2] tracking-tight text-ink">
            Most Popular This Month
          </h2>
          <BookCarousel
            books={popularBooks ? toCarouselItems(popularBooks?.data) : []}
            isError={false}
            errorMessage="Failed to load books."
            emptyMessage="No books found."
            heightClass="h-122"
            gapClass="gap-x-12"
            showDots
            className="mt-2"
          />
        </section>

        <section>
          <GenresSection />
        </section>
      </div>
    </div>
  );
};

export default DiscoverPage;
