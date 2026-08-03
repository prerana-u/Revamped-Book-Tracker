/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { api } from "../../../lib/axios-instance";
import BookCarousel from "../../common_components/BookCarousel";

interface MoreLikeThisSectionProps {
  bookId?: string | number;
}

interface BookRecord {
  id?: string | number;
  bookid?: string | number;
  title: string;
  author: string;
  image?: string;
  cover: string;
  genre: string;
  whyRecommended?: string;
  [key: string]: any;
}

const MoreLikeThisSection: React.FC<MoreLikeThisSectionProps> = ({
  bookId,
}) => {
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!bookId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<any>(`/morelikethis/${bookId}`, {
          signal: controller.signal,
        });

        const result = Array.isArray(response.data)
          ? response.data
          : (response.data?.books ?? response.data?.items ?? []);

        setBooks(result);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setError("Unable to load more books like this right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => controller.abort();
  }, [bookId]);

  if (!bookId) {
    return null;
  }

  return (
    <section className="w-full  px-10 pt-8 pb-20 bg-cream-deep ">
      <div className="">
        <span className="text-[20px] font-lora uppercase tracking-[0.08em] font-semibold text-sienna block mb-4">
          More Like This
        </span>
      </div>

      {loading ? (
        <div className="rounded-[20px] border border-border-ink bg-white p-6 shadow-[0_12px_40px_-26px_rgba(28,26,22,0.5)]">
          <p className="font-dm text-[0.95rem] text-ink-soft">
            Loading recommendations...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-[20px] border border-border-ink bg-white p-6 shadow-[0_12px_40px_-26px_rgba(28,26,22,0.5)]">
          <p className="font-dm text-[0.95rem] text-sienna">{error}</p>
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-[20px] border border-border-ink bg-white p-6 shadow-[0_12px_40px_-26px_rgba(28,26,22,0.5)]">
          <p className="font-dm text-[0.95rem] text-ink-soft">
            No recommendations found.
          </p>
        </div>
      ) : (
        <BookCarousel
          books={books}
          isLoading={loading}
          isError={!!error}
          errorMessage="Failed to load books for this genre."
          emptyMessage="No books found for this genre."
          heightClass="h-122"
          gapClass="gap-x-12"
          showDots
          className="mt-4"
        />
      )}
    </section>
  );
};

export default MoreLikeThisSection;
