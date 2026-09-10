// LLMEvaluator: sends the problem, submission, and deterministic findings
// to an LLM (Gemini, by default) for contextual, judgment-based feedback.
//
// Conforms to the shared Evaluator contract (see Evaluator.js):
//   evaluate(submission, problem, context) -> Promise<{ aiInsights, summary }>
//
// Pure with respect to persistence: no DB writes here. This module is
// provider-agnostic — it depends on an injected `callLLM` function rather
// than importing any specific SDK. The default implementation calls
// Gemini via the isolated geminiClient module (injectable for testing —
// see createLLMEvaluator below). Swapping providers again later only
// means writing a new client module and passing it in here; nothing in
// this file's prompt/validation logic is Gemini-specific.

const { callGemini: defaultCallLLM } = require('./geminiClient');

class LLMEvaluatorError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'LLMEvaluatorError';
    if (cause) this.cause = cause;
  }
}

function buildPrompt(submission, problem, deterministicFindings) {
  const requirements = (problem?.requirements || []).map((r) => `- ${r}`).join('\n') || '(none listed)';
  const constraints = (problem?.constraints || []).map((c) => `- ${c}`).join('\n') || '(none listed)';
  const expectedConcepts = (problem?.expectedConcepts || []).map((c) => `- ${c}`).join('\n') || '(none listed)';

  const classes = submission?.classes || [];
  const classesText = classes.length
    ? classes
        .map(
          (c) =>
            `  - ${c.name || '(unnamed)'}\n` +
            `    responsibilities: ${(c.responsibilities || []).join(', ') || '(none)'}\n` +
            `    relationships: ${(c.relationships || []).join(', ') || '(none)'}`
        )
        .join('\n')
    : '  (no classes submitted)';

  const patternsUsed = (submission?.patternsUsed || []).join(', ') || '(none named)';
  const codeStub = submission?.codeStub || '(none provided)';

  const structuralFindings = (deterministicFindings?.structural || []).map((f) => `- ${f.message}`).join('\n') || '(none)';
  const heuristicFindings = (deterministicFindings?.heuristic || []).map((f) => `- ${f.message}`).join('\n') || '(none)';

  return `You are reviewing a learner's Low-Level Design (LLD) submission for a practice platform.

PROBLEM: ${problem?.title || '(untitled)'}

Requirements:
${requirements}

Constraints:
${constraints}

Concepts that MAY be relevant to this problem (these are suggestions, NOT required answers — a valid solution may use none, some, or different concepts entirely):
${expectedConcepts}

LEARNER'S SUBMISSION:

Classes:
${classesText}

Patterns explicitly named by the learner: ${patternsUsed}

Optional code stub:
${codeStub}

DETERMINISTIC FINDINGS ALREADY PRODUCED (structural, high-confidence, rule-based):
${structuralFindings}

DETERMINISTIC FINDINGS ALREADY PRODUCED (heuristic, medium-confidence, rule-based):
${heuristicFindings}

YOUR TASK
Give contextual design feedback a rule engine cannot produce. Specifically consider:
- requirement coverage (does the design actually address the stated requirements?)
- responsibility and cohesion (do classes have a sensible, focused purpose?)
- coupling between classes
- abstraction choices (are interfaces/base classes used where they add real value?)
- extensibility (how would this design handle a plausible future requirement?)
- whether any patterns the learner chose make sense for this problem
- useful trade-offs the learner made, explicitly or implicitly

IMPORTANT RULES — follow all of these:
1. Multiple LLD designs can be valid for this problem. Do not imply there is one correct solution.
2. Do not require a specific design pattern unless the problem's requirements genuinely cannot be satisfied without it. Naming a pattern as a suggestion is fine; demanding one is not.
3. Do not treat the "concepts that may be relevant" list as mandatory answers or a checklist to fulfill.
4. Do not contradict the deterministic findings above — build on them or address different aspects, but don't say something is fine that was already flagged, or vice versa.
5. Be actionable and explainable — reference the learner's actual classes/responsibilities by name, not generic LLD advice.
6. Avoid generic praise ("great job!", "nice work!") with no substance behind it.
7. Focus on this specific submission and problem, not LLD best practices in the abstract.

RESPONSE
Provide 2-5 items in aiInsights, each a self-contained, specific observation or suggestion. Keep summary to one or two sentences capturing the overall picture.`;
}

function stripCodeFences(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

function parseAndValidate(rawText) {
  let parsed;

  try {
    parsed = JSON.parse(stripCodeFences(rawText));
  } catch (err) {
    throw new LLMEvaluatorError('LLM response was not valid JSON.', err);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new LLMEvaluatorError('LLM response JSON must be an object.');
  }

  if (!Array.isArray(parsed.aiInsights)) {
    throw new LLMEvaluatorError('LLM response is missing a valid "aiInsights" array.');
  }

  for (const item of parsed.aiInsights) {
    if (typeof item !== 'object' || item === null || typeof item.message !== 'string' || !item.message.trim()) {
      throw new LLMEvaluatorError('Each item in "aiInsights" must be an object with a non-empty string "message".');
    }
  }

  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
    throw new LLMEvaluatorError('LLM response is missing a valid non-empty string "summary".');
  }

  return {
    aiInsights: parsed.aiInsights.map((item) => ({ message: item.message })),
    summary: parsed.summary,
  };
}

/**
 * Creates an LLMEvaluator bound to a specific callLLM implementation.
 * Defaults to the real Gemini client; tests inject a fake to avoid real
 * API calls. Any provider can be used here as long as it implements the
 * same callLLM({prompt, apiKey, timeoutMs, model}) -> Promise<string> shape.
 */
function createLLMEvaluator(callLLMFn = defaultCallLLM) {
  // evaluate(submission, problem, context) — conforms to the shared
  // Evaluator contract. `context.deterministicFindings` is expected to be
  // { structural, heuristic } as produced by RuleEvaluator; if absent,
  // the prompt notes none were provided.
  async function evaluate(submission, problem, context = {}) {
    const prompt = buildPrompt(submission, problem, context.deterministicFindings);

    let rawText;
    try {
      rawText = await callLLMFn({
        prompt,
        apiKey: context.apiKey,
        timeoutMs: context.timeoutMs,
        model: context.model,
      });
    } catch (err) {
      const isTimeout =
        err &&
        (err.name === 'GeminiTimeoutError' ||
          err.name === 'APIConnectionTimeoutError' ||
          /timed out|timeout/i.test(err.message || ''));

      if (isTimeout) {
        throw new LLMEvaluatorError('LLM evaluation timed out.', err);
      }
      throw new LLMEvaluatorError(`LLM evaluation failed due to an API error: ${err.message}`, err);
    }

    return parseAndValidate(rawText);
  }

  return { evaluate };
}

// Default instance using the real Gemini client, for normal application use.
const defaultEvaluator = createLLMEvaluator();

module.exports = {
  evaluate: defaultEvaluator.evaluate,
  createLLMEvaluator,
  LLMEvaluatorError,
  buildPrompt, // exported for prompt-content tests
};