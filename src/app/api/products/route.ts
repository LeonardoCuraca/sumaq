import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/db';
import { serverError } from '@/lib/api';

export const revalidate = 3600;

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    return serverError('public products GET', error);
  }
}
