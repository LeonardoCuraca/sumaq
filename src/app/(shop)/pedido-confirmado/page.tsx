'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MessageCircle, ArrowLeft, ShieldCheck, Clock, FileText } from 'lucide-react';
import { SITE, whatsappUrl } from '@/lib/site';

function PedidoConfirmadoContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const total = searchParams.get('total');
  const whatsappCustom = searchParams.get('whatsapp');

  const defaultWa = whatsappUrl(
    orderId
      ? `Hola asesor de SUMAQ, acabo de registrar mi pedido #${orderId} en la web oficial por S/ ${total || '0'} y deseo confirmar el comprobante y despacho.`
      : undefined
  );

  const targetWa = whatsappCustom || defaultWa;

  return (
    <div className="py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-6">
        {/* Animated Success Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200">
            ¡ORDEN REGISTRADA CON ÉXITO!
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
            {orderId ? `Pedido #${orderId} Registrado` : 'Pedido Registrado'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Hemos reservado tus herramientas en nuestro almacén central. Para completar el pago y
            coordinar el despacho o retiro, comunícate con un asesor oficial en WhatsApp.
          </p>
        </div>

        {total && (
          <div className="inline-block p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block font-medium">Monto Total a Pagar:</span>
            <span className="text-3xl font-black text-sumaq-600">S/ {total}</span>
          </div>
        )}

        {/* Big WhatsApp CTA */}
        <div className="pt-2">
          <a
            href={targetWa}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/20 transform hover:-translate-y-0.5 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Abrir WhatsApp para Confirmar Despacho &rarr;
          </a>
          <p className="text-[11px] text-slate-500 mt-2">
            Atención oficial directa: +{SITE.whatsappNumber} (Lunes a Sábado 8:00 am - 8:00 pm)
          </p>
        </div>

        {/* Step by Step instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>1. Envía el Comprobante</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Realiza tu abono mediante Yape, Plin o transferencia bancaria (BCP / BBVA / Interbank).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <FileText className="w-4 h-4 text-sumaq-600" />
              <span>2. Emisión Electrónica</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Emitimos tu Boleta o Factura electrónica con DNI/RUC para garantía y sustento tributario.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>3. Despacho Inmediato</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Despacho el mismo día en Lima o envío por agencia con código de seguimiento nacional.
            </p>
          </div>
        </div>

        {/* Actions back */}
        <div className="pt-4 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PedidoConfirmadoPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-zinc-400 text-xs">
          Cargando confirmación de pedido...
        </div>
      }
    >
      <PedidoConfirmadoContent />
    </Suspense>
  );
}
