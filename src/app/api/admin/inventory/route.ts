import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adjustProductStock, getRecentStockMovements } from '@/lib/db';
import { getSessionUser, requireAdmin } from '@/lib/guards';
import { badRequest, readJson, serverError } from '@/lib/api';
import { formatZodError, stockAdjustmentSchema } from '@/lib/validation';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const movements = await getRecentStockMovements(100);
    return NextResponse.json(movements);
  } catch (error) {
    return serverError('admin/inventory GET', error);
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    let body: unknown;
    try {
      body = await readJson(request, 4_000);
    } catch {
      return badRequest('JSON inválido');
    }

    const parsed = stockAdjustmentSchema.safeParse(body);
    if (!parsed.success) return badRequest(formatZodError(parsed.error));

    const user = await getSessionUser();
    const actor = user?.email || user?.name || 'admin';

    const result = await adjustProductStock({
      ...parsed.data,
      actor,
    });
    if (!result) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/linea-hair');
    revalidatePath('/linea-barber');
    revalidatePath('/api/products');

    return NextResponse.json({
      success: true,
      productId: parsed.data.productId,
      stock: result.stock,
      reservedStock: result.reservedStock,
    });
  } catch (error) {
    return serverError('admin/inventory POST', error);
  }
}
