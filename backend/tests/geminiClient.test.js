// Mock the SDK before requiring geminiClient, since geminiClient imports
// it at module load time.
jest.mock('@google/genai', () => {
  return { GoogleGenAI: jest.fn() };
});

const { GoogleGenAI } = require('@google/genai');
const { callGemini } = require('../src/evaluators/geminiClient');

describe('geminiClient', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, GEMINI_API_KEY: 'test-key', GEMINI_TIMEOUT_MS: '5000' };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('throws if no API key is available (env var and override both absent)', async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(callGemini({ prompt: 'hello' })).rejects.toThrow(/GEMINI_API_KEY is not set/);
  });

  test('returns response.text on a successful call', async () => {
    const generateContent = jest.fn().mockResolvedValue({ text: 'plain text response' });
    GoogleGenAI.mockImplementation(() => ({ models: { generateContent } }));

    const result = await callGemini({ prompt: 'hello' });

    expect(result).toBe('plain text response');
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
        contents: 'hello',
      })
    );
  });

  test('passes through model/apiKey overrides instead of only using env vars', async () => {
    const generateContent = jest.fn().mockResolvedValue({ text: 'ok' });
    GoogleGenAI.mockImplementation(() => ({ models: { generateContent } }));

    await callGemini({ prompt: 'hi', apiKey: 'override-key', model: 'gemini-custom-model' });

    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'override-key' });
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-custom-model' })
    );
  });

  test('propagates an SDK error as a rejected promise', async () => {
    const generateContent = jest.fn().mockRejectedValue(new Error('503 Service Unavailable'));
    GoogleGenAI.mockImplementation(() => ({ models: { generateContent } }));

    await expect(callGemini({ prompt: 'hello' })).rejects.toThrow('503 Service Unavailable');
  });

  test('rejects with a GeminiTimeoutError if the SDK call never resolves within the timeout', async () => {
    // Simulate a hung request that never resolves.
    const generateContent = jest.fn().mockImplementation(() => new Promise(() => {}));
    GoogleGenAI.mockImplementation(() => ({ models: { generateContent } }));

    await expect(callGemini({ prompt: 'hello', timeoutMs: 50 })).rejects.toMatchObject({
      name: 'GeminiTimeoutError',
    });
  });

  test('returns an empty string if the response has no text field', async () => {
    const generateContent = jest.fn().mockResolvedValue({});
    GoogleGenAI.mockImplementation(() => ({ models: { generateContent } }));

    const result = await callGemini({ prompt: 'hello' });

    expect(result).toBe('');
  });
});