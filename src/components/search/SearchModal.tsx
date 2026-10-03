'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, X, ShoppingBag } from 'lucide-react';
import { INITIAL_PRODUCTS, Product } from '@/lib/products-data';
import { useCart } from '@/context/CartContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const { addToCart } = useCart();

  if (!isOpen) return null;

  const filtered = query.trim()
    ? INITIAL_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.punchline.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-[#14161b] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-sumaq-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca planchas, secadoras, trimmer, fotón, repuestos..."
            autoFocus
            className="w-full bg-transparent border-none text-white text-base focus:outline-none placeholder-zinc-500"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-2">
          {query.trim() === '' ? (
            <p className="text-xs text-zinc-400 text-center py-6">
              Escribe el nombre de la herramienta o línea que necesitas.
            </p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400 text-sm">
                No encontramos herramientas con el término &quot;
                <span className="text-white">{query}</span>&quot;
              </p>
              <a
                href={`https://wa.me/51957709262?text=Hola,%20busco%20información%20sobre%20${encodeURIComponent(query)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-sumaq-400 hover:underline"
              >
                Consultar disponibilidad por WhatsApp con un asesor Lizze &rarr;
              </a>
            </div>
          ) : (
            filtered.map((item: Product) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-14 h-14 rounded-lg object-cover bg-black border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/producto/${item.slug}`}
                      onClick={onClose}
                      className="text-sm font-bold text-white hover:text-sumaq-400 truncate block"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-zinc-400 truncate">{item.punchline}</p>
                    <span className="text-xs font-bold text-sumaq-400">S/ {item.prices.reg}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      addToCart(item);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-sumaq-600 hover:bg-sumaq-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Añadir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
