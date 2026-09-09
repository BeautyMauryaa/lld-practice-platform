// TEMPORARY smoke-test script — not part of the application runtime.
// Run manually: node scripts/testGemini.js
// Makes exactly ONE real request to the Gemini API using the existing,
// unmodified geminiClient module (no architecture changes, no new
// dependencies, no retries — a single attempt either succeeds or fails).
// Safe to delete once you've confirmed the integration works.

require('dotenv').config();
const { callGemini } = require('../src/evaluators/geminiClient');

// Classifies a failure using only what's available on the thrown error —
// status/code from the SDK/HTTP layer where present, plus message/name
// text matching as a fallback. Never inspects or prints the API key.
function classifyError(err) {
  const status = err.status || err.statusCode || (err.error && err.error.code);
  const message = (err.message || '').toLowerCase();
  const name = err.name || '';

  if (!process.env.GEMINI_API_KEY) {
    return 'missing API key (GEMINI_API_KEY is not set in backend/.env)';
  }
  if (name === 'GeminiTimeoutError' || /timed out|timeout/i.test(message)) {
    return 'timeout (no response within the configured GEMINI_TIMEOUT_MS)';
  }
  if (status === 401 || status === 403 || /api key not valid|permission denied|unauthenticated|invalid.*key/i.test(message)) {
    return 'invalid API key (rejected by Gemini — check the value in backend/.env)';
  }
  if (status === 404 || /not found|not supported|unsupported model|invalid model/i.test(message)) {
    return 'invalid/unsupported model (check GEMINI_MODEL in backend/.env)';
  }
  if (status === 429 || /quota|rate limit|resource_exhausted/i.test(message)) {
    return 'quota/rate limit exceeded';
  }
  return `other API error (status: ${status || 'unknown'})`;
}

async function main() {
  console.log('Sending one real request to Gemini...');
  console.log('Model:', process.env.GEMINI_MODEL || '(unset — using existing default from geminiClient)');
  console.log('Timeout:', process.env.GEMINI_TIMEOUT_MS || '(unset — using existing default from geminiClient)');
  console.log('API key present:', process.env.GEMINI_API_KEY ? 'yes' : 'no'); // presence only, never the value

  try {
    const response = await callGemini({ prompt: 'Reply with exactly: GEMINI_OK' });

    console.log('\n--- Actual Gemini response ---');
    console.log(response);
    console.log('------------------------------\n');

    if (response.trim() === 'GEMINI_OK') {
      console.log('SUCCESS: real Gemini API call worked and matched the expected reply exactly.');
    } else {
      console.log('SUCCESS: real Gemini API call worked (response text differs slightly from the exact instruction, but this was a genuine successful call).');
    }
    process.exit(0);
  } catch (err) {
    console.error('\nFAILED: the real Gemini API call did not succeed.');
    console.error('Likely cause:', classifyError(err));
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    process.exit(1);
  }
}

main();