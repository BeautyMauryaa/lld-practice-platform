// Shared Evaluator contract.
//
// This is intentionally NOT a base class or abstract class — with two
// evaluators that produce genuinely different output shapes
// (RuleEvaluator: { structural, heuristic }, LLMEvaluator: { aiInsights,
// summary }), a class hierarchy would only add indirection without
// enforcing anything useful yet. A future CompositeEvaluator (Step 7) is
// what will actually need a common invocation shape to run both — this
// file documents that shape so both modules agree on it without
// inheritance.
//
// Contract:
//   evaluate(submission, problem, context) -> EvaluationResult | Promise<EvaluationResult>
//
// - submission: the learner's Submission object ({ classes, patternsUsed, codeStub })
// - problem: the Problem object ({ requirements, constraints, expectedConcepts, ... })
// - context: optional extra input an evaluator may use (e.g. findings from
//   another evaluator that already ran). Evaluators that don't need it can
//   ignore it — it defaults to {} and every evaluator must accept it being
//   present or absent without throwing.
//
// Every evaluate() implementation must:
//   - be free of Express/MongoDB dependencies (pure input -> output)
//   - never throw on well-formed input; only throw a controlled,
//     evaluator-specific error (e.g. LLMEvaluatorError) on failure
//   - never write to the database itself
//
// RuleEvaluator.evaluate is synchronous; LLMEvaluator.evaluate is async.
// Callers should always `await` the result so either works uniformly:
//   const result = await someEvaluator.evaluate(submission, problem, context);

/**
 * @typedef {Object} EvaluationContext
 * @property {{structural: Array, heuristic: Array}} [deterministicFindings]
 *   Findings produced by RuleEvaluator, passed to LLMEvaluator so its
 *   feedback doesn't contradict what's already been established.
 */

module.exports = {};