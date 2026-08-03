const { genAI } = require("../config/gemini");
const { geminiModel: GEMINI_MODEL } = require("../config/env");
const { CachedBook } = require("../schemas");
const {
  normalize,
  stripEditionQualifiers,
  mapWithRateLimit,
} = require("../utils/textUtils");

function extractJsonObject(text) {
  if (!text) return null;

  const cleaned = String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }

  return JSON.parse(cleaned);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findCachedBookForSummary(title, author, googleId) {
  if (googleId) {
    const byGoogleId = await CachedBook.findOne({ googleId }).lean();
    if (byGoogleId) {
      return byGoogleId;
    }
  }

  const strippedTitle = stripEditionQualifiers(title);
  const normalizedTitle = normalize(strippedTitle);
  const normalizedAuthor = normalize(author);

  const canonicalQuery = {
    normalizedTitle,
  };

  if (normalizedAuthor) {
    canonicalQuery.normalizedAuthors = {
      $in: [normalizedAuthor],
    };
  }

  return CachedBook.findOne(canonicalQuery).lean();
}

async function requestGemini(prompt, attempt = 0) {
  try {
    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    return response;
  } catch (error) {
    if (error?.status === 429 && attempt < 2) {
      const delayMs = 2000 * (attempt + 1);
      await sleep(delayMs);
      return requestGemini(prompt, attempt + 1);
    }

    throw error;
  }
}

function buildFallbackSummary(title, author) {
  return {
    title: title || "This book",
    author: author || "Unknown author",
    summary: `A compelling read that introduces ${title || "this story"} through an inviting premise, layered character dynamics, and a memorable atmosphere that rewards readers who like to discover the journey on their own terms.`,
    tone: "Atmospheric",
    themes: ["Character-driven", "Immersive read"],
  };
}

async function buildGeminiSpoilerFreeSummary(title, author, googleId) {
  if (!title || !String(title).trim()) {
    throw new Error("Book title is required");
  }

  const cachedBook = await findCachedBookForSummary(title, author, googleId);

  if (cachedBook?.summary) {
    console.log("Returning cached summary for:", title, author, googleId);
    return {
      title: cachedBook.title || title,
      author: cachedBook.authors?.[0] || author || "Unknown author",
      summary: cachedBook.summary,
      tone: cachedBook.tone || "Atmospheric",
      themes: Array.isArray(cachedBook.themes) ? cachedBook.themes : [],
    };
  }

  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  const prompt = `You are a careful book-summary assistant. Create a spoiler-free summary for the book below.

Core rules:
- Do not reveal the ending, major twist, final resolution, or any plot outcome.
- Do not spoil the climax or final reveal.
- Keep the summary concise, readable, and appealing to a general audience.
- If the book description is incomplete, infer only broad, non-spoiler details.
- Return ONLY valid JSON in this exact shape:
{
  "title": "Book Title",
  "author": "Author Name",
  "summary": "A concise spoiler-free summary in 80-120 words.",
  "tone": "A short tone label",
  "themes": ["theme 1", "theme 2"]
}

Book details:
Title: ${title}
Author: ${author || "Unknown author"}
Description: No description available. Generate the summary using the title and author only.
`;

  try {
    const response = await requestGemini(prompt);
    const contentText =
      response?.text ||
      response?.output_text ||
      response?.candidates?.[0]?.content ||
      "";

    const parsed = extractJsonObject(contentText);
    const result = {
      title: parsed?.title || title,
      author: parsed?.author || author || "Unknown author",
      summary: parsed?.summary || "",
      tone: parsed?.tone || "Atmospheric",
      themes: Array.isArray(parsed?.themes) ? parsed.themes : [],
    };

    if (cachedBook) {
      await CachedBook.findOneAndUpdate(
        { _id: cachedBook._id },
        {
          $set: {
            summary: result.summary,
            tone: result.tone,
            themes: result.themes,
            summaryCachedAt: new Date(),
          },
        },
      );
    }

    return result;
  } catch (error) {
    if (error?.response?.status === 429 || error?.name === "SyntaxError") {
      const fallback = buildFallbackSummary(title, author);

      if (cachedBook) {
        await CachedBook.findOneAndUpdate(
          { _id: cachedBook._id },
          {
            $set: {
              summary: fallback.summary,
              tone: fallback.tone,
              themes: fallback.themes,
              summaryCachedAt: new Date(),
            },
          },
        );
      }

      return fallback;
    }

    throw error;
  }
}

module.exports = {
  extractJsonObject,
  sleep,
  requestGemini,
  buildFallbackSummary,
  buildGeminiSpoilerFreeSummary,
  findCachedBookForSummary,
};
