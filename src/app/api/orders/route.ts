import { NextResponse } from 'next/server';
import { checkRateLimit, createOrder, getProductsByIds } from '@/lib/db';
import { badRequest, readJson, serverError, tooManyRequests } from '@/lib/api';
import { clientIp, getSessionUser } from '@/lib/guards';
import { QuoteError, buildQuote, type Role } from '@/lib/pricing';
import { formatZodError, orderSchema } from '@/lib/validation';
import { SITE, whatsappUrl } from '@/lib/site';

export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit(`order:${clientIp(request)}`, 10, 3600))) return tooManyRequests();

    let body: unknown;
    try {
      body = await readJson(request);
    } catch {
      return badRequest('JSON inválido o demasiado grande');
    }
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) return badRequest(formatZodError(parsed.error));
    const data = parsed.data;

    const user = await getSessionUser();
    const role = user?.role as Role;

    // Los precios, el flete y el total se calculan SIEMPRE en servidor.
    const products = await getProductsByIds([...new Set(data.items.map((i) => i.id))]);
    let quote;
    try {
      quote = buildQuote(data, products, role);
    } catch (err) {
      if (err instanceof QuoteError) return badRequest(err.message);
      throw err;
    }

    const address = data.deliveryType === 'almacen' ? `Retiro en almacén (${SITE.warehouseShort})` : data.address;
    if (data.deliveryType === 'domicilio' && address.length < 5) return badRequest('Ingresa la dirección de entrega.');

    const orderId = await createOrder({
      customerName: data.fullName,
      customerDoc: data.dniRuc,
      customerPhone: data.phone,
      deliveryType: data.deliveryType,
      city: data.city,
      address,
      paymentMethod: data.paymentMethod,
      total: quote.total,
      items: quote.items,
      userId: user?.id ? Number(user.id) : null,
    });

    const lines = quote.items.map((it) => `• ${it.name} x${it.qty} (${it.voltage || '220V'}) - S/ ${it.price * it.qty}`).join('\n');
    const text =
      `*NUEVO PEDIDO SUMAQ - LIZZE BRASIL (Orden #${orderId})*\n\n` +
      `*Cliente:* ${data.fullName}\n` +
      `*DNI/RUC:* ${data.dniRuc}\n` +
      `*WhatsApp:* ${data.phone}\n` +
      `*Entrega:* ${data.deliveryType === 'almacen' ? 'Retiro en Almacén (Jesús María)' : `Envío a domicilio (${data.city})`}\n` +
      `*Dirección:* ${address}\n` +
      `*Método sugerido:* ${data.paymentMethod}\n\n` +
      `*HERRAMIENTAS SOLICITADAS:*\n${lines}\n\n` +
      `*Envío:* S/ ${quote.shipping}\n` +
      `*TOTAL:* S/ ${quote.total}\n\n` +
      `_Hola asesor de SUMAQ, acabo de generar mi pedido en la web oficial y deseo confirmar el despacho y emisión de mi comprobante._`;

    return NextResponse.json({ success: true, orderId, total: quote.total, whatsappUrl: whatsappUrl(text) });
  } catch (error) {
    return serverError('orders POST', error);
  }
}
