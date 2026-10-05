import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'SUMAQ Core • Panel de Administración y Control',
  description: 'Ambiente privado de gestión para inventario, órdenes y auditoría de SUMAQ Importaciones.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans antialiased">
      {children}
    </div>
  );
}
