import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { whatsappUrl } from '@/lib/site';
import { ShieldCheck, MapPin, Mail, MessageCircle } from 'lucide-react';

interface FooterProps {
  hasHairStock?: boolean;
  hasBarberStock?: boolean;
}

export function Footer({
  hasHairStock = true,
  hasBarberStock = false,
}: FooterProps) {
  return (
    <footer className="bg-slate-100/80 border-t border-slate-200 text-slate-600 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-sumaq.png"
                alt="SUMAQ Importaciones - Distribuidor Oficial Lizze Brasil Perú"
                width={150}
                height={67}
                className="h-11 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Importador N°1 en el Perú de la prestigiosa marca{' '}
              <strong className="text-slate-900 font-bold">LIZZE BRASIL</strong>. Especializados en
              herramientas térmicas profesionales de titanio, secadoras de alto torque y fototerapia
              capilar para los mejores salones del país.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% Original Lizze
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                🛡️ 6 Meses de Garantía
              </span>
            </div>
          </div>

          {/* Col 2: Líneas de Producto */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-slate-900 mb-4">Catálogo</h4>
            <ul className="space-y-2.5 text-xs">
              {hasHairStock && (
                <>
                  <li>
                    <Link href="/linea-hair" className="hover:text-sumaq-600 transition-colors">
                      Planchas Lizze Extreme & Supreme
                    </Link>
                  </li>
                  <li>
                    <Link href="/linea-hair" className="hover:text-sumaq-600 transition-colors">
                      Planchas Fusion, Slim & Mini
                    </Link>
                  </li>
                  <li>
                    <Link href="/linea-hair" className="hover:text-sumaq-600 transition-colors">
                      Secadoras Hipersonic, Supreme & Extreme
                    </Link>
                  </li>
                  <li>
                    <Link href="/linea-hair" className="hover:text-sumaq-600 transition-colors">
                      Tenaza Lizze & Photon Lizze
                    </Link>
                  </li>
                  <li>
                    <Link href="/linea-hair" className="hover:text-sumaq-600 transition-colors">
                      Juego de Cepillos Cerda Jabalí
                    </Link>
                  </li>
                </>
              )}
              {hasBarberStock && (
                <>
                  <li>
                    <Link href="/linea-barber" className="hover:text-amber-600 transition-colors">
                      Máquinas Clipper Magnéticas
                    </Link>
                  </li>
                  <li>
                    <Link href="/linea-barber" className="hover:text-amber-600 transition-colors">
                      Trimmer DLC & Shaver 8000 RPM
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Col 3: Empresa y B2B */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-slate-900 mb-4">
              Negocios & Salones
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/trabaja-con-nosotros"
                  className="hover:text-sumaq-600 font-semibold text-sumaq-600"
                >
                  Club Salones & Estilistas
                </Link>
              </li>
              <li>
                <Link href="/trabaja-con-nosotros" className="hover:text-sumaq-600 transition-colors">
                  Precios al por Mayor
                </Link>
              </li>
              <li>
                <Link href="/contactanos" className="hover:text-sumaq-600 transition-colors">
                  Alianzas y Canjes Comerciales
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="hover:text-sumaq-600 transition-colors">
                  Sobre SUMAQ Importaciones
                </Link>
              </li>
              <li>
                <Link
                  href="/seguimiento"
                  className="hover:text-sumaq-600 font-semibold text-slate-900 transition-colors"
                >
                  Seguimiento de Pedido
                </Link>
              </li>
              <li>
                <Link href="/terminos-y-condiciones" className="hover:text-sumaq-600 transition-colors">
                  Términos, Envíos y Garantía
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contacto directo & Dirección */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-slate-900 mb-4">
              Sede y Atención
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sumaq-600 shrink-0 mt-0.5" />
                <span>Av. 6 de Agosto 589, Jesús María, Lima - Perú</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sumaq-600 shrink-0" />
                <span className="break-all">sumaq.2025import@gmail.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>+51 957 709 262 / +51 983 459 490</span>
              </li>
            </ul>
            {/* Social links */}
            <div className="flex items-center gap-3 pt-4">
              <a
                href="https://www.instagram.com/sumaqimportaciones"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-sumaq-600 hover:text-white transition-colors text-xs font-bold text-slate-700 shadow-2xs"
                title="Instagram"
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@sumaqimport01"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-sumaq-600 hover:text-white transition-colors text-xs font-bold text-slate-700 shadow-2xs"
                title="TikTok"
              >
                TikTok
              </a>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-emerald-600 hover:text-white transition-colors text-xs font-bold text-slate-700 shadow-2xs"
                title="WhatsApp"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Legal */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 SUMAQ Importaciones - Distribuidor Autorizado Lizze Brasil en Perú.</p>
          <div className="flex items-center gap-6">
            <Link href="/terminos-y-condiciones" className="hover:text-slate-800 transition-colors">
              Términos y Condiciones
            </Link>
            <Link href="/terminos-y-condiciones" className="hover:text-slate-800 transition-colors">
              Política de Garantía
            </Link>
            <Link href="/contactanos" className="hover:text-slate-800 transition-colors">
              Libro de Reclamaciones
            </Link>
            <Link href="/admin" className="hover:text-sumaq-600 font-bold transition-colors">
              Panel Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
