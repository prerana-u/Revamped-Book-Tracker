import React, { useMemo, useState } from "react";
import { X, BookOpen, Clock } from "lucide-react";

// A commonly cited average adult reading pace for prose fiction/nonfiction.
// This is a general estimate, not a personalized figure — we don't have
// timestamped reading-session data to derive an individual pace from.
const AVERAGE_PAGES_PER_HOUR = 40;

interface ReadingProgressModalProps {
  title: string;
  author?: string;
  pageCount?: number;
  initialCurrentPage?: number;
  onClose: () => void;
  onSave: (currentPage: number, pageCount: number) => Promise<void> | void;
}

const formatDuration = (hours: number): string => {
  if (!Number.isFinite(hours) || hours <= 0) return "0 min";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
};

export const ReadingProgressModal: React.FC<ReadingProgressModalProps> = ({
  title,
  author,
  pageCount,
  initialCurrentPage = 0,
  onClose,
  onSave,
}) => {
  const safePageCount = pageCount && pageCount > 0 ? pageCount : undefined;
  const [page, setPage] = useState(
    Math.max(
      0,
      safePageCount
        ? Math.min(initialCurrentPage, safePageCount)
        : initialCurrentPage,
    ),
  );
  const [saving, setSaving] = useState(false);

  const percentComplete = useMemo(() => {
    if (!safePageCount) return 0;
    return Math.min(100, Math.round((page / safePageCount) * 100));
  }, [page, safePageCount]);

  const totalReadTime = useMemo(() => {
    if (!safePageCount) return null;
    return safePageCount / AVERAGE_PAGES_PER_HOUR;
  }, [safePageCount]);

  const remainingReadTime = useMemo(() => {
    if (!safePageCount) return null;
    const remainingPages = Math.max(safePageCount - page, 0);
    return remainingPages / AVERAGE_PAGES_PER_HOUR;
  }, [safePageCount, page]);

  const handlePageChange = (value: number) => {
    if (Number.isNaN(value)) {
      setPage(0);
      return;
    }
    const clamped = Math.max(
      0,
      safePageCount ? Math.min(value, safePageCount) : value,
    );
    setPage(clamped);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(page, safePageCount ?? 0);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-[14px] shadow-[0_16px_40px_rgba(0,0,0,0.18)] p-6 font-dm text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="font-lora text-[1.15rem] font-semibold text-ink leading-tight">
              Update Progress
            </h2>
            <p className="text-[0.8rem] text-ink-muted mt-0.5">
              {title}
              {author ? ` · ${author}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted hover:text-ink transition-colors p-1 -mr-1 -mt-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Page input */}
        <div className="mt-5">
          <label className="text-[0.8rem] font-medium text-ink-muted mb-1.5 block">
            Current page
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={safePageCount}
              value={page}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-border-ink rounded-[8px] text-[0.9rem] font-dm focus:outline-none focus:ring-2 focus:ring-sienna/40"
            />
            <span className="text-[0.85rem] text-ink-muted">
              of {safePageCount ?? "?"} pages
            </span>
          </div>

          {safePageCount && (
            <input
              type="range"
              min={0}
              max={safePageCount}
              value={page}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="w-full mt-3 accent-sienna"
            />
          )}
        </div>

        {/* Progress bar */}
        {safePageCount && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[0.75rem] text-ink-muted mb-1">
              <span className="flex items-center gap-1">
                <BookOpen size={13} />
                Progress
              </span>
              <span className="font-medium text-ink">{percentComplete}%</span>
            </div>
            <div className="w-full h-2 bg-sienna-pale rounded-full overflow-hidden">
              <div
                className="h-full bg-sienna rounded-full transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        )}

        {/* Time to read */}
        {safePageCount ? (
          <div className="mt-5 rounded-[10px] bg-cream border border-border-ink/60 px-3.5 py-3">
            <div className="flex items-center gap-1.5 text-[0.8rem] font-medium text-ink mb-1.5">
              <Clock size={14} className="text-sienna" />
              Time to read
            </div>
            <div className="flex items-center justify-between text-[0.82rem] text-ink-muted">
              <span>Whole book</span>
              <span className="text-ink font-medium">
                {formatDuration(totalReadTime ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[0.82rem] text-ink-muted mt-1">
              <span>Remaining from here</span>
              <span className="text-ink font-medium">
                {formatDuration(remainingReadTime ?? 0)}
              </span>
            </div>
            <p className="text-[0.68rem] text-ink-muted/80 mt-2 leading-snug">
              Estimated at an average pace of {AVERAGE_PAGES_PER_HOUR} pages per
              hour.
            </p>
          </div>
        ) : (
          <p className="text-[0.78rem] text-ink-muted mt-4">
            Page count isn't available for this book, so we can't estimate
            reading time.
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2.5 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[10px] border border-border-ink text-ink text-[0.875rem] font-medium hover:bg-cream-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-[10px] bg-sienna text-white text-[0.875rem] font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Progress"}
          </button>
        </div>
      </div>
    </div>
  );
};
