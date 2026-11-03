import { NextResponse } from 'next/server';
import { getOrderById, recordOrderPayment } from '@/lib/db';
import { badRequest, notFound, serverError } from '@/lib/api';
import {
  ensureMpConfigLoaded,
  fetchMercadoPagoPayment,
  getMpConfigStatus,
  searchMercadoPagoPaymentsByOrder,
} from '@/lib/mercadopago';

/**
 * Verifica el estado actual de una orden y, si tiene un payment_id o preferencia de Mercado Pago,
 * sincroniza en vivo con la API de Mercado Pago (útil cuando el cliente regresa de MP
 * antes de que llegue el webhook asíncrono, o cuando el administrador hace clic en "Sincronizar con MP").
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return badRequest('ID de orden inválido');
    }

    const url = new URL(request.url);
    const paymentIdParam = url.searchParams.get('payment_id') || url.searchParams.get('collection_id');
    const forceSync = url.searchParams.get('sync') === '1';

    let order = await getOrderById(orderId);
    if (!order) return notFound('Orden no encontrada');

    await ensureMpConfigLoaded();
    const mpConfig = getMpConfigStatus();

    // Si recibimos un payment_id explícito de MP o se solicitó sincronización activa
    if (mpConfig.configured && (paymentIdParam || (forceSync && order.paymentGateway === 'mercadopago'))) {
      try {
        if (paymentIdParam && paymentIdParam !== 'null') {
          const verified = await fetchMercadoPagoPayment(paymentIdParam);
          if (verified.orderId === order.id && verified.amount + 0.5 >= order.total) {
            await recordOrderPayment({
              orderId: order.id,
              provider: 'mercadopago',
              externalPaymentId: verified.externalPaymentId,
              status: verified.status,
              statusDetail: verified.statusDetail,
              paymentType: verified.paymentType,
              paymentMethodId: verified.paymentMethodId,
              installments: verified.installments,
              amount: verified.amount,
              feeAmount: verified.feeAmount,
              netAmount: verified.netAmount,
              currency: verified.currency,
              payerEmail: verified.payerEmail,
              payerDocType: verified.payerDocType,
              payerDocNumber: verified.payerDocNumber,
              approvedAt: verified.approvedAt,
              rawResponse: verified.rawResponse,
              actor: 'live_verification',
            });
            order = (await getOrderById(orderId)) ?? order;
          }
        } else if (forceSync) {
          const payments = await searchMercadoPagoPaymentsByOrder(order.id);
          for (const verified of payments) {
            if (verified.amount + 0.5 >= order.total) {
              await recordOrderPayment({
                orderId: order.id,
                provider: 'mercadopago',
                externalPaymentId: verified.externalPaymentId,
                status: verified.status,
                statusDetail: verified.statusDetail,
                paymentType: verified.paymentType,
                paymentMethodId: verified.paymentMethodId,
                installments: verified.installments,
                amount: verified.amount,
                feeAmount: verified.feeAmount,
                netAmount: verified.netAmount,
                currency: verified.currency,
                payerEmail: verified.payerEmail,
                payerDocType: verified.payerDocType,
                payerDocNumber: verified.payerDocNumber,
                approvedAt: verified.approvedAt,
                rawResponse: verified.rawResponse,
                actor: 'admin_sync',
              });
            }
          }
          order = (await getOrderById(orderId)) ?? order;
        }
      } catch (syncErr) {
        console.warn('[orders/[id]/verify] No se pudo sincronizar con MP:', syncErr);
      }
    }

    // Retornar datos seguros para la vista de confirmación
    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      invoiceType: order.invoiceType,
      deliveryType: order.deliveryType,
      city: order.city,
      paymentMethod: order.paymentMethod,
      paymentGateway: order.paymentGateway,
      paymentStatus: order.paymentStatus,
      mpPaymentId: order.mpPaymentId,
      status: order.status,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      currency: order.currency,
      shippingCarrier: order.shippingCarrier,
      trackingCode: order.trackingCode,
      items: order.items,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      mpConfigured: mpConfig.configured,
    });
  } catch (error) {
    return serverError('orders verify GET', error);
  }
}
