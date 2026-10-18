'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Truck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  MessageCircle,
  Lock,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { availableStock } from '@/lib/products-data';

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
    invoiceType: 'boleta' as 'boleta' | 'factura',
    dniRuc: '',
    email: '',
    phone: '',
    deliveryType: 'domicilio' as 'domicilio' | 'almacen',
    city: 'Lima',
    address: '',
    paymentGateway: 'mercadopago' as 'mercadopago' | 'manual_whatsapp',
    paymentMethod: 'Mercado Pago (Tarjetas, Yape, PagoEfectivo)',
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
      body: JSON.stringify({
        items: itemsPayload,
        deliveryType: formData.deliveryType,
        city: formData.city,
      }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((q) => {
        if (q) setQuote(q);
      })
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, formData.deliveryType, formData.city]);

  const unitPrice = (id: string, fallback: number) =>
    quote?.items.find((i) => i.id === id)?.price ?? fallback;

  // Mientras llega la cotización se muestran valores estimados; el servidor siempre recalcula.
  const shippingCost =
    quote?.shipping ?? (formData.deliveryType === 'almacen' || formData.city === 'Lima' ? 0 : 19);
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
          invoiceType: formData.invoiceType,
          dniRuc: formData.dniRuc,
          email: formData.email,
          phone: formData.phone,
          deliveryType: formData.deliveryType,
          city: formData.city,
          address: formData.address,
          paymentGateway: formData.paymentGateway,
          paymentMethod: formData.paymentMethod,
          items: itemsPayload,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(data.error || 'Hubo un problema generando el pedido. Intenta nuevamente.');
        return;
      }

      clearCart();

      // Si eligió Mercado Pago y el backend devolvió el checkoutUrl oficial de Mercado Pago, redirigimos
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      const confirmUrl = `/pedido-confirmado?orderId=${data.orderId}&orderNumber=${encodeURIComponent(
        data.orderNumber || ''
      )}&total=${data.total}&gateway=${data.paymentGateway || formData.paymentGateway}&whatsapp=${encodeURIComponent(
        data.whatsappUrl || ''
      )}${data.mpFallback ? '&mp_fallback=1' : ''}`;

      if (formData.paymentGateway === 'manual_whatsapp' && data.whatsappUrl) {
        try {
          window.open(data.whatsappUrl, '_blank');
        } catch {
          // Popups bloqueados no interfieren con la confirmación
        }
      }
      router.push(confirmUrl);
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
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 text-3xl">
          <ShoppingBag className="w-8 h-8 text-sumaq-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Tu carrito está vacío</h1>
        <p className="text-xs text-slate-500 mb-6">
          Explora nuestras herramientas profesionales Lizze y añádelas para procesar tu orden.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/linea-hair"
            className="px-6 py-3 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white text-xs font-bold transition-colors inline-block shadow-sm"
          >
            Ver Catálogo de Salones
          </Link>
          <Link
            href="/seguimiento"
            className="px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors inline-block"
          >
            Rastrear un Pedido Existente
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Checkout Steps Progress */}
      <div className="max-w-xl mx-auto mb-12">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-0" />

          {/* Step 1 */}
          <button
            onClick={() => setStep(1)}
            className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer"
          >
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= 1
                  ? 'bg-sumaq-600 text-white shadow-md shadow-sumaq-600/30'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              1
            </span>
            <span
              className={`text-[11px] font-bold ${step === 1 ? 'text-sumaq-600' : 'text-slate-500'}`}
            >
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
                  ? 'bg-sumaq-600 text-white shadow-md shadow-sumaq-600/30'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </span>
            <span
              className={`text-[11px] font-bold ${step === 2 ? 'text-sumaq-600' : 'text-slate-500'}`}
            >
              Despacho y Datos
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
                  ? 'bg-sumaq-600 text-white shadow-md shadow-sumaq-600/30'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </span>
            <span
              className={`text-[11px] font-bold ${step === 3 ? 'text-sumaq-600' : 'text-slate-500'}`}
            >
              Pasarela de Pago
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-8">
          {formError && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
            >
              {formError}
            </div>
          )}

          {/* STEP 1: CART REVIEW */}
          {step === 1 && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Revisión de Herramientas</h2>
                <span className="text-xs text-slate-500">
                  {cartEntries.length} tipo(s) de producto
                </span>
              </div>

              <div className="divide-y divide-slate-100 space-y-4">
                {cartEntries.map(([slug, item]) => {
                  const avail = availableStock(item.product);
                  return (
                    <div key={slug} className="pt-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-xs text-sumaq-600 font-semibold">
                            S/ {unitPrice(item.product.id, item.product.prices.reg)} c/u
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.voltage}
                            </span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                              Stock: {avail} disp.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controller & Delete */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
                          <button
                            onClick={() => updateQty(slug, -1)}
                            className="px-3 py-1.5 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 py-1.5 text-slate-900 font-bold">{item.qty}</span>
                          <button
                            onClick={() => updateQty(slug, 1)}
                            disabled={item.qty >= avail}
                            className="px-3 py-1.5 hover:bg-slate-200 disabled:opacity-40 text-slate-600 font-bold transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-sm font-black text-slate-900 w-20 text-right">
                          S/ {unitPrice(item.product.id, item.product.prices.reg) * item.qty}
                        </span>

                        <button
                          onClick={() => removeFromCart(slug)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <Link
                  href="/linea-hair"
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Seguir comprando
                </Link>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  Continuar a Despacho <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DELIVERY DETAILS */}
          {step === 2 && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Datos de Entrega y Facturación Electrónica
                </h2>
                <span className="text-xs text-slate-500">Paso 2 de 3</span>
              </div>

              {/* Invoice Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tipo de Comprobante Electrónico SUNAT:
                </label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, invoiceType: 'boleta' })}
                    className={`p-3 rounded-xl border font-bold transition-all cursor-pointer ${
                      formData.invoiceType === 'boleta'
                        ? 'bg-sumaq-50 border-sumaq-500 text-sumaq-800 ring-1 ring-sumaq-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Boleta de Venta (DNI / RUC 10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, invoiceType: 'factura' })}
                    className={`p-3 rounded-xl border font-bold transition-all cursor-pointer ${
                      formData.invoiceType === 'factura'
                        ? 'bg-sumaq-50 border-sumaq-500 text-sumaq-800 ring-1 ring-sumaq-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Factura Comercial Salones (RUC 11 dígitos)
                  </button>
                </div>
              </div>

              {/* Delivery Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryType: 'domicilio' })}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    formData.deliveryType === 'domicilio'
                      ? 'bg-sumaq-50/70 border-sumaq-500 text-slate-900 ring-1 ring-sumaq-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sumaq-600" /> Envío a Domicilio / Salón
                  </p>
                  <p className="text-xs mt-1 text-slate-500">
                    Lima Gratis • Provincias S/ 19 (Shalom / Olva)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryType: 'almacen' })}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    formData.deliveryType === 'almacen'
                      ? 'bg-emerald-50/70 border-emerald-500 text-slate-900 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Retiro en Almacén Central
                  </p>
                  <p className="text-xs mt-1 text-slate-500">
                    Av. 6 de Agosto 589, Jesús María (Gratis)
                  </p>
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {formData.invoiceType === 'factura'
                        ? 'Razón Social del Salón / Empresa *'
                        : 'Nombre Completo de quien recibe *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder={
                        formData.invoiceType === 'factura'
                          ? 'Ej. Inversiones Belleza SAC'
                          : 'Nombre y Apellidos'
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {formData.invoiceType === 'factura'
                        ? 'Número de RUC (11 dígitos) *'
                        : 'DNI (8 dígitos) o RUC *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.dniRuc}
                      onChange={(e) => setFormData({ ...formData, dniRuc: e.target.value })}
                      placeholder={formData.invoiceType === 'factura' ? '20XXXXXXXXX' : 'Número de documento'}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      WhatsApp / Teléfono *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+51 9..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Correo Electrónico (Recibo MP)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="cliente@salon.pe"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Ciudad / Departamento
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:border-sumaq-500 focus:outline-none"
                    >
                      <option value="Lima">Lima Metropolitana / Callao (Gratis)</option>
                      <option value="Arequipa">Arequipa (Agencia)</option>
                      <option value="Trujillo">Trujillo / La Libertad (Agencia)</option>
                      <option value="Chiclayo">Chiclayo / Lambayeque (Agencia)</option>
                      <option value="Cusco">Cusco (Agencia)</option>
                      <option value="Piura">Piura (Agencia)</option>
                      <option value="Huancayo">Huancayo / Junín (Agencia)</option>
                      <option value="Ica">Ica (Agencia)</option>
                      <option value="Otra">Otras Provincias (Agencia Nacional)</option>
                    </select>
                  </div>
                </div>

                {formData.deliveryType === 'domicilio' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Dirección Exacta o Agencia de Destino y Referencias *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Av / Calle, Nro, Distrito, Referencia o sede Shalom/Olva"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver al Carrito
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !formData.fullName.trim() ||
                      !/^\+?[\d\s-]{7,20}$/.test(formData.phone.trim())
                    ) {
                      setFormError('Completa tu nombre/razón social y un teléfono válido.');
                      return;
                    }
                    if (!/^(\d{8}|\d{11})$/.test(formData.dniRuc.trim())) {
                      setFormError('Ingresa un DNI (8 dígitos) o RUC (11 dígitos) válido.');
                      return;
                    }
                    if (formData.invoiceType === 'factura' && formData.dniRuc.trim().length !== 11) {
                      setFormError('Para Factura debes ingresar un RUC de 11 dígitos.');
                      return;
                    }
                    if (
                      formData.deliveryType === 'domicilio' &&
                      formData.address.trim().length < 5
                    ) {
                      setFormError('Ingresa la dirección de entrega.');
                      return;
                    }
                    setFormError('');
                    setStep(3);
                  }}
                  className="px-6 py-3 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  Continuar a Pago <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT GATEWAY & CONFIRM */}
          {step === 3 && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  Selecciona tu Pasarela de Pago
                </h2>
                <span className="text-xs text-slate-500">Paso 3 de 3</span>
              </div>

              {/* Main Gateway Selector: Mercado Pago vs WhatsApp Direct */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      paymentGateway: 'mercadopago',
                      paymentMethod: 'Mercado Pago (Tarjetas, Yape, PagoEfectivo)',
                    })
                  }
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    formData.paymentGateway === 'mercadopago'
                      ? 'bg-sky-50/70 border-sky-500 text-slate-900 ring-2 ring-sky-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-black uppercase tracking-wider mb-2">
                    <Lock className="w-3 h-3" /> Pasarela Automática 24/7
                  </span>
                  <p className="font-black text-base text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-sky-600" /> Pagar con Mercado Pago
                  </p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Aprobación instantánea con <strong>Yape</strong>,{' '}
                    <strong>Tarjetas de Crédito/Débito</strong> (Visa, Mastercard, Amex, Diners en
                    cuotas) o <strong>PagoEfectivo</strong>.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      paymentGateway: 'manual_whatsapp',
                      paymentMethod: 'Transferencia BCP/BBVA o Yape Directo',
                    })
                  }
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    formData.paymentGateway === 'manual_whatsapp'
                      ? 'bg-emerald-50/70 border-emerald-500 text-slate-900 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider mb-2">
                    Atención Personalizada
                  </span>
                  <p className="font-black text-base text-slate-900 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-emerald-600" /> Transferencia / Asesor WhatsApp
                  </p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Reserva tu orden y coordina el abono directo a cuentas corporativas{' '}
                    <strong>BCP / BBVA / Interbank</strong> o Yape con un ejecutivo SUMAQ.
                  </p>
                </button>
              </div>

              {formData.paymentGateway === 'mercadopago' ? (
                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 text-xs text-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-sky-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-sky-600" /> Compra 100% Protegida con
                    Encriptación SSL y Mercado Pago Perú
                  </div>
                  <p>
                    Al continuar, tu stock quedará reservado por 30 minutos y serás dirigido a la
                    pasarela segura de <strong>Mercado Pago</strong> para abonar{' '}
                    <strong>S/ {grandTotal}</strong>. Una vez aprobado el pago, tu orden pasará
                    automáticamente a preparación de despacho.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center gap-2 text-sumaq-600 font-bold">
                    <ShieldCheck className="w-4 h-4" /> Proceso de Compra Asistido SUMAQ
                  </div>
                  <p>
                    Al confirmar, tu orden se registrará con código único y se abrirá WhatsApp con
                    un asesor oficial de SUMAQ para verificar el comprobante, emitir tu{' '}
                    {formData.invoiceType === 'factura' ? 'Factura' : 'Boleta'} electrónica y
                    coordinar el despacho inmediato.
                  </p>
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver a Datos de Entrega
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompleteOrder}
                  className={`px-8 py-3.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer ${
                    formData.paymentGateway === 'mercadopago'
                      ? 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 shadow-sky-600/20'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-600/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting
                    ? 'Generando Orden Segura...'
                    : formData.paymentGateway === 'mercadopago'
                    ? `Pagar S/ ${grandTotal} con Mercado Pago →`
                    : `Confirmar Orden por S/ ${grandTotal} en WhatsApp →`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sticky top-28 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
              Resumen de la Orden
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Herramientas:</span>
                <span className="text-slate-900 font-bold">S/ {shownSubtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Costo de Despacho:</span>
                <span
                  className={
                    shippingCost === 0
                      ? 'text-emerald-600 font-bold'
                      : 'text-slate-900 font-semibold'
                  }
                >
                  {shippingCost === 0 ? 'GRATIS' : `S/ ${shippingCost}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Garantía Oficial (6 Meses):</span>
                <span className="text-emerald-600 font-bold">INCLUIDA</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total a Pagar:</span>
              <span className="text-2xl font-black text-sumaq-600">S/ {grandTotal}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Garantía y Respaldo SUMAQ:</p>
              <p>• Stock verificado en tiempo real en nuestro almacén de Lima.</p>
              <p>• Equipos 100% nuevos sellados en caja con sello Lizze Brasil.</p>
              <p>• Pagos procesados con Mercado Pago o atención directa B2B.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
