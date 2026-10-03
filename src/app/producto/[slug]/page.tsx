import React from 'react';
import { notFound } from 'next/navigation';
import { getProductBySlug, getAllProducts } from '@/lib/db';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;
export const revalidate = 0;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Producto no encontrado | SUMAQ' };

  return {
    title: `${product.name} | SUMAQ Lizze Brasil Perú`,
    description: `${product.punchline}. ${product.shortDesc}`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
