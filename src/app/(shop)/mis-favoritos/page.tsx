'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { INITIAL_PRODUCTS, Product } from '@/lib/products-data';
import { ProductCard } from '@/components/product/ProductCard';

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useCart();
  const [products, setProducts] = React.useState<Product[]>(INITIAL_PRODUCTS);

  React.useEffect(() => {
    fetch('/api/products')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setProducts(data);
      })
      .catch(() => {});
  }, []);

  const favItems = products.filter((p) => wishlist.includes(p.slug));

  if (favItems.length === 0) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-sumaq-600/10 text-sumaq-500 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Tu lista de favoritos está vacía</h1>
        <p className="text-xs text-zinc-400 mb-6">
          Guarda las herramientas que deseas para equipar tu salón o consultar cotizaciones más tarde.
        </p>
        <Link
          href="/linea-hair"
          className="px-6 py-3 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white text-xs font-bold inline-block"
        >
          Explorar Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Mis Herramientas Guardadas</h1>
          <p className="text-xs text-zinc-400 mt-1">{favItems.length} producto(s) en tu lista</p>
        </div>
        <button
          onClick={() => {
            favItems.forEach((p) => toggleWishlist(p.slug));
          }}
          className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> Limpiar lista
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {favItems.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
