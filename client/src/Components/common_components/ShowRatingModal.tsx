/* eslint-disable @typescript-eslint/no-explicit-any */
import { X } from "lucide-react";

type RatingProps = {
  setShowRatingModal: any;
  setBookRating: any;
  bookRating: number;
  handleRatingSave: any;
  book: any;
};
export default function ShowRatingModal({
  setShowRatingModal,
  setBookRating,
  bookRating,
  handleRatingSave,
  book,
}: RatingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-ink bg-cream p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-lora text-[1.5rem] font-semibold text-ink">
            Add a rating
          </h2>
          <button
            onClick={() => setShowRatingModal(false)}
            aria-label="Close rating modal"
            className="rounded-md border border-border-ink p-1 text-ink-muted hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mb-4 text-sm text-ink-muted">
          Rate “{book.title}” before saving it to your Read shelf.
        </p>

        <div className="mb-5 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setBookRating(star)}
              className={`rounded-full border px-3 py-1 text-sm transition-all ${
                bookRating >= star
                  ? "border-sienna bg-sienna text-cream"
                  : "border-border-ink text-ink-muted hover:border-border-ink-hover"
              }`}
            >
              {star}★
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowRatingModal(false)}
            className="rounded-lg border border-border-ink px-4 py-2 text-sm text-ink hover:bg-cream-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRatingSave}
            disabled={bookRating === 0}
            className="rounded-lg bg-sienna px-4 py-2 text-sm font-medium text-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save rating
          </button>
        </div>
      </div>
    </div>
  );
}
