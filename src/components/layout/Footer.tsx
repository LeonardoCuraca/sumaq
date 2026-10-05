import React from 'react';
import Link from 'next/link';
import { whatsappUrl } from '@/lib/site';
import { ShieldCheck, MapPin, Mail, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#090a0c] border-t border-white/10 text-zinc-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sumaq-600 flex items-center justify-center font-black text-white text-lg">
                S
              </div>
              <span className="font-black tracking-wider text-2xl text-white">
                SUMAQ<span className="text-sumaq-500">.</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Importador N°1 en el Perú de la prestigiosa marca{' '}
              <strong className="text-zinc-200">LIZZE BRASIL</strong>. Especializados en
              herramientas térmicas profesionales de titanio, fototerapia capilar y barbería de alto
              rendimiento para los mejores salones del país.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Original Lizze
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300">
                🛡️ 6 Meses de Garantía
              </span>
            </div>
          </div>

          {/* Col 2: Líneas de Producto */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white mb-4">Catálogo</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/linea-hair" className="hover:text-sumaq-400 transition-colors">
                  Planchas Extreme & Supreme
                </Link>
              </li>
              <li>
                <Link href="/linea-hair" className="hover:text-sumaq-400 transition-colors">
                  Secadores Turbo 2600W
                </Link>
              </li>
              <li>
                <Link href="/linea-hair" className="hover:text-sumaq-400 transition-colors">
                  Rizadores & Fotón Lizze
                </Link>
              </li>
              <li>
                <Link href="/linea-barber" className="hover:text-amber-400 transition-colors">
                  Máquinas Clipper Magnéticas
                </Link>
              </li>
              <li>
                <Link href="/linea-barber" className="hover:text-amber-400 transition-colors">
                  Trimmer DLC & Shaver 8000 RPM
                </Link>
              </li>
              <li>
                <Link href="/linea-hair" className="hover:text-sumaq-400 transition-colors">
                  Cepillos Cerda de Jabalí
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Empresa y B2B */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white mb-4">
              Negocios & Salones
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/trabaja-con-nosotros"
                  className="hover:text-sumaq-400 font-semibold text-sumaq-300"
                >
                  Club Salones & Estilistas
                </Link>
              </li>
              <li>
                <Link href="/trabaja-con-nosotros" className="hover:text-sumaq-400 transition-colors">
                  Precios al por Mayor
                </Link>
              </li>
              <li>
                <Link href="/contactanos" className="hover:text-sumaq-400 transition-colors">
                  Alianzas y Canjes Comerciales
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="hover:text-sumaq-400 transition-colors">
                  Sobre SUMAQ Importaciones
                </Link>
              </li>
              <li>
                <Link href="/terminos-y-condiciones" className="hover:text-sumaq-400 transition-colors">
                  Términos, Envíos y Garantía
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contacto directo & Dirección */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white mb-4">
              Sede y Atención
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sumaq-500 shrink-0 mt-0.5" />
                <span>Av. 6 de Agosto 589, Jesús María, Lima - Perú</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sumaq-500 shrink-0" />
                <span className="break-all">sumaq.2025import@gmail.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>+51 957 709 262 / +51 983 459 490</span>
              </li>
            </ul>
            {/* Social links */}
            <div className="flex items-center gap-3 pt-4">
              <a
                href="https://www.instagram.com/sumaqimportaciones"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-sumaq-600 hover:text-white transition-colors text-xs font-bold"
                title="Instagram"
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@sumaqimport01"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-sumaq-600 hover:text-white transition-colors text-xs font-bold"
                title="TikTok"
              >
                TikTok
              </a>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-emerald-600 hover:text-white transition-colors text-xs font-bold"
                title="WhatsApp"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Legal */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 SUMAQ Importaciones - Distribuidor Autorizado Lizze Brasil en Perú.</p>
          <div className="flex items-center gap-6">
            <Link href="/terminos-y-condiciones" className="hover:text-zinc-300 transition-colors">
              Términos y Condiciones
            </Link>
            <Link href="/terminos-y-condiciones" className="hover:text-zinc-300 transition-colors">
              Política de Garantía
            </Link>
            <Link href="/contactanos" className="hover:text-zinc-300 transition-colors">
              Libro de Reclamaciones
            </Link>
            <Link href="/admin" className="hover:text-sumaq-400 font-bold transition-colors">
              Panel Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
