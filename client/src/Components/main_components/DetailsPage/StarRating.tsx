import { Star } from "lucide-react";
import React, { useState } from "react";

interface StarRatingProps {
  onRate?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({ onRate }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const handleRate = (v: number) => {
    setRating(v);
    onRate?.(v);
  };

  return (
    <div className="text-center w-full">
      <p className="text-[0.75rem] text-ink-muted mb-1.5">Rate this book</p>
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            aria-label={`${v} star${v > 1 ? "s" : ""}`}
            onClick={() => handleRate(v)}
            onMouseEnter={() => setHover(v)}
            onMouseLeave={() => setHover(0)}
            className="text-[22px] leading-none bg-transparent border-none p-0 cursor-pointer transition-transform duration-100 hover:scale-110"
            style={{ color: v <= (hover || rating) ? "#C99A2E" : "#D9D0C5" }}
          >
            <Star size={22} fill="currentColor" />
          </button>
        ))}
      </div>
    </div>
  );
};
