'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
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
  Database,
  Search,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  LogOut,
  Activity,
  CreditCard,
  Layers,
  AlertTriangle,
  Truck,
  Clock,
  Webhook,
  Sliders,
} from 'lucide-react';
import { Product } from '@/lib/products-data';
import { OrderRecord, StockMovementRecord, WebhookEventRecord } from '@/lib/db';
import { useSession, signOut } from 'next-auth/react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  pageSizeOptions?: number[];
}

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 20],
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="px-4 py-3 border-t border-slate-800/80 bg-[#090d14] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3 text-slate-400">
        <span>
          Mostrando <strong className="text-white font-semibold">{startItem}</strong> -{' '}
          <strong className="text-white font-semibold">{endItem}</strong> de{' '}
          <strong className="text-white font-semibold">{totalItems}</strong> registros
        </span>
        <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-800">
          <span className="text-[11px] text-slate-500">Filas:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-[#121824] border border-slate-700/80 rounded-md px-2 py-0.5 text-[11px] text-white focus:outline-none cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Anterior
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-slate-600 font-bold">
                  ...
                </span>
              );
            }
            const pageNum = Number(p);
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                  currentPage === pageNum
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950 font-black'
                    : 'bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
        >
          Siguiente <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

type AdminSection =
  | 'overview'
  | 'products'
  | 'inventory'
  | 'orders'
  | 'payments'
  | 'users'
  | 'system';

export default function AdminConsolePage() {
  const { data: session } = useSession();

  // Navigation State
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; email: string; role: string; createdAt: string }>>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEventRecord[]>([]);
  const [mpConfig, setMpConfig] = useState<{ configured: boolean; hasWebhookSecret: boolean; mode: string }>({
    configured: false,
    hasWebhookSecret: false,
    mode: 'unconfigured',
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'hair' | 'barber'>('all');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Pagination State
  const [productsPage, setProductsPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);

  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);

  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stock Adjustment (Kardex) Modal State
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(5);
  const [stockType, setStockType] = useState<'restock' | 'manual_adjustment' | 'return'>('restock');
  const [stockReason, setStockReason] = useState('');
  const [savingStock, setSavingStock] = useState(false);

  // Order Detail Drawer / Modal State
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [syncingMpOrder, setSyncingMpOrder] = useState(false);
  const [savingOrderAdmin, setSavingOrderAdmin] = useState(false);
  const [orderForm, setOrderForm] = useState<{
    status: string;
    paymentStatus: string;
    shippingCarrier: string;
    trackingCode: string;
    adminNotes: string;
  }>({
    status: 'pendiente_pago',
    paymentStatus: 'unpaid',
    shippingCarrier: '',
    trackingCode: '',
    adminNotes: '',
  });

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

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resProd, resOrders, resUsers, resInv, resWebhooks] = await Promise.all([
        fetch('/api/admin/products').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/orders').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/users').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/inventory').then((r) => r.json()).catch(() => []),
        fetch('/api/admin/webhooks').then((r) => r.json()).catch(() => null),
      ]);

      if (Array.isArray(resProd)) setProducts(resProd);
      if (Array.isArray(resOrders)) setOrders(resOrders);
      if (Array.isArray(resUsers)) setUsers(resUsers);
      if (Array.isArray(resInv)) setStockMovements(resInv);
      if (resWebhooks && typeof resWebhooks === 'object') {
        if (resWebhooks.mpConfig) setMpConfig(resWebhooks.mpConfig);
        if (Array.isArray(resWebhooks.events)) setWebhookEvents(resWebhooks.events);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initialLoad() {
      try {
        const [resProd, resOrders, resUsers, resInv, resWebhooks] = await Promise.all([
          fetch('/api/admin/products').then((r) => r.json()).catch(() => []),
          fetch('/api/admin/orders').then((r) => r.json()).catch(() => []),
          fetch('/api/admin/users').then((r) => r.json()).catch(() => []),
          fetch('/api/admin/inventory').then((r) => r.json()).catch(() => []),
          fetch('/api/admin/webhooks').then((r) => r.json()).catch(() => null),
        ]);
        if (!ignore) {
          if (Array.isArray(resProd)) setProducts(resProd);
          if (Array.isArray(resOrders)) setOrders(resOrders);
          if (Array.isArray(resUsers)) setUsers(resUsers);
          if (Array.isArray(resInv)) setStockMovements(resInv);
          if (resWebhooks && typeof resWebhooks === 'object') {
            if (resWebhooks.mpConfig) setMpConfig(resWebhooks.mpConfig);
            if (Array.isArray(resWebhooks.events)) setWebhookEvents(resWebhooks.events);
          }
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    initialLoad();
    return () => {
      ignore = true;
    };
  }, []);

  const handleAdminLogout = () => {
    signOut({ callbackUrl: '/login' });
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
        notify('Producto e inventario sincronizados correctamente en Neon PostgreSQL.');
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
      const res = await fetch(`/api/admin/products?slug=${encodeURIComponent(slug)}`, {
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

  // Submit stock adjustment (Kardex)
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalProduct || stockDelta === 0) return;

    setSavingStock(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: stockModalProduct.id,
          delta: stockDelta,
          movementType: stockType,
          reason: stockReason || `Ajuste de inventario (${stockType})`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify(`Stock de "${stockModalProduct.name}" actualizado a ${data.stock} unidades.`);
        setStockModalProduct(null);
        setStockReason('');
        fetchData();
      } else {
        alert(data.error || 'No se pudo ajustar el stock');
      }
    } catch {
      alert('Error de red al ajustar inventario');
    } finally {
      setSavingStock(false);
    }
  };

  // Quick Order Status Change from table
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
        if (data.order) {
          setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        } else {
          fetchData();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open full Order Detail modal
  const openOrderDetail = async (ord: OrderRecord) => {
    setSelectedOrder(ord);
    setOrderForm({
      status: ord.status || 'pendiente_pago',
      paymentStatus: ord.paymentStatus || 'unpaid',
      shippingCarrier: ord.shippingCarrier || '',
      trackingCode: ord.trackingCode || '',
      adminNotes: ord.adminNotes || '',
    });
    setLoadingOrderDetail(true);
    try {
      const res = await fetch(`/api/admin/orders?id=${ord.id}`);
      if (res.ok) {
        const fullOrder: OrderRecord = await res.json();
        setSelectedOrder(fullOrder);
        setOrderForm({
          status: fullOrder.status || 'pendiente_pago',
          paymentStatus: fullOrder.paymentStatus || 'unpaid',
          shippingCarrier: fullOrder.shippingCarrier || '',
          trackingCode: fullOrder.trackingCode || '',
          adminNotes: fullOrder.adminNotes || '',
        });
      }
    } catch (err) {
      console.error('Error loading order detail:', err);
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  // Save full Order update from modal
  const handleSaveOrderDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSavingOrderAdmin(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status: orderForm.status,
          paymentStatus: orderForm.paymentStatus,
          shippingCarrier: orderForm.shippingCarrier || null,
          trackingCode: orderForm.trackingCode || null,
          adminNotes: orderForm.adminNotes || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify(`Orden ${selectedOrder.orderNumber || `#${selectedOrder.id}`} actualizada e inventario sincronizado.`);
        if (data.order) {
          setSelectedOrder(data.order);
          setOrders((prev) => prev.map((o) => (o.id === data.order.id ? data.order : o)));
        }
        fetchData();
      } else {
        alert(data.error || 'Error al actualizar la orden');
      }
    } catch {
      alert('Error de conexión al guardar la orden');
    } finally {
      setSavingOrderAdmin(false);
    }
  };

  // Manual sync with Mercado Pago API
  const handleSyncWithMercadoPago = async (orderId: number) => {
    setSyncingMpOrder(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/verify?sync=1`);
      const data = await res.json();
      if (res.ok && data.order) {
        notify(
          data.verifiedPayment
            ? `Sincronizado con Mercado Pago: Pago #${data.verifiedPayment.id} (${data.verifiedPayment.status})`
            : 'Consulta completada con Mercado Pago.'
        );
        // Reload full order detail
        const detailRes = await fetch(`/api/admin/orders?id=${orderId}`);
        if (detailRes.ok) {
          const fullOrder = await detailRes.json();
          setSelectedOrder(fullOrder);
          setOrderForm({
            status: fullOrder.status || 'pendiente_pago',
            paymentStatus: fullOrder.paymentStatus || 'unpaid',
            shippingCarrier: fullOrder.shippingCarrier || '',
            trackingCode: fullOrder.trackingCode || '',
            adminNotes: fullOrder.adminNotes || '',
          });
        }
        fetchData();
      } else {
        alert(data.error || 'No se pudo sincronizar con Mercado Pago');
      }
    } catch {
      alert('Error de red al sincronizar con Mercado Pago');
    } finally {
      setSyncingMpOrder(false);
    }
  };

  // Computed metrics
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelado')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const confirmedPaidRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingOrders = orders.filter(
    (o) =>
      o.status === 'pendiente_whatsapp' ||
      o.status === 'pendiente_pago' ||
      !o.status
  ).length;
  const paidOrdersCount = orders.filter((o) => o.paymentStatus === 'paid').length;
  const hairCount = products.filter((p) => p.category === 'hair').length;
  const barberCount = products.filter((p) => p.category === 'barber').length;
  const lowStockProducts = products.filter((p) => {
    const avail = Math.max(0, (p.stock ?? 0) - (p.reservedStock ?? 0));
    return p.trackInventory !== false && avail <= (p.lowStockThreshold ?? 3);
  });

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.punchline.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(productSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      orderFilter === 'all' ||
      (orderFilter === 'pending_any'
        ? o.status === 'pendiente_pago' || o.status === 'pendiente_whatsapp'
        : o.status === orderFilter);
    const matchesPayment =
      paymentFilter === 'all' || o.paymentStatus === paymentFilter;
    return matchesStatus && matchesPayment;
  });

  // Total pages calculations
  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const totalUserPages = Math.max(1, Math.ceil(users.length / usersPerPage));

  const safeProductsPage = Math.min(Math.max(1, productsPage), totalProductPages);
  const safeOrdersPage = Math.min(Math.max(1, ordersPage), totalOrderPages);
  const safeUsersPage = Math.min(Math.max(1, usersPage), totalUserPages);

  const paginatedProducts = filteredProducts.slice(
    (safeProductsPage - 1) * productsPerPage,
    safeProductsPage * productsPerPage
  );

  const paginatedOrders = filteredOrders.slice(
    (safeOrdersPage - 1) * ordersPerPage,
    safeOrdersPage * ordersPerPage
  );

  const paginatedUsers = users.slice(
    (safeUsersPage - 1) * usersPerPage,
    safeUsersPage * usersPerPage
  );

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
                  E-Commerce & ERP
                </span>
              </div>
            </div>

            <div className="mt-4 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SISTEMA ACTIVO • MERCADO PAGO V2
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 text-xs font-semibold">
            <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Operaciones E-Commerce
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
              onClick={() => setActiveSection('orders')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'orders'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" /> Órdenes, Pagos & Envío
              </span>
              {pendingOrders > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {pendingOrders} pend.
                </span>
              )}
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
                <Package className="w-4 h-4 text-blue-400" /> Catálogo & Stock
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('inventory')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'inventory'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-indigo-400" /> Kardex & Movimientos
              </span>
              {lowStockProducts.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  {lowStockProducts.length} alerta
                </span>
              )}
            </button>

            <div className="px-3 pt-4 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Pasarela & Seguridad
            </div>

            <button
              onClick={() => setActiveSection('payments')}
              className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeSection === 'payments'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Webhook className="w-4 h-4 text-sky-400" /> Mercado Pago & Webhooks
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                  mpConfig.configured
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {mpConfig.configured ? mpConfig.mode : 'setup'}
              </span>
            </button>

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
                <p className="text-xs font-bold text-white truncate">{session?.user?.name || 'Operador SUMAQ'}</p>
                <p className="text-[10px] text-slate-500 truncate">{session?.user?.email || 'admin@sumaq.pe'}</p>
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
              {activeSection === 'products' && 'Catálogo, Precios & Stock'}
              {activeSection === 'inventory' && 'Kardex de Inventario'}
              {activeSection === 'orders' && 'Órdenes, Pagos & Despacho'}
              {activeSection === 'payments' && 'Pasarela Mercado Pago & Webhooks'}
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
          <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md">
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
                <h2 className="text-2xl font-black text-white">Panel de Control Operativo E-Commerce</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Métricas en tiempo real de inventario reservado/físico, cobros en Mercado Pago y despachos nacionales.
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800/90">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Equipos & Stock
                      </p>
                      <h3 className="text-3xl font-black text-white mt-1">{products.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{hairCount} Hair / {barberCount} Barber</span>
                    {lowStockProducts.length > 0 ? (
                      <span className="text-rose-400 font-bold">
                        {lowStockProducts.length} stock crítico
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Stock Óptimo</span>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800/90">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Órdenes Totales
                      </p>
                      <h3 className="text-3xl font-black text-white mt-1">{orders.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-emerald-400 font-semibold">{paidOrdersCount} pagadas</span>
                    <span className="text-amber-400 font-semibold">{pendingOrders} en espera</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800/90">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Volumen en Órdenes
                      </p>
                      <h3 className="text-3xl font-black text-emerald-400 mt-1">
                        S/ {totalRevenue.toFixed(2)}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Pagado confirmado:</span>
                    <strong className="text-white">S/ {confirmedPaidRevenue.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800/90">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Pasarela Mercado Pago
                      </p>
                      <h3 className="text-xl font-black text-white mt-2 uppercase">
                        {mpConfig.configured
                          ? mpConfig.mode === 'production'
                            ? 'Producción Activa'
                            : 'Sandbox / Test'
                          : 'Modo Asistido'}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Webhooks recibidos:</span>
                    <strong className="text-sky-400">{webhookEvents.length} eventos</strong>
                  </div>
                </div>
              </div>

              {/* Low Stock Alert Strip */}
              {lowStockProducts.length > 0 && (
                <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                        Alerta de Reposición de Inventario ({lowStockProducts.length} equipos con bajo stock)
                      </h4>
                      <p className="text-xs text-rose-300/80 mt-0.5">
                        {lowStockProducts.map((p) => `${p.name} (${Math.max(0, (p.stock ?? 0) - (p.reservedStock ?? 0))} disp.)`).join(' • ')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('products')}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Abastecer Stock &rarr;
                  </button>
                </div>
              )}

              {/* Quick Actions Strip */}
              <div className="p-6 rounded-2xl bg-[#0c1018] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white">Acciones Rápidas de Administración</h4>
                  <p className="text-xs text-slate-400">
                    Gestiona productos, audita cobros de Mercado Pago o despacha órdenes pendientes.
                  </p>
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
                        stock: 15,
                        lowStockThreshold: 3,
                        sku: '',
                        trackInventory: true,
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
                    <ShoppingBag className="w-4 h-4 text-emerald-400" /> Gestionar Órdenes
                  </button>
                  <button
                    onClick={() => setActiveSection('payments')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Webhook className="w-4 h-4 text-sky-400" /> Monitor Mercado Pago
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION: PRODUCTS CATALOG & STOCK MANAGEMENT */}
          {/* =============================================================== */}
          {activeSection === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Catálogo, Precios & Control de Stock</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Administra fotos con Vercel Blob, precios minoristas/mayoristas y stock disponible en tiempo real.
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
                      stock: 15,
                      lowStockThreshold: 3,
                      sku: '',
                      trackInventory: true,
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
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setProductsPage(1);
                    }}
                    placeholder="Buscar equipo por nombre, SKU o punchline..."
                    className="w-full bg-[#0d121c] border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter('all');
                      setProductsPage(1);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedCategoryFilter === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'bg-[#0d121c] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Todos ({products.length})
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter('hair');
                      setProductsPage(1);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedCategoryFilter === 'hair'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-[#0d121c] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Línea Hair ({hairCount})
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter('barber');
                      setProductsPage(1);
                    }}
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
                        <th className="py-3 px-4 font-bold">Equipo / SKU</th>
                        <th className="py-3 px-4 font-bold">Categoría</th>
                        <th className="py-3 px-4 font-bold">Stock Disponible</th>
                        <th className="py-3 px-4 font-bold">Precio Salón</th>
                        <th className="py-3 px-4 font-bold">Pack Mayorista</th>
                        <th className="py-3 px-4 font-bold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {paginatedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            No se encontraron equipos que coincidan con la búsqueda o filtro.
                          </td>
                        </tr>
                      ) : (
                        paginatedProducts.map((p) => {
                          const totalStock = p.stock ?? 0;
                          const reserved = p.reservedStock ?? 0;
                          const avail = Math.max(0, totalStock - reserved);
                          const isLow = avail <= (p.lowStockThreshold ?? 3);

                          return (
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
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      SKU: {p.sku || `SMQ-${p.id}`}
                                    </p>
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
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${
                                      avail <= 0
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        : isLow
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    }`}
                                  >
                                    {avail} disp.
                                  </span>
                                  {reserved > 0 && (
                                    <span className="text-[10px] text-amber-400 font-mono">
                                      ({reserved} reserv.)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-white text-sm">
                                S/ {p.prices?.reg}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-emerald-400">
                                S/ {p.prices?.salonPack}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setStockModalProduct(p);
                                      setStockDelta(5);
                                      setStockType('restock');
                                      setStockReason('');
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-600 hover:text-white text-indigo-300 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                    title="Ajustar Stock (Kardex)"
                                  >
                                    <Sliders className="w-3 h-3" /> Stock
                                  </button>
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
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  currentPage={safeProductsPage}
                  totalPages={totalProductPages}
                  totalItems={filteredProducts.length}
                  itemsPerPage={productsPerPage}
                  onPageChange={setProductsPage}
                  onItemsPerPageChange={setProductsPerPage}
                  pageSizeOptions={[5, 10, 20]}
                />
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION: INVENTORY KARDEX & MOVEMENTS */}
          {/* =============================================================== */}
          {activeSection === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Kardex & Auditoría de Inventario</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Registro inmutable de ingresos de mercadería, reservas de carrito, ventas confirmadas y liberaciones.
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('products')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-colors self-start sm:self-auto"
                >
                  Ajustar Stock de un Equipo &rarr;
                </button>
              </div>

              <div className="bg-[#0c1018] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/50">
                        <th className="py-3 px-4 font-bold">Fecha / Hora</th>
                        <th className="py-3 px-4 font-bold">Equipo</th>
                        <th className="py-3 px-4 font-bold">Tipo Movimiento</th>
                        <th className="py-3 px-4 font-bold">Variación</th>
                        <th className="py-3 px-4 font-bold">Saldo Stock</th>
                        <th className="py-3 px-4 font-bold">Motivo / Orden</th>
                        <th className="py-3 px-4 font-bold text-right">Operador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {stockMovements.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            Aún no hay movimientos registrados en el Kardex.
                          </td>
                        </tr>
                      ) : (
                        stockMovements.map((mov) => (
                          <tr key={mov.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                              {new Date(mov.createdAt).toLocaleString('es-PE')}
                            </td>
                            <td className="py-3 px-4 font-bold text-white">
                              {mov.productName || `Equipo #${mov.productId}`}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  mov.movementType === 'restock' || mov.movementType === 'return'
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : mov.movementType === 'commit'
                                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                    : mov.movementType === 'reserve'
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {mov.movementType}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold">
                              <span className={mov.quantityDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {mov.quantityDelta > 0 ? `+${mov.quantityDelta}` : mov.quantityDelta}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-300 font-mono">
                              <strong className="text-white">{mov.stockAfter}</strong>{' '}
                              <span className="text-[10px] text-slate-500">
                                ({mov.reservedAfter} res.)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                              {mov.reason || (mov.orderId ? `Orden #${mov.orderId}` : '—')}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                              {mov.actor}
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
          {/* SECTION: ORDERS, PAYMENTS & LOGISTICS */}
          {/* =============================================================== */}
          {activeSection === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Gestión de Órdenes, Pagos & Despacho</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Controla el estado financiero (Mercado Pago / WhatsApp), reserva de stock y códigos de seguimiento.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={orderFilter}
                    onChange={(e) => {
                      setOrderFilter(e.target.value);
                      setOrdersPage(1);
                    }}
                    className="bg-[#0d121c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="all">Estado Logístico: Todos ({orders.length})</option>
                    <option value="pending_any">Pendientes de Pago ({pendingOrders})</option>
                    <option value="confirmado">Confirmado / Pagado</option>
                    <option value="preparando">En Preparación</option>
                    <option value="en_despacho">En Despacho</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>

                  <select
                    value={paymentFilter}
                    onChange={(e) => {
                      setPaymentFilter(e.target.value);
                      setOrdersPage(1);
                    }}
                    className="bg-[#0d121c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="all">Estado Pago: Todos</option>
                    <option value="paid">Pagado Verificado ({paidOrdersCount})</option>
                    <option value="pending">En Validación MP</option>
                    <option value="unpaid">No Pagado</option>
                    <option value="failed">Rechazado / Fallido</option>
                    <option value="refunded">Reembolsado</option>
                  </select>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-20 text-center bg-[#0d121c] border border-slate-800 rounded-2xl text-slate-400 text-xs">
                  No hay órdenes que coincidan con los filtros seleccionados.
                </div>
              ) : (
                <div className="bg-[#0c1018] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/50">
                          <th className="py-3 px-4 font-bold">Código Orden</th>
                          <th className="py-3 px-4 font-bold">Cliente / Comprobante</th>
                          <th className="py-3 px-4 font-bold">Pasarela & Pago</th>
                          <th className="py-3 px-4 font-bold">Entrega / Tracking</th>
                          <th className="py-3 px-4 font-bold">Total</th>
                          <th className="py-3 px-4 font-bold">Estado Logístico</th>
                          <th className="py-3 px-4 font-bold text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {paginatedOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-black text-white block">
                                {ord.orderNumber || `#${ord.id}`}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('es-PE') : ''}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-white">{ord.customerName}</p>
                              <p className="text-[10px] text-slate-400 uppercase">
                                {ord.invoiceType || 'boleta'}: {ord.customerDoc} • {ord.customerPhone}
                              </p>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col items-start gap-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    ord.paymentStatus === 'paid'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : ord.paymentStatus === 'pending'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : ord.paymentStatus === 'failed'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {ord.paymentStatus === 'paid'
                                    ? '✓ PAGADO'
                                    : ord.paymentStatus === 'pending'
                                    ? 'EN VALIDACIÓN'
                                    : ord.paymentStatus === 'failed'
                                    ? 'FALLIDO'
                                    : ord.paymentStatus === 'refunded'
                                    ? 'REEMBOLSADO'
                                    : 'PENDIENTE PAGO'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {ord.paymentGateway === 'mercadopago' ? '💳 Mercado Pago' : '💬 WhatsApp'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="capitalize font-semibold text-slate-300 block">
                                {ord.deliveryType === 'almacen' ? 'Retiro Sede' : `Envío (${ord.city})`}
                              </span>
                              {ord.trackingCode ? (
                                <span className="text-[10px] text-cyan-400 font-mono">
                                  {ord.shippingCarrier}: {ord.trackingCode}
                                </span>
                              ) : (
                                <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{ord.address}</p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-black text-emerald-400 text-sm whitespace-nowrap">
                              S/ {Number(ord.total).toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={ord.status || 'pendiente_pago'}
                                onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                                className="bg-[#121824] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
                              >
                                <option value="pendiente_pago">Pendiente Pago</option>
                                <option value="pendiente_whatsapp">Pendiente WhatsApp</option>
                                <option value="confirmado">Confirmado / Pagado</option>
                                <option value="en_preparacion">En Preparación</option>
                                <option value="en_despacho">En Despacho</option>
                                <option value="entregado">Entregado</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openOrderDetail(ord)}
                                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600 hover:text-white transition-colors text-[11px] font-bold cursor-pointer"
                                >
                                  Gestionar
                                </button>
                                <a
                                  href={`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(ord.customerName)},%20te%20escribimos%20de%20SUMAQ%20Importaciones%20respecto%20a%20tu%20orden%20${encodeURIComponent(ord.orderNumber || `#${ord.id}`)}.`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                                  title="Contactar por WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <TablePagination
                    currentPage={safeOrdersPage}
                    totalPages={totalOrderPages}
                    totalItems={filteredOrders.length}
                    itemsPerPage={ordersPerPage}
                    onPageChange={setOrdersPage}
                    onItemsPerPageChange={setOrdersPerPage}
                    pageSizeOptions={[5, 10, 25]}
                  />
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION: MERCADO PAGO GATEWAY & WEBHOOK LOGS */}
          {/* =============================================================== */}
          {activeSection === 'payments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Pasarela Mercado Pago & Auditoría de Webhooks</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Monitorea las notificaciones firmadas (HMAC-SHA256) y el estado de las credenciales de cobro.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-[#0c1018] border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Estado Credenciales MP
                  </span>
                  <p className="text-lg font-black text-white flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        mpConfig.configured ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    {mpConfig.configured
                      ? `Conectado (${mpConfig.mode.toUpperCase()})`
                      : 'MP_ACCESS_TOKEN Pendiente'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {mpConfig.configured
                      ? 'Checkout Pro generando preferencias automáticamente.'
                      : 'Configura MP_ACCESS_TOKEN en tu entorno para activar redirección automática a Mercado Pago.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c1018] border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Verificación Criptográfica HMAC
                  </span>
                  <p className="text-lg font-black text-white">
                    {mpConfig.hasWebhookSecret ? 'Firma Activa (SHA-256)' : 'Verificación API Directa'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Cada pago es contrastado directamente contra <code className="text-cyan-400">GET /v1/payments/&#123;id&#125;</code> antes de descontar inventario.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c1018] border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Endpoint de Notificaciones
                  </span>
                  <p className="text-xs font-mono font-bold text-cyan-400 break-all">
                    /api/webhooks/mercadopago
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Idempotente y tolerante a reintentos con registro completo en base de datos.
                  </p>
                </div>
              </div>

              {/* Webhook Events Table */}
              <div className="bg-[#0c1018] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Últimos Eventos Webhook Recibidos ({webhookEvents.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/50">
                        <th className="py-3 px-4 font-bold">Fecha / Hora</th>
                        <th className="py-3 px-4 font-bold">Event ID / Recurso</th>
                        <th className="py-3 px-4 font-bold">Tópico / Acción</th>
                        <th className="py-3 px-4 font-bold">Firma HMAC</th>
                        <th className="py-3 px-4 font-bold">Estado</th>
                        <th className="py-3 px-4 font-bold text-right">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {webhookEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            No se han recibido notificaciones de webhook todavía.
                          </td>
                        </tr>
                      ) : (
                        webhookEvents.map((ev) => (
                          <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                              {new Date(ev.createdAt).toLocaleString('es-PE')}
                            </td>
                            <td className="py-3 px-4 font-mono text-white">
                              {ev.resourceId || ev.eventId}
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {ev.topic}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ev.signatureValid
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : 'bg-rose-500/15 text-rose-300'
                                }`}
                              >
                                {ev.signatureValid ? 'Válida' : 'Inválida'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-[11px] uppercase text-cyan-400">
                                {ev.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-slate-400 max-w-xs truncate">
                              {ev.errorMessage || 'OK'}
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
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500">
                            No hay inicios de sesión registrados todavía.
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((u, i) => (
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

                <TablePagination
                  currentPage={safeUsersPage}
                  totalPages={totalUserPages}
                  totalItems={users.length}
                  itemsPerPage={usersPerPage}
                  onPageChange={setUsersPage}
                  onItemsPerPageChange={setUsersPerPage}
                  pageSizeOptions={[5, 10, 25, 50]}
                />
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
                  Estado de la infraestructura serverless en Neon DB, Mercado Pago y Vercel Blob.
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
                      <span className="text-slate-400">Tablas E-Commerce:</span>
                      <span className="text-slate-200">
                        products, orders, payments, stock_movements, webhook_events
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Registros:</span>
                      <span className="text-slate-200">{products.length} productos / {orders.length} órdenes</span>
                    </div>
                  </div>
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
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =================================================================== */}
      {/* MODAL: PRODUCT CREATION & EDITION (WITH INVENTORY FIELDS) */}
      {/* =================================================================== */}
      {modalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d121c] border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                  Gestor de Catálogo & Inventario
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {editingProduct.id ? 'Editar Equipo' : 'Nuevo Equipo en Catálogo'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
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
                    <p className="text-[11px] text-slate-500">O ingresa una URL web directa:</p>
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

              {/* Prices & Temp */}
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
                          salonPack: editingProduct.prices?.salonPack || Math.max(1, Number(e.target.value) - 20),
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

              {/* Inventory Fields */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-cyan-400 mb-1">Código SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    placeholder="LIZ-EXT-001"
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-cyan-400 mb-1">Stock Físico Total</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.stock ?? 15}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-cyan-400 mb-1">Alerta Stock Bajo</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.lowStockThreshold ?? 3}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        lowStockThreshold: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
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

      {/* =================================================================== */}
      {/* MODAL: QUICK STOCK ADJUSTMENT (KARDEX) */}
      {/* =================================================================== */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d121c] border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  Movimiento de Kardex
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{stockModalProduct.name}</h3>
              </div>
              <button
                onClick={() => setStockModalProduct(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Stock físico actual:</span>
                <span className="text-base font-black text-white font-mono">
                  {stockModalProduct.stock ?? 0} unid. ({stockModalProduct.reservedStock ?? 0} reservadas)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Tipo de Operación</label>
                  <select
                    value={stockType}
                    onChange={(e) => setStockType(e.target.value as 'restock' | 'manual_adjustment' | 'return')}
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="restock">Ingreso Mercadería (+)</option>
                    <option value="return">Devolución (+)</option>
                    <option value="manual_adjustment">Ajuste Inventario (+/-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Cantidad (+ o -)</label>
                  <input
                    type="number"
                    required
                    value={stockDelta}
                    onChange={(e) => setStockDelta(Number(e.target.value))}
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Motivo / Guía de Remisión *</label>
                <input
                  type="text"
                  required
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="Ej. Importación lote Brasil #042"
                  className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingStock || stockDelta === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {savingStock ? 'Registrando...' : 'Registrar en Kardex'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ORDER DETAIL, PAYMENT VERIFICATION & SHIPPING TRACKING */}
      {/* =================================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d121c] border border-slate-800 rounded-3xl w-full max-w-4xl p-6 sm:p-8 space-y-6 my-8 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl font-black text-white font-mono">
                    {selectedOrder.orderNumber || `#${selectedOrder.id}`}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      selectedOrder.paymentStatus === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    Pago: {selectedOrder.paymentStatus}
                  </span>
                  {selectedOrder.stockCommitted && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300">
                      Stock Descontado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Cliente: <strong className="text-white">{selectedOrder.customerName}</strong> •{' '}
                  <span className="uppercase">{selectedOrder.invoiceType}</span>: {selectedOrder.customerDoc}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSyncWithMercadoPago(selectedOrder.id)}
                  disabled={syncingMpOrder}
                  className="px-3.5 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingMpOrder ? 'animate-spin' : ''}`} />
                  {syncingMpOrder ? 'Consultando MP...' : 'Sincronizar con Mercado Pago'}
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {loadingOrderDetail && (
              <div className="text-xs text-cyan-400 animate-pulse">
                Cargando historial completo de pagos y eventos...
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
              {/* Left column: Admin Management Form */}
              <form onSubmit={handleSaveOrderDetail} className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-4">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-400" /> Control de Estados & Tracking de Envío
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-400 mb-1">Estado Logístico</label>
                      <select
                        value={orderForm.status}
                        onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                        className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="pendiente_pago">Pendiente de Pago</option>
                        <option value="pendiente_whatsapp">Pendiente WhatsApp</option>
                        <option value="confirmado">Confirmado / Pagado</option>
                        <option value="en_preparacion">En Preparación</option>
                        <option value="en_despacho">En Despacho</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado (Libera Stock)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-400 mb-1">Estado Financiero</label>
                      <select
                        value={orderForm.paymentStatus}
                        onChange={(e) => setOrderForm({ ...orderForm, paymentStatus: e.target.value })}
                        className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="unpaid">No Pagado (unpaid)</option>
                        <option value="pending">En Validación (pending)</option>
                        <option value="paid">Pagado Verificado (paid)</option>
                        <option value="failed">Rechazado (failed)</option>
                        <option value="refunded">Reembolsado (refunded)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-400 mb-1">Agencia / Courier</label>
                      <input
                        type="text"
                        value={orderForm.shippingCarrier}
                        onChange={(e) => setOrderForm({ ...orderForm, shippingCarrier: e.target.value })}
                        placeholder="Ej. Shalom / Olva Courier / Motorizado"
                        className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-400 mb-1">Código de Seguimiento / Guía</label>
                      <input
                        type="text"
                        value={orderForm.trackingCode}
                        onChange={(e) => setOrderForm({ ...orderForm, trackingCode: e.target.value })}
                        placeholder="Ej. SHM-9823412"
                        className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Notas Internas de Administración</label>
                    <textarea
                      rows={2}
                      value={orderForm.adminNotes}
                      onChange={(e) => setOrderForm({ ...orderForm, adminNotes: e.target.value })}
                      placeholder="Observaciones de facturación, número de serie despachado..."
                      className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingOrderAdmin}
                      className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      {savingOrderAdmin ? 'Guardando cambios...' : 'Guardar Cambios de Orden'}
                    </button>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Equipos en la Orden (Total: S/ {Number(selectedOrder.total).toFixed(2)})
                  </h4>
                  <div className="divide-y divide-slate-800/60">
                    {(selectedOrder.items || []).map((it, idx) => (
                      <div key={idx} className="py-2 flex justify-between">
                        <span className="text-slate-200">
                          <strong>{it.qty}x</strong> {it.name} ({it.voltage || '220V'})
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          S/ {(it.qty * Number(it.price)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </form>

              {/* Right column: Payments & Timeline */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-sky-400" /> Transacciones de Pago
                  </h4>
                  {selectedOrder.payments && selectedOrder.payments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedOrder.payments.map((pay) => (
                        <div
                          key={pay.id}
                          className="p-3 rounded-xl bg-[#121824] border border-slate-800 space-y-1"
                        >
                          <div className="flex justify-between font-mono">
                            <span className="text-cyan-400 font-bold">MP #{pay.externalPaymentId}</span>
                            <span className="uppercase font-bold text-white">{pay.status}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Monto: S/ {Number(pay.amount).toFixed(2)} • Medio:{' '}
                            {pay.paymentMethodId || pay.paymentType || 'N/A'}
                          </p>
                          {pay.payerEmail && (
                            <p className="text-[10px] text-slate-500">Pagador: {pay.payerEmail}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px]">
                      No hay transacciones automáticas registradas aún para esta orden.
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" /> Bitácora de Eventos
                  </h4>
                  {selectedOrder.events && selectedOrder.events.length > 0 ? (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {selectedOrder.events.map((ev) => (
                        <div key={ev.id} className="border-l-2 border-cyan-500 pl-3 py-0.5">
                          <p className="font-bold text-slate-200">{ev.description}</p>
                          {ev.toState && (
                            <p className="text-[11px] text-slate-400">Estado: {ev.toState}</p>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(ev.createdAt).toLocaleString('es-PE')} • {ev.actor}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px]">Sin eventos adicionales.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
