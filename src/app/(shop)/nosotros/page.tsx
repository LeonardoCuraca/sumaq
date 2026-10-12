import React from 'react';
import { Target, Eye } from 'lucide-react';

export const metadata = {
  title: 'Nosotros | SUMAQ Importaciones - Lizze Brasil Perú',
  description:
    'Conoce la historia, misión y compromiso de SUMAQ Importaciones, distribuidor líder de herramientas profesionales térmicas Lizze Brasil en Perú.',
};

export default function AboutPage() {
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-sumaq-600">
          Trayectoria & Compromiso
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900">
          El importador N°1 en el Perú de LIZZE BRASIL
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Nacimos con el propósito de acercar a los salones y estilistas del país herramientas
          innovadoras, originales y de alto rendimiento que revolucionen los resultados de belleza sin
          comprometer la salud del cabello.
        </p>
      </div>

      {/* Mission & Vision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sumaq-50 text-sumaq-600 flex items-center justify-center border border-sumaq-100">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Nuestra Misión</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Importar y distribuir tecnología profesional de belleza 100% original y de la más alta
            calidad, ofreciendo a los profesionales peruanos herramientas confiables que cuidan y
            embellecen la fibra capilar, con respaldo de garantía, servicio técnico real y atención
            cercana en todo el territorio nacional.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Eye className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Nuestra Visión</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Ser la empresa referente y el aliado estratégico indiscutible en el Perú para la
            modernización de salones de belleza y barberías, elevando el estándar técnico de los
            estilistas con innovación brasileña de vanguardia y confianza total en cada compra.
          </p>
        </div>
      </div>

      {/* Values Strip */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6 text-center">Nuestros Pilares de Confianza</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <span className="text-3xl">🇧🇷</span>
            <h4 className="font-bold text-sm text-white mt-2">Autenticidad Garantizada</h4>
            <p className="text-xs text-slate-300 mt-1">
              Importación directa sin intermediarios con sellos de originalidad Lizze.
            </p>
          </div>
          <div>
            <span className="text-3xl">⚡</span>
            <h4 className="font-bold text-sm text-white mt-2">Calibración a 220V</h4>
            <p className="text-xs text-slate-300 mt-1">
              Herramientas probadas y adaptadas para la red eléctrica del Perú.
            </p>
          </div>
          <div>
            <span className="text-3xl">🤝</span>
            <h4 className="font-bold text-sm text-white mt-2">Cercanía y Acompañamiento</h4>
            <p className="text-xs text-slate-300 mt-1">
              Asesoría post-venta y repuestos originales disponibles en almacén de Lima.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
