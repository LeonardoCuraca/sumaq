import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  createOrder,
  formatOrderNumber,
  getProductsByIds,
  saveOrderMpPreference,
} from '@/lib/db';
import { badRequest, readJson, serverError, tooManyRequests } from '@/lib/api';
import { clientIp, getSessionUser } from '@/lib/guards';
import { QuoteError, buildQuote, type Role } from '@/lib/pricing';
import { formatZodError, orderSchema } from '@/lib/validation';
import { SITE, whatsappUrl } from '@/lib/site';
import {
  createMercadoPagoPreference,
  ensureMpConfigLoaded,
  getMpConfigStatus,
} from '@/lib/mercadopago';

export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit(`order:${clientIp(request)}`, 15, 3600))) return tooManyRequests();

    let body: unknown;
    try {
      body = await readJson(request);
    } catch {
      return badRequest('JSON inválido o demasiado grande');
    }
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) return badRequest(formatZodError(parsed.error));
    const data = parsed.data;

    // Si solicita factura, validar que el documento sea un RUC de 11 dígitos
    if (data.invoiceType === 'factura' && data.dniRuc.length !== 11) {
      return badRequest('Para emitir Factura Electrónica debes ingresar un RUC válido de 11 dígitos.');
    }

    const user = await getSessionUser();
    const role = user?.role as Role;

    // Los precios, el stock, el flete y el total se calculan SIEMPRE en servidor.
    const products = await getProductsByIds([...new Set(data.items.map((i) => i.id))]);
    let quote;
    try {
      quote = buildQuote(data, products, role);
    } catch (err) {
      if (err instanceof QuoteError) return badRequest(err.message);
      throw err;
    }

    const address =
      data.deliveryType === 'almacen'
        ? `Retiro en almacén (${SITE.warehouseShort})`
        : data.address;
    if (data.deliveryType === 'domicilio' && address.length < 5) {
      return badRequest('Ingresa la dirección de entrega.');
    }

    const gateway =
      data.paymentGateway ??
      (data.paymentMethod.toLowerCase().includes('mercado') ? 'mercadopago' : 'manual_whatsapp');

    let orderId: number;
    try {
      orderId = await createOrder({
        customerName: data.fullName,
        customerDoc: data.dniRuc,
        customerPhone: data.phone,
        customerEmail: data.email || undefined,
        invoiceType: data.invoiceType,
        deliveryType: data.deliveryType,
        city: data.city,
        address,
        paymentMethod: data.paymentMethod,
        paymentGateway: gateway,
        subtotal: quote.subtotal,
        shippingCost: quote.shipping,
        total: quote.total,
        items: quote.items,
        userId: user?.id ? Number(user.id) : null,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('Stock insuficiente')) {
        return badRequest(err.message);
      }
      throw err;
    }

    const orderNumber = formatOrderNumber(orderId);

    const lines = quote.items
      .map((it) => `• ${it.name} x${it.qty} (${it.voltage || '220V'}) - S/ ${it.price * it.qty}`)
      .join('\n');
    const text =
      `*NUEVO PEDIDO SUMAQ - LIZZE BRASIL (${orderNumber})*\n\n` +
      `*Cliente:* ${data.fullName}\n` +
      `*Comprobante:* ${data.invoiceType.toUpperCase()} (${data.dniRuc})\n` +
      `*WhatsApp:* ${data.phone}\n` +
      `*Entrega:* ${data.deliveryType === 'almacen' ? 'Retiro en Almacén (Jesús María)' : `Envío a domicilio (${data.city})`}\n` +
      `*Dirección:* ${address}\n` +
      `*Método de Pago:* ${data.paymentMethod}\n\n` +
      `*HERRAMIENTAS SOLICITADAS:*\n${lines}\n\n` +
      `*Subtotal:* S/ ${quote.subtotal}\n` +
      `*Envío:* S/ ${quote.shipping}\n` +
      `*TOTAL:* S/ ${quote.total}\n\n` +
      `_Hola asesor de SUMAQ, acabo de generar mi orden ${orderNumber} en la web oficial y deseo coordinar el despacho y emisión de mi comprobante._`;

    const waUrl = whatsappUrl(text);

    // Si el cliente eligió pagar con Mercado Pago y las credenciales están activas, creamos la Preferencia
    await ensureMpConfigLoaded();
    const mpStatus = getMpConfigStatus();
    if (gateway === 'mercadopago' && mpStatus.configured) {
      try {
        const origin = new URL(request.url).origin;
        const pref = await createMercadoPagoPreference({
          orderId,
          orderNumber,
          customerName: data.fullName,
          customerEmail: data.email || undefined,
          customerPhone: data.phone,
          customerDoc: data.dniRuc,
          items: quote.items,
          shippingCost: quote.shipping,
          baseUrl: origin,
        });

        await saveOrderMpPreference(orderId, pref.preferenceId);

        return NextResponse.json({
          success: true,
          orderId,
          orderNumber,
          total: quote.total,
          paymentGateway: 'mercadopago',
          preferenceId: pref.preferenceId,
          checkoutUrl: pref.checkoutUrl,
          whatsappUrl: waUrl,
        });
      } catch (mpErr) {
        console.error('[orders POST] Error creando preferencia de Mercado Pago:', mpErr);
        return NextResponse.json({
          success: true,
          orderId,
          orderNumber,
          total: quote.total,
          paymentGateway: 'mercadopago',
          mpFallback: true,
          mpError: 'No se pudo conectar momentáneamente con Mercado Pago. Tu orden quedó reservada.',
          whatsappUrl: waUrl,
        });
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      total: quote.total,
      paymentGateway: gateway,
      mpConfigured: mpStatus.configured,
      whatsappUrl: waUrl,
    });
  } catch (error) {
    return serverError('orders POST', error);
  }
}
