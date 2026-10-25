import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, ShieldCheck, Zap, Award, Sparkles } from 'lucide-react';
import { getAllProducts } from '@/lib/db';
import { availableStock } from '@/lib/products-data';
import { ProductCard } from '@/components/product/ProductCard';

export const revalidate = 3600;

export default async function HomePage() {
  const products = await getAllProducts();
  const hairProducts = products.filter((p) => p.category === 'hair' && availableStock(p) > 0);
  const barberProducts = products.filter((p) => p.category === 'barber' && availableStock(p) > 0);

  return (
    <div>
      {/* Luxury Hero Banner */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-900/40 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&auto=format&fit=crop&q=80"
          alt="Salón de Belleza Profesional Lizze"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.65]"
        />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-rose-200 text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-sumaq-400 animate-ping" />
              DISTRIBUIDOR OFICIAL LIZZE BRASIL EN PERÚ
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05]">
              La tecnología térmica que{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">
                revoluciona tu salón.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
              Alisa en la mitad de pasadas y garantiza un brillo espejo insuperable. Planchas de
              titanio hasta 252°C, secadoras de alto torque, tenazas y fototerapia capilar con
              garantía oficial y servicio técnico en Perú.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/linea-hair"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-sumaq-600 to-sumaq-700 hover:from-sumaq-500 hover:to-sumaq-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-sumaq-600/30 transform hover:-translate-y-0.5 transition-all"
              >
                Ver Catálogo para Salones
              </Link>
              <Link
                href="/trabaja-con-nosotros"
                className="px-7 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/30 backdrop-blur-sm transition-all flex items-center gap-2"
              >
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                Convenio Salones & Packs B2B
              </Link>
            </div>

            {/* Trust Proof Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20 max-w-lg">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">+1,800</p>
                <p className="text-xs text-slate-300">Salones equipados</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-rose-300">252°C</p>
                <p className="text-xs text-slate-300">Calor ultraestable</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">6 Meses</p>
                <p className="text-xs text-slate-300">Garantía oficial</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-sumaq-100 text-sumaq-600 flex items-center justify-center mb-4 text-2xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 mb-1">100% Original Lizze</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Importadas directamente desde la fábrica en Brasil. Cero imitaciones ni réplicas.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 text-2xl">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 mb-1">Despacho Inmediato</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Envío gratuito para Lima y Callao. Envíos diarios a todas las provincias del Perú.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 text-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 mb-1">Soporte y Garantía</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  6 meses de garantía real por desperfecto con taller técnico especializado en Lima.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 text-2xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 mb-1">Precios Mayoristas</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Facturación con RUC, descuentos escalonados por combos de salón y asesoría técnica.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Línea Hair Section (Solo se muestra si la línea tiene stock disponible) */}
      {hairProducts.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sumaq-600 text-xs font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-sumaq-500" />
                Especialidad en Keratinas, Botox y Alisados
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                Línea Hair Profesional
              </h2>
            </div>
            <Link
              href="/linea-hair"
              className="inline-flex items-center gap-2 text-sm font-bold text-sumaq-600 hover:text-sumaq-700"
            >
              Ver catálogo completo ({hairProducts.length} equipos) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hairProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* B2B Club Salones Banner */}
      <section className="my-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-sumaq-900 via-rose-950 to-slate-950 border border-sumaq-500/20 shadow-xl p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-sumaq-600 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
              PROGRAMA PARTNER SALONES 2026
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              ¿Abres un nuevo salón o quieres renovar tus equipos?
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              Accede a nuestros packs de equipamiento profesional Lizze con descuentos escalonados,
              capacitación técnica para tu equipo de estilistas y línea directa de recambios.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <a
                href="https://wa.me/51957709262?text=Hola,%20deseo%20cotizar%20un%20pack%20de%20equipamiento%20para%20mi%20salón%20de%20belleza"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-transform hover:scale-105 shadow-md"
              >
                Cotizar Pack Salón por WhatsApp
              </a>
              <Link
                href="/trabaja-con-nosotros"
                className="px-6 py-3 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors"
              >
                Llenar Formulario Salones
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Línea Barber Section (Desaparece automáticamente cuando no hay stock en la línea Barber) */}
      {barberProducts.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Precisión de 8500 RPM para Barberías
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Línea Barber Pro</h2>
            </div>
            <Link
              href="/linea-barber"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700"
            >
              Ver máquinas de corte Lizze Barber <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {barberProducts.map((p) => (
              <ProductCard key={p.id} product={p} accent="amber" />
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-sumaq-600 uppercase tracking-widest">
              Testimonios de Profesionales
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              Respaldado por los salones más reconocidos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
              <p className="text-xs text-slate-600 leading-relaxed italic mb-6">
                &quot;Trabajo alisados brasileños a diario en Miraflores. La Plancha Lizze Extreme de
                250°C me redujo el tiempo de planchado de 2 horas a 50 minutos. El cabello queda con
                un brillo que la clienta ama.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sumaq-100 text-sumaq-600 font-bold flex items-center justify-center">
                  MR
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Mariana Rivera</p>
                  <p className="text-[10px] text-slate-500">Master Stylist, Lima</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
              <p className="text-xs text-slate-600 leading-relaxed italic mb-6">
                &quot;La Plancha Lizze Supreme y la Secadora Lizze Extreme cambiaron por completo el
                ritmo de nuestro salón. Sellamos tratamientos de botox y keratina en la mitad del
                tiempo y con brillo espejo.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center">
                  CP
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Camila Paredes</p>
                  <p className="text-[10px] text-slate-500">Directora, San Borja Hair Studio</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
              <p className="text-xs text-slate-600 leading-relaxed italic mb-6">
                &quot;Compré 4 combos para equipar mi cadena en Trujillo. Todo 100% original con sello
                Lizze, factura y entrega en agencia en 48 horas. SUMAQ es nuestro proveedor de
                confianza.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                  VT
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Valeria Torres</p>
                  <p className="text-[10px] text-slate-500">Directora Salones D&apos;Élite (Trujillo)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
