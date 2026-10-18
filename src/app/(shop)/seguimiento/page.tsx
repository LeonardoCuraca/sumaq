'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  MapPin,
  FileText,
  AlertCircle,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { whatsappUrl } from '@/lib/site';

interface TrackedOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  invoiceType: 'boleta' | 'factura';
  deliveryType: string;
  city: string;
  address: string;
  paymentMethod: string;
  paymentGateway: 'mercadopago' | 'whatsapp';
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  status: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  items: Array<{
    id?: string;
    slug?: string;
    name: string;
    qty: number;
    price?: number;
    unitPrice?: number;
    voltage?: string;
  }>;
  shippingCarrier?: string | null;
  trackingCode?: string | null;
  paidAt?: string | null;
  createdAt: string;
  events: Array<{
    id: number;
    eventType: string;
    fromState?: string | null;
    toState?: string | null;
    description: string;
    actor: string;
    createdAt: string;
  }>;
}

const LOGISTICS_STEPS = [
  { key: 'registrado', label: 'Orden Registrada', desc: 'Reserva de stock activa' },
  { key: 'confirmado', label: 'Pago Confirmado', desc: 'Validado y facturado' },
  { key: 'en_preparacion', label: 'En Preparación', desc: 'Control de calidad en almacén' },
  { key: 'en_despacho', label: 'En Despacho', desc: 'Enviado a destino / agencia' },
  { key: 'entregado', label: 'Entregado', desc: 'Recibido por el cliente' },
];

function getStepIndex(status: string, paymentStatus: string): number {
  if (status === 'entregado') return 4;
  if (status === 'en_despacho') return 3;
  if (status === 'en_preparacion' || status === 'preparando') return 2;
  if (status === 'confirmado' || paymentStatus === 'paid') return 1;
  return 0;
}

function SeguimientoContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get('order') || '';
  const initialDoc = searchParams.get('doc') || '';

  const [orderInput, setOrderInput] = useState(initialOrder);
  const [docInput, setDocInput] = useState(initialDoc);
  const [loading, setLoading] = useState(Boolean(initialOrder && initialDoc));
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [retryingMp, setRetryingMp] = useState(false);

  const performLookup = useCallback(async (ordQuery: string, docQuery: string) => {
    if (!ordQuery.trim() || !docQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        order: ordQuery.trim(),
        doc: docQuery.trim(),
      });
      const res = await fetch(`/api/orders/track?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setOrder(null);
        setError(data.error || 'No se encontró el pedido con los datos ingresados.');
      } else {
        setOrder(data);
      }
    } catch {
      setError('Error de conexión al consultar tu pedido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialOrder.trim() || !initialDoc.trim()) return;
    let ignore = false;
    async function autoLookup() {
      try {
        const qs = new URLSearchParams({
          order: initialOrder.trim(),
          doc: initialDoc.trim(),
        });
        const res = await fetch(`/api/orders/track?${qs.toString()}`);
        const data = await res.json();
        if (!ignore) {
          if (!res.ok) {
            setOrder(null);
            setError(data.error || 'No se encontró el pedido con los datos ingresados.');
          } else {
            setOrder(data);
          }
        }
      } catch {
        if (!ignore) {
          setError('Error de conexión al consultar tu pedido.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    autoLookup();
    return () => {
      ignore = true;
    };
  }, [initialOrder, initialDoc]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(orderInput, docInput);
  };

  const handlePayWithMercadoPago = async () => {
    if (!order) return;
    setRetryingMp(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/retry-payment`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      alert(data.error || 'No se pudo generar el enlace de Mercado Pago en este momento.');
    } catch {
      alert('Error de conexión al generar el link de pago.');
    } finally {
      setRetryingMp(false);
    }
  };

  const currentStep = order ? getStepIndex(order.status, order.paymentStatus) : 0;
  const isCancelled = order?.status === 'cancelado';

  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sumaq-50 border border-sumaq-200 text-sumaq-700 text-xs font-bold uppercase tracking-wider">
          <Truck className="w-3.5 h-3.5" /> Tracking & Estado de Orden en Vivo
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Seguimiento de tu Pedido
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Consulta en tiempo real la validación de tu pago en Mercado Pago, reserva de stock,
          emisión de comprobante y código de seguimiento de agencia.
        </p>
      </div>

      {/* Search Form Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-md">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Código o N° de Orden *
            </label>
            <input
              type="text"
              required
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              placeholder="Ej. SMQ-2026-000012 o 12"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono focus:outline-none focus:border-sumaq-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              DNI (8 dígitos) o RUC (11 dígitos) *
            </label>
            <input
              type="text"
              required
              maxLength={11}
              value={docInput}
              onChange={(e) => setDocInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Ingresa el DNI o RUC de compra"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono focus:outline-none focus:border-sumaq-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-sumaq-600 to-sumaq-700 hover:from-sumaq-500 hover:to-sumaq-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sumaq-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Buscando...' : 'Consultar'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Order Details Result */}
      {order && (
        <div className="space-y-6">
          {/* Status Overview Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                    {order.orderNumber}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                      order.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : order.paymentStatus === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : order.paymentStatus === 'refunded'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {order.paymentStatus === 'paid'
                      ? 'Pagado Verificado'
                      : order.paymentStatus === 'pending'
                      ? 'Pago en Validación'
                      : order.paymentStatus === 'refunded'
                      ? 'Reembolsado'
                      : 'Pendiente de Pago'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Registrado el {new Date(order.createdAt).toLocaleString('es-PE')} • Comprobante:{' '}
                  <strong className="uppercase text-slate-700">{order.invoiceType}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {order.paymentStatus !== 'paid' &&
                  order.paymentStatus !== 'refunded' &&
                  !isCancelled && (
                    <button
                      onClick={handlePayWithMercadoPago}
                      disabled={retryingMp}
                      className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      {retryingMp ? 'Abriendo Mercado Pago...' : 'Pagar con Mercado Pago'}
                    </button>
                  )}

                <a
                  href={whatsappUrl(
                    `Hola SUMAQ, consulto por el estado de mi orden ${order.orderNumber} a nombre de ${order.customerName}.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Soporte WhatsApp
                </a>
              </div>
            </div>

            {/* Logistics Progress Stepper */}
            {isCancelled ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Orden Cancelada</p>
                  <p className="text-rose-700">
                    Esta orden fue anulada y la reserva de stock fue liberada. Si realizaste un pago, contáctanos por WhatsApp para asistirte.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                {LOGISTICS_STEPS.map((step, index) => {
                  const completed = index <= currentStep;
                  const active = index === currentStep;
                  return (
                    <div
                      key={step.key}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        active
                          ? 'bg-sumaq-50/80 border-sumaq-400 shadow-xs'
                          : completed
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                            completed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {completed ? '✓' : index + 1}
                        </span>
                        {active && (
                          <span className="text-[10px] font-bold uppercase text-sumaq-700 bg-sumaq-100 px-2 py-0.5 rounded-full">
                            Actual
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900">{step.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Shipping Carrier & Tracking Code Banner */}
            {(order.shippingCarrier || order.trackingCode) && (
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block">
                      Información de Despacho / Courier
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      Agencia: {order.shippingCarrier || 'Courier Asignado'}
                    </p>
                  </div>
                </div>
                {order.trackingCode && (
                  <div className="bg-white px-4 py-2 rounded-xl border border-sky-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Código de Seguimiento / Guía
                    </span>
                    <span className="font-mono font-black text-sm text-sky-700">
                      {order.trackingCode}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Two Column Layout: Order Items + Event Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Items & Delivery Info */}
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md space-y-5">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-sumaq-600" /> Detalle de Equipos y Entrega
              </h2>

              <div className="divide-y divide-slate-100">
                {order.items.map((item, idx) => {
                  const unitPrice = Number(item.price ?? item.unitPrice ?? 0);
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">
                          {item.qty}x {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Voltaje: {item.voltage || '220V'} • Precio unitario: S/{' '}
                          {unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-black text-slate-900 text-sm whitespace-nowrap">
                        S/ {(item.qty * unitPrice).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Equipos:</span>
                  <span>S/ {Number(order.subtotal || order.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Costo de Envío:</span>
                  <span>
                    {Number(order.shippingCost) > 0
                      ? `S/ ${Number(order.shippingCost).toFixed(2)}`
                      : 'Gratis / Retiro en Sede'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total de la Orden:</span>
                  <span className="text-sumaq-600">S/ {Number(order.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-sumaq-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Destino de Entrega</span>
                    <span className="text-slate-600 capitalize block">
                      {order.deliveryType === 'almacen'
                        ? 'Retiro en Sede Jesús María'
                        : `Envío a ${order.city}`}
                    </span>
                    <span className="text-[11px] text-slate-500">{order.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-sumaq-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Titular & Medio de Pago</span>
                    <span className="text-slate-600 block">{order.customerName}</span>
                    <span className="text-[11px] text-slate-500 uppercase">
                      Vía {order.paymentGateway === 'mercadopago' ? 'Mercado Pago' : 'WhatsApp'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Audit Timeline */}
            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md space-y-5">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sumaq-600" /> Historial de Eventos
              </h2>

              {order.events && order.events.length > 0 ? (
                <div className="relative pl-5 space-y-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {order.events.map((ev) => (
                    <div key={ev.id} className="relative">
                      <span className="absolute -left-[17px] top-1 w-3 h-3 rounded-full bg-sumaq-600 ring-4 ring-sumaq-50" />
                      <div className="text-xs">
                        <p className="font-bold text-slate-900">{ev.description}</p>
                        {ev.toState && (
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Estado: <span className="font-mono">{ev.toState}</span>
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {new Date(ev.createdAt).toLocaleString('es-PE')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Orden registrada en el sistema</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Fecha: {new Date(order.createdAt).toLocaleString('es-PE')}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Garantía Oficial 6 Meses
                </span>
                <Link
                  href="/linea-hair"
                  className="font-bold text-sumaq-600 hover:text-sumaq-700 inline-flex items-center gap-1"
                >
                  Seguir comprando <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SeguimientoPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-slate-400 text-xs">
          Cargando módulo de seguimiento...
        </div>
      }
    >
      <SeguimientoContent />
    </Suspense>
  );
}
