import type { Metadata } from 'next';
import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'SUMAQ Core • Panel de Administración y Control',
  description: 'Ambiente privado de gestión para inventario, órdenes y auditoría de SUMAQ Importaciones.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login?callbackUrl=/admin');
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans antialiased">
      {children}
    </div>
  );
}

