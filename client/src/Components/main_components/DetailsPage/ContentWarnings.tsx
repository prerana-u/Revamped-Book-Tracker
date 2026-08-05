import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { api } from "../../../lib/axios-instance";

interface ContentWarning {
  category: string;
  severity: "mild" | "moderate" | "severe";
  description: string;
}

interface ContentWarningResponse {
  warnings: ContentWarning[];
}

interface ContentWarningDisplayProps {
  title: string;
  author: string;
  googleId?: string;
  description?: string;
}

const fetchContentWarnings = (params: {
  title: string;
  author: string;
  googleId?: string;
  description?: string;
  refresh?: boolean;
}): Promise<ContentWarning[]> =>
  api
    .get<ContentWarningResponse>("/books/content-warnings", {
      params: {
        title: params.title,
        author: params.author,
        googleId: params.googleId,
        description: params.description,
        ...(params.refresh ? { refresh: "true" } : {}),
      },
    })
    .then((r) => r.data.warnings);

// Severity drives the badge color — kept subtle/warm to match the app's
// palette rather than harsh red/yellow alert colors
const SEVERITY_STYLES: Record<ContentWarning["severity"], string> = {
  mild: "bg-cream text-ink-soft border-ink/10",
  moderate: "bg-sienna/10 text-sienna border-sienna/30",
  severe: "bg-sienna/20 text-sienna border-sienna/50",
};

export default function ContentWarnings({
  title,
  author,
  googleId,
  description,
}: ContentWarningDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const {
    data: warnings = [],
    isLoading,
    isFetching,
    isError,
  } = useQuery<ContentWarning[], Error>({
    queryKey: ["contentWarnings", googleId ?? title, refreshToken],
    queryFn: () =>
      fetchContentWarnings({
        title,
        author,
        googleId,
        description,
        refresh: refreshToken > 0,
      }),
    enabled: !!title && !!author,
    staleTime: 1000 * 60 * 10,
  });

  //   const handleRefresh = (e: React.MouseEvent) => {
  //     e.stopPropagation();
  //     setRefreshToken((n) => n + 1);
  //   };

  if (isLoading) {
    return (
      <div className="text-sm text-ink-soft font-dm py-2">
        Checking content warnings...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-ink-soft font-dm py-2">
        Unable to load content warnings.
      </div>
    );
  }

  if (warnings.length === 0) {
    return null; // nothing notable — don't clutter the page with an empty section
  }

  // Collapsed view shows a compact summary row; expanded shows full list
  const visibleWarnings = expanded ? warnings : warnings.slice(0, 5);

  return (
    <section className="w-full max-w-270 mx-auto mt-4">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-between w-full font-dm uppercase text-[0.8rem] font-medium text-sienna mb-3.5 border-b border-ink-muted pb-2 cursor-pointer bg-transparent"
      >
        <span className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-sienna" />
          Content Warnings
        </span>
        <span className="flex items-center gap-3">
          {/* <button
            onClick={handleRefresh}
            disabled={isFetching}
            aria-label="Refresh content warnings"
            className="text-ink-muted hover:text-sienna transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          </button> */}
          {expanded ? (
            <ChevronUp size={16} className="text-ink-muted" />
          ) : (
            <ChevronDown size={16} className="text-ink-muted" />
          )}
        </span>
      </button>

      <div
        className={`${expanded ? "grid grid-cols-3 gap-4" : "flex flex-wrap justify-start items-center gap-4 mb-2 h-full"}`}
      >
        {visibleWarnings.map((warning, i) => (
          <div
            key={`${warning.category}-${i}`}
            className={[
              "flex flex-col gap-0.5 px-3 py-2 rounded-lg border text-[0.8rem] font-dm max-w-xs h-full",
              SEVERITY_STYLES[warning.severity],
            ].join(" ")}
          >
            <span className="font-semibold">
              {warning.category}
              <span className="ml-1.5 text-[0.7rem] font-normal uppercase tracking-wide opacity-70">
                {warning.severity}
              </span>
            </span>
            {expanded && (
              <span className="text-ink-soft leading-snug">
                {warning.description}
              </span>
            )}
          </div>
        ))}
      </div>

      {!expanded && warnings.length > 5 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-[0.8rem] text-sienna font-medium font-dm bg-transparent border-none cursor-pointer p-0 hover:underline"
        >
          +{warnings.length - 5} more
        </button>
      )}
    </section>
  );
}
