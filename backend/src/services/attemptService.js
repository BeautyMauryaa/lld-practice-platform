// AttemptService: the smallest reasonable service layer for the
// submit/evaluate workflow. Every other Attempt endpoint so far has been
// simple enough to live directly in the controller, but this one
// coordinates several steps (status checks, running CompositeEvaluator,
// persisting results, handling failure) — enough that keeping it in the
// route/controller would blur "coordinate the request" with "run the
// workflow." This file owns the workflow; the controller just translates
// its errors into HTTP responses.

const Attempt = require('../models/Attempt');
const Problem = require('../models/Problem');
const { createCompositeEvaluator } = require('../evaluators/compositeEvaluator');
const ruleEvaluator = require('../evaluators/ruleEvaluator');
const llmEvaluator = require('../evaluators/llmEvaluator');

class AttemptNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AttemptNotFoundError';
  }
}

class InvalidSubmissionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidSubmissionError';
  }
}

class AttemptStatusConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AttemptStatusConflictError';
  }
}

class EvaluationPipelineError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'EvaluationPipelineError';
    if (cause) this.cause = cause;
  }
}

// Deliberately minimal: only checks there's something to evaluate at all.
// Does not judge design quality — that's the evaluator's job, not
// validation's, same principle used for the draft-save endpoint.
function hasMeaningfulSubmission(submission) {
  return Boolean(submission) && Array.isArray(submission.classes) && submission.classes.length > 0;
}

/**
 * Runs the full submit -> evaluate -> persist workflow for one attempt.
 *
 * @param {string} attemptId
 * @param {Object} [deps] - dependency injection point for tests; defaults
 *   to the real CompositeEvaluator wired to the real RuleEvaluator/LLMEvaluator.
 * @param {{evaluate: Function}} [deps.compositeEvaluator]
 * @returns {Promise<Attempt>} the saved, evaluated (or failed) attempt document
 */
async function submitAttempt(attemptId, deps = {}) {
  const compositeEvaluator =
    deps.compositeEvaluator || createCompositeEvaluator({ ruleEvaluator, llmEvaluator });

  const attempt = await Attempt.findById(attemptId);

  if (!attempt) {
    throw new AttemptNotFoundError('Attempt not found.');
  }

  if (attempt.status !== 'draft') {
    throw new AttemptStatusConflictError(
      `Cannot submit — attempt status is "${attempt.status}", not "draft".`
    );
  }

  if (!hasMeaningfulSubmission(attempt.submission)) {
    throw new InvalidSubmissionError(
      'Submission must include at least one class before it can be submitted.'
    );
  }

  const problem = await Problem.findById(attempt.problemId).lean();
  if (!problem) {
    // Shouldn't normally happen (createAttempt already verified the
    // problem existed), but handle it as a pipeline failure rather than
    // assuming — the attempt hasn't moved past "draft" yet at this point,
    // so nothing is left stuck in "evaluating".
    throw new EvaluationPipelineError('Associated problem could not be found.');
  }

  // Single persisted transition into evaluation, per the agreed
  // draft -> submitted/evaluating -> evaluated flow.
  attempt.submittedAt = new Date();
  attempt.status = 'evaluating';
  await attempt.save();

  try {
    const feedback = await compositeEvaluator.evaluate(attempt.submission, problem);

    attempt.feedback = feedback;
    attempt.status = 'evaluated';
    attempt.evaluatedAt = new Date();
    await attempt.save();

    return attempt;
  } catch (err) {
    // A genuine pipeline failure (e.g. RuleEvaluator threw) — controlled
    // LLM-only failures never reach this catch, since CompositeEvaluator
    // already resolves those into a normal result with llmAvailable:false.
    attempt.status = 'failed';
    await attempt.save();
    throw new EvaluationPipelineError('Evaluation failed.', err);
  }
}

module.exports = {
  submitAttempt,
  AttemptNotFoundError,
  InvalidSubmissionError,
  AttemptStatusConflictError,
  EvaluationPipelineError,
};