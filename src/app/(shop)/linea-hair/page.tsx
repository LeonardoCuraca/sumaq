import React from 'react';
import { getAllProducts } from '@/lib/db';
import { availableStock } from '@/lib/products-data';
import { ProductCard } from '@/components/product/ProductCard';

export const revalidate = 3600;

export const metadata = {
  title: 'Línea Hair Lizze Brasil | Planchas de Titanio, Secadoras y Fototerapia | SUMAQ',
  description:
    'Catálogo oficial de herramientas térmicas Lizze Brasil para peluquerías y salones en Perú. Planchas de titanio hasta 252°C, secadoras y Photon Lizze.',
};

export default async function LineaHairPage() {
  const products = await getAllProducts();
  const hairProducts = products.filter((p) => p.category === 'hair' && availableStock(p) > 0);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sumaq-50 text-sumaq-700 text-xs font-bold uppercase mb-2 border border-sumaq-200">
          Línea Profesional Lizze Hair
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
          Alisados Térmicos, Secado y Tratamientos
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Herramientas de calor regulado hasta 252°C, creadas para procesar alisados de keratina,
          botox capilar y peinados en tiempo récord con máxima protección para la fibra capilar.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {hairProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
