import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';

export interface TokenPayload {
  sub: string;
  role: Role;
  organizationId: string;
}

export const tokenService = {
  signAccessToken(payload: TokenPayload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
  },

  signRefreshToken(payload: TokenPayload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
  },

  verifyRefreshToken(token: string) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  },

  sanitizePayload(payload: TokenPayload & { iat?: number; exp?: number }) {
    const { iat: _iat, exp: _exp, ...safePayload } = payload;
    return safePayload;
  },

  hashToken(value: string) {
    return crypto.createHash('sha256').update(value).digest('hex');
  },

  generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  },
};
