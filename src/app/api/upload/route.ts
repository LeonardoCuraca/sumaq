import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') || 'upload.jpg';

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'BLOB_READ_WRITE_TOKEN no configurado en variables de entorno de Vercel.' },
      { status: 500 }
    );
  }

  try {
    if (!request.body) {
      return NextResponse.json({ error: 'Cuerpo de archivo no proporcionado' }, { status: 400 });
    }

    const blob = await put(filename, request.body, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido al subir a Blob';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
