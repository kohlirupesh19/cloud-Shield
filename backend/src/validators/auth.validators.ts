import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    organizationName: z.string().min(2).max(120),
    organizationSlug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
    fullName: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(10).max(128),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(20) }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email() }),
});

export const resetPasswordSchema = z.object({
  body: z.object({ token: z.string().min(12), password: z.string().min(10).max(128) }),
});

export const verifyEmailSchema = z.object({
  body: z.object({ token: z.string().min(12) }),
});
