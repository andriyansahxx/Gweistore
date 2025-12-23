import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenantId;
  const users = await prisma.user.findMany({ where: tenantId ? { tenantId } : undefined, take: 100 });
  res.json({ users });
});

userRouter.patch('/:id/balance-adjust', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { amount, note } = req.body;
  const user = await prisma.user.update({
    where: { id },
    data: { balance: { increment: amount } }
  });
  await prisma.transactionLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      amount,
      note,
      type: amount >= 0 ? 'ADJUSTMENT' : 'ADJUSTMENT'
    }
  });
  res.json({ user });
});
