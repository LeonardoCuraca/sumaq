import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'SUMAQ Importaciones | Equipos Profesionales Lizze Brasil para Salones y Barberías',
  description:
    'Importador N°1 en el Perú de herramientas térmicas de titanio Lizze Brasil: planchas hasta 250°C, secadores de 2400W, fototerapia capilar y barbería con garantía oficial en Lima y provincias.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="bg-[#0b0c0e] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-sumaq-600 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
