import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken({ sub: admin.id, role: admin.role, tenantId: admin.tenantId ?? undefined });

  return res.json({ token, role: admin.role, tenantId: admin.tenantId });
});

authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const admin = await prisma.adminUser.findUnique({ where: { id: req.user.id } });
  return res.json({ admin });
});
