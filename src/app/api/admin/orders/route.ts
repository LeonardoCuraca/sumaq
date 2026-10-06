import { NextResponse } from 'next/server';
import { getAllOrders, updateOrderStatus } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { badRequest, readJson, serverError } from '@/lib/api';
import { formatZodError, orderStatusSchema } from '@/lib/validation';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
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
      body = await readJson(request, 2_000);
    } catch {
      return badRequest('JSON inválido');
    }
    const parsed = orderStatusSchema.safeParse(body);
    if (!parsed.success) return badRequest(formatZodError(parsed.error));

    const ok = await updateOrderStatus(parsed.data.orderId, parsed.data.status);
    if (!ok) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    return NextResponse.json({ success: true, ...parsed.data });
  } catch (error) {
    return serverError('admin/orders PATCH', error);
  }
}
