'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Package,
  ShoppingBag,
  Users,
  Plus,
  Trash2,
  Edit3,
  Upload,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Database,
  Search,
  DollarSign,
  Lock,
  ChevronRight,
  Sliders,
  Check,
  Eye,
  LogOut,
  Terminal,
  Activity,
  FileText
} from 'lucide-react';
import { Product } from '@/lib/products-data';
import { OrderRecord } from '@/lib/db';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function AdminConsolePage() {
  const { data: session, status } = useSession();

  // Navigation State
  const [activeSection, setActiveSection] = useState<'overview' | 'products' | 'orders' | 'users' | 'system'>('overview');

  // Security gatekeeper state (allows quick master pass if session not configured)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [gatePassword, setGatePassword] = useState('');
  const [gateError, setGateError] = useState('');

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; email: string; role: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'hair' | 'barber'>('all');
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Clock
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if session has admin role or localStorage unlocked
  useEffect(() => {
    if (session?.user && (session.user as { role?: string }).role === 'admin') {
      setIsUnlocked(true);
    } else {
      const savedPass = sessionStorage.getItem('sumaq_admin_unlocked');
      if (savedPass === 'true') {
        setIsUnlocked(true);
      }
    }
  }, [session]);

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
    if (isUnlocked) {
      fetchData();
    }
  }, [isUnlocked]);

  // Handle Security Gate Unlock
  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gatePassword === 'Lizze2026' || gatePassword === 'admin') {
      sessionStorage.setItem('sumaq_admin_unlocked', 'true');
      setIsUnlocked(true);
      setGateError('');
      notify('Acceso autorizado como Operador del Sistema.');
    } else {
      setGateError('Clave de seguridad incorrecta. Acceso restringido.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('sumaq_admin_unlocked');
    setIsUnlocked(false);
    if (session) {
      signOut({ redirect: false });
    }
  };

  // Image Upload directly to Vercel Blob
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
        notify('Imagen subida exitosamente a Vercel Blob.');
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

  // Save product in Neon DB
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.prices?.reg) {
      alert('Completa al menos el nombre y el precio regular del producto.');
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
        notify('Producto sincronizado correctamente en Neon PostgreSQL.');
        setModalOpen(false);
        setEditingProduct(null);
        fetchData();
      } else {
        alert(data.error || 'Error al guardar producto');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al guardar producto');
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (slug: string, name: string) => {
    if (!confirm(`¿Eliminar definitivamente el equipo "${name}" del catálogo?`)) return;

    try {
      const res = await fetch(`/api/admin/products?slug=${slug}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        notify(`"${name}" fue eliminado de la base de datos.`);
        fetchData();
      } else {
        alert(data.error || 'No se pudo eliminar');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al eliminar');
    }
  };

  // Update order status in Neon DB
  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Orden #${orderId} actualizada a "${status}".`);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Computed metrics
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'pendiente_whatsapp' || !o.status).length;
  const hairCount = products.filter((p) => p.category === 'hair').length;
  const barberCount = products.filter((p) => p.category === 'barber').length;

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.punchline.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  // =========================================================================
  // RENDER: SECURITY GATE / RESTRICTED ACCESS SCREEN
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle Background Circuit Glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-[#0d121c] border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                CONSOLA RESTRINGIDA
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
                SUMAQ Core Administration
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Portal de control privado para operadores y administradores autorizados.
              </p>
            </div>
          </div>

          {gateError && (
            <div className="p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{gateError}</span>
            </div>
          )}

          <form onSubmit={handleGateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                Clave de Seguridad Operativa
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoFocus
                  value={gatePassword}
                  onChange={(e) => setGatePassword(e.target.value)}
                  placeholder="Introduce contraseña de administrador"
                  className="w-full bg-[#121824] border border-slate-700/80 rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-cyan-900/40 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Desbloquear Consola <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Credential Hint */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
            <p className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Clave de acceso predeterminada:
            </p>
            <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-between font-mono text-[11px] text-cyan-300">
              <span>Lizze2026</span>
              <button
                type="button"
                onClick={() => setGatePassword('Lizze2026')}
                className="text-[10px] text-slate-400 hover:text-white uppercase font-sans font-bold underline cursor-pointer"
              >
                Autocompletar
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
            >
              &larr; Volver a la Tienda Pública
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: MAIN ADMIN PORTAL (ISOLATED DEDICATED SHELL)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR NAVIGATION (ENTERPRISE SLATE) */}
      {/* ------------------------------------------------------------------ */}
      <aside className="w-full lg:w-72 bg-[#0c1018] border-r border-slate-800/90 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-950/50">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-wider text-base text-white leading-none">
                  SUMAQ CORE
                </span>
                <span className="text-[10px] tracking-widest text-cyan-400 font-bold uppercase mt-1">
                  Management Console
                </span>
              </div>
            </div>

            <div className="mt-4 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SISTEMA ACTIVO • PERMISOS TOTALES
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 text-xs font-semibold">
            <div className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Operaciones
            </div>

            <button
              onClick={() => setActiveSection('overview')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'overview'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-cyan-400" /> Resumen Ejecutivo
              </span>
            </button>

            <button
              onClick={() => setActiveSection('products')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'products'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-blue-400" /> Catálogo & Equipos
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('orders')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'orders'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" /> Órdenes & Despacho
              </span>
              {pendingOrders > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold animate-pulse">
                  {pendingOrders} pend.
                </span>
              )}
            </button>

            <div className="px-3 pt-5 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Seguridad & Cloud
            </div>

            <button
              onClick={() => setActiveSection('users')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'users'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-purple-400" /> Auditoría de Accesos
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('system')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'system'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-amber-400" /> Neon DB & Blob Status
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer with Operator Info */}
        <div className="p-4 border-t border-slate-800/80 bg-[#090d14] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                OP
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Operador Maestro</p>
                <p className="text-[10px] text-slate-500 truncate">admin@sumaq.pe</p>
              </div>
            </div>
            <button
              onClick={handleAdminLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Cerrar sesión de la consola"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/"
            target="_blank"
            className="w-full py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-slate-700/60 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" /> Ver Tienda en Vivo &rarr;
          </Link>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONSOLE WORKSPACE */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#07090e]">
        {/* Top Operational Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0b0f17]/90 backdrop-blur-md px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Consola</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-bold capitalize">
              {activeSection === 'overview' && 'Resumen Ejecutivo'}
              {activeSection === 'products' && 'Catálogo & Equipos'}
              {activeSection === 'orders' && 'Órdenes & Despacho'}
              {activeSection === 'users' && 'Auditoría de Accesos'}
              {activeSection === 'system' && 'Diagnóstico del Sistema'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>UTC-5 (Lima): {currentTime}</span>
            </div>

            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Sincronizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Toast Floating Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
          {/* =============================================================== */}
          {/* SECTION: OVERVIEW / RESUMEN EJECUTIVO */}
          {/* =============================================================== */}
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-white">Panel de Control Operativo</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Métricas clave de inventario, facturación estimada y actividad del sistema SUMAQ.
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800/90 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Equipos en Catálogo
                      </p>
                      <h3 className="text-3xl font-black text-white mt-1">{products.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{hairCount} Línea Hair</span>
                    <span>{barberCount} Línea Barber</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800/90 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Órdenes Generadas
                      </p>
                      <h3 className="text-3xl font-black text-white mt-1">{orders.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-amber-400 font-semibold">{pendingOrders} pendientes</span>
                    <span>{orders.length - pendingOrders} procesadas</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800/90 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Volumen Total Estimado
                      </p>
                      <h3 className="text-3xl font-black text-emerald-400 mt-1">
                        S/ {totalRevenue.toFixed(2)}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <span>Registrado vía Carrito & WhatsApp</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800/90 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Accesos Registrados
                      </p>
                      <h3 className="text-3xl font-black text-white mt-1">{users.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <span>Salones y administradores</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Strip */}
              <div className="p-6 rounded-2xl bg-[#0c1018] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white">Acciones Rápidas de Administración</h4>
                  <p className="text-xs text-slate-400">Gestiona productos o revisa órdenes pendientes al instante.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setEditingProduct({
                        name: '',
                        category: 'hair',
                        punchline: '',
                        temp: '250°C (480°F)',
                        voltage: ['220V'],
                        prices: { reg: 380, min: 360, salonPack: 350 },
                        images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'],
                        specs: { placas: 'Titanio', garantia: '6 meses oficial' },
                        shortDesc: '',
                        longDesc: '',
                      });
                      setModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Agregar Nuevo Equipo
                  </button>
                  <button
                    onClick={() => setActiveSection('orders')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-400" /> Ver Órdenes Recientes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION: PRODUCTS CATALOG MANAGEMENT */}
          {/* =============================================================== */}
          {activeSection === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Catálogo & Personalización</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Crea, edita fotos con Vercel Blob o ajusta precios de los equipos.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct({
                      name: '',
                      category: 'hair',
                      punchline: '',
                      temp: '250°C (480°F)',
                      voltage: ['220V'],
                      prices: { reg: 380, min: 360, salonPack: 350 },
                      images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'],
                      specs: { placas: 'Titanio', garantia: '6 meses oficial' },
                      shortDesc: '',
                      longDesc: '',
                    });
                    setModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/40 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Nuevo Equipo
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar equipo por nombre o punchline..."
                    className="w-full bg-[#0d121c] border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedCategoryFilter === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'bg-[#0d121c] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Todos ({products.length})
                  </button>
                  <button
                    onClick={() => setSelectedCategoryFilter('hair')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedCategoryFilter === 'hair'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-[#0d121c] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Línea Hair ({hairCount})
                  </button>
                  <button
                    onClick={() => setSelectedCategoryFilter('barber')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedCategoryFilter === 'barber'
                        ? 'bg-amber-600 text-white'
                        : 'bg-[#0d121c] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Línea Barber ({barberCount})
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-[#0c1018] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/50">
                        <th className="py-3 px-4 font-bold">Equipo / Imagen</th>
                        <th className="py-3 px-4 font-bold">Categoría</th>
                        <th className="py-3 px-4 font-bold">Temperatura</th>
                        <th className="py-3 px-4 font-bold">Precio Salón</th>
                        <th className="py-3 px-4 font-bold">Pack Mayorista</th>
                        <th className="py-3 px-4 font-bold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-12 h-12 rounded-lg object-cover bg-black border border-slate-800 shrink-0"
                              />
                              <div className="min-w-0 max-w-xs">
                                <p className="font-bold text-white truncate">{p.name}</p>
                                <p className="text-[11px] text-slate-400 truncate">{p.punchline}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                p.category === 'hair'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-medium">
                            {p.temp !== 'N/A' ? `🔥 ${p.temp}` : '—'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white text-sm">
                            S/ {p.prices?.reg}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400">
                            S/ {p.prices?.salonPack}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/producto/${p.slug}`}
                                target="_blank"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="Ver en tienda"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 hover:text-white text-cyan-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Editar
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.slug, p.name)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                                title="Eliminar equipo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION: ORDERS & LOGISTICS */}
          {/* =============================================================== */}
          {activeSection === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Gestión de Órdenes & Despacho</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Pedidos generados desde el carrito y sincronizados con WhatsApp.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setOrderFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      orderFilter === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'bg-[#0d121c] text-slate-400 border border-slate-800'
                    }`}
                  >
                    Todas ({orders.length})
                  </button>
                  <button
                    onClick={() => setOrderFilter('pendiente_whatsapp')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      orderFilter === 'pendiente_whatsapp'
                        ? 'bg-amber-600 text-white'
                        : 'bg-[#0d121c] text-slate-400 border border-slate-800'
                    }`}
                  >
                    Pendientes ({pendingOrders})
                  </button>
                  <button
                    onClick={() => setOrderFilter('confirmado')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      orderFilter === 'confirmado'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#0d121c] text-slate-400 border border-slate-800'
                    }`}
                  >
                    Confirmados
                  </button>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-20 text-center bg-[#0d121c] border border-slate-800 rounded-2xl text-slate-400 text-xs">
                  No hay órdenes que coincidan con el filtro seleccionado.
                </div>
              ) : (
                <div className="bg-[#0c1018] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/50">
                          <th className="py-3 px-4 font-bold">Orden</th>
                          <th className="py-3 px-4 font-bold">Cliente / RUC</th>
                          <th className="py-3 px-4 font-bold">Contacto</th>
                          <th className="py-3 px-4 font-bold">Entrega / Dirección</th>
                          <th className="py-3 px-4 font-bold">Ítems</th>
                          <th className="py-3 px-4 font-bold">Total</th>
                          <th className="py-3 px-4 font-bold">Estado</th>
                          <th className="py-3 px-4 font-bold text-right">WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-black text-white">#{ord.id}</td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-white">{ord.customerName}</p>
                              <p className="text-[10px] text-slate-400">Doc: {ord.customerDoc}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-mono text-slate-300">{ord.customerPhone}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="capitalize font-semibold text-slate-300">
                                {ord.deliveryType === 'almacen' ? 'Retiro Jesús María' : `Envío (${ord.city})`}
                              </span>
                              <p className="text-[10px] text-slate-500 truncate max-w-xs">{ord.address}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5 max-w-xs">
                                {(ord.items || []).map((it, idx) => (
                                  <p key={idx} className="truncate text-slate-300">
                                    • {it.name} x{it.qty} ({it.voltage || '220V'})
                                  </p>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-black text-emerald-400 text-sm whitespace-nowrap">
                              S/ {ord.total}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={ord.status || 'pendiente_whatsapp'}
                                onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                                className="bg-[#121824] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
                              >
                                <option value="pendiente_whatsapp">Pendiente WhatsApp</option>
                                <option value="confirmado">Confirmado / Pagado</option>
                                <option value="en_despacho">En Despacho</option>
                                <option value="entregado">Entregado</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <a
                                href={`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(ord.customerName)},%20te%20escribimos%20de%20la%20administración%20de%20SUMAQ%20Importaciones%20respecto%20a%20tu%20orden%20%23${ord.id}.`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors text-[11px] font-bold inline-flex items-center gap-1.5"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> Chat
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION: USER AUDIT LOGS */}
          {/* =============================================================== */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Auditoría de Inicios de Sesión</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Registro cronológico de ingresos a la plataforma guardados en Neon PostgreSQL.
                </p>
              </div>

              <div className="bg-[#0c1018] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/50">
                        <th className="py-3 px-4 font-bold"># ID</th>
                        <th className="py-3 px-4 font-bold">Usuario / Correo / RUC</th>
                        <th className="py-3 px-4 font-bold">Rol Asignado</th>
                        <th className="py-3 px-4 font-bold">Fecha y Hora</th>
                        <th className="py-3 px-4 font-bold text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500">
                            No hay inicios de sesión registrados todavía.
                          </td>
                        </tr>
                      ) : (
                        users.map((u, i) => (
                          <tr key={u.id || i} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-500">#{u.id || i + 1}</td>
                            <td className="py-3 px-4 font-bold text-white">{u.email}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  u.role === 'admin'
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {u.createdAt ? new Date(u.createdAt).toLocaleString('es-PE') : 'Reciente'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                                <Check className="w-3.5 h-3.5" /> Autenticado
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION: SYSTEM & CLOUD DIAGNOSTICS */}
          {/* =============================================================== */}
          {activeSection === 'system' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Diagnóstico del Sistema & Cloud</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Estado de la infraestructura serverless en Neon DB y Vercel Blob.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#0c1018] border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Neon PostgreSQL Serverless</h3>
                      <p className="text-[11px] text-slate-400">Base de datos relacional principal</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estado de Conexión:</span>
                      <span className="text-emerald-400 font-bold">Activo & En Línea</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tablas Gestionadas:</span>
                      <span className="text-slate-200">products, orders, b2b_leads, user_logins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Registros:</span>
                      <span className="text-slate-200">{products.length} productos / {orders.length} órdenes</span>
                    </div>
                  </div>

                  <a
                    href="/api/init-db"
                    target="_blank"
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center block transition-colors"
                  >
                    Ejecutar Verificación de Tablas (/api/init-db) &rarr;
                  </a>
                </div>

                <div className="p-6 rounded-2xl bg-[#0c1018] border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Vercel Blob Storage</h3>
                      <p className="text-[11px] text-slate-400">Almacenamiento CDN para fotos de productos</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estado de Almacén:</span>
                      <span className="text-cyan-400 font-bold">Público / CDN Global</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Directorio de Subida:</span>
                      <span className="text-slate-200 font-mono">products/</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Endpoint Activo:</span>
                      <span className="text-slate-200 font-mono">/api/upload</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Puedes subir imágenes directamente desde la pestaña de Catálogo al crear o editar cualquier equipo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =================================================================== */}
      {/* MODAL: PRODUCT CREATION & EDITION (WITH BLOB UPLOAD) */}
      {/* =================================================================== */}
      {modalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d121c] border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                  Gestor de Inventario
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {editingProduct.id ? 'Editar Equipo' : 'Nuevo Equipo en Catálogo'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Vercel Blob Image Upload */}
              <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-3">
                <label className="block font-bold text-slate-300">
                  Foto Principal del Equipo (Vercel Blob Storage)
                </label>
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editingProduct.images?.[0] || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'}
                    alt="Preview"
                    className="w-20 h-20 rounded-xl object-cover bg-black border border-slate-800 shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <label className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      {uploadingImage ? 'Subiendo archivo a Blob...' : 'Seleccionar archivo local'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500">
                      O ingresa una URL web directa:
                    </p>
                    <input
                      type="url"
                      value={editingProduct.images?.[0] || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, images: [e.target.value] })
                      }
                      placeholder="https://..."
                      className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Nombre del Equipo *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Ej. Plancha Lizze Extreme Titanium"
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Categoría</label>
                  <select
                    value={editingProduct.category || 'hair'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as 'hair' | 'barber',
                      })
                    }
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="hair">Línea Hair (Alisados, Secado y Fototerapia)</option>
                    <option value="barber">Línea Barber (Clipper, Trimmer y Shaver)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Precio Salón (S/) *</label>
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
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Pack Mayorista (S/)</label>
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
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Temperatura Máxima</label>
                  <input
                    type="text"
                    value={editingProduct.temp || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, temp: e.target.value })}
                    placeholder="250°C (480°F)"
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Frase Destacada / Punchline</label>
                <input
                  type="text"
                  value={editingProduct.punchline || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, punchline: e.target.value })}
                  placeholder="Alisado brasileño profesional en la mitad de pasadas"
                  className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Descripción Detallada</label>
                <textarea
                  rows={3}
                  value={editingProduct.longDesc || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, longDesc: e.target.value })}
                  placeholder="Detalles sobre placas de titanio nano-revestido, cable giratorio de 2.7m..."
                  className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wider uppercase transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingProduct ? 'Guardando en Neon...' : 'Guardar en Base de Datos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
