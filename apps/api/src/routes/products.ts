import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

export const productRouter = Router();
productRouter.use(requireAuth);

productRouter.get('/categories', async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenantId;
  const categories = await prisma.productCategory.findMany({
    where: tenantId ? { tenantId } : undefined,
    include: { products: { include: { variants: true } } },
    orderBy: { sortOrder: 'asc' }
  });
  res.json({ categories });
});

productRouter.post('/categories', async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(400).json({ message: 'Tenant context required' });
  const { name, sortOrder } = req.body;
  const category = await prisma.productCategory.create({ data: { tenantId, name, sortOrder } });
  res.status(201).json({ category });
});

productRouter.post('/products', async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(400).json({ message: 'Tenant context required' });
  const { categoryId, name, description, sortOrder } = req.body;
  const product = await prisma.product.create({
    data: { tenantId, categoryId, name, description, sortOrder }
  });
  res.status(201).json({ product });
});

productRouter.post('/variants', async (req: AuthenticatedRequest, res) => {
  const { productId, name, price, stock, sku } = req.body;
  const variant = await prisma.productVariant.create({ data: { productId, name, price, stock, sku } });
  res.status(201).json({ variant });
});

productRouter.post('/variants/:id/stock', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { payload } = req.body as { payload: string };
  if (!payload) return res.status(400).json({ message: 'payload is required' });

  const entries = payload
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (entries.length === 0) return res.status(400).json({ message: 'No stock entries detected' });

  const created = await prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.update({
      where: { id },
      data: {
        stock: { increment: entries.length },
        stockItems: { createMany: { data: entries.map((content) => ({ content })) } }
      }
    });
    return { variant };
  });

  res.status(201).json({ count: entries.length, variant: created.variant });
});

productRouter.patch('/variants/:id', async (req, res) => {
  const { id } = req.params;
  const { price, stock, isActive } = req.body;
  const variant = await prisma.productVariant.update({ data: { price, stock, isActive }, where: { id } });
  res.json({ variant });
});
