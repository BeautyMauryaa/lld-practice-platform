const Attempt = require('../models/Attempt');
const Learner = require('../models/Learner');
const Problem = require('../models/Problem');
const { isValidObjectId, validateSubmissionShape } = require('../validation/attemptValidation');
const attemptService = require('../services/attemptService');

// Shapes an Attempt document into the full response format used by
// GET /api/attempts/:id (and reused by createAttempt/saveDraft responses).
function toFullAttemptResponse(attempt) {
  return {
    id: attempt._id,
    learnerId: attempt.learnerId,
    problemId: attempt.problemId,
    submission: attempt.submission,
    status: attempt.status,
    feedback: attempt.feedback,
    createdAt: attempt.createdAt,
    submittedAt: attempt.submittedAt,
    evaluatedAt: attempt.evaluatedAt,
  };
}

// POST /api/attempts
async function createAttempt(req, res) {
  const { learnerId, problemId } = req.body || {};

  if (!learnerId || !problemId) {
    return res.status(400).json({ error: 'learnerId and problemId are required.' });
  }

  if (!isValidObjectId(learnerId) || !isValidObjectId(problemId)) {
    return res.status(400).json({ error: 'learnerId and problemId must be valid IDs.' });
  }

  try {
    const [learner, problem] = await Promise.all([
      Learner.findById(learnerId).lean(),
      Problem.findById(problemId).lean(),
    ]);

    if (!learner) {
      return res.status(404).json({ error: 'Learner not found.' });
    }
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    const attempt = await Attempt.create({
      learnerId,
      problemId,
      submission: {
        classes: [],
        patternsUsed: [],
        codeStub: '',
      },
      status: 'draft',
    });

    res.status(201).json(toFullAttemptResponse(attempt));
  } catch (err) {
    console.error('Error creating attempt:', err.message);
    res.status(500).json({ error: 'Failed to create attempt.' });
  }
}

// PATCH /api/attempts/:id
async function saveDraft(req, res) {
  const { id } = req.params;
  const { submission } = req.body || {};

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid attempt ID.' });
  }

  if (submission === undefined) {
    return res.status(400).json({ error: 'submission is required.' });
  }

  const shapeError = validateSubmissionShape(submission);
  if (shapeError) {
    return res.status(400).json({ error: shapeError });
  }

  try {
    const attempt = await Attempt.findById(id);

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }

    if (attempt.status !== 'draft') {
      return res.status(409).json({
        error: `Cannot update submission — attempt status is "${attempt.status}", not "draft".`,
      });
    }

    attempt.submission = {
      classes: submission.classes !== undefined ? submission.classes : attempt.submission.classes,
      patternsUsed: submission.patternsUsed !== undefined ? submission.patternsUsed : attempt.submission.patternsUsed,
      codeStub: submission.codeStub !== undefined ? submission.codeStub : attempt.submission.codeStub,
    };

    await attempt.save();

    res.json(toFullAttemptResponse(attempt));
  } catch (err) {
    console.error('Error saving draft:', err.message);
    res.status(500).json({ error: 'Failed to save draft.' });
  }
}

// GET /api/attempts/:id
async function getAttempt(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid attempt ID.' });
  }

  try {
    const attempt = await Attempt.findById(id).lean();

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }

    res.json({
      id: attempt._id,
      learnerId: attempt.learnerId,
      problemId: attempt.problemId,
      submission: attempt.submission,
      status: attempt.status,
      feedback: attempt.feedback,
      createdAt: attempt.createdAt,
      submittedAt: attempt.submittedAt,
      evaluatedAt: attempt.evaluatedAt,
    });
  } catch (err) {
    console.error('Error fetching attempt:', err.message);
    res.status(500).json({ error: 'Failed to fetch attempt.' });
  }
}

// GET /api/attempts?learnerId=xxx
async function listAttemptsByLearner(req, res) {
  const { learnerId } = req.query;

  if (!learnerId) {
    return res.status(400).json({ error: 'learnerId query parameter is required.' });
  }

  if (!isValidObjectId(learnerId)) {
    return res.status(400).json({ error: 'learnerId must be a valid ID.' });
  }

  try {
    const learner = await Learner.findById(learnerId).lean();
    if (!learner) {
      return res.status(404).json({ error: 'Learner not found.' });
    }

    const attempts = await Attempt.find({ learnerId })
      .sort({ createdAt: -1 })
      .select('problemId status createdAt submittedAt evaluatedAt')
      .lean();

    const result = attempts.map((a) => ({
      id: a._id,
      problemId: a.problemId,
      status: a.status,
      createdAt: a.createdAt,
      submittedAt: a.submittedAt,
      evaluatedAt: a.evaluatedAt,
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching attempt history:', err.message);
    res.status(500).json({ error: 'Failed to fetch attempt history.' });
  }
}

// POST /api/attempts/:id/submit
async function submitAttempt(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid attempt ID.' });
  }

  try {
    const attempt = await attemptService.submitAttempt(id);
    res.json(toFullAttemptResponse(attempt));
  } catch (err) {
    if (err instanceof attemptService.AttemptNotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof attemptService.InvalidSubmissionError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof attemptService.AttemptStatusConflictError) {
      return res.status(409).json({ error: err.message });
    }
    if (err instanceof attemptService.EvaluationPipelineError) {
      // Log the real cause server-side; never expose provider errors,
      // API keys, or internal details to the learner.
      console.error('Evaluation pipeline failed:', err.message, err.cause ? err.cause.message : '');
      return res.status(500).json({ error: 'Evaluation failed. Please try again.' });
    }

    console.error('Unexpected error during submit:', err.message);
    res.status(500).json({ error: 'Failed to submit attempt.' });
  }
}

// DELETE /api/attempts/:id
async function deleteAttempt(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid attempt ID.' });
  }

  try {
    const attempt = await Attempt.findByIdAndDelete(id);

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting attempt:', err.message);
    res.status(500).json({ error: 'Failed to delete attempt.' });
  }
}

module.exports = { createAttempt, saveDraft, getAttempt, listAttemptsByLearner, submitAttempt, deleteAttempt };