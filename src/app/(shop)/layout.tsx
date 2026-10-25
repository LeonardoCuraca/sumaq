import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { Navbar } from '@/components/layout/Navbar';
import { Ticker } from '@/components/layout/Ticker';
import { Footer } from '@/components/layout/Footer';
import { getAllProducts } from '@/lib/db';
import { INITIAL_PRODUCTS, categoryHasStock } from '@/lib/products-data';

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let products = INITIAL_PRODUCTS;
  try {
    products = await getAllProducts();
  } catch {
    products = INITIAL_PRODUCTS;
  }

  const hasHairStock = categoryHasStock(products, 'hair');
  const hasBarberStock = categoryHasStock(products, 'barber');

  return (
    <CartProvider>
      <Navbar
        initialHasHairStock={hasHairStock}
        initialHasBarberStock={hasBarberStock}
      />
      <Ticker />
      <main className="flex-1 w-full relative">{children}</main>
      <Footer hasHairStock={hasHairStock} hasBarberStock={hasBarberStock} />
    </CartProvider>
  );
}
