'use client';

import React, { useState } from 'react';
import { MapPin, MessageCircle, Mail, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    reason: 'Consulta de Compra / Precios',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg =
      `*NUEVA CONSULTA DESDE LA WEB SUMAQ*\n\n` +
      `*Nombre:* ${formData.name}\n` +
      `*Motivo:* ${formData.reason}\n` +
      `*Correo:* ${formData.email}\n` +
      `*Teléfono:* ${formData.phone}\n` +
      `*Mensaje:* ${formData.message}\n`;

    setSent(true);
    setTimeout(() => {
      window.open(`https://wa.me/51957709262?text=${encodeURIComponent(msg)}`, '_blank');
    }, 800);
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Info */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-xs font-bold text-sumaq-400 uppercase tracking-widest">
              Alianzas y Soporte
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">
              Conversemos sobre nuevas oportunidades
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Si eres marca, creador de contenido de belleza, educador capilar o salón de alto perfil
            interesado en convenios, canjes o capacitaciones conjuntas, escríbenos directamente.
          </p>

          <div className="space-y-4 pt-4 text-xs">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#131519] border border-white/5">
              <div className="p-2 rounded-xl bg-sumaq-600/20 text-sumaq-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white">Almacén Central & Retiros:</p>
                <p className="text-zinc-400">Av. 6 de Agosto 589, Jesús María, Lima, Perú</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#131519] border border-white/5">
              <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white">WhatsApp Asesoría Comercial:</p>
                <p className="text-zinc-400">+51 957 709 262 / +51 983 459 490</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#131519] border border-white/5">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white">Correo Oficial:</p>
                <p className="text-zinc-400">sumaq.2025import@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="lg:col-span-7">
          <div className="p-8 rounded-3xl bg-[#131519] border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">
              Déjanos tu consulta o propuesta comercial
            </h2>

            {sent ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">¡Mensaje preparado!</h3>
                <p className="text-xs text-zinc-400">
                  Redirigiendo a WhatsApp con un asesor oficial de SUMAQ...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tu nombre"
                      className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Motivo de Contacto</label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                    >
                      <option>Consulta de Compra / Precios</option>
                      <option>Alianzas / Canjes / Creadores</option>
                      <option>Garantía y Soporte Técnico</option>
                      <option>Distribución en Provincias</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Teléfono / Celular *</label>
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

                <div>
                  <label className="block font-bold text-zinc-400 mb-1">
                    Mensaje o Detalle de la Solicitud *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Escribe aquí tu consulta..."
                    className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Enviar Mensaje a SUMAQ en WhatsApp
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
