import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Primera capa de protección: redirige/niega antes de renderizar.
 * Cada route handler admin además valida con requireAdmin() (defensa en profundidad).
 */
export default auth((req: NextRequest & { auth?: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith('/api/')) {
    if (!req.auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    return NextResponse.next();
  }

  // Páginas /admin
  if (role !== 'admin') {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/upload/:path*'],
};
