import { Star, StarHalf } from "lucide-react";
import React from "react";

interface RatingDisplayProps {
  score: number;
  totalRatings: string;
  totalReviews?: string;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  score,
  totalRatings,
}) => {
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-2.5 flex-wrap mb-[22px]">
      <div className="flex gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`f${i}`} className="text-[20px] leading-none text-gold">
            <Star size={20} fill="currentColor" />
          </span>
        ))}
        {hasHalf && (
          <span className="text-[20px] leading-none text-gold">
            <StarHalf size={20} fill="currentColor" />
          </span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span
            key={`e${i}`}
            className="text-[20px] leading-none text-[#D9D0C5]"
          >
            <Star size={20} fill="currentColor" />
          </span>
        ))}
      </div>
      <span className="font-lora text-[1.5rem] font-semibold text-ink">
        {score.toFixed(2)}{" "}
        <span className="text-[0.82rem] text-ink-muted">
          Stars Average Rating
        </span>
      </span>
      {/* <span className="text-[0.82rem] text-ink-muted">
        <a href="#" className="text-sienna no-underline hover:underline">
          {totalRatings} ratings
        </a>
        {" · "}
        <a href="#" className="text-sienna no-underline hover:underline">{totalReviews} reviews</a>
      </span> */}
    </div>
  );
};
