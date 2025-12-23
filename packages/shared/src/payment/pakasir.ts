import axios from 'axios';
import { InvoiceRequest, InvoiceResponse, PaymentProvider, WebhookPayload } from './types';

export class PakasirProvider implements PaymentProvider {
  name = 'pakasir';
  constructor(private options: { projectSlug: string; apiKey: string; mode?: 'url' | 'api'; baseUrl?: string }) {}

  async createInvoice(request: InvoiceRequest): Promise<InvoiceResponse> {
    if (this.options.mode === 'api') {
      const endpoint = `${this.options.baseUrl || 'https://app.pakasir.com'}/api/transactioncreate/qris`; // default method
      const { data } = await axios.post(endpoint, {
        project: this.options.projectSlug,
        order_id: request.orderId,
        amount: request.amount,
        api_key: this.options.apiKey
      });
      return {
        providerRef: request.orderId,
        paymentNumber: data.payment_number,
        totalPayment: data.total_payment,
        expiresAt: data.expired_at
      };
    }

    const url = `${this.options.baseUrl || 'https://app.pakasir.com'}/pay/${this.options.projectSlug}/${request.amount}?order_id=${encodeURIComponent(request.orderId)}`;
    return { payUrl: url, providerRef: request.orderId };
  }

  async verify(params: { orderId: string; amount: number }): Promise<boolean> {
    const detailUrl = `${this.options.baseUrl || 'https://app.pakasir.com'}/api/transactiondetail`;
    const { data } = await axios.get(detailUrl, {
      params: {
        project: this.options.projectSlug,
        order_id: params.orderId,
        amount: params.amount,
        api_key: this.options.apiKey
      }
    });
    return data?.status === 'completed';
  }

  parseWebhook(payload: unknown): WebhookPayload {
    const body = payload as Record<string, any>;
    return {
      order_id: body.order_id,
      amount: Number(body.amount),
      status: body.status,
      project: body.project,
      payment_method: body.payment_method,
      completed_at: body.completed_at
    };
  }
}
