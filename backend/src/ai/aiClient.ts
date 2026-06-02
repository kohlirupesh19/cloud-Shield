import { Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { env } from '../config/env';

export interface AIAnalysisRequest {
  organization_id: string;
  project_id: string;
  dataset_id?: string;
  payload: Prisma.InputJsonValue;
  frameworks?: string[];
  mode?: 'single' | 'combined';
  source_hash?: string;
}

export interface AIAnalysisResponse {
  success: boolean;
  analysis_type: string;
  confidence: number;
  explanation: string;
  result: Record<string, any>;
  metadata: Record<string, any>;
  llm_used?: boolean;
}

const AI_TIMEOUT_MS = Number(process.env.AI_CLIENT_TIMEOUT_MS || 50_000); // slightly above Ollama default 45s; override in tests for speed
const MAX_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function postToAI<T = AIAnalysisResponse>(path: string, payload: AIAnalysisRequest | Record<string, unknown>): Promise<T> {
  const url = `${env.AI_ENGINE_URL}${path}`;
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (env.AI_INTERNAL_TOKEN) headers['X-Internal-Token'] = env.AI_INTERNAL_TOKEN;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        // Only retry on 5xx / network-ish; 4xx are client errors, fail fast
        if (res.status >= 500 && attempt < MAX_RETRIES) {
          lastErr = new ApiError(502, `AI engine request failed (attempt ${attempt + 1}): ${body}`);
          await sleep(200 * (attempt + 1)); // bounded backoff
          continue;
        }
        throw new ApiError(502, `AI engine request failed: ${body}`);
      }

      return (await res.json()) as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError' || /abort/i.test(err.message || '')) {
        lastErr = new ApiError(504, `AI engine request timed out after ${AI_TIMEOUT_MS}ms`);
        if (attempt < MAX_RETRIES) {
          await sleep(300 * (attempt + 1));
          continue;
        }
        throw lastErr;
      }
      if (attempt < MAX_RETRIES && (err instanceof TypeError || /fetch|network|ECONNRESET/i.test(err.message || ''))) {
        lastErr = err;
        await sleep(250 * (attempt + 1));
        continue;
      }
      // non-retryable
      if (err instanceof ApiError) throw err;
      throw new ApiError(502, `AI engine request failed: ${err.message || err}`);
    }
  }

  throw lastErr || new ApiError(502, 'AI engine request failed after retries');
}

export const aiClient = {
  quality: (req: AIAnalysisRequest) => postToAI<AIAnalysisResponse>('/ai/quality', req),
  security: (req: AIAnalysisRequest) => postToAI<AIAnalysisResponse>('/ai/security', req),
  governance: (req: AIAnalysisRequest) => postToAI<AIAnalysisResponse>('/ai/governance', req),
  compliance: (req: AIAnalysisRequest) => postToAI<AIAnalysisResponse>('/ai/compliance', req),
  workflow: (req: AIAnalysisRequest) => postToAI<Record<string, any>>('/ai/workflow', req),
  reset: () => postToAI<Record<string, any>>('/ai/reset', {}),
};
