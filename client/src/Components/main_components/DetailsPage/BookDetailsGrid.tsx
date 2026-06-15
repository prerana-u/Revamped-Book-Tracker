import React from "react";

interface DetailCell {
  key: string;
  value: string;
}

interface BookDetailsGridProps {
  cells: DetailCell[];
}

export const BookDetailsGrid: React.FC<BookDetailsGridProps> = ({ cells }) => (
  <div className="grid grid-cols-2 border border-sienna rounded-sm overflow-hidden bg-transparent mb-8">
    {cells.map((cell, i) => {
      const isLastRow = i >= cells.length - 2;
      const isRightCol = i % 2 === 1;
      return (
        <div
          key={cell.key}
          className={`p-[14px_18px] ${!isLastRow ? "border-b border-sienna" : ""} ${!isRightCol ? "border-r border-sienna" : ""}`}
        >
          <p className="text-[0.72rem] text-ink-muted uppercase tracking-[0.06em] mb-0.5">
            {cell.key}
          </p>
          <p className="text-[0.875rem] font-medium text-ink">{cell.value}</p>
        </div>
      );
    })}
  </div>
);
