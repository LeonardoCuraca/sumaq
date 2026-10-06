import { NextResponse } from 'next/server';
import { auth } from './auth';

export type SessionUser = { id?: string; email?: string | null; role?: string };

/** Devuelve el usuario con sesión o null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser | undefined) ?? null;
}

/**
 * Guard para route handlers de administración. Úsalo así:
 *   const denied = await requireAdmin(); if (denied) return denied;
 * Es la barrera real de seguridad (el proxy es solo una primera capa).
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  return null;
}

/** IP del cliente (Vercel/proxies establecen x-forwarded-for). */
export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
