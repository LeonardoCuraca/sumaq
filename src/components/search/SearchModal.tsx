'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ShoppingBag } from 'lucide-react';
import { INITIAL_PRODUCTS, Product, availableStock, categoryHasStock } from '@/lib/products-data';
import { useCart } from '@/context/CartContext';
import { whatsappUrl } from '@/lib/site';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<Product[]>(INITIAL_PRODUCTS);
  const { addToCart } = useCart();

  React.useEffect(() => {
    if (!isOpen) return;
    fetch('/api/products')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCatalog(data);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const activeCatalog = catalog.filter(
    (p) => categoryHasStock(catalog, p.category) && availableStock(p) > 0
  );

  const filtered = query.trim()
    ? activeCatalog.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.punchline.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-sumaq-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca plancha supreme, secadora hipersonic, tenaza, photon, cepillos..."
            autoFocus
            className="w-full bg-transparent border-none text-slate-900 text-base focus:outline-none placeholder-slate-400 font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-2">
          {query.trim() === '' ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Escribe el nombre de la herramienta Lizze que necesitas.
            </p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 text-sm">
                No encontramos herramientas disponibles con el término &quot;
                <span className="text-slate-900 font-bold">{query}</span>&quot;
              </p>
              <a
                href={whatsappUrl(`Hola, busco información sobre ${query}`)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-sumaq-600 font-semibold hover:underline"
              >
                Consultar disponibilidad por WhatsApp con un asesor Lizze &rarr;
              </a>
            </div>
          ) : (
            filtered.map((item: Product) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-lg object-contain p-1 bg-white border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/producto/${item.slug}`}
                      onClick={onClose}
                      className="text-sm font-bold text-slate-900 hover:text-sumaq-600 truncate block"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-500 truncate">{item.punchline}</p>
                    <span className="text-xs font-bold text-sumaq-600">S/ {item.prices.reg}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      addToCart(item);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-sumaq-600 hover:bg-sumaq-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
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
