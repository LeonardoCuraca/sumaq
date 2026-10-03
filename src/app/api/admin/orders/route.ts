import { NextResponse } from 'next/server';
import { getAllOrders, updateOrderStatus } from '@/lib/db';

export async function GET() {
  try {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error obteniendo órdenes';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId y status requeridos' }, { status: 400 });
    }

    const ok = await updateOrderStatus(Number(orderId), status);
    if (!ok) {
      return NextResponse.json({ error: 'No se pudo actualizar el estado de la orden' }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId, status });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error actualizando orden';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
