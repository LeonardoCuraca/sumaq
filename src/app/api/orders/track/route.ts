import { NextResponse } from 'next/server';
import { checkRateLimit, getOrderForPublicTracking } from '@/lib/db';
import { badRequest, notFound, serverError, tooManyRequests } from '@/lib/api';
import { clientIp } from '@/lib/guards';

/**
 * Consulta pública de estado de pedido autenticada mediante Número de Orden (ej. SMQ-2026-000015 o #15)
 * + Documento de Identidad (DNI o RUC del comprador).
 */
export async function GET(request: Request) {
  try {
    if (!(await checkRateLimit(`track:${clientIp(request)}`, 20, 900))) {
      return tooManyRequests();
    }

    const url = new URL(request.url);
    const orderQuery = (url.searchParams.get('order') || '').trim();
    const doc = (url.searchParams.get('doc') || '').trim();

    if (!orderQuery || !doc) {
      return badRequest('Ingresa el código de tu orden y tu DNI o RUC.');
    }

    if (!/^(\d{8}|\d{11})$/.test(doc)) {
      return badRequest('El DNI (8 dígitos) o RUC (11 dígitos) no tiene un formato válido.');
    }

    const order = await getOrderForPublicTracking(orderQuery, doc);
    if (!order) {
      return notFound('No encontramos un pedido con esa combinación de código de orden y DNI/RUC.');
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      invoiceType: order.invoiceType,
      deliveryType: order.deliveryType,
      city: order.city,
      address: order.address,
      paymentMethod: order.paymentMethod,
      paymentGateway: order.paymentGateway,
      paymentStatus: order.paymentStatus,
      status: order.status,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      currency: order.currency,
      items: order.items,
      shippingCarrier: order.shippingCarrier,
      trackingCode: order.trackingCode,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      events: order.events || [],
    });
  } catch (error) {
    return serverError('orders track GET', error);
  }
}
