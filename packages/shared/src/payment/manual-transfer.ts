import { InvoiceRequest, InvoiceResponse, PaymentProvider, WebhookPayload } from './types';

export class ManualTransferProvider implements PaymentProvider {
  name = 'manual-transfer';

  async createInvoice(request: InvoiceRequest): Promise<InvoiceResponse> {
    const payUrl = `https://example.com/manual-transfer?order_id=${encodeURIComponent(request.orderId)}&amount=${request.amount}`;
    return { payUrl, providerRef: request.orderId };
  }

  async verify(): Promise<boolean> {
    return false; // manual verification handled outside
  }

  parseWebhook(payload: unknown): WebhookPayload {
    const body = payload as Record<string, any>;
    return {
      order_id: body.order_id,
      amount: Number(body.amount),
      status: body.status || 'pending'
    };
  }
}
