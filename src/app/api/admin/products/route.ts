import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createProduct, deleteProductBySlug, getAllProducts, updateProduct } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { badRequest, readJson, serverError } from '@/lib/api';
import { formatZodError, productInputSchema, slugify } from '@/lib/validation';
import { deleteBlobImages } from '@/lib/blob';
import type { Product } from '@/lib/products-data';

function revalidateCatalog(slug?: string) {
  revalidatePath('/');
  revalidatePath('/linea-hair');
  revalidatePath('/linea-barber');
  if (slug) revalidatePath(`/producto/${slug}`);
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json(await getAllProducts());
  } catch (error) {
    return serverError('admin/products GET', error);
  }
}

/** Crea (sin id existente) o actualiza (con id existente) un producto. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    let body: unknown;
    try {
      body = await readJson(request);
    } catch {
      return badRequest('JSON inválido o demasiado grande');
    }

    const parsed = productInputSchema.safeParse(body);
    if (!parsed.success) return badRequest(formatZodError(parsed.error));
    const input = parsed.data;

    const slug = slugify(input.slug || input.name);
    if (!slug) return badRequest('No se pudo generar un slug válido.');

    const product: Product = {
      id: input.id || `prod-${crypto.randomUUID().slice(0, 8)}`,
      slug,
      category: input.category,
      name: input.name,
      badge: input.badge,
      punchline: input.punchline,
      temp: input.temp,
      voltage: input.voltage,
      options: input.options,
      prices: input.prices,
      images: input.images,
      specs: input.specs,
      shortDesc: input.shortDesc,
      longDesc: input.longDesc,
      isFeatured: input.isFeatured,
    };

    try {
      const updated = input.id ? await updateProduct(product) : false;
      const ok = updated || (await createProduct(product));
      if (!ok) return NextResponse.json({ error: 'Ya existe un producto con ese slug o id.' }, { status: 409 });
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        return NextResponse.json({ error: 'Ya existe un producto con ese slug.' }, { status: 409 });
      }
      throw err;
    }

    revalidateCatalog(product.slug);
    return NextResponse.json({ success: true, product });
  } catch (error) {
    return serverError('admin/products POST', error);
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const slug = new URL(request.url).searchParams.get('slug');
    if (!slug) return badRequest('Slug no proporcionado');

    const images = await deleteProductBySlug(slug);
    if (images === null) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    await deleteBlobImages(images);
    revalidateCatalog(slug);
    return NextResponse.json({ success: true, slug });
  } catch (error) {
    return serverError('admin/products DELETE', error);
  }
}
