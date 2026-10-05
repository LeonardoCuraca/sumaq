import React from 'react';
import { getAllProducts } from '@/lib/db';
import { ProductCard } from '@/components/product/ProductCard';

export const revalidate = 3600;

export const metadata = {
  title: 'Línea Barber Lizze Brasil | Shaver, Trimmer DLC y Clipper Magnética | SUMAQ',
  description:
    'Máquinas profesionales para barbería Lizze Brasil. Motores magnéticos de 8500 RPM, cuchillas DLC y shavers de precisión en Perú.',
};

export default async function LineaBarberPage() {
  const products = await getAllProducts();
  const barberProducts = products.filter((p) => p.category === 'barber');

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase mb-2">
          Línea Barber Lizze Brasil
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Herramientas de Corte y Precisión
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
          Motores magnéticos y sin escobillas hasta 8500 RPM diseñados para jornadas intensivas en
          barberías. Cero calentamiento de cuchillas ni atascos.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {barberProducts.map((p) => (
          <ProductCard key={p.id} product={p} accent="amber" />
        ))}
      </div>
    </div>
  );
}
