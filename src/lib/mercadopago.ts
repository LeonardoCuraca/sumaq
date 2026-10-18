import crypto from 'node:crypto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import type { OrderItem } from './db';

export interface MpConfigStatus {
  configured: boolean;
  hasWebhookSecret: boolean;
  mode: 'production' | 'sandbox' | 'unconfigured';
  publicKey: string | null;
}

export function getMpAccessToken(): string | null {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  return token && token.length > 10 ? token : null;
}

export function getMpConfigStatus(): MpConfigStatus {
  const token = getMpAccessToken();
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim() || null;
  const hasWebhookSecret = Boolean(process.env.MP_WEBHOOK_SECRET?.trim());
  if (!token) {
    return { configured: false, hasWebhookSecret, mode: 'unconfigured', publicKey };
  }
  const isSandbox = token.startsWith('TEST-') || process.env.MP_SANDBOX === 'true';
  return {
    configured: true,
    hasWebhookSecret,
    mode: isSandbox ? 'sandbox' : 'production',
    publicKey,
  };
}

function getMpClient(): MercadoPagoConfig {
  const accessToken = getMpAccessToken();
  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN no está configurado en las variables de entorno.');
  }
  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 10000 },
  });
}

export interface CreatePreferenceInput {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  customerDoc: string;
  items: OrderItem[];
  shippingCost: number;
  baseUrl?: string;
}

export interface CreatedPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
  checkoutUrl: string;
}

/**
 * Crea una preferencia de pago en Mercado Pago (Checkout Pro) en PEN (Soles).
 * Incluye items detallados, costo de envío, identificación del comprador (DNI/RUC),
 * expiración de 30 minutos (alineada con la reserva de stock) y URLs de retorno + webhook.
 */
export async function createMercadoPagoPreference(
  input: CreatePreferenceInput
): Promise<CreatedPreferenceResult> {
  const client = getMpClient();
  const preference = new Preference(client);
  const baseUrl = (input.baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://sumaq.pe').replace(/\/$/, '');

  const mpItems = input.items.map((item) => ({
    id: item.id,
    title: `${item.name}${item.voltage && item.voltage !== 'N/A' ? ` (${item.voltage})` : ''}`,
    description: `Herramienta profesional Lizze Brasil - Orden ${input.orderNumber}`,
    category_id: 'health_and_beauty',
    quantity: item.qty,
    currency_id: 'PEN',
    unit_price: Number(item.price.toFixed(2)),
  }));

  if (input.shippingCost > 0) {
    mpItems.push({
      id: 'shipping-cost',
      title: 'Despacho y Embalaje Seguro a Agencia / Domicilio',
      description: `Envío de orden ${input.orderNumber}`,
      category_id: 'shipping',
      quantity: 1,
      currency_id: 'PEN',
      unit_price: Number(input.shippingCost.toFixed(2)),
    });
  }

  const docClean = input.customerDoc.replace(/\D/g, '');
  const docType = docClean.length === 11 ? 'RUC' : 'DNI';

  const now = new Date();
  const expiresTo = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos

  const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

  const response = await preference.create({
    body: {
      items: mpItems,
      payer: {
        name: input.customerName,
        email: input.customerEmail || `cliente.${input.orderId}@sumaqimport.pe`,
        phone: {
          area_code: '51',
          number: input.customerPhone.replace(/\D/g, '').replace(/^51/, ''),
        },
        identification: {
          type: docType,
          number: docClean,
        },
      },
      external_reference: String(input.orderId),
      statement_descriptor: 'SUMAQ LIZZE',
      back_urls: {
        success: `${baseUrl}/pedido-confirmado?orderId=${input.orderId}&mp_status=approved`,
        pending: `${baseUrl}/pedido-confirmado?orderId=${input.orderId}&mp_status=pending`,
        failure: `${baseUrl}/pedido-confirmado?orderId=${input.orderId}&mp_status=failure`,
      },
      ...(isLocalhost ? {} : { auto_return: 'approved' }),
      ...(isLocalhost ? {} : { notification_url: `${baseUrl}/api/webhooks/mercadopago` }),
      binary_mode: false,
      expires: true,
      expiration_date_from: now.toISOString(),
      expiration_date_to: expiresTo.toISOString(),
      metadata: {
        order_id: input.orderId,
        order_number: input.orderNumber,
        customer_doc: docClean,
      },
    },
    requestOptions: {
      idempotencyKey: `pref-order-${input.orderId}-${Date.now()}`,
    },
  });

  if (!response.id || !response.init_point) {
    throw new Error('Mercado Pago no devolvió una preferencia válida.');
  }

  const status = getMpConfigStatus();
  const checkoutUrl =
    status.mode === 'sandbox' && response.sandbox_init_point
      ? response.sandbox_init_point
      : response.init_point;

  return {
    preferenceId: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point,
    checkoutUrl,
  };
}

export interface VerifiedMpPayment {
  externalPaymentId: string;
  orderId: number | null;
  status: string;
  statusDetail: string | null;
  paymentType: string | null;
  paymentMethodId: string | null;
  installments: number;
  amount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  payerEmail: string | null;
  payerDocType: string | null;
  payerDocNumber: string | null;
  approvedAt: string | null;
  rawResponse: Record<string, unknown>;
}

/**
 * Consulta directamente la API de Mercado Pago (Source of Truth) por ID de pago.
 * Nunca se confía ciegamente en el body del webhook sin verificar el recurso en MP.
 */
export async function fetchMercadoPagoPayment(paymentId: string | number): Promise<VerifiedMpPayment> {
  const client = getMpClient();
  const paymentClient = new Payment(client);
  const p = await paymentClient.get({ id: String(paymentId) });

  const externalRef = p.external_reference || (p.metadata as Record<string, unknown> | undefined)?.order_id;
  const parsedOrderId = externalRef ? Number(externalRef) : NaN;

  const amount = Number(p.transaction_amount ?? 0);
  const netReceived = Number(p.transaction_details?.net_received_amount ?? 0);
  const feeCharges = Array.isArray(p.fee_details)
    ? p.fee_details.reduce((acc, f) => acc + Number(f.amount ?? 0), 0)
    : 0;
  const computedNet = netReceived > 0 ? netReceived : Math.max(0, amount - feeCharges);

  return {
    externalPaymentId: String(p.id),
    orderId: Number.isFinite(parsedOrderId) && parsedOrderId > 0 ? parsedOrderId : null,
    status: p.status || 'pending',
    statusDetail: p.status_detail || null,
    paymentType: p.payment_type_id || null,
    paymentMethodId: p.payment_method_id || null,
    installments: Number(p.installments ?? 1),
    amount,
    feeAmount: Number(feeCharges.toFixed(2)),
    netAmount: Number(computedNet.toFixed(2)),
    currency: p.currency_id || 'PEN',
    payerEmail: p.payer?.email || null,
    payerDocType: p.payer?.identification?.type || null,
    payerDocNumber: p.payer?.identification?.number || null,
    approvedAt: p.date_approved || null,
    rawResponse: p as unknown as Record<string, unknown>,
  };
}

/**
 * Busca pagos asociados a un external_reference (orderId) directamente en Mercado Pago.
 * Útil para reconciliación activa desde el panel de administración o cuando el cliente vuelve al sitio.
 */
export async function searchMercadoPagoPaymentsByOrder(orderId: number): Promise<VerifiedMpPayment[]> {
  const client = getMpClient();
  const paymentClient = new Payment(client);
  const res = await paymentClient.search({
    options: {
      external_reference: String(orderId),
      sort: 'date_created',
      criteria: 'desc',
    },
  });

  const results = res.results || [];
  return results.map((p) => {
    const amount = Number(p.transaction_amount ?? 0);
    const netReceived = Number(p.transaction_details?.net_received_amount ?? 0);
    const rawFeeDetails = (p as unknown as { fee_details?: Array<{ amount?: number }> }).fee_details;
    const feeCharges = Array.isArray(rawFeeDetails)
      ? rawFeeDetails.reduce((acc: number, f: { amount?: number }) => acc + Number(f.amount ?? 0), 0)
      : 0;
    const computedNet = netReceived > 0 ? netReceived : Math.max(0, amount - feeCharges);

    return {
      externalPaymentId: String(p.id),
      orderId,
      status: p.status || 'pending',
      statusDetail: p.status_detail || null,
      paymentType: p.payment_type_id || null,
      paymentMethodId: p.payment_method_id || null,
      installments: Number(p.installments ?? 1),
      amount,
      feeAmount: Number(feeCharges.toFixed(2)),
      netAmount: Number(computedNet.toFixed(2)),
      currency: p.currency_id || 'PEN',
      payerEmail: p.payer?.email || null,
      payerDocType: p.payer?.identification?.type || null,
      payerDocNumber: p.payer?.identification?.number || null,
      approvedAt: p.date_approved || null,
      rawResponse: p as unknown as Record<string, unknown>,
    };
  });
}

/**
 * Verifica criptográficamente la firma HMAC-SHA256 enviada por Mercado Pago en el header `x-signature`.
 * Formato oficial de manifest de MP: `id:[data.id_lower];request-id:[x-request-id];ts:[ts];`
 */
export function verifyMercadoPagoWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret?: string | null;
}): boolean {
  const secret = (params.secret ?? process.env.MP_WEBHOOK_SECRET)?.trim();
  // Si no hay MP_WEBHOOK_SECRET configurado, devolvemos false pero el caller puede decidir
  // si igual verifica contra la API de MP (Zero-Trust). Si hay secret, debe coincidir exactamente.
  if (!secret) return false;
  if (!params.xSignature || !params.dataId) return false;

  const parts = params.xSignature.split(',');
  let ts = '';
  let v1 = '';
  for (const part of parts) {
    const [key, val] = part.split('=', 2).map((s) => s?.trim());
    if (key === 'ts') ts = val || '';
    if (key === 'v1') v1 = val || '';
  }

  if (!ts || !v1) return false;

  const cleanDataId = params.dataId.toLowerCase();
  let manifest = `id:${cleanDataId};`;
  if (params.xRequestId) {
    manifest += `request-id:${params.xRequestId};`;
  }
  manifest += `ts:${ts};`;

  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(v1, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
