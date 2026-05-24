import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import asyncHandler from '../utils/asyncHandler';
import { prisma } from '../config/prisma';
import { tokenService } from '../services/token.service';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.register(req.body);
    sendSuccess(res, data, 'Registration completed', 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.login({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || undefined,
    });
    sendSuccess(res, data, 'Login successful');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.refreshToken(req.body.refreshToken);
    sendSuccess(res, data, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.body.refreshToken);
    sendSuccess(res, {}, 'Logged out');
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findFirst({ where: { email: req.body.email } });
    if (!user) return sendSuccess(res, {}, 'If the email exists, reset instructions were sent');
    const token = tokenService.generateSecureToken();
    await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpires: new Date(Date.now() + 15 * 60 * 1000) } });
    sendSuccess(res, { resetTokenPreview: token }, 'Reset token generated');
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findFirst({
      where: { resetToken: req.body.token, resetTokenExpires: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, resetToken: null, resetTokenExpires: null } });
    sendSuccess(res, {}, 'Password reset successful');
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    await prisma.user.updateMany({ where: { emailVerifyToken: req.body.token }, data: { isEmailVerified: true, emailVerifyToken: null } });
    sendSuccess(res, {}, 'Email verified');
  }),

  profile: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, { user: req.user }, 'Profile loaded');
  }),
};
