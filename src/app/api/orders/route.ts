import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      dniRuc,
      phone,
      deliveryType,
      city,
      address,
      paymentMethod,
      items,
      total,
    } = body;

    let orderId = Math.floor(100000 + Math.random() * 900000);

    // Save to Neon DB if connected
    const sql = getDb();
    if (sql) {
      try {
        const result = await sql`
          INSERT INTO orders (
            customer_name, customer_doc, customer_phone, delivery_type, city, address, payment_method, total, items
          ) VALUES (
            ${fullName || 'Cliente Salón'},
            ${dniRuc || 'Por coordinar'},
            ${phone || 'N/A'},
            ${deliveryType || 'domicilio'},
            ${city || 'Lima'},
            ${address || 'Retiro Almacén Jesús María'},
            ${paymentMethod || 'Yape/Plin'},
            ${total},
            ${JSON.stringify(items)}
          ) RETURNING id;
        `;
        if (result && result[0]?.id) {
          orderId = result[0].id;
        }
      } catch (dbErr) {
        console.warn('Neon DB order save skipped/failed:', dbErr);
      }
    }

    // Format WhatsApp message
    const formattedItems = (items || [])
      .map(
        (it: { name: string; qty: number; voltage?: string }) =>
          `• ${it.name} x${it.qty} (${it.voltage || '220V'})`
      )
      .join('\n');

    const whatsappText =
      `*NUEVO PEDIDO SUMAQ - LIZZE BRASIL (Orden #${orderId})*\n\n` +
      `*Cliente:* ${fullName || 'Cliente Salón'}\n` +
      `*DNI/RUC:* ${dniRuc || 'Por coordinar'}\n` +
      `*WhatsApp:* ${phone || 'N/A'}\n` +
      `*Entrega:* ${deliveryType === 'almacen' ? 'Retiro en Almacén (Jesús María)' : `Envío a domicilio (${city})`}\n` +
      `*Dirección:* ${address || 'Av. 6 de Agosto 589, Jesús María'}\n` +
      `*Método sugerido:* ${paymentMethod || 'Billetera Digital'}\n\n` +
      `*HERRAMIENTAS SOLICITADAS:*\n${formattedItems}\n\n` +
      `*TOTAL:* S/ ${total}\n\n` +
      `_Hola asesor de SUMAQ, acabo de generar mi pedido en la web oficial y deseo confirmar el despacho y emisión de mi comprobante._`;

    const encodedMessage = encodeURIComponent(whatsappText);
    const whatsappUrl = `https://wa.me/51957709262?text=${encodedMessage}`;

    return NextResponse.json({
      success: true,
      orderId,
      whatsappUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error procesando pedido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
