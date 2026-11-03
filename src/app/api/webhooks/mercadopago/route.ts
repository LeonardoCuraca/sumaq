import { NextResponse } from 'next/server';
import {
  getOrderById,
  logWebhookEvent,
  recordOrderEvent,
  recordOrderPayment,
  updateWebhookEventStatus,
} from '@/lib/db';
import {
  ensureMpConfigLoaded,
  fetchMercadoPagoPayment,
  getMpConfigStatus,
  getMpWebhookSecret,
  verifyMercadoPagoWebhookSignature,
} from '@/lib/mercadopago';

/**
 * Webhook receptor oficial de Mercado Pago (IPN / Webhooks v2).
 */
export async function POST(request: Request) {
  let webhookLogId: number | null = null;

  try {
    await ensureMpConfigLoaded();

    const url = new URL(request.url);
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    let body: Record<string, unknown> = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      body = {};
    }

    const topic = String(
      body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic') || 'unknown'
    );
    const dataObj = (body.data as Record<string, unknown> | undefined) || {};
    const resourceId = String(
      dataObj.id || url.searchParams.get('data.id') || url.searchParams.get('id') || body.id || ''
    );
    const eventId = body.id ? String(body.id) : xRequestId;

    if (!resourceId) {
      return NextResponse.json({ received: true, ignored: 'missing_resource_id' }, { status: 200 });
    }

    const hasSecret = Boolean(getMpWebhookSecret());
    const signatureValid = hasSecret
      ? verifyMercadoPagoWebhookSignature({
          xSignature,
          xRequestId,
          dataId: url.searchParams.get('data.id') || resourceId,
        })
      : false;

    webhookLogId = await logWebhookEvent({
      provider: 'mercadopago',
      eventId,
      topic,
      resourceId,
      signatureValid,
      status: 'received',
      payload: body,
    });

    if (hasSecret && !signatureValid) {
      await updateWebhookEventStatus(webhookLogId, 'failed', 'Firma HMAC x-signature inválida');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    if (topic !== 'payment' && !topic.includes('payment')) {
      await updateWebhookEventStatus(webhookLogId, 'ignored', `Topic no requiere acción: ${topic}`);
      return NextResponse.json({ received: true, ignored: topic }, { status: 200 });
    }

    const mpConfig = getMpConfigStatus();
    if (!mpConfig.configured) {
      await updateWebhookEventStatus(webhookLogId, 'failed', 'MP_ACCESS_TOKEN no configurado');
      return NextResponse.json({ error: 'MP not configured' }, { status: 503 });
    }

    const verifiedPayment = await fetchMercadoPagoPayment(resourceId);
    if (!verifiedPayment.orderId) {
      await updateWebhookEventStatus(
        webhookLogId,
        'ignored',
        `Pago #${resourceId} sin external_reference de orden SUMAQ`
      );
      return NextResponse.json({ received: true, ignored: 'no_order_reference' }, { status: 200 });
    }

    const order = await getOrderById(verifiedPayment.orderId);
    if (!order) {
      await updateWebhookEventStatus(
        webhookLogId,
        'failed',
        `Orden #${verifiedPayment.orderId} no existe en la base de datos`
      );
      return NextResponse.json({ received: true, error: 'order_not_found' }, { status: 200 });
    }

    if (verifiedPayment.status === 'approved') {
      const expectedTotal = Number(order.total);
      const paidAmount = Number(verifiedPayment.amount);
      if (paidAmount + 0.5 < expectedTotal || verifiedPayment.currency !== 'PEN') {
        const fraudMsg = `Alerta de integridad en Pago #${verifiedPayment.externalPaymentId}: pagado ${verifiedPayment.currency} ${paidAmount} vs esperado PEN ${expectedTotal}`;
        await recordOrderEvent({
          orderId: order.id,
          eventType: 'security_alert',
          description: fraudMsg,
          actor: 'mercadopago_webhook',
        });
        await updateWebhookEventStatus(webhookLogId, 'failed', fraudMsg);
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }
    }

    const result = await recordOrderPayment({
      orderId: order.id,
      provider: 'mercadopago',
      externalPaymentId: verifiedPayment.externalPaymentId,
      status: verifiedPayment.status,
      statusDetail: verifiedPayment.statusDetail,
      paymentType: verifiedPayment.paymentType,
      paymentMethodId: verifiedPayment.paymentMethodId,
      installments: verifiedPayment.installments,
      amount: verifiedPayment.amount,
      feeAmount: verifiedPayment.feeAmount,
      netAmount: verifiedPayment.netAmount,
      currency: verifiedPayment.currency,
      payerEmail: verifiedPayment.payerEmail,
      payerDocType: verifiedPayment.payerDocType,
      payerDocNumber: verifiedPayment.payerDocNumber,
      approvedAt: verifiedPayment.approvedAt,
      rawResponse: verifiedPayment.rawResponse,
      actor: 'mercadopago_webhook',
    });

    await updateWebhookEventStatus(webhookLogId, 'processed');

    return NextResponse.json(
      {
        received: true,
        orderId: order.id,
        orderStatus: result.orderStatus,
        paymentStatus: result.paymentStatus,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[webhooks/mercadopago] Error procesando notificación:', err);
    if (webhookLogId) {
      await updateWebhookEventStatus(
        webhookLogId,
        'failed',
        err instanceof Error ? err.message : 'Error desconocido'
      );
    }
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'SUMAQ Mercado Pago Webhook Receiver' });
}
