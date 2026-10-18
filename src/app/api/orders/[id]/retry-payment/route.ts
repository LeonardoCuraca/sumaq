import { NextResponse } from 'next/server';
import { getOrderById, recordOrderEvent, saveOrderMpPreference } from '@/lib/db';
import { badRequest, notFound, serverError } from '@/lib/api';
import { createMercadoPagoPreference, getMpConfigStatus } from '@/lib/mercadopago';

/**
 * Genera una nueva Preferencia de Mercado Pago para una orden existente cuyo pago falló o quedó pendiente.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return badRequest('ID de orden inválido');
    }

    const order = await getOrderById(orderId);
    if (!order) return notFound('Orden no encontrada');

    if (order.paymentStatus === 'paid') {
      return badRequest('Esta orden ya se encuentra pagada.');
    }
    if (order.status === 'cancelado') {
      return badRequest('Esta orden fue cancelada. Por favor genera un nuevo pedido.');
    }

    const mpConfig = getMpConfigStatus();
    if (!mpConfig.configured) {
      return badRequest('La pasarela de Mercado Pago no está configurada en este entorno.');
    }

    const origin = new URL(request.url).origin;
    const pref = await createMercadoPagoPreference({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail || undefined,
      customerPhone: order.customerPhone,
      customerDoc: order.customerDoc,
      items: order.items,
      shippingCost: order.shippingCost,
      baseUrl: origin,
    });

    await saveOrderMpPreference(order.id, pref.preferenceId);
    await recordOrderEvent({
      orderId: order.id,
      eventType: 'payment_retry',
      fromState: order.paymentStatus,
      toState: 'unpaid',
      description: `Nuevo link de pago de Mercado Pago generado (${pref.preferenceId})`,
      actor: order.customerName,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      preferenceId: pref.preferenceId,
      checkoutUrl: pref.checkoutUrl,
    });
  } catch (error) {
    return serverError('orders retry-payment POST', error);
  }
}
