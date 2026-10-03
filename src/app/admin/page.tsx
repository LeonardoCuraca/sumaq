'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  Users,
  Plus,
  Trash2,
  Edit2,
  Upload,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { Product } from '@/lib/products-data';
import { OrderRecord } from '@/lib/db';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users'>('products');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; email: string; role: string; createdAt: string }>>([]);

  // Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resOrders, resUsers] = await Promise.all([
        fetch('/api/admin/products').then((r) => r.json()),
        fetch('/api/admin/orders').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
      ]);

      if (Array.isArray(resProd)) setProducts(resProd);
      if (Array.isArray(resOrders)) setOrders(resOrders);
      if (Array.isArray(resUsers)) setUsers(resUsers);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Image upload to Vercel Blob
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setEditingProduct((prev) => ({
          ...prev,
          images: [data.url, ...(prev?.images?.slice(1) || [])],
        }));
        notify('¡Imagen subida exitosamente a Vercel Blob!');
      } else {
        alert(data.error || 'Error subiendo imagen a Blob');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al subir imagen a Blob');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save product (Create / Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.prices?.reg) {
      alert('Completa al menos el nombre y el precio regular');
      return;
    }

    setSavingProduct(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });

      const data = await res.json();
      if (data.success) {
        notify('Producto guardado correctamente en Neon DB');
        setModalOpen(false);
        setEditingProduct(null);
        fetchData();
      } else {
        alert(data.error || 'Error guardando producto');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al guardar producto');
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (slug: string) => {
    if (!confirm(`¿Estás seguro de eliminar el producto con slug "${slug}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products?slug=${slug}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        notify('Producto eliminado de la base de datos');
        fetchData();
      } else {
        alert(data.error || 'No se pudo eliminar');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al eliminar');
    }
  };

  // Update order status
  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Estado de la orden #${orderId} actualizado a "${status}"`);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Volver a la tienda"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-sumaq-600 text-white text-[10px] font-black uppercase tracking-wider">
                  Panel SUMAQ
                </span>
                <span className="text-xs text-zinc-400">Neon Postgres & Vercel Blob</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Panel de Administración
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar datos
            </button>
            <button
              onClick={() => {
                setEditingProduct({
                  name: '',
                  category: 'hair',
                  punchline: '',
                  temp: '250°C (480°F)',
                  voltage: ['220V'],
                  prices: { reg: 350, min: 330, salonPack: 320 },
                  images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80'],
                  specs: { placas: 'Titanio nano-revestido', garantia: '6 meses oficial' },
                  shortDesc: '',
                  longDesc: '',
                });
                setModalOpen(true);
              }}
              className="px-5 py-2 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white text-xs font-bold shadow-lg shadow-sumaq-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* Floating Notification */}
        {notification && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-xl animate-fade-in">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-[#131519] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Productos Activos</p>
              <h3 className="text-2xl font-black text-white mt-1">{products.length}</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Catálogo en Neon DB</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sumaq-600/10 text-sumaq-400 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#131519] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Órdenes Generadas</p>
              <h3 className="text-2xl font-black text-white mt-1">{orders.length}</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Vía Carrito y WhatsApp</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#131519] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Volumen Total Pedidos</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">S/ {totalRevenue.toFixed(2)}</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Suma de órdenes registradas</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#131519] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Inicios de Sesión</p>
              <h3 className="text-2xl font-black text-white mt-1">{users.length}</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Salones y administradores</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-sumaq-600 text-white shadow-md shadow-sumaq-600/30'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Package className="w-4 h-4" />
            Catálogo & Productos ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-sumaq-600 text-white shadow-md shadow-sumaq-600/30'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Órdenes & Pedidos ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-sumaq-600 text-white shadow-md shadow-sumaq-600/30'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            Historial de Inicios de Sesión ({users.length})
          </button>
        </div>

        {/* TAB 1: PRODUCTS LIST */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Herramientas en Catálogo</h2>
              <span className="text-xs text-zinc-400">Las modificaciones impactan en la tienda en tiempo real</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-[#131519] border border-white/5 flex flex-col justify-between hover:border-white/20 transition-all space-y-4"
                >
                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-20 h-20 rounded-xl object-cover bg-black border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sumaq-500/10 text-sumaq-400 border border-sumaq-500/20 uppercase">
                          {p.category}
                        </span>
                        {p.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-zinc-300">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white truncate mt-1">{p.name}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{p.punchline}</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-sm font-black text-white">S/ {p.prices?.reg}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          Mayorista: S/ {p.prices?.salonPack}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <Link
                      href={`/producto/${p.slug}`}
                      target="_blank"
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver en Tienda
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.slug)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS LIST */}
        {activeTab === 'orders' && (
          <div className="bg-[#131519] border border-white/10 rounded-3xl p-6 overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Órdenes de Compra Generadas</h2>
              <span className="text-xs text-zinc-400">Total: {orders.length} pedidos en Neon DB</span>
            </div>

            {orders.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-xs">
                No hay órdenes registradas todavía. Cuando los clientes finalicen compra, aparecerán aquí.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-400">
                      <th className="py-3 px-4 font-bold">Orden #</th>
                      <th className="py-3 px-4 font-bold">Cliente</th>
                      <th className="py-3 px-4 font-bold">WhatsApp / Teléfono</th>
                      <th className="py-3 px-4 font-bold">Entrega</th>
                      <th className="py-3 px-4 font-bold">Productos</th>
                      <th className="py-3 px-4 font-bold">Total</th>
                      <th className="py-3 px-4 font-bold">Estado</th>
                      <th className="py-3 px-4 font-bold">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">#{ord.id}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white">{ord.customerName}</p>
                          <p className="text-[10px] text-zinc-400">Doc: {ord.customerDoc}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <a
                            href={`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline font-bold"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {ord.customerPhone}
                          </a>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize font-medium text-zinc-300">
                            {ord.deliveryType === 'almacen' ? 'Retiro Jesús María' : `Envío (${ord.city})`}
                          </span>
                          <p className="text-[10px] text-zinc-500 truncate max-w-xs">{ord.address}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 max-w-xs">
                            {(ord.items || []).map((it, idx) => (
                              <p key={idx} className="truncate text-zinc-300">
                                • {it.name} x{it.qty} ({it.voltage || '220V'})
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-black text-sumaq-400 text-sm whitespace-nowrap">
                          S/ {ord.total}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={ord.status || 'pendiente_whatsapp'}
                            onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                            className="bg-[#181a20] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
                          >
                            <option value="pendiente_whatsapp">Pendiente WhatsApp</option>
                            <option value="confirmado">Confirmado / Pagado</option>
                            <option value="en_despacho">En Despacho</option>
                            <option value="entregado">Entregado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <a
                            href={`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(ord.customerName)},%20te%20escribimos%20de%20SUMAQ%20Importaciones%20respecto%20a%20tu%20orden%20%23${ord.id}.`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            Chat WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USER LOGINS */}
        {activeTab === 'users' && (
          <div className="bg-[#131519] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Historial de Accesos y Usuarios</h2>
              <span className="text-xs text-zinc-400">Registrados automáticamente en Neon DB</span>
            </div>

            {users.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-xs">
                No hay inicios de sesión registrados aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-400">
                      <th className="py-3 px-4 font-bold">#</th>
                      <th className="py-3 px-4 font-bold">Usuario / Correo / RUC</th>
                      <th className="py-3 px-4 font-bold">Rol Asignado</th>
                      <th className="py-3 px-4 font-bold">Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u, i) => (
                      <tr key={u.id || i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-zinc-500">{i + 1}</td>
                        <td className="py-3 px-4 font-bold text-white">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-sumaq-500/20 text-sumaq-400 border border-sumaq-500/30'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {u.createdAt ? new Date(u.createdAt).toLocaleString('es-PE') : 'Reciente'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRODUCT CREATE / EDIT MODAL */}
      {modalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#131519] border border-white/10 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">
                {editingProduct.id ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Image Upload directly to Vercel Blob */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                <label className="block font-bold text-zinc-300">
                  Foto Principal del Producto (Vercel Blob Storage)
                </label>
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editingProduct.images?.[0] || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'}
                    alt="Preview"
                    className="w-20 h-20 rounded-xl object-cover bg-black border border-white/10 shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      {uploadingImage ? 'Subiendo a Vercel Blob...' : 'Subir archivo a Blob'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      O pega la URL directa de la imagen:
                    </p>
                    <input
                      type="url"
                      value={editingProduct.images?.[0] || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, images: [e.target.value] })
                      }
                      placeholder="https://..."
                      className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs focus:border-sumaq-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-zinc-400 mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Ej. Plancha Lizze Extreme Titanium"
                    className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-sumaq-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-400 mb-1">Categoría</label>
                  <select
                    value={editingProduct.category || 'hair'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as 'hair' | 'barber',
                      })
                    }
                    className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-sumaq-500 focus:outline-none"
                  >
                    <option value="hair">Línea Hair (Alisados / Secadores / Fotón)</option>
                    <option value="barber">Línea Barber (Clipper / Trimmer / Shaver)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-zinc-400 mb-1">Precio Salón (S/) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.prices?.reg || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        prices: {
                          reg: Number(e.target.value),
                          min: editingProduct.prices?.min || Number(e.target.value),
                          salonPack: editingProduct.prices?.salonPack || Number(e.target.value) - 20,
                        },
                      })
                    }
                    placeholder="380"
                    className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-sumaq-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-400 mb-1">Precio Pack Mayorista (S/)</label>
                  <input
                    type="number"
                    value={editingProduct.prices?.salonPack || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        prices: {
                          reg: editingProduct.prices?.reg || 0,
                          min: editingProduct.prices?.min || 0,
                          salonPack: Number(e.target.value),
                        },
                      })
                    }
                    placeholder="350"
                    className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-sumaq-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-400 mb-1">Temperatura Máxima</label>
                  <input
                    type="text"
                    value={editingProduct.temp || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, temp: e.target.value })}
                    placeholder="250°C (480°F)"
                    className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-sumaq-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-400 mb-1">Frase Destacada / Punchline</label>
                <input
                  type="text"
                  value={editingProduct.punchline || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, punchline: e.target.value })}
                  placeholder="Alisado brasileño profesional en la mitad de pasadas"
                  className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-sumaq-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-400 mb-1">Descripción Completa</label>
                <textarea
                  rows={3}
                  value={editingProduct.longDesc || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, longDesc: e.target.value })}
                  placeholder="Detalles sobre beneficios, tipo de titanio, cable giratorio, etc."
                  className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-sumaq-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white font-bold tracking-wider uppercase transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingProduct ? 'Guardando...' : 'Guardar en Base de Datos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
