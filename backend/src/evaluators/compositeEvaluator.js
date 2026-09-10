// CompositeEvaluator: coordinates the existing RuleEvaluator and
// LLMEvaluator (injected, not instantiated here) into the final
// FeedbackReport shape used by Attempt.feedback.
//
// Conforms to the shared Evaluator contract (see Evaluator.js):
//   evaluate(submission, problem, context) -> Promise<FeedbackReport>
//
// Ordering matters and is intentional: RuleEvaluator runs first because
// its findings are both part of the final report AND input to
// LLMEvaluator (so the AI's feedback doesn't contradict what deterministic
// checks already established). If RuleEvaluator fails, LLMEvaluator is
// never called — there'd be nothing meaningful to hand it, and a failure
// at this layer is a real evaluation failure, not a "partial feedback is
// still useful" case like an LLM outage is.

const { LLMEvaluatorError } = require('./llmEvaluator');

class CompositeEvaluatorError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'CompositeEvaluatorError';
    if (cause) this.cause = cause;
  }
}

/**
 * @param {Object} deps
 * @param {{evaluate: Function}} deps.ruleEvaluator - injected, e.g. require('./ruleEvaluator')
 * @param {{evaluate: Function}} deps.llmEvaluator - injected, e.g. require('./llmEvaluator')
 */
function createCompositeEvaluator({ ruleEvaluator, llmEvaluator }) {
  async function evaluate(submission, problem, context = {}) {
    let ruleResult;
    try {
      ruleResult = await ruleEvaluator.evaluate(submission, problem, context);
    } catch (err) {
      // A RuleEvaluator failure is a real evaluation failure — propagate
      // it rather than returning a report with fabricated/empty
      // deterministic findings. LLMEvaluator is intentionally never
      // called in this path.
      throw new CompositeEvaluatorError('Deterministic evaluation failed.', err);
    }

    const structural = ruleResult.structural || [];
    const heuristic = ruleResult.heuristic || [];

    try {
      const llmResult = await llmEvaluator.evaluate(submission, problem, {
        ...context,
        deterministicFindings: { structural, heuristic },
      });

      return {
        structural,
        heuristic,
        aiInsights: llmResult.aiInsights,
        llmAvailable: true,
        summary: llmResult.summary,
      };
    } catch (err) {
      // A controlled LLM failure must not fail the whole evaluation —
      // deterministic feedback is still useful on its own. Any other
      // (unexpected/programming) error is NOT swallowed the same way.
      if (err instanceof LLMEvaluatorError) {
        // Server-side only — never returned to the learner, never includes
        // GEMINI_API_KEY (err.message/err.cause here come from geminiClient's
        // own error handling, which never includes the key value itself,
        // only whether it was set).
        console.error(
          'LLMEvaluator failed; falling back to rule-based feedback only.',
          'Reason:', err.message,
          err.cause ? `| Cause: ${err.cause.message}` : ''
        );
        return {
          structural,
          heuristic,
          aiInsights: [],
          llmAvailable: false,
          summary: 'Evaluation completed with rule-based feedback. AI feedback was temporarily unavailable.',
        };
      }
      throw new CompositeEvaluatorError('LLM evaluation failed unexpectedly.', err);
    }
  }

  return { evaluate };
}

module.exports = { createCompositeEvaluator, CompositeEvaluatorError };