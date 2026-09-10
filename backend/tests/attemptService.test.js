const Attempt = require('../src/models/Attempt');
const Problem = require('../src/models/Problem');
const {
  submitAttempt,
  AttemptNotFoundError,
  InvalidSubmissionError,
  AttemptStatusConflictError,
  EvaluationPipelineError,
} = require('../src/services/attemptService');

function makeAttemptDoc(overrides = {}) {
  const doc = {
    _id: 'attempt1',
    problemId: 'problem1',
    status: 'draft',
    submission: {
      classes: [{ name: 'ParkingLot', responsibilities: [], relationships: [] }],
      patternsUsed: [],
      codeStub: '',
    },
    feedback: null,
    submittedAt: undefined,
    evaluatedAt: undefined,
    ...overrides,
  };
  doc.save = jest.fn().mockImplementation(() => Promise.resolve(doc));
  return doc;
}

function fakeProblemFindById(problem = { _id: 'problem1', title: 'Design a Parking Lot' }) {
  return () => ({ lean: async () => problem });
}

describe('attemptService.submitAttempt', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('A: successful submission runs CompositeEvaluator and persists an evaluated attempt', async () => {
    const attemptDoc = makeAttemptDoc();
    Attempt.findById = jest.fn().mockResolvedValue(attemptDoc);
    Problem.findById = fakeProblemFindById();

    const feedback = {
      structural: [],
      heuristic: [],
      aiInsights: [{ message: 'Consider separating concerns.' }],
      llmAvailable: true,
      summary: 'Looks solid.',
    };
    const compositeEvaluator = { evaluate: jest.fn().mockResolvedValue(feedback) };

    const result = await submitAttempt('attempt1', { compositeEvaluator });

    expect(compositeEvaluator.evaluate).toHaveBeenCalledTimes(1);
    expect(compositeEvaluator.evaluate).toHaveBeenCalledWith(attemptDoc.submission, expect.objectContaining({ title: 'Design a Parking Lot' }));
    expect(result.status).toBe('evaluated');
    expect(result.feedback).toEqual(feedback);
    expect(result.submittedAt).toBeInstanceOf(Date);
    expect(result.evaluatedAt).toBeInstanceOf(Date);
    // persisted twice: once entering "evaluating", once with the final result
    expect(attemptDoc.save).toHaveBeenCalledTimes(2);
  });

  test('B: attempt not found throws AttemptNotFoundError and never touches the evaluator', async () => {
    Attempt.findById = jest.fn().mockResolvedValue(null);
    const compositeEvaluator = { evaluate: jest.fn() };

    await expect(submitAttempt('missing-id', { compositeEvaluator })).rejects.toThrow(AttemptNotFoundError);
    expect(compositeEvaluator.evaluate).not.toHaveBeenCalled();
  });

  test('C: an empty/invalid submission throws InvalidSubmissionError and never touches the evaluator', async () => {
    const attemptDoc = makeAttemptDoc({ submission: { classes: [], patternsUsed: [], codeStub: '' } });
    Attempt.findById = jest.fn().mockResolvedValue(attemptDoc);
    const compositeEvaluator = { evaluate: jest.fn() };

    await expect(submitAttempt('attempt1', { compositeEvaluator })).rejects.toThrow(InvalidSubmissionError);
    expect(compositeEvaluator.evaluate).not.toHaveBeenCalled();
    expect(attemptDoc.save).not.toHaveBeenCalled();
  });

  test('D: an already-submitted/evaluated attempt throws AttemptStatusConflictError and never touches the evaluator', async () => {
    const attemptDoc = makeAttemptDoc({ status: 'evaluated' });
    Attempt.findById = jest.fn().mockResolvedValue(attemptDoc);
    const compositeEvaluator = { evaluate: jest.fn() };

    await expect(submitAttempt('attempt1', { compositeEvaluator })).rejects.toThrow(AttemptStatusConflictError);
    expect(compositeEvaluator.evaluate).not.toHaveBeenCalled();
    expect(attemptDoc.save).not.toHaveBeenCalled();
  });

  test('E: LLM unavailable — CompositeEvaluator result with llmAvailable:false is still saved as evaluated', async () => {
    const attemptDoc = makeAttemptDoc();
    Attempt.findById = jest.fn().mockResolvedValue(attemptDoc);
    Problem.findById = fakeProblemFindById();

    const feedback = {
      structural: [{ message: 'Structural finding', severity: 'info' }],
      heuristic: [{ message: 'Heuristic finding', severity: 'info' }],
      aiInsights: [],
      llmAvailable: false,
      summary: 'Evaluation completed with rule-based feedback. AI feedback was temporarily unavailable.',
    };
    const compositeEvaluator = { evaluate: jest.fn().mockResolvedValue(feedback) };

    const result = await submitAttempt('attempt1', { compositeEvaluator });

    expect(result.status).toBe('evaluated');
    expect(result.feedback.llmAvailable).toBe(false);
    expect(result.feedback.structural).toEqual(feedback.structural);
    expect(result.feedback.heuristic).toEqual(feedback.heuristic);
  });

  test('F: total evaluator failure marks the attempt failed (not stuck in evaluating) and rethrows', async () => {
    const attemptDoc = makeAttemptDoc();
    Attempt.findById = jest.fn().mockResolvedValue(attemptDoc);
    Problem.findById = fakeProblemFindById();

    const compositeEvaluator = { evaluate: jest.fn().mockRejectedValue(new Error('RuleEvaluator crashed')) };

    await expect(submitAttempt('attempt1', { compositeEvaluator })).rejects.toThrow(EvaluationPipelineError);
    expect(attemptDoc.status).toBe('failed');
    expect(attemptDoc.status).not.toBe('evaluating');
    expect(attemptDoc.save).toHaveBeenCalledTimes(2); // entering evaluating, then failed
  });

  test('a missing associated Problem is a pipeline failure, not a silent partial evaluation', async () => {
    const attemptDoc = makeAttemptDoc();
    Attempt.findById = jest.fn().mockResolvedValue(attemptDoc);
    Problem.findById = fakeProblemFindById(null);
    const compositeEvaluator = { evaluate: jest.fn() };

    await expect(submitAttempt('attempt1', { compositeEvaluator })).rejects.toThrow(EvaluationPipelineError);
    expect(compositeEvaluator.evaluate).not.toHaveBeenCalled();
    expect(attemptDoc.save).not.toHaveBeenCalled();
  });
});