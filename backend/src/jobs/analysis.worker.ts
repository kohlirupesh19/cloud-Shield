import { Worker, Job } from 'bullmq';
import { bullmqRedisConnection } from '../config/redis';
import logger from '../config/logger';
import { ANALYSIS_QUEUE_NAME } from './analysisQueue';
import { analysisRepository } from '../repositories/analysis.repository';
import { aiClient } from '../ai/aiClient';
import { prisma } from '../config/prisma';
import { AnalysisStatus, AnalysisType } from '@prisma/client';

export interface AnalysisJobData {
  analysisId: string;
  organizationId: string;
  projectId: string;
  datasetId?: string;
  requestedById: string;
  type: AnalysisType;
  payload: any;
}

/**
 * Pure-ish job processor: drives the PENDING/QUEUED -> RUNNING -> COMPLETED/FAILED
 * lifecycle, calls the AI engine, and persists the report. Extracted from the
 * Worker callback so it can be unit-tested without a live Redis/BullMQ connection.
 */
export async function processAnalysisJob(data: AnalysisJobData): Promise<{ analysisId: string; success: boolean }> {
  await analysisRepository.updateStatus(data.analysisId, AnalysisStatus.RUNNING, { startedAt: new Date() });

  const mode: 'single' | 'combined' = data.type === AnalysisType.COMBINED ? 'combined' : 'single';
  const aiReq = {
    organization_id: data.organizationId,
    project_id: data.projectId,
    dataset_id: data.datasetId,
    payload: data.payload,
    frameworks: data.payload?.frameworks,
    mode,
  };

  let result: any;
  try {
    if (data.type === AnalysisType.QUALITY) result = await aiClient.quality(aiReq);
    else if (data.type === AnalysisType.SECURITY) result = await aiClient.security(aiReq);
    else if (data.type === AnalysisType.GOVERNANCE) result = await aiClient.governance(aiReq);
    else if (data.type === AnalysisType.COMPLIANCE) result = await aiClient.compliance(aiReq);
    else if (data.type === AnalysisType.COMBINED) result = await aiClient.workflow(aiReq);
    else throw new Error(`Unknown analysis type: ${data.type}`);
  } catch (err: any) {
    await analysisRepository.updateStatus(data.analysisId, AnalysisStatus.FAILED, {
      errorMessage: err.message || 'AI request failed',
    });
    logger.error({ err, analysisId: data.analysisId }, 'Analysis job failed');
    throw err; // let bull mark failed
  }

  const summary = typeof result === 'object' ? JSON.stringify(result).slice(0, 1000) : 'completed';
  const innerResult = result?.result || {};
  const qualityScore = innerResult.quality_score !== undefined ? Number(innerResult.quality_score) : null;
  const anomalyScore = innerResult.anomaly_score !== undefined ? Number(innerResult.anomaly_score) : null;
  const riskScore = innerResult.risk_score !== undefined ? Number(innerResult.risk_score) : null;
  const confidence = result?.confidence !== undefined && result.confidence !== null ? Number(result.confidence) : null;

  await analysisRepository.updateStatus(data.analysisId, AnalysisStatus.COMPLETED, {
    completedAt: new Date(),
    summary,
    confidence,
    riskScore,
  });

  const markdownContent = buildReportMarkdown(data.type, result, { qualityScore, anomalyScore, riskScore });

  await prisma.aiReport.create({
    data: {
      organizationId: data.organizationId,
      analysisId: data.analysisId,
      createdById: data.requestedById,
      reportType: data.type,
      title: `${data.type} Scan: ${data.analysisId.slice(-6)}`,
      markdownContent,
      jsonPayload: result || {},
    },
  });

  logger.info({ analysisId: data.analysisId }, 'Analysis job completed');
  return { analysisId: data.analysisId, success: true };
}

/** Build the human-readable report markdown. Exported for testing. */
export function buildReportMarkdown(
  type: AnalysisType,
  result: any,
  scores: { qualityScore: number | null; anomalyScore: number | null; riskScore: number | null }
): string {
  const { qualityScore, anomalyScore, riskScore } = scores;
  const innerResult = result?.result || {};
  const llmUsed = !!(result && (result as any).llm_used);
  let markdownContent = `# ${type} Analysis Report\n\n`;
  markdownContent += `**LLM-assisted**: ${llmUsed ? 'yes' : 'heuristic-only (no LLM contribution or disabled)'}\n\n`;
  if (type === AnalysisType.QUALITY) {
    markdownContent += `## Outlier Detection Results\n- **Quality Score**: ${qualityScore !== null ? qualityScore + '%' : 'N/A'}\n- **Anomaly Score**: ${anomalyScore !== null ? anomalyScore : 'N/A'}\n\n## Issues Found\n${(innerResult.issues || []).map((i: string) => `- ${i}`).join('\n')}\n\n## Explanation\n${innerResult.explanation || ''}\n\n## Recommendations\n${(innerResult.recommendations || []).map((r: string) => `- ${r}`).join('\n')}`;
  } else if (type === AnalysisType.SECURITY) {
    markdownContent += `## DBSCAN Behavioral Clustering\n- **Threat Level**: ${innerResult.threat_level || 'LOW'}\n- **Risk Score**: ${riskScore !== null ? riskScore : 'N/A'}\n\n## Summary\n${innerResult.summary || ''}\n\n## Attack Pattern\n${innerResult.attack_pattern || ''}\n\n## Remediations\n${(innerResult.remediations || []).map((r: string) => `- ${r}`).join('\n')}`;
  } else {
    markdownContent += `## Details\n${innerResult.explanation || 'Analysis completed successfully.'}`;
  }
  return markdownContent;
}

export function startAnalysisWorker() {
  const worker = new Worker(
    ANALYSIS_QUEUE_NAME,
    async (job: Job) => {
      const data = job.data as AnalysisJobData;
      logger.info({ jobId: job.id, analysisId: data.analysisId, type: data.type }, 'Processing analysis job');
      return processAnalysisJob(data);
    },
    {
      connection: bullmqRedisConnection,
      concurrency: 2, // allow some parallel analyses
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Analysis worker job failed');
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Analysis worker job completed');
  });

  logger.info('Analysis worker started');
  return worker;
}
