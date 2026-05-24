import { Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { env } from '../config/env';

async function postToAI<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${env.AI_ENGINE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(502, `AI engine request failed: ${body}`);
  }

  return (await res.json()) as T;
}

export interface AIAnalysisRequest {
  organization_id: string;
  project_id: string;
  dataset_id?: string;
  payload: Prisma.InputJsonValue;
  frameworks?: string[];
}

export const aiClient = {
  quality: (req: AIAnalysisRequest) => postToAI('/ai/quality', req as any),
  security: (req: AIAnalysisRequest) => postToAI('/ai/security', req as any),
  governance: (req: AIAnalysisRequest) => postToAI('/ai/governance', req as any),
  compliance: (req: AIAnalysisRequest) => postToAI('/ai/compliance', req as any),
  workflow: (req: AIAnalysisRequest) => postToAI('/ai/workflow', req as any),
  reset: () => postToAI('/ai/reset', {}),
};
