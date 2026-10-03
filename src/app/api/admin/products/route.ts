import { NextResponse } from 'next/server';
import { getAllProducts, upsertProduct, deleteProductBySlug } from '@/lib/db';
import { Product } from '@/lib/products-data';

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json(products);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error cargando productos';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product: Product = {
      id: body.id || `prod-${Date.now()}`,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      category: body.category || 'hair',
      name: body.name,
      badge: body.badge || '',
      punchline: body.punchline || '',
      temp: body.temp || 'N/A',
      voltage: Array.isArray(body.voltage) ? body.voltage : ['220V'],
      options: Array.isArray(body.options) ? body.options : [],
      prices: {
        reg: Number(body.prices?.reg || 0),
        min: Number(body.prices?.min || 0),
        salonPack: Number(body.prices?.salonPack || 0),
      },
      images: Array.isArray(body.images) ? body.images : [body.imageUrl || ''],
      specs: body.specs || {},
      shortDesc: body.shortDesc || '',
      longDesc: body.longDesc || '',
      isFeatured: Boolean(body.isFeatured),
    };

    const ok = await upsertProduct(product);
    if (!ok) {
      return NextResponse.json({ error: 'No se pudo guardar en la base de datos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error guardando producto';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Slug no proporcionado' }, { status: 400 });
    }

    const ok = await deleteProductBySlug(slug);
    if (!ok) {
      return NextResponse.json({ error: 'No se pudo eliminar el producto' }, { status: 500 });
    }

    return NextResponse.json({ success: true, slug });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error eliminando producto';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
