import { NextResponse } from 'next/server';
import { checkRateLimit, createLead } from '@/lib/db';
import { badRequest, readJson, serverError, tooManyRequests } from '@/lib/api';
import { clientIp } from '@/lib/guards';
import { formatZodError, leadSchema } from '@/lib/validation';
import { whatsappUrl } from '@/lib/site';

export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit(`lead:${clientIp(request)}`, 5, 3600))) return tooManyRequests();

    let body: unknown;
    try {
      body = await readJson(request, 20_000);
    } catch {
      return badRequest('JSON inválido');
    }
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) return badRequest(formatZodError(parsed.error));
    const d = parsed.data;

    await createLead(d);

    const text =
      `*SOLICITUD AFILIACIÓN CLUB SALONES SUMAQ*\n\n` +
      `*Salón / Negocio:* ${d.salonName}\n*RUC/DNI:* ${d.docNumber}\n*Contacto:* ${d.contactName}\n` +
      `*Teléfono:* ${d.phone}\n*Ciudad:* ${d.city}\n*Interés:* ${d.interest}\n*Notas:* ${d.notes || 'Ninguna'}\n\n` +
      `_Hola asesor de SUMAQ, deseo acceder a la lista de precios mayoristas para salones._`;

    return NextResponse.json({ success: true, whatsappUrl: whatsappUrl(text) });
  } catch (error) {
    return serverError('leads POST', error);
  }
}
