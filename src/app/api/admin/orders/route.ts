import { NextResponse } from 'next/server';
import { getAllOrders, getOrderById, updateOrderAdmin } from '@/lib/db';
import { getSessionUser, requireAdmin } from '@/lib/guards';
import { badRequest, readJson, serverError } from '@/lib/api';
import { formatZodError, orderStatusSchema } from '@/lib/validation';

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    if (idParam) {
      const orderId = Number(idParam);
      if (!Number.isInteger(orderId) || orderId <= 0) return badRequest('ID de orden inválido');
      const order = await getOrderById(orderId);
      if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
      return NextResponse.json(order);
    }
    return NextResponse.json(await getAllOrders());
  } catch (error) {
    return serverError('admin/orders GET', error);
  }
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    let body: unknown;
    try {
      body = await readJson(request, 8_000);
    } catch {
      return badRequest('JSON inválido');
    }
    const parsed = orderStatusSchema.safeParse(body);
    if (!parsed.success) return badRequest(formatZodError(parsed.error));

    const user = await getSessionUser();
    const actor = user?.email || user?.name || 'admin';

    const ok = await updateOrderAdmin({
      ...parsed.data,
      actor,
    });
    if (!ok) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    const updatedOrder = await getOrderById(parsed.data.orderId);
    return NextResponse.json({ success: true, order: updatedOrder, ...parsed.data });
  } catch (error) {
    return serverError('admin/orders PATCH', error);
  }
}
