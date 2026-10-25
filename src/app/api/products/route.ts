import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/db';
import { serverError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    return serverError('public products GET', error);
  }
}
