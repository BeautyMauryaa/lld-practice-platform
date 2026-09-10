const express = require('express');
const request = require('supertest');

jest.mock('../src/services/attemptService', () => {
  const actual = jest.requireActual('../src/services/attemptService');
  return {
    ...actual,
    submitAttempt: jest.fn(),
  };
});

const attemptService = require('../src/services/attemptService');
const attemptRoutes = require('../src/routes/attemptRoutes');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/attempts', attemptRoutes);
  return app;
}

const VALID_ID = '507f1f77bcf86cd799439011';

describe('POST /api/attempts/:id/submit', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.clearAllMocks();
  });

  test('malformed ID returns 400 without calling the service', async () => {
    const res = await request(app).post('/api/attempts/not-a-real-id/submit').send();

    expect(res.status).toBe(400);
    expect(attemptService.submitAttempt).not.toHaveBeenCalled();
  });

  test('successful submission returns 200 with id, status, and feedback', async () => {
    const feedback = {
      structural: [],
      heuristic: [],
      aiInsights: [{ message: 'Good use of composition.' }],
      llmAvailable: true,
      summary: 'Solid overall.',
    };
    attemptService.submitAttempt.mockResolvedValue({
      _id: VALID_ID,
      learnerId: 'learner1',
      problemId: 'problem1',
      submission: { classes: [], patternsUsed: [], codeStub: '' },
      status: 'evaluated',
      feedback,
      createdAt: new Date(),
      submittedAt: new Date(),
      evaluatedAt: new Date(),
    });

    const res = await request(app).post(`/api/attempts/${VALID_ID}/submit`).send();

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(VALID_ID);
    expect(res.body.status).toBe('evaluated');
    expect(res.body.feedback).toEqual(feedback);
  });

  test('attempt not found returns 404', async () => {
    attemptService.submitAttempt.mockRejectedValue(
      new attemptService.AttemptNotFoundError('Attempt not found.')
    );

    const res = await request(app).post(`/api/attempts/${VALID_ID}/submit`).send();

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Attempt not found.');
  });

  test('invalid/empty submission returns 400', async () => {
    attemptService.submitAttempt.mockRejectedValue(
      new attemptService.InvalidSubmissionError('Submission must include at least one class before it can be submitted.')
    );

    const res = await request(app).post(`/api/attempts/${VALID_ID}/submit`).send();

    expect(res.status).toBe(400);
  });

  test('already-submitted/evaluated attempt returns 409', async () => {
    attemptService.submitAttempt.mockRejectedValue(
      new attemptService.AttemptStatusConflictError('Cannot submit — attempt status is "evaluated", not "draft".')
    );

    const res = await request(app).post(`/api/attempts/${VALID_ID}/submit`).send();

    expect(res.status).toBe(409);
  });

  test('total pipeline failure returns 500 with a generic, non-leaking error message', async () => {
    const providerErr = new Error('GEMINI_API_KEY is not set.');
    attemptService.submitAttempt.mockRejectedValue(
      new attemptService.EvaluationPipelineError('Evaluation failed.', providerErr)
    );

    const res = await request(app).post(`/api/attempts/${VALID_ID}/submit`).send();

    expect(res.status).toBe(500);
    expect(res.body.error).not.toMatch(/api key|gemini/i);
  });
});