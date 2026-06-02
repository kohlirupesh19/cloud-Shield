import { analysisService } from '../src/services/analysis.service';
import { AnalysisType } from '@prisma/client';

// Mock only the repository/queue parts inside enqueue if needed, but for shape we can spy the real or mock at lower level.
// For controller contract test we directly exercise the public enqueue (the thing controller calls and returns with 202).
jest.mock('../src/jobs/analysisQueue', () => ({
  enqueueAnalysis: jest.fn().mockResolvedValue({ id: 'job-1' }),
}));

// Also mock prisma create used inside enqueue
jest.mock('../src/repositories/analysis.repository', () => ({
  analysisRepository: {
    create: jest.fn().mockResolvedValue({ id: 'an-123' }),
  },
}));

describe('Analysis enqueue (controller contract: 202 shape returned by service)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enqueue for QUALITY returns { analysisId, status: QUEUED } shape (what controller sends as 202)', async () => {
    const result = await analysisService.enqueue({
      organizationId: 'org1',
      projectId: 'proj1',
      requestedById: 'user1',
      type: AnalysisType.QUALITY,
      payload: { rows: [] },
    } as any);

    expect(result).toEqual({ analysisId: 'an-123', status: 'QUEUED' });
  });

  it('enqueue for COMBINED returns the shape (controller would send 202)', async () => {
    const result = await analysisService.enqueue({
      organizationId: 'org1',
      projectId: 'proj1',
      requestedById: 'user1',
      type: AnalysisType.COMBINED,
      payload: { run_all: true },
    } as any);

    expect(result).toHaveProperty('analysisId');
    expect(result.status).toBe('QUEUED');
  });
});
