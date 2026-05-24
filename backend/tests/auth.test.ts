import { tokenService } from '../src/services/token.service';

describe('token service', () => {
  it('creates access token', () => {
    const token = tokenService.signAccessToken({
      sub: 'user1',
      role: 'ORG_ADMIN' as any,
      organizationId: 'org1',
    });
    expect(typeof token).toBe('string');
  });
});
