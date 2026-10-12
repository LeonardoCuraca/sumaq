'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8">
        <Link href="/" className="hover:text-slate-900">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/linea-${product.category}`} className="hover:text-slate-900 capitalize">
          Línea {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-sumaq-600 font-semibold">{product.name}</span>
      </nav>

      {/* Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-sm relative">
            <Image
              src={selectedImg}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-all duration-300"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 z-10 text-xs font-bold px-3 py-1 rounded-full bg-sumaq-600 text-white shadow-md">
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
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border transition-all ${
                    selectedImg === img ? 'border-sumaq-500 ring-2 ring-sumaq-500/20 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} miniatura ${idx}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Specs, Selector, Action */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">{product.name}</h1>
            <p className="text-base text-sumaq-600 font-medium">{product.punchline}</p>
          </div>

          {/* Pricing Breakdown */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Precio Regular Salón:</span>
              <div className="text-3xl font-black text-slate-900">S/ {product.prices.reg}</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Pack Salón: S/ {product.prices.salonPack}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">A partir de 3 unidades o combos</p>
            </div>
          </div>

          {/* Voltage Selector */}
          {product.voltage && product.voltage.length > 0 && product.voltage[0] !== 'N/A' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Selecciona Voltaje:
              </label>
              <div className="flex gap-3">
                {product.voltage.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVoltage(v)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      selectedVoltage === v
                        ? 'bg-sumaq-600 text-white border-sumaq-500 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Medida o Diámetro:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.options.map((opt, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Added to cart toast alert */}
          {addedAlert && (
            <div className="p-3 rounded-xl bg-sumaq-50 border border-sumaq-200 flex items-center justify-between text-xs text-sumaq-900 shadow-xs">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 font-bold" /> ¡Añadido al carrito con éxito!
              </span>
              <Link href="/finalizar-compra" className="underline font-bold text-sumaq-700 hover:text-sumaq-800">
                Ir a pagar &rarr;
              </Link>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3.5 px-6 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white font-bold text-sm shadow-md shadow-sumaq-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              {inCart > 0 ? `Añadir otra unidad (Tienes ${inCart})` : 'Añadir al Carrito'}
            </button>
            <a
              href={`https://wa.me/${SITE.whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <MessageCircle className="w-5 h-5" />
              Pedir por WhatsApp
            </a>
            <button
              onClick={() => toggleWishlist(product.slug)}
              className="p-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-sumaq-600 border border-slate-200 shadow-2xs"
              title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'text-sumaq-600 fill-sumaq-600' : ''}`} />
            </button>
          </div>

          {/* Description */}
          <div className="border-t border-slate-200 pt-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Descripción y Beneficios
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">{product.longDesc}</p>
          </div>

          {/* Technical Specs Grid */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Ficha Técnica Oficial
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <span className="text-slate-400 capitalize block text-[10px] uppercase font-bold">
                    {k}
                  </span>
                  <span className="text-slate-800 font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
