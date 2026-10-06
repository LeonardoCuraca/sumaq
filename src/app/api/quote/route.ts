import { NextResponse } from 'next/server';
import { checkRateLimit, getProductsByIds } from '@/lib/db';
import { badRequest, readJson, serverError, tooManyRequests } from '@/lib/api';
import { clientIp, getSessionUser } from '@/lib/guards';
import { QuoteError, buildQuote, type Role } from '@/lib/pricing';
import { formatZodError, quoteSchema } from '@/lib/validation';

/** Cotización autoritativa: el checkout muestra estos precios (según el rol de la sesión). */
export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit(`quote:${clientIp(request)}`, 120, 3600))) return tooManyRequests();

    let body: unknown;
    try {
      body = await readJson(request, 20_000);
    } catch {
      return badRequest('JSON inválido');
    }
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) return badRequest(formatZodError(parsed.error));

    const user = await getSessionUser();
    const products = await getProductsByIds([...new Set(parsed.data.items.map((i) => i.id))]);
    try {
      return NextResponse.json(buildQuote(parsed.data, products, user?.role as Role));
    } catch (err) {
      if (err instanceof QuoteError) return badRequest(err.message);
      throw err;
    }
  } catch (error) {
    return serverError('quote POST', error);
  }
}
