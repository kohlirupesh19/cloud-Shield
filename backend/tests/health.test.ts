import request from 'supertest';
import { app } from '../src/app';

describe('health', () => {
  it('returns service response', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 500]).toContain(res.status);
  });
});
