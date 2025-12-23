export interface InvoiceRequest {
  tenantId: string;
  orderId: string;
  amount: number;
  method?: string;
  description?: string;
}

export interface InvoiceResponse {
  payUrl?: string;
  expiresAt?: string;
  providerRef?: string;
  paymentNumber?: string;
  totalPayment?: number;
}

export interface WebhookPayload {
  order_id: string;
  amount: number;
  status: string;
  project?: string;
  payment_method?: string;
  completed_at?: string;
}

export interface PaymentProvider {
  name: string;
  createInvoice(request: InvoiceRequest): Promise<InvoiceResponse>;
  verify(params: { orderId: string; amount: number }): Promise<boolean>;
  parseWebhook(payload: unknown): WebhookPayload;
}
