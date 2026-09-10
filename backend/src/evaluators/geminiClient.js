// The only module in this codebase that talks to the Google Gen AI SDK
// directly. llmEvaluator.js depends on the `callGemini` function here
// rather than importing the SDK itself, so the API mechanics (auth,
// timeout, response-shape unwrapping) stay separate from prompt
// construction and response validation.
//
// Uses @google/genai — the current GA, officially recommended SDK for the
// Gemini API (the older @google/generative-ai package is deprecated).

const { GoogleGenAI, Type } = require('@google/genai');

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_TIMEOUT_MS = 30000;

// Enforces the FeedbackReport LLM contract at the API level, using
// @google/genai's structured-output config (responseMimeType +
// responseSchema — verified against current SDK docs before adding this).
// This removes reliance on the model simply "following instructions" to
// produce clean JSON with no surrounding prose or code fences, which was
// the actual cause of intermittent "LLM response was not valid JSON"
// failures: llmEvaluator's fence-stripping regex only handles a response
// that is ENTIRELY a fenced block, so any stray prose around the JSON
// (which prompt-only instructions don't reliably prevent) broke parsing.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    aiInsights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING },
        },
        required: ['message'],
      },
    },
    summary: { type: Type.STRING },
  },
  required: ['aiInsights', 'summary'],
};

/**
 * Sends a single-turn prompt to Gemini and returns the raw text response.
 * Does not parse or validate the content — that's llmEvaluator's job.
 *
 * @param {Object} params
 * @param {string} params.prompt
 * @param {string} [params.apiKey] - defaults to process.env.GEMINI_API_KEY
 * @param {number} [params.timeoutMs] - defaults to 30000ms, no retries
 * @param {string} [params.model]
 * @returns {Promise<string>} raw text content from Gemini's response
 */
async function callGemini({ prompt, apiKey, timeoutMs, model }) {
  const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY;
  const resolvedTimeout = timeoutMs || Number(process.env.GEMINI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  const resolvedModel = model || process.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (!resolvedApiKey) {
    throw new Error('GEMINI_API_KEY is not set.');
  }

  const client = new GoogleGenAI({ apiKey: resolvedApiKey });

  // The SDK accepts a per-request timeout via config.httpOptions.timeout,
  // but as a safety net (and to keep behavior predictable and testable
  // regardless of SDK internals) we also race it against an explicit
  // timeout here. No retries — a single attempt either resolves or throws.
  const requestPromise = client.models.generateContent({
    model: resolvedModel,
    contents: prompt,
    config: {
      httpOptions: { timeout: resolvedTimeout },
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  let activeTimer;
  const timeoutPromise = new Promise((_, reject) => {
    activeTimer = setTimeout(() => {
      const err = new Error(`Gemini request timed out after ${resolvedTimeout}ms.`);
      err.name = 'GeminiTimeoutError';
      reject(err);
    }, resolvedTimeout);
  });

  try {
    const response = await Promise.race([requestPromise, timeoutPromise]);
    return response.text || '';
  } finally {
    // Always clear the timer once the race settles — whichever side won,
    // a dangling setTimeout handle otherwise stays open and can crash
    // process.exit() on some platforms (observed on Windows/libuv).
    clearTimeout(activeTimer);
  }
}

module.exports = { callGemini, DEFAULT_MODEL, DEFAULT_TIMEOUT_MS };