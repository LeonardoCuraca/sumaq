'use client';

import React, { useState } from 'react';
import { Award, ShieldCheck, GraduationCap, CheckCircle } from 'lucide-react';

export default function B2BPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    salonName: '',
    docNumber: '',
    contactName: '',
    phone: '',
    city: '',
    interest: 'Planchas Térmicas (Extreme / Supreme)',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.whatsappUrl) {
        setError(data.error || 'No pudimos registrar tu solicitud. Inténtalo nuevamente.');
        return;
      }
      setSubmitted(true);
      setTimeout(() => {
        window.open(data.whatsappUrl, '_blank');
      }, 800);
    } catch {
      setError('Error de conexión. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="px-3.5 py-1 rounded-full bg-sumaq-600/20 text-sumaq-400 text-xs font-bold uppercase tracking-widest border border-sumaq-500/30">
          B2B • Salones & Barberías
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">
          Impulsa la rentabilidad de tu negocio con Lizze Brasil
        </h1>
        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
          Únete al programa exclusivo para estilistas, centros capilares y barberías de todo el Perú.
          Obtén márgenes preferenciales, soporte técnico local y entregas prioritarias.
        </p>
      </div>

      {/* Benefits 3-col */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="p-6 rounded-2xl bg-[#131519] border border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-sumaq-600/20 text-sumaq-400 flex items-center justify-center font-bold text-xl">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Precios Mayoristas Directos</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Factura electrónica a nombre de tu empresa o salón con deducción de IGV y tarifas
            mayoristas desde 3 unidades combinables.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#131519] border border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Línea de Garantía Express</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Soporte técnico prioritario en Lima para no frenar la atención a tus clientes si una
            máquina presenta anomalías de fábrica.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#131519] border border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Capacitación y Técnicas</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Masterclasses exclusivas sobre calibración térmica según el grosor del cabello,
            fototerapia y técnicas avanzadas de sellado.
          </p>
        </div>
      </div>

      {/* Registration Form for Salons */}
      <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-[#111317] border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Formulario de Afiliación para Salones
        </h2>
        <p className="text-xs text-zinc-400 text-center mb-6">
          Completa tus datos y un ejecutivo B2B te enviará la lista de precios mayoristas en minutos por WhatsApp.
        </p>

        {error && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">¡Solicitud recibida!</h3>
            <p className="text-xs text-zinc-400">
              Te estamos redirigiendo a WhatsApp con un asesor corporativo de SUMAQ...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-zinc-400 mb-1">
                  Nombre del Salón o Negocio *
                </label>
                <input
                  type="text"
                  required
                  value={formData.salonName}
                  onChange={(e) => setFormData({ ...formData, salonName: e.target.value })}
                  placeholder="Ej. Studio Belleza Lima"
                  className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 mb-1">RUC o DNI del Titular *</label>
                <input
                  type="text"
                  required
                  value={formData.docNumber}
                  onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                  placeholder="10 / 20..."
                  className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-zinc-400 mb-1">Nombre de Contacto *</label>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Tu nombre completo"
                  className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 mb-1">WhatsApp / Teléfono *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+51 9..."
                  className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-zinc-400 mb-1">Ciudad y Distrito *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ej. Lima, Miraflores"
                  className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-400 mb-1">Equipos de Interés</label>
                <select
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                  className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                >
                  <option>Planchas Térmicas (Extreme / Supreme)</option>
                  <option>Secadores Turbo Profesionales</option>
                  <option>Máquinas de Barbería (Clipper & Trimmer)</option>
                  <option>Combos de Equipamiento Completo</option>
                  <option>Fototerapia Fotón Lizze</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-zinc-400 mb-1">
                Mensaje o Requerimientos Especiales
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="¿Cuántas sillas o estilistas conforman tu salón? ¿Deseas cotizar algún pack específico?"
                className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white font-bold text-xs shadow-lg shadow-sumaq-600/30 tracking-wider uppercase transition-all disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Solicitar Tarifa Mayorista & Asesoría en WhatsApp'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
