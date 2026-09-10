const { createCompositeEvaluator, CompositeEvaluatorError } = require('../src/evaluators/compositeEvaluator');
const { LLMEvaluatorError } = require('../src/evaluators/llmEvaluator');

const problem = { title: 'Design a Parking Lot', expectedConcepts: ['Some form of spot allocation strategy'] };
const submission = { classes: [{ name: 'ParkingLot', responsibilities: [], relationships: [] }], patternsUsed: [], codeStub: '' };

function makeFakeRuleEvaluator(result) {
  return { evaluate: jest.fn().mockReturnValue(result) };
}

function makeFakeLLMEvaluator(resultOrRejection, { rejects = false } = {}) {
  return {
    evaluate: rejects ? jest.fn().mockRejectedValue(resultOrRejection) : jest.fn().mockResolvedValue(resultOrRejection),
  };
}

describe('CompositeEvaluator - A. Rule + LLM both succeed', () => {
  test('preserves structural, heuristic, aiInsights, and summary; llmAvailable is true', async () => {
    const ruleResult = {
      structural: [{ message: 'Class "ParkingLot" has no listed responsibilities.', severity: 'info' }],
      heuristic: [{ message: 'Spot allocation is not clearly addressed.', severity: 'info' }],
    };
    const llmResult = {
      aiInsights: [{ message: 'Consider extracting allocation logic into its own class.' }],
      summary: 'Solid start, a few things worth refining.',
    };

    const ruleEvaluator = makeFakeRuleEvaluator(ruleResult);
    const llmEvaluator = makeFakeLLMEvaluator(llmResult);
    const composite = createCompositeEvaluator({ ruleEvaluator, llmEvaluator });

    const result = await composite.evaluate(submission, problem);

    expect(result).toEqual({
      structural: ruleResult.structural,
      heuristic: ruleResult.heuristic,
      aiInsights: llmResult.aiInsights,
      llmAvailable: true,
      summary: llmResult.summary,
    });
  });
});

describe('CompositeEvaluator - B. LLM fails with LLMEvaluatorError', () => {
  test('preserves deterministic findings, empties aiInsights, sets llmAvailable false, provides fallback summary, and does not throw', async () => {
    const ruleResult = {
      structural: [{ message: 'Class "ParkingLot" has no listed responsibilities.', severity: 'info' }],
      heuristic: [{ message: 'Spot allocation is not clearly addressed.', severity: 'info' }],
    };

    const ruleEvaluator = makeFakeRuleEvaluator(ruleResult);
    const llmEvaluator = makeFakeLLMEvaluator(new LLMEvaluatorError('LLM evaluation timed out.'), { rejects: true });
    const composite = createCompositeEvaluator({ ruleEvaluator, llmEvaluator });

    const result = await composite.evaluate(submission, problem);

    expect(result.structural).toEqual(ruleResult.structural);
    expect(result.heuristic).toEqual(ruleResult.heuristic);
    expect(result.aiInsights).toEqual([]);
    expect(result.llmAvailable).toBe(false);
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
    // The raw provider error must never leak into the learner-facing summary.
    expect(result.summary).not.toMatch(/api key|gemini|anthropic/i);
  });
});

describe('CompositeEvaluator - C. RuleEvaluator fails', () => {
  test('throws a CompositeEvaluatorError and never calls the LLM evaluator', async () => {
    const ruleEvaluator = { evaluate: jest.fn().mockImplementation(() => { throw new Error('unexpected crash'); }) };
    const llmEvaluator = { evaluate: jest.fn() };
    const composite = createCompositeEvaluator({ ruleEvaluator, llmEvaluator });

    await expect(composite.evaluate(submission, problem)).rejects.toThrow(CompositeEvaluatorError);
    expect(llmEvaluator.evaluate).not.toHaveBeenCalled();
  });

  test('also handles a rejected (async) RuleEvaluator failure the same way', async () => {
    const ruleEvaluator = { evaluate: jest.fn().mockRejectedValue(new Error('db-ish failure')) };
    const llmEvaluator = { evaluate: jest.fn() };
    const composite = createCompositeEvaluator({ ruleEvaluator, llmEvaluator });

    await expect(composite.evaluate(submission, problem)).rejects.toThrow(CompositeEvaluatorError);
    expect(llmEvaluator.evaluate).not.toHaveBeenCalled();
  });
});

describe('CompositeEvaluator - D. Dependency injection', () => {
  test('uses the exact injected evaluator functions, not any internally instantiated concrete evaluator', async () => {
    const ruleResult = { structural: [], heuristic: [] };
    const llmResult = { aiInsights: [{ message: 'x' }], summary: 'y' };

    const ruleEvaluator = makeFakeRuleEvaluator(ruleResult);
    const llmEvaluator = makeFakeLLMEvaluator(llmResult);
    const composite = createCompositeEvaluator({ ruleEvaluator, llmEvaluator });

    await composite.evaluate(submission, problem);

    expect(ruleEvaluator.evaluate).toHaveBeenCalledTimes(1);
    expect(llmEvaluator.evaluate).toHaveBeenCalledTimes(1);
  });

  test('swapping in different fake evaluators changes the output — proves no hardcoded concrete evaluator is used', async () => {
    const ruleEvaluatorA = makeFakeRuleEvaluator({ structural: [{ message: 'A', severity: 'info' }], heuristic: [] });
    const llmEvaluatorA = makeFakeLLMEvaluator({ aiInsights: [], summary: 'A summary' });
    const compositeA = createCompositeEvaluator({ ruleEvaluator: ruleEvaluatorA, llmEvaluator: llmEvaluatorA });
    const resultA = await compositeA.evaluate(submission, problem);

    const ruleEvaluatorB = makeFakeRuleEvaluator({ structural: [{ message: 'B', severity: 'warning' }], heuristic: [] });
    const llmEvaluatorB = makeFakeLLMEvaluator({ aiInsights: [], summary: 'B summary' });
    const compositeB = createCompositeEvaluator({ ruleEvaluator: ruleEvaluatorB, llmEvaluator: llmEvaluatorB });
    const resultB = await compositeB.evaluate(submission, problem);

    expect(resultA.structural[0].message).toBe('A');
    expect(resultB.structural[0].message).toBe('B');
    expect(resultA.summary).toBe('A summary');
    expect(resultB.summary).toBe('B summary');
  });
});

describe('CompositeEvaluator - E. Deterministic findings are passed into LLMEvaluator', () => {
  test('llmEvaluator.evaluate receives structural + heuristic findings from ruleEvaluator via context.deterministicFindings', async () => {
    const ruleResult = {
      structural: [{ message: 'Structural finding X', severity: 'warning' }],
      heuristic: [{ message: 'Heuristic finding Y', severity: 'info' }],
    };
    const ruleEvaluator = makeFakeRuleEvaluator(ruleResult);
    const llmEvaluator = makeFakeLLMEvaluator({ aiInsights: [], summary: 'ok' });
    const composite = createCompositeEvaluator({ ruleEvaluator, llmEvaluator });

    await composite.evaluate(submission, problem);

    expect(llmEvaluator.evaluate).toHaveBeenCalledWith(
      submission,
      problem,
      expect.objectContaining({
        deterministicFindings: {
          structural: ruleResult.structural,
          heuristic: ruleResult.heuristic,
        },
      })
    );
  });
});