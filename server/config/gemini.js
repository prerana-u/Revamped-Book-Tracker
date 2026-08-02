const { GoogleGenAI } = require("@google/genai");
const { geminiApiKey } = require("./env");

// genAI is null when no key is configured; callers should check before using it.
const genAI = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

module.exports = { genAI };
