'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  MessageCircle,
  ArrowLeft,
  ShieldCheck,
  Clock,
  FileText,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  PackageSearch,
  Sparkles,
} from 'lucide-react';
import { SITE, whatsappUrl } from '@/lib/site';

interface VerifiedOrderData {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  paymentGateway: 'mercadopago' | 'whatsapp';
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  invoiceType: 'boleta' | 'factura';
  deliveryType: string;
  city: string;
  address: string;
  customerName: string;
  customerDoc: string;
  mpPaymentId?: string | null;
  paidAt?: string | null;
  items: Array<{
    name: string;
    qty: number;
    price?: number;
    unitPrice?: number;
    voltage?: string;
  }>;
}

function PedidoConfirmadoContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('external_reference');
  const orderNumberParam = searchParams.get('orderNumber');
  const totalParam = searchParams.get('total');
  const whatsappCustom = searchParams.get('whatsapp');
  const gatewayParam = searchParams.get('gateway');
  const mpStatusParam =
    searchParams.get('mp_status') ||
    searchParams.get('collection_status') ||
    searchParams.get('status');
  const mpPaymentIdParam =
    searchParams.get('payment_id') || searchParams.get('collection_id');
  const mpFallback = searchParams.get('mp_fallback') === '1';

  const [order, setOrder] = useState<VerifiedOrderData | null>(null);
  const [verifying, setVerifying] = useState<boolean>(Boolean(orderId));
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const verifyOrder = useCallback(async () => {
    if (!orderId) return;
    setVerifying(true);
    try {
      const qs = new URLSearchParams();
      if (mpPaymentIdParam && mpPaymentIdParam !== 'null') {
        qs.set('payment_id', mpPaymentIdParam);
      }
      if (mpStatusParam) {
        qs.set('status', mpStatusParam);
      }
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/verify?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.order) {
          setOrder(data.order);
        }
      }
    } catch (err) {
      console.error('Error verificando estado de orden:', err);
    } finally {
      setVerifying(false);
    }
  }, [orderId, mpPaymentIdParam, mpStatusParam]);

  useEffect(() => {
    if (!orderId) return;
    let ignore = false;
    async function loadInitialStatus() {
      try {
        const qs = new URLSearchParams();
        if (mpPaymentIdParam && mpPaymentIdParam !== 'null') {
          qs.set('payment_id', mpPaymentIdParam);
        }
        if (mpStatusParam) {
          qs.set('status', mpStatusParam);
        }
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId!)}/verify?${qs.toString()}`);
        if (!ignore && res.ok) {
          const data = await res.json();
          if (data?.order) {
            setOrder(data.order);
          }
        }
      } catch (err) {
        console.error('Error verificando estado de orden:', err);
      } finally {
        if (!ignore) setVerifying(false);
      }
    }
    loadInitialStatus();
    return () => {
      ignore = true;
    };
  }, [orderId, mpPaymentIdParam, mpStatusParam]);

  const handleRetryMercadoPago = async () => {
    if (!orderId) return;
    setRetryingPayment(true);
    setRetryError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/retry-payment`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setRetryError(
        data.error ||
          'No se pudo conectar con Mercado Pago en este momento. Puedes finalizar tu atención por WhatsApp.'
      );
    } catch {
      setRetryError('Error de red al conectar con Mercado Pago.');
    } finally {
      setRetryingPayment(false);
    }
  };

  const displayOrderNumber =
    order?.orderNumber || orderNumberParam || (orderId ? `#${orderId}` : '');
  const displayTotal =
    order?.total !== undefined ? order.total.toFixed(2) : totalParam || '0.00';

  const effectivePaymentStatus =
    order?.paymentStatus ||
    (mpStatusParam === 'approved'
      ? 'paid'
      : mpStatusParam === 'pending' || mpStatusParam === 'in_process'
      ? 'pending'
      : mpStatusParam === 'failure' || mpStatusParam === 'rejected'
      ? 'failed'
      : 'unpaid');

  const isPaid = effectivePaymentStatus === 'paid';
  const isPendingMp = effectivePaymentStatus === 'pending';
  const isFailedOrUnpaidMp =
    !isPaid &&
    !isPendingMp &&
    (mpStatusParam === 'failure' ||
      mpStatusParam === 'rejected' ||
      order?.paymentGateway === 'mercadopago' ||
      gatewayParam === 'mercadopago') &&
    !mpFallback;

  const defaultWa = whatsappUrl(
    displayOrderNumber
      ? isPaid
        ? `Hola asesor de SUMAQ, acabo de realizar el pago de mi pedido ${displayOrderNumber} por S/ ${displayTotal} en Mercado Pago y deseo coordinar el envío.`
        : `Hola asesor de SUMAQ, acabo de registrar mi pedido ${displayOrderNumber} en la web oficial por S/ ${displayTotal} y deseo confirmar el pago y despacho.`
      : undefined
  );

  const targetWa = whatsappCustom || defaultWa;
  const trackingHref = displayOrderNumber
    ? `/seguimiento?order=${encodeURIComponent(displayOrderNumber)}${
        order?.customerDoc ? `&doc=${encodeURIComponent(order.customerDoc)}` : ''
      }`
    : '/seguimiento';

  return (
    <div className="py-12 sm:py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl text-center space-y-6">
        {/* Status Icon */}
        {isPaid ? (
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        ) : isPendingMp ? (
          <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-10 h-10" />
          </div>
        ) : isFailedOrUnpaidMp ? (
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-10 h-10" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        )}

        {/* Headline & Status Badge */}
        <div>
          {isPaid ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> ¡PAGO APROBADO CON ÉXITO!
            </span>
          ) : isPendingMp ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-wider border border-amber-200">
              PAGO EN VALIDACIÓN POR MERCADO PAGO
            </span>
          ) : isFailedOrUnpaidMp ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-wider border border-rose-200">
              PAGO NO COMPLETADO • STOCK RESERVADO
            </span>
          ) : (
            <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200">
              ¡ORDEN REGISTRADA CON ÉXITO!
            </span>
          )}

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3">
            {displayOrderNumber ? `Pedido ${displayOrderNumber}` : 'Pedido Registrado'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            {isPaid
              ? 'Tu pago ha sido procesado y verificado automáticamente. Nuestro equipo de almacén ya está preparando tus equipos originales Lizze Brasil para despacho prioritario.'
              : isPendingMp
              ? 'Mercado Pago está procesando tu abono (ej. código CIP PagoEfectivo o validación bancaria). Tus equipos ya están reservados y se confirmarán automáticamente.'
              : isFailedOrUnpaidMp
              ? 'Tu pedido y la reserva de inventario están asegurados por 30 minutos, pero el cobro en Mercado Pago no se completó. Puedes reintentar con otra tarjeta, Yape o finalizar por WhatsApp.'
              : 'Hemos reservado tus herramientas en nuestro almacén central. Para completar el pago y coordinar el despacho o retiro, comunícate con un asesor oficial en WhatsApp.'}
          </p>
        </div>

        {/* Fallback notice if MP wasn't configured */}
        {mpFallback && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Atención Prioritaria Directa Activada</p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Tu orden <strong>{displayOrderNumber}</strong> fue registrada y tu stock está reservado. En este instante el cobro automático está en modo asistido; finaliza tu pago directamente con nuestro asesor oficial por WhatsApp.
              </p>
            </div>
          </div>
        )}

        {/* Summary & Digital Receipt */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Código de Seguimiento
              </span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {displayOrderNumber || 'Pendiente'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Monto Total {isPaid ? 'Pagado' : 'a Pagar'}
              </span>
              <span className="text-2xl font-black text-sumaq-600">S/ {displayTotal}</span>
            </div>
          </div>

          {order && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Cliente</span>
                <span className="font-bold text-slate-800 block truncate">{order.customerName}</span>
                <span className="text-[11px] text-slate-500">
                  {order.invoiceType === 'factura' ? 'Factura RUC' : 'Boleta DNI'}: {order.customerDoc}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Modalidad</span>
                <span className="font-bold text-slate-800 block capitalize">
                  {order.deliveryType === 'almacen' ? 'Retiro en Sede Lima' : `Envío a ${order.city}`}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">{order.address}</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Estado Financiero</span>
                <span
                  className={`font-black uppercase text-xs ${
                    isPaid
                      ? 'text-emerald-600'
                      : isPendingMp
                      ? 'text-amber-600'
                      : 'text-slate-700'
                  }`}
                >
                  {isPaid
                    ? 'PAGADO VERIFICADO'
                    : isPendingMp
                    ? 'EN VALIDACIÓN'
                    : 'PENDIENTE DE PAGO'}
                </span>
                {order.mpPaymentId && (
                  <span className="text-[10px] text-slate-500 block font-mono">
                    Op. MP #{order.mpPaymentId}
                  </span>
                )}
              </div>
            </div>
          )}

          {order?.items && order.items.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Equipos Incluidos
              </span>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-700">
                  <span>
                    <strong className="text-slate-900">{item.qty}x</strong> {item.name}{' '}
                    <span className="text-slate-400">({item.voltage || '220V'})</span>
                  </span>
                  <span className="font-bold text-slate-900">
                    S/ {((item.price ?? item.unitPrice ?? 0) * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {retryError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {retryError}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="space-y-3 pt-2">
          {isFailedOrUnpaidMp && orderId && (
            <button
              onClick={handleRetryMercadoPago}
              disabled={retryingPayment}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              {retryingPayment
                ? 'Generando link seguro...'
                : 'Reintentar Pago con Mercado Pago'}
            </button>
          )}

          {isPendingMp && (
            <button
              onClick={verifyOrder}
              disabled={verifying}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
              {verifying ? 'Consultando con Mercado Pago...' : 'Actualizar Estado del Pago'}
            </button>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={trackingHref}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
            >
              <PackageSearch className="w-4 h-4 text-sumaq-400" />
              Seguimiento del Pedido en Vivo
            </Link>

            <a
              href={targetWa}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              {isPaid ? 'Coordinar Despacho por WhatsApp' : 'Confirmar por WhatsApp Oficial'}
            </a>
          </div>

          <p className="text-[11px] text-slate-500">
            Atención oficial directa: +{SITE.whatsappNumber} (Lunes a Sábado 8:00 am - 8:00 pm)
          </p>
        </div>

        {/* Step by Step instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>1. Validación & Reserva</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Tus herramientas están separadas en almacén y validadas con pago electrónico o asesor.
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
              <span>3. Despacho con Tracking</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Consulta tu agencia y código de seguimiento en tiempo real desde nuestra sección de Tracking.
            </p>
          </div>
        </div>

        {/* Actions back */}
        <div className="pt-4 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Catálogo Principal
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
        <div className="py-24 text-center text-slate-400 text-xs">
          Verificando estado de tu pedido...
        </div>
      }
    >
      <PedidoConfirmadoContent />
    </Suspense>
  );
}
