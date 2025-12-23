import axios from 'axios';
import FormData from 'form-data';
import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const webhookRouter = Router();

async function sendTelegramDocument(botToken: string, chatId: string, filename: string, content: string) {
  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('document', Buffer.from(content, 'utf-8'), { filename, contentType: 'text/plain' });
  form.append('caption', 'Berikut data pesanan Anda.');

  await axios.post(`https://api.telegram.org/bot${botToken}/sendDocument`, form, {
    headers: form.getHeaders()
  });
}

function formatStockFile(items: { content: string }[]) {
  return items
    .map((item, idx) => `${idx + 1}. ${item.content}`)
    .join('\n');
}

webhookRouter.post('/pakasir/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const payload = req.body as Record<string, any>;
  const orderRef = payload.order_id || payload.orderId || payload.orderCode;

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ providerRef: orderRef }, { order: { orderCode: orderRef } }],
      order: { tenantId }
    },
    include: {
      order: {
        include: {
          user: true,
          tenant: true,
          variant: {
            include: {
              stockItems: {
                where: { isUsed: false },
                orderBy: { createdAt: 'asc' }
              }
            }
          }
        }
      }
    }
  });

  if (!payment || !payment.order) return res.status(404).json({ message: 'Payment not found' });

  if (payment.status === 'PAID') {
    return res.json({ message: 'Already processed' });
  }

  if (!payment.order.variantId || !payment.order.variant) {
    return res.status(400).json({ message: 'Order variant missing' });
  }

  const availableItems = payment.order.variant.stockItems.slice(0, payment.order.qty);

  if (availableItems.length < payment.order.qty) {
    return res.status(409).json({ message: 'Stock habis atau tidak cukup' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: 'PAID', rawWebhookJson: payload } });
    await tx.order.update({ where: { id: payment.orderId }, data: { status: 'PAID', paidAt: new Date() } });
    await tx.transactionLog.create({
      data: {
        tenantId,
        userId: payment.order.userId,
        amount: payment.order.amount,
        type: 'TOPUP',
        note: 'Auto credit after Pakasir payment'
      }
    });
    await tx.user.update({ where: { id: payment.order.userId }, data: { balance: { increment: payment.order.amount } } });
    await tx.productStockItem.updateMany({
      where: { id: { in: availableItems.map((item) => item.id) } },
      data: { isUsed: true, orderId: payment.orderId }
    });
    await tx.productVariant.update({
      where: { id: payment.order.variantId },
      data: { stock: { decrement: availableItems.length } }
    });
  });

  const deliveryContent = formatStockFile(availableItems);

  if (payment.order.user?.tgUserId && payment.order.tenant?.botToken) {
    try {
      await sendTelegramDocument(
        payment.order.tenant.botToken,
        payment.order.user.tgUserId,
        `${payment.order.orderCode || orderRef || 'produk'}.txt`,
        deliveryContent
      );
    } catch (err) {
      console.error('Failed to push delivery file to Telegram', err);
    }
  }

  res.json({ message: 'Payment processed', delivered: availableItems.length });
});
