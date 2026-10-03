import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.STORAGE_READ_WRITE_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error:
          'BLOB_READ_WRITE_TOKEN no configurado en Vercel. Ve a Storage > Blob y asegúrate de conectar el Blob Store a tu proyecto.',
      },
      { status: 500 }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle multipart/form-data upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No se envió ningún archivo en el formulario' }, { status: 400 });
      }

      const filename = `products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const blob = await put(filename, file, {
        access: 'public',
        token: token,
      });

      return NextResponse.json(blob);
    }

    // Handle direct binary stream upload
    const { searchParams } = new URL(request.url);
    const rawFilename = searchParams.get('filename') || 'upload.jpg';
    const filename = `products/${Date.now()}-${rawFilename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    if (!request.body) {
      return NextResponse.json({ error: 'Cuerpo de archivo vacío' }, { status: 400 });
    }

    const blob = await put(filename, request.body, {
      access: 'public',
      token: token,
    });

    return NextResponse.json(blob);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido al subir a Blob';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
