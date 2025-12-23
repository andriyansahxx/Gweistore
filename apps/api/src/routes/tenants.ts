import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

export const tenantRouter = Router();

tenantRouter.use(requireAuth);

function ensureSuperAdmin(req: AuthenticatedRequest, res: any) {
  if (req.user?.role !== 'SUPERADMIN') {
    res.status(403).json({ message: 'Forbidden' });
    return false;
  }
  return true;
}

tenantRouter.get('/', async (_req, res) => {
  const tenants = await prisma.tenant.findMany({ include: { settings: true, paymentSettings: true } });
  res.json({ tenants });
});

tenantRouter.post('/', async (req: AuthenticatedRequest, res) => {
  if (!ensureSuperAdmin(req, res)) return;
  const { name, botToken, rentalStart, rentalEnd } = req.body;
  const tenant = await prisma.tenant.create({
    data: {
      name,
      botToken,
      rentalStart: rentalStart ? new Date(rentalStart) : null,
      rentalEnd: rentalEnd ? new Date(rentalEnd) : null
    }
  });
  res.status(201).json({ tenant });
});

tenantRouter.patch('/:id', async (req: AuthenticatedRequest, res) => {
  if (!ensureSuperAdmin(req, res)) return;
  const { id } = req.params;
  const { isActive, name, botToken, rentalStart, rentalEnd } = req.body;
  const tenant = await prisma.tenant.update({
    where: { id },
    data: {
      isActive,
      name,
      botToken,
      rentalStart: rentalStart ? new Date(rentalStart) : undefined,
      rentalEnd: rentalEnd ? new Date(rentalEnd) : undefined
    }
  });
  res.json({ tenant });
});
