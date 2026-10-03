import { NextResponse } from 'next/server';
import { getAllUserLogins } from '@/lib/db';

export async function GET() {
  try {
    const logins = await getAllUserLogins();
    return NextResponse.json(logins);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error obteniendo sesiones de usuario';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
