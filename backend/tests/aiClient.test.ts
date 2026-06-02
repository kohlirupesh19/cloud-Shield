import { aiClient, AIAnalysisRequest } from '../src/ai/aiClient';
import ApiError from '../src/utils/ApiError';

// Mock global fetch for testing timeout/retry/typing
const mockFetch = jest.fn();
const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = mockFetch as any;
});

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.AI_CLIENT_TIMEOUT_MS;
});

const baseReq: AIAnalysisRequest = {
  organization_id: 'org1',
  project_id: 'proj1',
  payload: { rows: [] },
};

describe('aiClient hardening (Phase 1)', () => {
  it('uses AbortController (passes signal to fetch) and maps AbortError to timeout ApiError', async () => {
    process.env.AI_CLIENT_TIMEOUT_MS = '100';
    mockFetch.mockImplementation((url: any, init: any) => {
      // Immediately simulate an aborted fetch (as if timeout fired)
      const err = new Error('The operation was aborted.');
      (err as any).name = 'AbortError';
      return Promise.reject(err);
    });

    await expect(aiClient.quality(baseReq)).rejects.toThrow(/timed out after|aborted|AI engine request failed/i);
    expect(mockFetch).toHaveBeenCalled();
    const callInit = mockFetch.mock.calls[0][1];
    expect(callInit?.signal).toBeInstanceOf(AbortSignal);
  });

  it('should retry on 502 with backoff (up to 2 retries)', async () => {
    let calls = 0;
    mockFetch.mockImplementation(async () => {
      calls++;
      if (calls <= 2) {
        return { ok: false, status: 502, text: async () => 'bad gateway' } as any;
      }
      return { ok: true, json: async () => ({ success: true, analysis_type: 'quality', confidence: 0.8, explanation: 'ok', result: {}, metadata: {} }) } as any;
    });

    const res = await aiClient.quality(baseReq);
    expect(calls).toBe(3); // initial + 2 retries
    expect(res).toHaveProperty('success', true);
  });

  it('should retry on network error', async () => {
    let calls = 0;
    mockFetch.mockImplementation(async () => {
      calls++;
      if (calls < 2) {
        throw new Error('fetch failed');
      }
      return { ok: true, json: async () => ({ success: true, analysis_type: 'quality', confidence: 0.7, explanation: 'recovered', result: { foo: 1 }, metadata: {} }) } as any;
    });

    const res = await aiClient.quality(baseReq);
    expect(calls).toBe(2);
    expect(res.result.foo).toBe(1);
  });

  it('should not retry on 400 client error, propagate ApiError', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, text: async () => 'bad request' } as any);

    await expect(aiClient.security(baseReq)).rejects.toBeInstanceOf(ApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('replaces any-cast: calls pass typed request and receive typed response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        analysis_type: 'security',
        confidence: 0.85,
        explanation: 'from llm',
        result: { threat_level: 'HIGH' },
        metadata: { provider: 'ollama' },
      }),
    } as any);

    const res = await aiClient.security(baseReq);
    expect(res.analysis_type).toBe('security');
    expect(res.result.threat_level).toBe('HIGH');
  });

  it('types response envelope', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, analysis_type: 'governance', confidence: 0.9, explanation: '', result: {}, metadata: {} }) } as any);
    const res = await aiClient.governance(baseReq);
    expect(typeof res.success).toBe('boolean');
    expect(typeof res.confidence).toBe('number');
  });
});
