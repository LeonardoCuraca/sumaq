'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Plus, AlertTriangle } from 'lucide-react';
import { Product, availableStock } from '@/lib/products-data';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  accent?: 'sumaq' | 'amber';
}

export function ProductCard({ product }: ProductCardProps) {
  const { cart, addToCart, toggleWishlist, isWishlisted } = useCart();
  const inCart = cart[product.slug]?.qty || 0;
  const isFav = isWishlisted(product.slug);
  const avail = availableStock(product);
  const isOutOfStock = avail <= 0;
  const isLowStock = !isOutOfStock && avail <= (product.lowStockThreshold ?? 3);

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between hover:border-sumaq-400 hover:shadow-xl hover:shadow-sumaq-600/5 transition-all duration-300">
      {/* Top Ribbon */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sumaq-50 text-sumaq-700 border border-sumaq-200">
          {product.badge || 'Lizze Brasil'}
        </span>
        <button
          onClick={() => toggleWishlist(product.slug)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-sumaq-600 transition-colors"
          title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav ? 'text-sumaq-600 fill-sumaq-600' : ''
            }`}
          />
        </button>
      </div>

      {/* Image Container */}
      <Link
        href={`/producto/${product.slug}`}
        className="block relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-4 group-hover:scale-[1.02] transition-transform"
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover group-hover:opacity-95 transition-opacity ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
        />
        {product.temp !== 'N/A' && (
          <span className="absolute bottom-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/85 backdrop-blur-sm text-amber-300 border border-slate-700">
            🔥 {product.temp}
          </span>
        )}
        {isOutOfStock ? (
          <span className="absolute top-2 right-2 z-10 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white shadow-sm">
            Agotado
          </span>
        ) : isLowStock ? (
          <span className="absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
            <AlertTriangle className="w-3 h-3" /> ¡Últimas {avail}!
          </span>
        ) : null}
      </Link>

      {/* Title & Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link
            href={`/producto/${product.slug}`}
            className="font-bold text-base text-slate-900 group-hover:text-sumaq-600 transition-colors block mb-1"
          >
            {product.name}
          </Link>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {product.punchline}
          </p>
        </div>

        {/* Price Matrix & Quick Buy */}
        <div className="pt-3 border-t border-slate-100 mt-auto">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-xs text-slate-500 font-medium">Precio Salón:</span>
              <div className="text-lg font-black text-slate-900">S/ {product.prices.reg}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Pack Salón: S/ {product.prices.salonPack}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/producto/${product.slug}`}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-center font-semibold text-slate-700 transition-colors"
            >
              Ver Ficha
            </Link>
            <button
              onClick={() => addToCart(product)}
              disabled={isOutOfStock || inCart >= avail}
              className="px-3 py-2 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none text-white text-xs font-bold shadow-sm shadow-sumaq-600/20 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {isOutOfStock ? (
                'Sin Stock'
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  {inCart > 0 ? `(${inCart}) Agregar` : 'Comprar'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
