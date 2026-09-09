// // The only module in this codebase that talks to the Anthropic SDK
// // directly. llmEvaluator.js depends on the `callClaude` function here
// // rather than importing the SDK itself, so the API mechanics (auth,
// // timeout, response-shape unwrapping) stay separate from prompt
// // construction and response validation.

// const Anthropic = require('@anthropic-ai/sdk');

// const DEFAULT_MODEL = 'claude-sonnet-4-6';
// const DEFAULT_TIMEOUT_MS = 15000;

// /**
//  * Sends a single-turn prompt to Claude and returns the raw text response.
//  * Does not parse or validate the content — that's llmEvaluator's job.
//  *
//  * @param {Object} params
//  * @param {string} params.prompt
//  * @param {string} [params.apiKey] - defaults to process.env.ANTHROPIC_API_KEY
//  * @param {number} [params.timeoutMs] - defaults to 15000ms, no retries
//  * @param {string} [params.model]
//  * @returns {Promise<string>} raw text content from Claude's response
//  */
// async function callClaude({ prompt, apiKey, timeoutMs, model }) {
//   const resolvedApiKey = apiKey || process.env.ANTHROPIC_API_KEY;
//   const resolvedTimeout = timeoutMs || Number(process.env.CLAUDE_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
//   const resolvedModel = model || process.env.CLAUDE_MODEL || DEFAULT_MODEL;

//   if (!resolvedApiKey) {
//     throw new Error('ANTHROPIC_API_KEY is not set.');
//   }

//   // maxRetries: 0 — Step 6 explicitly asks for no retries; a later step
//   // can revisit retry behavior if needed.
//   const client = new Anthropic({
//     apiKey: resolvedApiKey,
//     timeout: resolvedTimeout,
//     maxRetries: 0,
//   });

//   const response = await client.messages.create({
//     model: resolvedModel,
//     max_tokens: 1024,
//     messages: [{ role: 'user', content: prompt }],
//   });

//   const textBlock = (response.content || []).find((block) => block.type === 'text');
//   return textBlock ? textBlock.text : ''; 
// }

// module.exports = { callClaude, DEFAULT_MODEL, DEFAULT_TIMEOUT_MS };