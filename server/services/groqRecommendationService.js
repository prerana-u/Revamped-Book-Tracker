const { Groq } = require("groq-sdk");

const groq = new Groq();

const PRIMARY_MODEL = "llama-3.3-70b-versatile";
// Smaller/different model as a fallback — different weights sometimes
// succeed where the primary one glitches, and it's cheap to try once
const FALLBACK_MODEL = "llama-3.1-8b-instant";

/**
 * Strips markdown fences (if the model ignores instructions and adds them
 * anyway) and parses the response into a JSON array. Returns [] on failure
 * instead of throwing, so callers can degrade gracefully.
 */
function extractJsonArray(text) {
  if (!text) return [];

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  const jsonSlice =
    start !== -1 && end !== -1 && end > start
      ? cleaned.slice(start, end + 1)
      : cleaned;

  try {
    const parsed = JSON.parse(jsonSlice);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to parse Groq response as JSON:", err.message);
    return [];
  }
}

/**
 * Single raw call to Groq chat completions. Returns the text content.
 */
async function callGroq(prompt, model) {
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model,
    temperature: 1,
    max_completion_tokens: 2048,
    top_p: 1,
    stream: false,
  });

  return completion?.choices?.[0]?.message?.content || "";
}

/**
 * Sends a prompt to Groq and returns a parsed JSON array, with resilience:
 *   1. Try PRIMARY_MODEL.
 *   2. If parsing yields an empty array, retry PRIMARY_MODEL once more
 *      (handles transient formatting slips).
 *   3. If still empty, fall back to FALLBACK_MODEL.
 *   4. If that's also empty, return [] and let the caller decide what to do
 *      (themesService already treats [] as "no books found").
 *
 * Every attempt is logged so you can see in prod how often fallback
 * actually gets used — if it's frequent, the prompt or primary model
 * choice probably needs revisiting.
 */
async function requestGroq(prompt, { retries = 1 } = {}) {
  // Attempt 1..N on the primary model
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const text = await callGroq(prompt, PRIMARY_MODEL);
    const parsed = extractJsonArray(text);

    if (parsed.length > 0) {
      if (attempt > 1) {
        console.log(
          `Groq primary model (${PRIMARY_MODEL}) succeeded on retry ${attempt - 1}`,
        );
      }
      return parsed;
    }

    console.warn(
      `Groq primary model (${PRIMARY_MODEL}) returned unparseable/empty JSON on attempt ${attempt}`,
    );
  }

  // Final fallback: different model
  console.warn(
    `Falling back to ${FALLBACK_MODEL} after primary model failures`,
  );
  const fallbackText = await callGroq(prompt, FALLBACK_MODEL);
  const fallbackParsed = extractJsonArray(fallbackText);

  if (fallbackParsed.length === 0) {
    console.error(
      "Groq fallback model also returned unparseable/empty JSON — giving up",
    );
  }

  return fallbackParsed;
}

module.exports = {
  requestGroq,
  extractJsonArray,
};
