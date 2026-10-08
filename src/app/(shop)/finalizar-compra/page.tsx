'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Truck, MapPin, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface ServerQuote {
  items: { id: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
}

export default function CheckoutPage() {
  const { cart, updateQty, removeFromCart, clearCart, subtotal } = useCart();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [quote, setQuote] = useState<ServerQuote | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    dniRuc: '',
    phone: '',
    deliveryType: 'domicilio', // 'domicilio' | 'almacen'
    city: 'Lima',
    address: '',
    paymentMethod: 'Yape / Plin',
  });

  const cartEntries = Object.entries(cart);

  const itemsPayload = cartEntries.map(([, item]) => ({
    id: item.product.id,
    qty: item.qty,
    voltage: item.voltage,
  }));
  const itemsKey = JSON.stringify(itemsPayload);

  // Precios y totales autoritativos desde el servidor (dependen del rol de la sesión).
  useEffect(() => {
    if (itemsPayload.length === 0) return;
    const controller = new AbortController();
    fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: itemsPayload, deliveryType: formData.deliveryType, city: formData.city }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((q) => setQuote(q))
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, formData.deliveryType, formData.city]);

  const unitPrice = (id: string, fallback: number) =>
    quote?.items.find((i) => i.id === id)?.price ?? fallback;

  // Mientras llega la cotización se muestran valores estimados; el servidor siempre recalcula.
  const shippingCost = quote?.shipping ?? (formData.deliveryType === 'almacen' || formData.city === 'Lima' ? 0 : 19);
  const shownSubtotal = quote?.subtotal ?? subtotal;
  const grandTotal = quote?.total ?? subtotal + shippingCost;

  const handleCompleteOrder = async () => {
    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          dniRuc: formData.dniRuc,
          phone: formData.phone,
          deliveryType: formData.deliveryType,
          city: formData.city,
          address: formData.address,
          paymentMethod: formData.paymentMethod,
          items: itemsPayload,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.whatsappUrl) {
        clearCart();
        const confirmUrl = `/pedido-confirmado?orderId=${data.orderId}&total=${data.total}&whatsapp=${encodeURIComponent(data.whatsappUrl)}`;
        try {
          window.open(data.whatsappUrl, '_blank');
        } catch {
          // Popups bloqueados no interfieren con la confirmación
        }
        router.push(confirmUrl);
      } else {
        setFormError(data.error || 'Hubo un problema generando el pedido. Intenta nuevamente.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Error de conexión. Tu pedido NO fue registrado; inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (cartEntries.length === 0 && step === 1) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 text-zinc-400 flex items-center justify-center mx-auto mb-4 text-3xl">
          <ShoppingBag className="w-8 h-8 text-sumaq-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Tu carrito está vacío</h1>
        <p className="text-xs text-zinc-400 mb-6">
          Explora nuestras herramientas profesionales Lizze y añádelas para procesar tu orden.
        </p>
        <Link
          href="/linea-hair"
          className="px-6 py-3 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white text-xs font-bold transition-colors inline-block"
        >
          Ver Catálogo de Salones
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Checkout Steps Progress */}
      <div className="max-w-xl mx-auto mb-12">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-white/10 -z-0" />

          {/* Step 1 */}
          <button
            onClick={() => setStep(1)}
            className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer"
          >
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= 1
                  ? 'bg-sumaq-600 text-white shadow-lg shadow-sumaq-600/40'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              1
            </span>
            <span className={`text-[11px] font-bold ${step === 1 ? 'text-sumaq-400' : 'text-zinc-400'}`}>
              Carrito
            </span>
          </button>

          {/* Step 2 */}
          <button
            onClick={() => setStep(2)}
            className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer"
          >
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= 2
                  ? 'bg-sumaq-600 text-white shadow-lg shadow-sumaq-600/40'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              2
            </span>
            <span className={`text-[11px] font-bold ${step === 2 ? 'text-sumaq-400' : 'text-zinc-400'}`}>
              Despacho
            </span>
          </button>

          {/* Step 3 */}
          <button
            onClick={() => setStep(3)}
            className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer"
          >
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= 3
                  ? 'bg-sumaq-600 text-white shadow-lg shadow-sumaq-600/40'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              3
            </span>
            <span className={`text-[11px] font-bold ${step === 3 ? 'text-sumaq-400' : 'text-zinc-400'}`}>
              Confirmación
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-8">
          {formError && (
            <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {formError}
            </div>
          )}
          {/* STEP 1: CART REVIEW */}
          {step === 1 && (
            <div className="bg-[#131519] border border-white/10 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white">Revisión de Herramientas</h2>
                <span className="text-xs text-zinc-400">{cartEntries.length} tipo(s) de producto</span>
              </div>

              <div className="divide-y divide-white/5 space-y-4">
                {cartEntries.map(([slug, item]) => (
                  <div key={slug} className="pt-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-xl object-cover bg-black border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{item.product.name}</h3>
                        <p className="text-xs text-sumaq-400 font-semibold">
                          S/ {unitPrice(item.product.id, item.product.prices.reg)} c/u
                        </p>
                        <span className="text-[10px] text-zinc-500">{item.voltage}</span>
                      </div>
                    </div>

                    {/* Quantity Controller & Delete */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden text-xs">
                        <button
                          onClick={() => updateQty(slug, -1)}
                          className="px-3 py-1.5 hover:bg-white/10 text-zinc-300 font-bold transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1.5 text-white font-bold">{item.qty}</span>
                        <button
                          onClick={() => updateQty(slug, 1)}
                          className="px-3 py-1.5 hover:bg-white/10 text-zinc-300 font-bold transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-sm font-black text-white w-20 text-right">
                        S/ {unitPrice(item.product.id, item.product.prices.reg) * item.qty}
                      </span>

                      <button
                        onClick={() => removeFromCart(slug)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <Link href="/linea-hair" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Seguir comprando
                </Link>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  Continuar a Despacho <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DELIVERY DETAILS */}
          {step === 2 && (
            <div className="bg-[#131519] border border-white/10 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white">Datos de Entrega y Facturación</h2>
                <span className="text-xs text-zinc-400">Paso 2 de 3</span>
              </div>

              {/* Delivery Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryType: 'domicilio' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formData.deliveryType === 'domicilio'
                      ? 'bg-sumaq-600/10 border-sumaq-500 text-white'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  <p className="font-bold text-sm text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sumaq-400" /> Envío a Domicilio / Salón
                  </p>
                  <p className="text-xs mt-1">Lima Gratis • Provincias a partir de S/19</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryType: 'almacen' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formData.deliveryType === 'almacen'
                      ? 'bg-sumaq-600/10 border-sumaq-500 text-white'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  <p className="font-bold text-sm text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" /> Retiro en Almacén
                  </p>
                  <p className="text-xs mt-1">Av. 6 de Agosto 589, Jesús María (Gratis)</p>
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">
                      Nombre Completo / Razón Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Nombre de quien recibe"
                      className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">
                      DNI o RUC (para comprobante) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.dniRuc}
                      onChange={(e) => setFormData({ ...formData, dniRuc: e.target.value })}
                      placeholder="Número de documento"
                      className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">
                      WhatsApp / Teléfono de Contacto *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+51 9..."
                      className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Ciudad / Departamento</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                    >
                      <option value="Lima">Lima Metropolitana / Callao (Envío Gratis)</option>
                      <option value="Arequipa">Arequipa (Agencia)</option>
                      <option value="Trujillo">Trujillo / La Libertad (Agencia)</option>
                      <option value="Chiclayo">Chiclayo / Lambayeque (Agencia)</option>
                      <option value="Cusco">Cusco (Agencia)</option>
                      <option value="Piura">Piura (Agencia)</option>
                      <option value="Otra">Otras Provincias (Agencia a coordinar)</option>
                    </select>
                  </div>
                </div>

                {formData.deliveryType === 'domicilio' && (
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">
                      Dirección Exacta y Referencias *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Av / Calle, Nro, Urb, Referencia"
                      className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver al Carrito
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.fullName.trim() || !/^\+?[\d\s-]{7,20}$/.test(formData.phone.trim())) {
                      setFormError('Completa tu nombre y un teléfono/WhatsApp válido.');
                      return;
                    }
                    if (!/^(\d{8}|\d{11})$/.test(formData.dniRuc.trim())) {
                      setFormError('Ingresa un DNI (8 dígitos) o RUC (11 dígitos) válido.');
                      return;
                    }
                    if (formData.deliveryType === 'domicilio' && formData.address.trim().length < 5) {
                      setFormError('Ingresa la dirección de entrega.');
                      return;
                    }
                    setFormError('');
                    setStep(3);
                  }}
                  className="px-6 py-3 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  Continuar a Pago <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT PREFERENCE & CONFIRM */}
          {step === 3 && (
            <div className="bg-[#131519] border border-white/10 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white">Método de Pago Sugerido</h2>
                <span className="text-xs text-zinc-400">Paso 3 de 3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'Yape / Plin' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formData.paymentMethod === 'Yape / Plin'
                      ? 'bg-sumaq-600/10 border-sumaq-500 text-white'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  <span className="text-lg block mb-1">📱</span>
                  <p className="font-bold text-white">Yape / Plin</p>
                  <p className="text-[11px] text-zinc-400">Acreditación instantánea</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'Transferencia BCP/BBVA' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formData.paymentMethod === 'Transferencia BCP/BBVA'
                      ? 'bg-sumaq-600/10 border-sumaq-500 text-white'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  <span className="text-lg block mb-1">🏦</span>
                  <p className="font-bold text-white">Transferencia Bancaria</p>
                  <p className="text-[11px] text-zinc-400">BCP, BBVA o Interbank</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'Tarjeta Crédito/Débito' })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    formData.paymentMethod === 'Tarjeta Crédito/Débito'
                      ? 'bg-sumaq-600/10 border-sumaq-500 text-white'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  <span className="text-lg block mb-1">💳</span>
                  <p className="font-bold text-white">Link Tarjeta</p>
                  <p className="text-[11px] text-zinc-400">Pago con link seguro</p>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-zinc-300 space-y-2">
                <div className="flex items-center gap-2 text-sumaq-400 font-bold">
                  <ShieldCheck className="w-4 h-4" /> Proceso de Compra Protegido SUMAQ
                </div>
                <p>
                  Al hacer clic en &quot;Confirmar Pedido y Abrir WhatsApp&quot;, tu orden se registrará
                  y serás redirigido con un asesor oficial de SUMAQ en WhatsApp para verificar
                  el comprobante, emitir tu Boleta o Factura electrónica y coordinar el despacho inmediato.
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver a Despacho
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompleteOrder}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting
                    ? 'Procesando Orden...'
                    : `Confirmar Pedido por S/ ${grandTotal} en WhatsApp →`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-[#131519] border border-white/10 rounded-3xl p-6 sticky top-28 space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider pb-3 border-b border-white/5">
              Resumen de la Orden
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal Herramientas:</span>
                <span className="text-white font-medium">S/ {shownSubtotal}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Costo de Despacho:</span>
                <span className={shippingCost === 0 ? 'text-emerald-400 font-bold' : 'text-white'}>
                  {shippingCost === 0 ? 'GRATIS' : `S/ ${shippingCost}`}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Garantía Oficial (6 Meses):</span>
                <span className="text-emerald-400 font-bold">INCLUIDA</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Total a Pagar:</span>
              <span className="text-2xl font-black text-sumaq-400">S/ {grandTotal}</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-400 space-y-1">
              <p className="font-bold text-zinc-300">Garantía SUMAQ:</p>
              <p>• Equipos 100% nuevos sellados en caja con sello Lizze Brasil.</p>
              <p>• Soporte técnico autorizado en Lima.</p>
              <p>• Asesoría para el uso correcto de temperatura según el cabello.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
