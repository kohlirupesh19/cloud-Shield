import { z } from 'zod';

export const runAnalysisSchema = z.object({
  body: z.object({
    projectId: z.string().min(1),
    datasetId: z.string().optional(),
    payload: z.record(z.any()).default({}),
  }),
});

export const generateReportSchema = z.object({
  body: z.object({
    analysisId: z.string().min(1),
  }),
});
