import { NextResponse } from 'next/server';
import { initializeNeonDatabase } from '@/lib/db';

export async function GET() {
  const success = await initializeNeonDatabase();
  if (success) {
    return NextResponse.json({
      message: 'Base de datos Neon inicializada y tablas migradas con éxito.',
    });
  } else {
    return NextResponse.json(
      {
        message:
          'No se pudo inicializar Neon DB. Asegúrate de configurar la variable DATABASE_URL en tu panel de Vercel.',
      },
      { status: 400 }
    );
  }
}
