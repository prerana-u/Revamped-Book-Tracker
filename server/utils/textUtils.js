function normalize(str) {
  return String(str || "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/gi, "")
    .trim();
}

function normalizeWhitespace(str) {
  return String(str || "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripEditionQualifiers(title) {
  // Remove any parenthetical content from the end (e.g., "(Movie Tie-In)", "(Hardcover)", etc.)
  let cleaned = String(title || "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .trim();

  // Remove content after colon if it contains qualifier keywords
  // (e.g., ": Reese's Book Club", ": Deluxe Edition", ": Special Edition")
  const colonIndex = cleaned.indexOf(":");
  if (colonIndex !== -1) {
    const afterColon = cleaned.substring(colonIndex + 1).toLowerCase();
    if (
      afterColon.includes("book club") ||
      afterColon.includes("edition") ||
      afterColon.includes("tie-in") ||
      afterColon.includes("special") ||
      afterColon.includes("deluxe") ||
      afterColon.includes("anniversary")
    ) {
      cleaned = cleaned.substring(0, colonIndex).trim();
    }
  }

  return cleaned;
}

function normalizeThumbnailUrl(url) {
  if (!url || typeof url !== "string") return "";
  return url.replace(/^http:/i, "https:");
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `fn` over `items` with a max concurrency, spacing calls out,
 * and retrying on 429s with exponential backoff.
 */
async function mapWithRateLimit(
  items,
  fn,
  { concurrency = 2, delayMs = 250, maxRetries = 3 } = {},
) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];

      let attempt = 0;
      while (true) {
        try {
          results[index] = await fn(item, index);
          break;
        } catch (error) {
          const status = error?.status || error?.response?.status;
          if ((status === 503 || status === 429) && attempt < maxRetries) {
            const backoff = delayMs * 2 ** attempt;
            await sleep(backoff);
            attempt += 1;
            continue;
          }
          results[index] = null; // don't let one bad book kill the batch
          break;
        }
      }

      // space out calls even on the happy path
      await sleep(delayMs);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    worker,
  );
  await Promise.all(workers);

  return results;
}

module.exports = {
  normalize,
  normalizeWhitespace,
  escapeRegex,
  stripEditionQualifiers,
  normalizeThumbnailUrl,
  sleep,
  mapWithRateLimit,
};
