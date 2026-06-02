import { AnalysisStatus, AnalysisType, Prisma } from '@prisma/client';
import { analysisRepository } from '../repositories/analysis.repository';
import { aiClient } from '../ai/aiClient';
import { prisma } from '../config/prisma';
import { enqueueAnalysis } from '../jobs/analysisQueue';

export const analysisService = {
  async runAnalysis(input: {
    organizationId: string;
    projectId: string;
    datasetId?: string;
    requestedById: string;
    type: AnalysisType;
    payload: Prisma.InputJsonValue;
  }) {
    const payload = input.payload as Record<string, any>;

    const record = await analysisRepository.create({
      organizationId: input.organizationId,
      projectId: input.projectId,
      datasetId: input.datasetId,
      requestedById: input.requestedById,
      type: input.type,
      inputPayload: input.payload,
    });

    await analysisRepository.updateStatus(record.id, AnalysisStatus.RUNNING, { startedAt: new Date() });

    const mode: 'single' | 'combined' = input.type === AnalysisType.COMBINED ? 'combined' : 'single';
    const aiReq = {
      organization_id: input.organizationId,
      project_id: input.projectId,
      dataset_id: input.datasetId,
      payload: input.payload,
      frameworks: payload.frameworks,
      mode,
    };

    let result: any;
    try {
      if (input.type === AnalysisType.QUALITY) result = await aiClient.quality(aiReq);
      else if (input.type === AnalysisType.SECURITY) result = await aiClient.security(aiReq);
      else if (input.type === AnalysisType.GOVERNANCE) result = await aiClient.governance(aiReq);
      else if (input.type === AnalysisType.COMPLIANCE) result = await aiClient.compliance(aiReq);
      else if (input.type === AnalysisType.COMBINED) result = await aiClient.workflow(aiReq);
    } catch (err: any) {
      await analysisRepository.updateStatus(record.id, AnalysisStatus.FAILED, {
        errorMessage: err.message || 'AI request failed',
      });
      throw err;
    }

    const summary = typeof result === 'object' ? JSON.stringify(result).slice(0, 1000) : 'completed';
    const innerResult = result?.result || {};
    const qualityScore = innerResult.quality_score !== undefined ? Number(innerResult.quality_score) : null;
    const anomalyScore = innerResult.anomaly_score !== undefined ? Number(innerResult.anomaly_score) : null;
    const riskScore = innerResult.risk_score !== undefined ? Number(innerResult.risk_score) : null;
    const confidence = result?.confidence !== undefined && result.confidence !== null ? Number(result.confidence) : null;

    const updated = await analysisRepository.updateStatus(record.id, AnalysisStatus.COMPLETED, {
      completedAt: new Date(),
      summary,
      confidence,
      riskScore,
    });

    const top = (result as any) || {};
    const llmUsed = !!(top.llm_used ?? (top.result && (top.result as any).llm_used));
    let markdownContent = `# ${input.type} Analysis Report\n\n**LLM-assisted**: ${llmUsed ? 'yes' : 'heuristic-only (no LLM contribution or disabled)'}\n\n`;
    if (input.type === AnalysisType.QUALITY) {
      markdownContent += `## Outlier Detection Results\n- **Quality Score**: ${qualityScore !== null ? qualityScore + '%' : 'N/A'}\n- **Anomaly Score**: ${anomalyScore !== null ? anomalyScore : 'N/A'}\n\n## Issues Found\n${(innerResult.issues || []).map((i: string) => `- ${i}`).join('\n')}\n\n## Explanation\n${innerResult.explanation || ''}\n\n## Recommendations\n${(innerResult.recommendations || []).map((r: string) => `- ${r}`).join('\n')}`;
    } else if (input.type === AnalysisType.SECURITY) {
      markdownContent += `## DBSCAN Behavioral Clustering\n- **Threat Level**: ${innerResult.threat_level || 'LOW'}\n- **Risk Score**: ${riskScore !== null ? riskScore : 'N/A'}\n\n## Summary\n${innerResult.summary || ''}\n\n## Attack Pattern\n${innerResult.attack_pattern || ''}\n\n## Remediations\n${(innerResult.remediations || []).map((r: string) => `- ${r}`).join('\n')}`;
    } else {
      markdownContent += `## Details\n${innerResult.explanation || 'Analysis completed successfully.'}`;
    }

    const report = await prisma.aiReport.create({
      data: {
        organizationId: input.organizationId,
        analysisId: record.id,
        createdById: input.requestedById,
        reportType: input.type,
        title: `${input.type} Scan: ${record.id.slice(-6)}`,
        markdownContent,
        jsonPayload: result || {},
      }
    });

    return { analysis: updated, result, report };
  },

  async history(organizationId: string) {
    return analysisRepository.list(organizationId);
  },

  async status(analysisId: string, organizationId: string) {
    return prisma.analysis.findFirst({ where: { id: analysisId, organizationId } });
  },

  // Async path: create QUEUED record + enqueue job immediately (worker performs the AI work)
  async enqueue(input: {
    organizationId: string;
    projectId: string;
    datasetId?: string;
    requestedById: string;
    type: AnalysisType;
    payload: Prisma.InputJsonValue;
  }) {
    const record = await analysisRepository.create({
      organizationId: input.organizationId,
      projectId: input.projectId,
      datasetId: input.datasetId,
      requestedById: input.requestedById,
      type: input.type,
      inputPayload: input.payload,
    });

    // Do NOT transition to RUNNING here; worker owns the lifecycle
    await enqueueAnalysis({
      analysisId: record.id,
      organizationId: input.organizationId,
      projectId: input.projectId,
      datasetId: input.datasetId,
      requestedById: input.requestedById,
      type: input.type,
      payload: input.payload as any,
    });

    return { analysisId: record.id, status: AnalysisStatus.QUEUED };
  },
};
