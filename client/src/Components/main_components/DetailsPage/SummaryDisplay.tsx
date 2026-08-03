import React, { useEffect, useState } from "react";
import { api } from "../../../lib/axios-instance";

type SummaryDisplayProps = {
  title: string;
  author: string;
  googleId?: string;
};

type SummaryResponse = {
  summary?: string;
  tone?: string | string[];
  themes?: string[] | string;
};

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({
  title,
  author,
  googleId,
}) => {
  const [summary, setSummary] = useState<string>("");
  const [tone, setTone] = useState<string>("");
  const [themes, setThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const query = new URLSearchParams({
          title,
          author,
        });

        if (googleId) {
          query.set("googleId", googleId);
        }

        const response = await api.get<SummaryResponse>(
          `/summary?${query.toString()}`,
          {
            signal: controller.signal,
          },
        );

        const data = response.data;

        setSummary(data.summary || "No summary available.");

        if (Array.isArray(data.tone)) {
          setTone(data.tone.join(", "));
        } else {
          setTone(data.tone || "Not available");
        }

        if (Array.isArray(data.themes)) {
          setThemes(data.themes);
        } else if (typeof data.themes === "string") {
          setThemes(
            data.themes
              .split(",")
              .map((theme) => theme.trim())
              .filter(Boolean),
          );
        } else {
          setThemes([]);
        }
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        setError("Unable to load book summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();

    return () => controller.abort();
  }, [title, author, googleId]);

  if (loading) {
    return (
      <section className="rounded-[20px] border border-border-ink bg-white p-6 shadow-[0_12px_40px_-26px_rgba(28,26,22,0.5)]">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded-full bg-cream-deep" />
          <div className="h-3 w-full rounded-full bg-cream-deep" />
          <div className="h-3 w-5/6 rounded-full bg-cream-deep" />
          <div className="h-3 w-4/6 rounded-full bg-cream-deep" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[20px] border border-border-ink bg-white p-6 shadow-[0_12px_40px_-26px_rgba(28,26,22,0.5)]">
        <p className="font-dm text-[0.95rem] text-sienna">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-[20px] border border-border-ink bg-white p-6 sm:p-7 shadow-[0_12px_40px_-26px_rgba(28,26,22,0.5)]">
      <div className="grid gap-6 md:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-sienna">
              AI summary
            </p>
            <p className="font-dm text-[0.98rem] leading-7 text-ink-soft">
              {summary}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-cream px-4 py-4 border border-[rgba(28,26,22,0.08)]">
            <p className="mb-2 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-sienna">
              Tone
            </p>
            <p className="font-dm text-[0.95rem] text-ink-soft">{tone}</p>
          </div>

          <div className="rounded-2xl bg-cream px-4 py-4 border border-[rgba(28,26,22,0.08)]">
            <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-sienna">
              Themes
            </p>
            {themes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {themes.map((theme, index) => (
                  <span
                    key={`${theme}-${index}`}
                    className="rounded-full border border-sienna-light bg-sienna-pale px-3 py-1 text-[0.78rem] font-medium text-sienna"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-dm text-[0.95rem] text-ink-soft">
                No themes available.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SummaryDisplay;
