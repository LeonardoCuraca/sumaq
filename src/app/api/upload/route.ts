import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/guards';
import { serverError, badRequest } from '@/lib/api';
import { MAX_IMAGE_BYTES, sniffImageType, uploadProductImage } from '@/lib/blob';

export async function POST(request: Request): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'El almacenamiento de imágenes no está configurado.' }, { status: 500 });
  }

  try {
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > MAX_IMAGE_BYTES + 10_000) return badRequest('La imagen supera 5 MB.');

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return badRequest('No se envió ningún archivo.');
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return badRequest('La imagen debe pesar entre 1 byte y 5 MB.');

    const buffer = await file.arrayBuffer();
    const realType = sniffImageType(new Uint8Array(buffer));
    if (!realType) return badRequest('Formato no permitido. Usa JPG, PNG o WebP.');

    const blob = await uploadProductImage(buffer, realType);
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    return serverError('upload', error);
  }
}
