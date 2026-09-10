const { createLLMEvaluator, LLMEvaluatorError, buildPrompt } = require('../src/evaluators/llmEvaluator');

const problem = {
  title: 'Design a Parking Lot',
  requirements: ['Support multiple spot sizes', 'Track vehicle entry/exit'],
  constraints: ['No payment gateway integration is required'],
  expectedConcepts: ['Some form of spot allocation strategy'],
};

const submission = {
  classes: [
    { name: 'ParkingLot', responsibilities: ['manage spots'], relationships: ['has many Spot'] },
  ],
  patternsUsed: [],
  codeStub: '',
};

const deterministicFindings = {
  structural: [{ message: 'Class "ParkingLot" has no listed responsibilities.', severity: 'info' }],
  heuristic: [{ message: 'Spot allocation is not clearly addressed.', severity: 'info' }],
};

function jsonResponse(obj) {
  return JSON.stringify(obj);
}

describe('LLMEvaluator - valid responses', () => {
  test('a valid Gemini-style response is correctly parsed into aiInsights and summary', async () => {
    const fakeCallLLM = jest.fn().mockResolvedValue(
      jsonResponse({
        aiInsights: [{ message: 'Consider separating spot allocation logic into its own class.' }],
        summary: 'The design covers the basics but could separate concerns further.',
      })
    );

    const evaluator = createLLMEvaluator(fakeCallLLM);
    const result = await evaluator.evaluate(submission, problem, { deterministicFindings });

    expect(result.aiInsights).toEqual([
      { message: 'Consider separating spot allocation logic into its own class.' },
    ]);
    expect(result.summary).toBe('The design covers the basics but could separate concerns further.');
  });

  test('multiple insights are preserved, in order', async () => {
    const fakeCallLLM = jest.fn().mockResolvedValue(
      jsonResponse({
        aiInsights: [
          { message: 'First insight about coupling.' },
          { message: 'Second insight about extensibility.' },
          { message: 'Third insight about abstraction.' },
        ],
        summary: 'Three distinct points worth considering.',
      })
    );

    const evaluator = createLLMEvaluator(fakeCallLLM);
    const result = await evaluator.evaluate(submission, problem, { deterministicFindings });

    expect(result.aiInsights).toHaveLength(3);
    expect(result.aiInsights[0].message).toBe('First insight about coupling.');
    expect(result.aiInsights[2].message).toBe('Third insight about abstraction.');
  });

  test('handles a response wrapped in markdown code fences', async () => {
    const fakeCallLLM = jest.fn().mockResolvedValue(
      '```json\n' + jsonResponse({ aiInsights: [{ message: 'Fenced insight.' }], summary: 'Fenced summary.' }) + '\n```'
    );

    const evaluator = createLLMEvaluator(fakeCallLLM);
    const result = await evaluator.evaluate(submission, problem, { deterministicFindings });

    expect(result.aiInsights[0].message).toBe('Fenced insight.');
  });
});

describe('LLMEvaluator - malformed responses', () => {
  test('malformed JSON throws a controlled LLMEvaluatorError', async () => {
    const fakeCallLLM = jest.fn().mockResolvedValue('this is not json {{{');

    const evaluator = createLLMEvaluator(fakeCallLLM);

    await expect(evaluator.evaluate(submission, problem, { deterministicFindings })).rejects.toThrow(
      LLMEvaluatorError
    );
  });

  test('missing "aiInsights" field throws a controlled error', async () => {
    const fakeCallLLM = jest.fn().mockResolvedValue(jsonResponse({ summary: 'Only a summary, no insights.' }));

    const evaluator = createLLMEvaluator(fakeCallLLM);

    await expect(evaluator.evaluate(submission, problem, {})).rejects.toThrow(LLMEvaluatorError);
    await expect(evaluator.evaluate(submission, problem, {})).rejects.toThrow(/aiInsights/);
  });

  test('missing "summary" field throws a controlled error', async () => {
    const fakeCallLLM = jest.fn().mockResolvedValue(jsonResponse({ aiInsights: [{ message: 'x' }] }));

    const evaluator = createLLMEvaluator(fakeCallLLM);

    await expect(evaluator.evaluate(submission, problem, {})).rejects.toThrow(/summary/);
  });

  test('an aiInsights item without a "message" string throws a controlled error', async () => {
    const fakeCallLLM = jest.fn().mockResolvedValue(
      jsonResponse({ aiInsights: [{ note: 'wrong field name' }], summary: 'ok' })
    );

    const evaluator = createLLMEvaluator(fakeCallLLM);

    await expect(evaluator.evaluate(submission, problem, {})).rejects.toThrow(LLMEvaluatorError);
  });
});

describe('LLMEvaluator - API failures', () => {
  test('a generic API error is wrapped in a controlled LLMEvaluatorError', async () => {
    const fakeCallLLM = jest.fn().mockRejectedValue(new Error('503 Service Unavailable'));

    const evaluator = createLLMEvaluator(fakeCallLLM);

    await expect(evaluator.evaluate(submission, problem, {})).rejects.toThrow(LLMEvaluatorError);
    await expect(evaluator.evaluate(submission, problem, {})).rejects.toThrow(/API error/);
  });

  test('a timeout error (GeminiTimeoutError) is wrapped in a controlled LLMEvaluatorError mentioning timeout', async () => {
    const timeoutErr = new Error('Gemini request timed out after 30000ms.');
    timeoutErr.name = 'GeminiTimeoutError';
    const fakeCallLLM = jest.fn().mockRejectedValue(timeoutErr);

    const evaluator = createLLMEvaluator(fakeCallLLM);

    await expect(evaluator.evaluate(submission, problem, {})).rejects.toThrow(/timed out/i);
  });

  test('a generic timeout-flavored error message is still detected even without a special error name', async () => {
    const timeoutErr = new Error('The request timeout was exceeded.');
    const fakeCallLLM = jest.fn().mockRejectedValue(timeoutErr);

    const evaluator = createLLMEvaluator(fakeCallLLM);

    await expect(evaluator.evaluate(submission, problem, {})).rejects.toThrow(/timed out/i);
  });
});

describe('LLMEvaluator - prompt content', () => {
  test('prompt includes problem details, submission, deterministic findings, and design-plurality instructions', () => {
    const prompt = buildPrompt(submission, problem, deterministicFindings);

    // Problem details
    expect(prompt).toContain('Design a Parking Lot');
    expect(prompt).toContain('Support multiple spot sizes');
    expect(prompt).toContain('No payment gateway integration is required');
    expect(prompt).toContain('Some form of spot allocation strategy');

    // Submission details
    expect(prompt).toContain('ParkingLot');
    expect(prompt).toContain('manage spots');

    // Deterministic findings
    expect(prompt).toContain('Class "ParkingLot" has no listed responsibilities.');
    expect(prompt).toContain('Spot allocation is not clearly addressed.');

    // Required instructions
    expect(prompt).toMatch(/multiple LLD designs can be valid/i);
    expect(prompt).toMatch(/not.*mandatory answers|not required answers/i);
    expect(prompt).toMatch(/do not contradict the deterministic findings/i);
    expect(prompt).toMatch(/avoid generic praise/i);
  });
});