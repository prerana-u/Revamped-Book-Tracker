import { ChevronDown } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

export type ShelfOption = "Want to Read" | "Currently Reading" | "Read";

interface ShelfItem {
  value: ShelfOption;
  icon: string;
  subtitle: string;
}

const SHELF_OPTIONS: ShelfItem[] = [
  { value: "Want to Read", icon: "ti-bookmark", subtitle: "On your wishlist" },
  {
    value: "Currently Reading",
    icon: "ti-book-2",
    subtitle: "You're reading this now",
  },
  { value: "Read", icon: "ti-checks", subtitle: "You've finished this one" },
];

interface ShelfDropdownProps {
  onSelect?: (shelf: ShelfOption) => void;
  selected?: ShelfOption;
}

export const ShelfDropdown: React.FC<ShelfDropdownProps> = ({
  onSelect,
  selected: selectedProp,
}) => {
  const [selected, setSelected] = useState<ShelfOption>(
    selectedProp ?? "Want to Read",
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProp) {
      setSelected(selectedProp);
    }
  }, [selectedProp]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (value: ShelfOption) => {
    setSelected(value);
    setOpen(false);
    onSelect?.(value);
  };

  return (
    <div ref={ref} className="relative w-full">
      {/* Main button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-[11px] bg-sienna text-white rounded-[10px] font-dm text-[0.875rem] font-medium hover:opacity-90 transition-opacity relative"
      >
        <i className="ti ti-bookmark text-base" aria-hidden="true" />
        <span className="flex-1 text-left">{selected}</span>
        {/* Caret panel */}
        <span
          className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center bg-black/15 border-l border-white/25 rounded-r-[10px]"
          aria-hidden="true"
        >
          <ChevronDown
            size={16}
            className={`text-white font-semibold transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-20 bg-white border border-[rgba(28,26,22,0.12)] rounded-[10px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
          {SHELF_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => pick(opt.value)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-[11px] text-left text-[0.875rem] text-ink border-b border-[rgba(28,26,22,0.06)] last:border-b-0 transition-colors duration-150 font-dm
                ${selected === opt.value ? "bg-sienna-pale" : "hover:bg-sienna-pale"}`}
            >
              <i
                className={`ti ${opt.icon} text-sienna text-base`}
                aria-hidden="true"
              />
              <div className="flex-1">
                <div className="font-medium">{opt.value}</div>
                <div className="text-[0.72rem] text-ink-muted mt-0.5">
                  {opt.subtitle}
                </div>
              </div>
              {selected === opt.value && (
                <i
                  className="ti ti-check text-sienna text-[15px]"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
