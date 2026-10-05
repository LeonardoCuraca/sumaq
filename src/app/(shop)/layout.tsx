import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { Navbar } from '@/components/layout/Navbar';
import { Ticker } from '@/components/layout/Ticker';
import { Footer } from '@/components/layout/Footer';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Navbar />
      <Ticker />
      <main className="flex-1 w-full relative">{children}</main>
      <Footer />
    </CartProvider>
  );
}
