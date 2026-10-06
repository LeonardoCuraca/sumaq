import { NextResponse } from 'next/server';

/**
 * Respuesta de error genérica: el detalle se registra en el servidor pero no se filtra al cliente.
 */
export function serverError(context: string, error: unknown, status = 500) {
  console.error(`[${context}]`, error);
  return NextResponse.json({ error: 'Ocurrió un error interno. Inténtalo nuevamente.' }, { status });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function tooManyRequests() {
  return NextResponse.json(
    { error: 'Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.' },
    { status: 429 }
  );
}

/** Lee JSON con límite de tamaño; lanza si es inválido o excede el máximo. */
export async function readJson(request: Request, maxBytes = 100_000): Promise<unknown> {
  const raw = await request.text();
  if (raw.length > maxBytes) throw new Error('payload_too_large');
  return JSON.parse(raw);
}
