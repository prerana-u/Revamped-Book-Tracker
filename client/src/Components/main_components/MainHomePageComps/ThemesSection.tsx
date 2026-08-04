/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
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
import themesData from "../../../assets/Json/themes.json";
import { RefreshCcw, Search } from "lucide-react";

// Maps the icon key stored in themes.json to the actual imported asset
const ICON_MAP: Record<string, string> = {
  horrorIcon,
  romanceIcon,
  fantasyIcon,
  fictionIcon,
  mysteryIcon,
  thrillerIcon,
  scienceFictionIcon,
  historicalFictionIcon,
  nonFictionIcon,
};

interface ThemeDefinition {
  theme: string;
  description: string;
  icon: string;
}

const THEMES = themesData as ThemeDefinition[];

export default function ThemesSection() {
  const [activeTheme, setActiveTheme] = useState(THEMES[0]?.theme ?? "");
  // Bumped every time "Get New Recs" is clicked. Including it in the query
  // key forces a refetch even though `activeTheme` hasn't changed, and its
  // value (>0) tells the queryFn to ask the backend for a refresh instead
  // of serving cached recs.
  const [refreshToken, setRefreshToken] = useState(0);

  const activeThemeMeta = THEMES.find((t) => t.theme === activeTheme);

  const {
    data: books = [],
    isLoading,
    isFetching,
    isError,
  } = useQuery<BookCarouselItem[], Error>({
    queryKey: ["booksByTheme", activeTheme, refreshToken],
    queryFn: async () => {
      const response = await api.get<BookCarouselItem[]>("/getbooksbytheme", {
        params: {
          theme: activeTheme,
          description: activeThemeMeta?.description,
          // Only pass refresh on an actual refresh click, not the initial
          // load or a theme switch (refreshToken resets to 0 on theme change)
          ...(refreshToken > 0 ? { refresh: "true" } : {}),
        },
      });
      return response.data;
    },
    enabled: !!activeTheme,
  });

  const handleThemeChange = (theme: string) => {
    setActiveTheme(theme);
    // Reset refresh state so switching themes doesn't carry over a stale
    // "refresh" request from whatever theme was active before
    setRefreshToken(0);
  };

  const handleRefresh = () => {
    setRefreshToken((n) => n + 1);
  };

  useEffect(() => {
    console.log(books, "books here 2");
  }, [books]);

  return (
    <div className="bg-cream-deep py-16 px-6 lg:px-16 flex flex-col h-fit">
      <div className="mx-auto w-full">
        <span className="text-[0.75rem] uppercase tracking-[0.08em] font-medium text-sienna block mb-4">
          Browse by theme
        </span>
        <h2 className="font-lora font-medium text-[clamp(1.8rem,3vw,2.8rem)] leading-[1.2] tracking-tight text-ink">
          Trending Book Tropes or Themes
        </h2>

        {/* Theme pill buttons */}
        <div className="flex flex-wrap gap-3 mt-8">
          {THEMES.map(({ theme, icon }) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={[
                "flex items-center gap-2 px-5 py-2.5 rounded-[40px] text-[0.875rem] cursor-pointer whitespace-nowrap transition-all duration-200 border font-dm",
                activeTheme === theme
                  ? "bg-sienna text-white border-sienna"
                  : "bg-white text-ink-soft border-ink/10 hover:bg-sienna hover:text-white hover:border-sienna hover:-translate-y-0.5",
              ].join(" ")}
            >
              <SvgIcon
                src={ICON_MAP[icon] ?? fictionIcon}
                alt={`${theme} icon`}
                className="w-6 h-6 text-sienna"
              />
              {theme}
            </button>
          ))}
        </div>

        {activeThemeMeta?.description && (
          <div className="flex flex-row justify-between items-center mt-4 text-sm text-ink-soft font-dm w-full rounded-lg p-4 bg-cream">
            <p>{activeThemeMeta.description}</p>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="bg-sienna p-3 cursor-pointer text-white text-[12px] font-semibold rounded-md font-dm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCcw
                size={14}
                className={isFetching ? "animate-spin" : ""}
              />
              {isFetching ? "Refreshing..." : "Get New Recs"}
            </button>
          </div>
        )}

        {/* Drop-in BookCarousel — zero carousel logic lives here */}
        <BookCarousel
          books={books}
          isLoading={isLoading}
          isError={isError}
          errorMessage="Failed to load books for this theme."
          emptyMessage="No books found for this theme."
          heightClass="h-122"
          gapClass="gap-x-12"
          showDots
          className="mt-4"
        />
      </div>
    </div>
  );
}
