'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Plus } from 'lucide-react';
import { Product } from '@/lib/products-data';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  accent?: 'sumaq' | 'amber';
}

export function ProductCard({ product }: ProductCardProps) {
  const { cart, addToCart, toggleWishlist, isWishlisted } = useCart();
  const inCart = cart[product.slug]?.qty || 0;
  const isFav = isWishlisted(product.slug);

  return (
    <div className="group relative bg-[#131519] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-sumaq-500/50 hover:shadow-xl hover:shadow-sumaq-600/10 transition-all duration-300">
      {/* Top Ribbon */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sumaq-500/10 text-sumaq-400 border border-sumaq-500/20">
          {product.badge || 'Lizze Brasil'}
        </span>
        <button
          onClick={() => toggleWishlist(product.slug)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-sumaq-400 transition-colors"
          title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav ? 'text-sumaq-500 fill-sumaq-500' : ''
            }`}
          />
        </button>
      </div>

      {/* Image Container */}
      <Link
        href={`/producto/${product.slug}`}
        className="block relative aspect-square rounded-xl overflow-hidden bg-black/40 mb-4 group-hover:scale-[1.02] transition-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
          loading="lazy"
        />
        {product.temp !== 'N/A' && (
          <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-zinc-200 border border-white/10">
            🔥 {product.temp}
          </span>
        )}
      </Link>

      {/* Title & Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link
            href={`/producto/${product.slug}`}
            className="font-bold text-base text-white group-hover:text-sumaq-400 transition-colors block mb-1"
          >
            {product.name}
          </Link>
          <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
            {product.punchline}
          </p>
        </div>

        {/* Price Matrix & Quick Buy */}
        <div className="pt-3 border-t border-white/5 mt-auto">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-xs text-zinc-400 font-medium">Precio Salón:</span>
              <div className="text-lg font-black text-white">S/ {product.prices.reg}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Pack Salón: S/ {product.prices.salonPack}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/producto/${product.slug}`}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-center font-semibold text-zinc-200 transition-colors"
            >
              Ver Ficha
            </Link>
            <button
              onClick={() => addToCart(product)}
              className="px-3 py-2 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white text-xs font-bold shadow-sm shadow-sumaq-600/30 flex items-center justify-center gap-1 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              {inCart > 0 ? `(${inCart}) Agregar` : 'Comprar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
