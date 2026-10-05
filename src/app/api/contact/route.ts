import { NextResponse } from 'next/server';
import { checkRateLimit, createContactMessage } from '@/lib/db';
import { badRequest, readJson, serverError, tooManyRequests } from '@/lib/api';
import { clientIp } from '@/lib/guards';
import { contactSchema, formatZodError } from '@/lib/validation';
import { whatsappUrl } from '@/lib/site';

export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit(`contact:${clientIp(request)}`, 5, 3600))) return tooManyRequests();

    let body: unknown;
    try {
      body = await readJson(request, 20_000);
    } catch {
      return badRequest('JSON inválido');
    }
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return badRequest(formatZodError(parsed.error));
    const d = parsed.data;

    await createContactMessage(d);

    const text =
      `*NUEVA CONSULTA DESDE LA WEB SUMAQ*\n\n*Nombre:* ${d.name}\n*Motivo:* ${d.reason}\n` +
      `*Correo:* ${d.email || '-'}\n*Teléfono:* ${d.phone || '-'}\n*Mensaje:* ${d.message}\n`;

    return NextResponse.json({ success: true, whatsappUrl: whatsappUrl(text) });
  } catch (error) {
    return serverError('contact POST', error);
  }
}
