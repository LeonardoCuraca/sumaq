'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, ShoppingBag, Menu, X, User, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { SITE, whatsappUrl } from '@/lib/site';
import { SearchModal } from '../search/SearchModal';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems, wishlist } = useCart();
  const { data: session } = useSession();

  const navLinks = [
    { name: 'Inicio', href: '/' },
    { name: 'Línea Hair', href: '/linea-hair', badge: 'bg-sumaq-500' },
    { name: 'Línea Barber', href: '/linea-barber', badge: 'bg-amber-500' },
    { name: 'Club Salones', href: '/trabaja-con-nosotros', highlight: true },
    { name: 'Nosotros', href: '/nosotros' },
    { name: 'Contacto', href: '/contactanos' },
  ];

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-sumaq-900 via-charcoal to-black border-b border-sumaq-900/50 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2 text-zinc-300 font-medium">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sumaq-600 text-white uppercase tracking-wider">
              PRO SALÓN
            </span>
            <span>Precios mayoristas y atención directa para salones de belleza y barberías</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400 text-xs">
            <Link
              href="/trabaja-con-nosotros"
              className="hover:text-sumaq-400 transition-colors flex items-center gap-1 font-semibold text-zinc-200"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sumaq-500" />
              Atención B2B Salones
            </Link>
            <span className="text-zinc-700">|</span>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
              WhatsApp Oficial: +{SITE.whatsappNumber}
            </a>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-[#0e1014]/90 glass-header border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sumaq-500 to-sumaq-700 flex items-center justify-center font-black text-white text-xl tracking-tighter shadow-lg shadow-sumaq-600/20 group-hover:scale-105 transition-transform">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-wider text-xl sm:text-2xl text-white leading-none">
                SUMAQ<span className="text-sumaq-500">.</span>
              </span>
              <span className="text-[10px] tracking-[0.25em] font-bold text-zinc-400 group-hover:text-sumaq-300 transition-colors">
                LIZZE BRASIL PERÚ
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 font-medium text-sm">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white bg-white/10 font-bold'
                      : link.highlight
                      ? 'text-sumaq-400 font-semibold hover:text-sumaq-300 hover:bg-sumaq-500/10'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.badge && <span className={`w-1.5 h-1.5 rounded-full ${link.badge}`} />}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions: Search, Wishlist, Cart, Login */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Buscar herramientas"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Trigger */}
            <Link
              href="/mis-favoritos"
              className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-sumaq-400 transition-colors"
              title="Mis Favoritos"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-sumaq-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              href="/finalizar-compra"
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sumaq-600 to-sumaq-700 hover:from-sumaq-500 hover:to-sumaq-600 text-white font-medium shadow-md shadow-sumaq-600/30 transition-all active:scale-95"
              title="Ver Carrito y Pedido"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden md:inline text-xs font-semibold">Carrito</span>
              <span
                className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                  totalItems > 0 ? 'bg-white text-black' : 'bg-black/40 text-white'
                }`}
              >
                {totalItems}
              </span>
            </Link>

            {/* User Session */}
            {session ? (
              <div className="flex items-center gap-2">
                {session.user?.role === 'admin' ? (
                  <Link
                    href="/admin"
                    className="px-2.5 py-1 rounded-lg bg-sumaq-600/20 text-sumaq-400 hover:bg-sumaq-600 hover:text-white text-xs font-bold transition-colors"
                  >
                    Admin
                  </Link>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    Salón Aliado
                  </span>
                )}
                <span className="hidden xl:inline text-xs text-zinc-300 font-medium truncate max-w-[120px]">
                  {session.user?.name || 'Mi Cuenta'}
                </span>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-xs text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                title="Acceso Salones"
              >
                <User className="w-4 h-4" />
                <span className="text-xs font-medium">Ingresar</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-white/5 text-zinc-300 hover:text-white"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/5 bg-[#0e1014] px-4 pt-3 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === link.href
                    ? 'text-white bg-white/10'
                    : link.highlight
                    ? 'text-sumaq-400 font-bold bg-sumaq-500/10'
                    : 'text-zinc-200 hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/terminos-y-condiciones"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Garantía y Términos Oficiales
            </Link>
            <div className="pt-2 border-t border-white/5 space-y-1">
              {session ? (
                <>
                  {session.user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-xs text-sumaq-400 font-semibold"
                    >
                      Consola de Administración
                    </Link>
                  )}
                  {session.user?.role === 'salon_partner' && (
                    <div className="px-3 py-1.5 text-xs text-emerald-400 font-semibold">
                      Perfil: Salón Aliado
                    </div>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 font-semibold cursor-pointer"
                  >
                    Cerrar sesión ({session.user?.name})
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-xs text-zinc-300 font-semibold"
                >
                  Acceso Salones / Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
