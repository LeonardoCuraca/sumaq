'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, MessageCircle, Heart, Check, ChevronRight } from 'lucide-react';
import { Product } from '@/lib/products-data';
import { useCart } from '@/context/CartContext';
import { SITE } from '@/lib/site';

export function ProductDetailClient({ product }: { product: Product }) {
  const [selectedImg, setSelectedImg] = useState(product.images[0]);
  const [selectedVoltage, setSelectedVoltage] = useState(product.voltage[0] || '220V');
  const [addedAlert, setAddedAlert] = useState(false);

  const { cart, addToCart, toggleWishlist, isWishlisted } = useCart();
  const inCart = cart[product.slug]?.qty || 0;
  const isFav = isWishlisted(product.slug);

  const handleAddToCart = () => {
    addToCart(product, 1, selectedVoltage);
    setAddedAlert(true);
    setTimeout(() => setAddedAlert(false), 3000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hola asesor de SUMAQ, deseo información y comprar la ${product.name} (Voltaje: ${selectedVoltage}). ¿Tienen stock disponible para entrega inmediata?`
  );

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-8">
        <Link href="/" className="hover:text-white">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/linea-${product.category}`} className="hover:text-white capitalize">
          Línea {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-sumaq-400 font-medium">{product.name}</span>
      </nav>

      {/* Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-black/60 border border-white/10 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImg}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full bg-sumaq-600 text-white shadow-lg">
                {product.badge}
              </span>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border transition-all ${
                    selectedImg === img ? 'border-sumaq-500 scale-105' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${product.name} miniatura ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Specs, Selector, Action */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{product.name}</h1>
            <p className="text-base text-sumaq-400 font-medium">{product.punchline}</p>
          </div>

          {/* Pricing Breakdown */}
          <div className="p-4 rounded-2xl bg-[#131519] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400">Precio Regular Salón:</span>
              <div className="text-3xl font-black text-white">S/ {product.prices.reg}</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-500/30">
                Pack Salón: S/ {product.prices.salonPack}
              </span>
              <p className="text-[10px] text-zinc-400 mt-1">A partir de 3 unidades o combos</p>
            </div>
          </div>

          {/* Voltage Selector */}
          {product.voltage && product.voltage.length > 0 && product.voltage[0] !== 'N/A' && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Selecciona Voltaje:
              </label>
              <div className="flex gap-3">
                {product.voltage.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVoltage(v)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      selectedVoltage === v
                        ? 'bg-sumaq-600 text-white border-sumaq-500'
                        : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {v} {v === '220V' ? '(Perú Estándar)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Options / Medidas */}
          {product.options && product.options.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Medida o Diámetro:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.options.map((opt, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-zinc-200"
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Added to cart toast alert */}
          {addedAlert && (
            <div className="p-3 rounded-xl bg-sumaq-600/20 border border-sumaq-500/50 flex items-center justify-between text-xs text-white">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> ¡Añadido al carrito con éxito!
              </span>
              <Link href="/finalizar-compra" className="underline font-bold hover:text-sumaq-300">
                Ir a pagar &rarr;
              </Link>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3.5 px-6 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white font-bold text-sm shadow-lg shadow-sumaq-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              {inCart > 0 ? `Añadir otra unidad (Tienes ${inCart})` : 'Añadir al Carrito'}
            </button>
            <a
              href={`https://wa.me/${SITE.whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Pedir por WhatsApp
            </a>
            <button
              onClick={() => toggleWishlist(product.slug)}
              className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-sumaq-400 border border-white/10"
              title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'text-sumaq-500 fill-sumaq-500' : ''}`} />
            </button>
          </div>

          {/* Description */}
          <div className="border-t border-white/10 pt-6 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Descripción y Beneficios
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">{product.longDesc}</p>
          </div>

          {/* Technical Specs Grid */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Ficha Técnica Oficial
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-zinc-500 capitalize block text-[10px] uppercase font-bold">
                    {k}
                  </span>
                  <span className="text-zinc-200 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
