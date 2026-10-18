import { neon } from '@neondatabase/serverless';
import { INITIAL_PRODUCTS, Product } from './products-data';

/**
 * Neon serverless PostgreSQL helper.
 * El esquema se gestiona con migraciones (`npm run db:migrate`), nunca en runtime.
 */
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  return neon(databaseUrl);
}

/** Igual que getDb pero falla explícitamente: usar en operaciones que no deben "fingir" éxito. */
export function requireDb() {
  const sql = getDb();
  if (!sql) throw new Error('DATABASE_URL no está configurada.');
  return sql;
}

const PRODUCT_COLUMNS = `id, slug, category, name, badge, punchline, temp, voltage, options, prices, images, specs,
  short_desc AS "shortDesc", long_desc AS "longDesc", is_featured AS "isFeatured",
  COALESCE(stock, 25)::int AS stock,
  COALESCE(reserved_stock, 0)::int AS "reservedStock",
  COALESCE(low_stock_threshold, 3)::int AS "lowStockThreshold",
  sku,
  COALESCE(track_inventory, true) AS "trackInventory"`;

/**
 * Libera oportunistamente reservas de stock cuyas órdenes no pagadas expiraron (TTL > 30 min).
 */
export async function releaseExpiredReservations(): Promise<void> {
  const sql = getDb();
  if (!sql) return;
  try {
    const expiredOrders = await sql`
      SELECT id, items FROM orders
      WHERE payment_status = 'unpaid'
        AND stock_committed = FALSE
        AND stock_released = FALSE
        AND stock_reserved_until IS NOT NULL
        AND stock_reserved_until < NOW()
      LIMIT 25`;

    for (const row of expiredOrders) {
      await releaseOrderStock(row.id as number, 'Expiración automática de reserva (TTL 30m)', 'system');
    }
  } catch {
    // Si la migración 003 aún no se corrió en un entorno dev antiguo, ignorar silenciosamente
  }
}

/**
 * Catálogo. Solo usa el catálogo estático cuando NO hay base de datos configurada (desarrollo local).
 * Si hay BD y falla, el error se propaga: nunca mostramos precios potencialmente obsoletos en silencio.
 */
export async function getAllProducts(): Promise<Product[]> {
  const sql = getDb();
  if (!sql) return INITIAL_PRODUCTS;

  if (Math.random() < 0.1) {
    await releaseExpiredReservations();
  }

  const rows = await sql.query(`SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY created_at ASC, id ASC`);
  return rows as unknown as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const sql = getDb();
  if (!sql) return INITIAL_PRODUCTS.find((p) => p.slug === slug) || null;

  const rows = await sql.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE slug = $1 LIMIT 1`, [slug]);
  return (rows[0] as unknown as Product) ?? null;
}

/** Productos por id (para recalcular pedidos en servidor). */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const sql = getDb();
  if (!sql) return INITIAL_PRODUCTS.filter((p) => ids.includes(p.id));

  await releaseExpiredReservations();
  const rows = await sql.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ANY($1)`, [ids]);
  return rows as unknown as Product[];
}

/** Crea un producto nuevo. Devuelve false si el slug o id ya existen. */
export async function createProduct(p: Product): Promise<boolean> {
  const sql = requireDb();
  const stock = typeof p.stock === 'number' ? p.stock : 25;
  const threshold = typeof p.lowStockThreshold === 'number' ? p.lowStockThreshold : 3;
  const sku = p.sku || `LZ-${p.id.toUpperCase()}`;
  const track = p.trackInventory ?? true;

  const rows = await sql`
    INSERT INTO products (id, slug, category, name, badge, punchline, temp, voltage, options, prices, images, specs, short_desc, long_desc, is_featured, stock, reserved_stock, low_stock_threshold, sku, track_inventory)
    VALUES (${p.id}, ${p.slug}, ${p.category}, ${p.name}, ${p.badge || null}, ${p.punchline}, ${p.temp},
      ${JSON.stringify(p.voltage)}, ${JSON.stringify(p.options || [])}, ${JSON.stringify(p.prices)},
      ${JSON.stringify(p.images)}, ${JSON.stringify(p.specs)}, ${p.shortDesc}, ${p.longDesc}, ${p.isFeatured || false},
      ${stock}, 0, ${threshold}, ${sku}, ${track})
    ON CONFLICT DO NOTHING
    RETURNING id`;
  return rows.length > 0;
}

/** Actualiza un producto existente por id. Devuelve false si no existe. */
export async function updateProduct(p: Product): Promise<boolean> {
  const sql = requireDb();
  const stock = typeof p.stock === 'number' ? p.stock : 25;
  const threshold = typeof p.lowStockThreshold === 'number' ? p.lowStockThreshold : 3;
  const sku = p.sku || `LZ-${p.id.toUpperCase()}`;
  const track = p.trackInventory ?? true;

  const rows = await sql`
    UPDATE products SET
      slug = ${p.slug}, category = ${p.category}, name = ${p.name}, badge = ${p.badge || null},
      punchline = ${p.punchline}, temp = ${p.temp}, voltage = ${JSON.stringify(p.voltage)},
      options = ${JSON.stringify(p.options || [])}, prices = ${JSON.stringify(p.prices)},
      images = ${JSON.stringify(p.images)}, specs = ${JSON.stringify(p.specs)},
      short_desc = ${p.shortDesc}, long_desc = ${p.longDesc}, is_featured = ${p.isFeatured || false},
      stock = ${stock}, low_stock_threshold = ${threshold}, sku = ${sku}, track_inventory = ${track},
      updated_at = NOW()
    WHERE id = ${p.id}
    RETURNING id`;
  return rows.length > 0;
}

/** Elimina un producto por slug y devuelve sus imágenes (para limpiar Blob) o null si no existía. */
export async function deleteProductBySlug(slug: string): Promise<string[] | null> {
  const sql = requireDb();
  const rows = await sql`DELETE FROM products WHERE slug = ${slug} RETURNING images`;
  if (rows.length === 0) return null;
  return (rows[0].images as string[]) ?? [];
}

// ---------------------------------------------------------------------------
// Inventario y Movimientos de Stock (Kardex)
// ---------------------------------------------------------------------------

export interface StockMovementRecord {
  id: number;
  productId: string;
  productName?: string;
  orderId: number | null;
  movementType: 'reserve' | 'commit' | 'release' | 'manual_adjustment' | 'restock' | 'return';
  quantityDelta: number;
  stockAfter: number;
  reservedAfter: number;
  reason: string | null;
  actor: string;
  createdAt: string;
}

export async function adjustProductStock(params: {
  productId: string;
  delta: number;
  movementType: 'manual_adjustment' | 'restock' | 'return';
  reason: string;
  actor: string;
}): Promise<{ stock: number; reservedStock: number } | null> {
  const sql = requireDb();
  const rows = await sql`
    UPDATE products
    SET stock = GREATEST(0, COALESCE(stock, 0) + ${params.delta}),
        updated_at = NOW()
    WHERE id = ${params.productId}
    RETURNING stock::int AS stock, COALESCE(reserved_stock, 0)::int AS "reservedStock"`;

  if (rows.length === 0) return null;
  const updated = rows[0] as { stock: number; reservedStock: number };

  await sql`
    INSERT INTO stock_movements (product_id, movement_type, quantity_delta, stock_after, reserved_after, reason, actor)
    VALUES (${params.productId}, ${params.movementType}, ${params.delta}, ${updated.stock}, ${updated.reservedStock}, ${params.reason}, ${params.actor})`;

  return updated;
}

export async function getRecentStockMovements(limit = 100): Promise<StockMovementRecord[]> {
  const sql = requireDb();
  const rows = await sql`
    SELECT sm.id, sm.product_id AS "productId", p.name AS "productName", sm.order_id AS "orderId",
      sm.movement_type AS "movementType", sm.quantity_delta AS "quantityDelta",
      sm.stock_after AS "stockAfter", sm.reserved_after AS "reservedAfter",
      sm.reason, sm.actor, sm.created_at AS "createdAt"
    FROM stock_movements sm
    LEFT JOIN products p ON p.id = sm.product_id
    ORDER BY sm.created_at DESC
    LIMIT ${limit}`;
  return rows as unknown as StockMovementRecord[];
}

// ---------------------------------------------------------------------------
// Usuarios y auditoría de accesos
// ---------------------------------------------------------------------------

export interface UserRecord {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'salon_partner';
  active: boolean;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const sql = requireDb();
  const rows = await sql`
    SELECT id, email, name, password_hash AS "passwordHash", role, active
    FROM users WHERE email = ${email.trim().toLowerCase()} LIMIT 1`;
  return (rows[0] as unknown as UserRecord) ?? null;
}

export async function recordUserLogin(email: string, role: string, ip?: string, userAgent?: string) {
  const sql = getDb();
  if (!sql) return;
  try {
    await sql`INSERT INTO user_logins (email, role, ip, user_agent) VALUES (${email}, ${role}, ${ip ?? null}, ${userAgent ?? null})`;
  } catch (err) {
    console.warn('No se pudo registrar el acceso:', err);
  }
}

export async function getAllUserLogins() {
  const sql = requireDb();
  return await sql`
    SELECT id, email, role, ip, created_at AS "createdAt"
    FROM user_logins ORDER BY created_at DESC LIMIT 100`;
}

// ---------------------------------------------------------------------------
// Pedidos, Pagos y Eventos
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = [
  'pendiente_pago',
  'pendiente_whatsapp',
  'confirmado',
  'en_preparacion',
  'en_despacho',
  'entregado',
  'cancelado',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'unpaid',
  'pending',
  'paid',
  'failed',
  'refunded',
  'charged_back',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  voltage?: string;
  price: number;
}

export interface PaymentRecord {
  id: number;
  orderId: number;
  provider: string;
  externalPaymentId: string | null;
  externalPreferenceId: string | null;
  status: string;
  statusDetail: string | null;
  paymentType: string | null;
  paymentMethodId: string | null;
  installments: number;
  amount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  payerEmail: string | null;
  payerDocType: string | null;
  payerDocNumber: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface OrderEventRecord {
  id: number;
  orderId: number;
  eventType: string;
  fromState: string | null;
  toState: string | null;
  description: string;
  actor: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface OrderRecord {
  id: number;
  orderNumber: string;
  customerName: string;
  customerDoc: string;
  customerPhone: string;
  customerEmail?: string | null;
  invoiceType: 'boleta' | 'factura';
  deliveryType: string;
  city: string;
  address: string;
  paymentMethod: string;
  paymentGateway: 'mercadopago' | 'manual_whatsapp';
  paymentStatus: PaymentStatus;
  mpPreferenceId?: string | null;
  mpPaymentId?: string | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  currency: string;
  items: OrderItem[];
  status: OrderStatus;
  shippingCarrier?: string | null;
  trackingCode?: string | null;
  adminNotes?: string | null;
  stockCommitted: boolean;
  stockReleased: boolean;
  stockReservedUntil?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  payments?: PaymentRecord[];
  events?: OrderEventRecord[];
}

export interface NewOrder {
  customerName: string;
  customerDoc: string;
  customerPhone: string;
  customerEmail?: string;
  invoiceType?: 'boleta' | 'factura';
  deliveryType: string;
  city: string;
  address: string;
  paymentMethod: string;
  paymentGateway?: 'mercadopago' | 'manual_whatsapp';
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
  total: number;
  items: OrderItem[];
  userId?: number | null;
}

export function formatOrderNumber(id: number, year = new Date().getFullYear()): string {
  return `SMQ-${year}-${String(id).padStart(6, '0')}`;
}

export async function recordOrderEvent(params: {
  orderId: number;
  eventType: string;
  fromState?: string | null;
  toState?: string | null;
  description: string;
  actor?: string;
  metadata?: Record<string, unknown> | null;
}) {
  const sql = getDb();
  if (!sql) return;
  try {
    await sql`
      INSERT INTO order_events (order_id, event_type, from_state, to_state, description, actor, metadata)
      VALUES (${params.orderId}, ${params.eventType}, ${params.fromState ?? null}, ${params.toState ?? null},
        ${params.description}, ${params.actor ?? 'system'}, ${params.metadata ? JSON.stringify(params.metadata) : null})`;
  } catch (err) {
    console.warn('No se pudo registrar order_event:', err);
  }
}

/**
 * Crea la orden y reserva atómicamente el inventario por 30 minutos.
 * Lanza Error si algún producto se quedó sin stock disponible en el instante de compra.
 */
export async function createOrder(o: NewOrder): Promise<number> {
  const sql = requireDb();

  // Agrupar cantidades por producto para validar y reservar stock
  const qtyByProduct = new Map<string, number>();
  for (const item of o.items) {
    qtyByProduct.set(item.id, (qtyByProduct.get(item.id) ?? 0) + item.qty);
  }

  const reservedProducts: { id: string; qty: number }[] = [];
  for (const [productId, qty] of qtyByProduct) {
    const res = await sql`
      UPDATE products
      SET reserved_stock = COALESCE(reserved_stock, 0) + ${qty},
          updated_at = NOW()
      WHERE id = ${productId}
        AND (COALESCE(track_inventory, true) = FALSE OR (COALESCE(stock, 25) - COALESCE(reserved_stock, 0)) >= ${qty})
      RETURNING id, COALESCE(stock, 25)::int AS stock, COALESCE(reserved_stock, 0)::int AS "reservedStock"`;

    if (res.length === 0) {
      // Revertir reservas previas de este lote si falló uno
      for (const prev of reservedProducts) {
        await sql`
          UPDATE products
          SET reserved_stock = GREATEST(0, COALESCE(reserved_stock, 0) - ${prev.qty})
          WHERE id = ${prev.id}`;
      }
      throw new Error(`Stock insuficiente para completar la reserva del producto (${productId}).`);
    }
    reservedProducts.push({ id: productId, qty });
  }

  const gateway = o.paymentGateway ?? (o.paymentMethod.toLowerCase().includes('mercado') ? 'mercadopago' : 'manual_whatsapp');
  const initialStatus: OrderStatus = gateway === 'mercadopago' ? 'pendiente_pago' : 'pendiente_whatsapp';
  const subtotal = o.subtotal ?? o.items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const shippingCost = o.shippingCost ?? Math.max(0, o.total - subtotal);

  const rows = await sql`
    INSERT INTO orders (
      customer_name, customer_doc, customer_phone, customer_email, invoice_type,
      delivery_type, city, address, payment_method, payment_gateway, payment_status,
      subtotal, shipping_cost, discount, total, items, status, user_id,
      stock_reserved_until
    )
    VALUES (
      ${o.customerName}, ${o.customerDoc}, ${o.customerPhone}, ${o.customerEmail || null}, ${o.invoiceType || 'boleta'},
      ${o.deliveryType}, ${o.city}, ${o.address}, ${o.paymentMethod}, ${gateway}, 'unpaid',
      ${subtotal}, ${shippingCost}, ${o.discount ?? 0}, ${o.total}, ${JSON.stringify(o.items)}, ${initialStatus}, ${o.userId ?? null},
      NOW() + INTERVAL '30 minutes'
    )
    RETURNING id`;

  const orderId = rows[0].id as number;
  const orderNumber = formatOrderNumber(orderId);
  await sql`UPDATE orders SET order_number = ${orderNumber} WHERE id = ${orderId}`;

  // Registrar movimientos de reserva en kardex
  for (const { id: productId, qty } of reservedProducts) {
    const pRow = await sql`SELECT COALESCE(stock, 25)::int AS stock, COALESCE(reserved_stock, 0)::int AS reserved FROM products WHERE id = ${productId}`;
    if (pRow.length > 0) {
      await sql`
        INSERT INTO stock_movements (product_id, order_id, movement_type, quantity_delta, stock_after, reserved_after, reason, actor)
        VALUES (${productId}, ${orderId}, 'reserve', 0, ${pRow[0].stock}, ${pRow[0].reserved}, ${`Reserva por orden ${orderNumber} (${qty} und.)`}, 'system')`;
    }
  }

  await recordOrderEvent({
    orderId,
    eventType: 'order_created',
    fromState: null,
    toState: initialStatus,
    description: `Orden ${orderNumber} creada vía ${gateway === 'mercadopago' ? 'Mercado Pago' : 'WhatsApp'}. Stock reservado por 30 min.`,
    actor: o.customerEmail || o.customerName,
  });

  return orderId;
}

/**
 * Confirma en firme el descuento de stock cuando una orden es pagada o confirmada.
 * Idempotente: si `stock_committed` ya es true, no vuelve a descontar.
 */
export async function commitOrderStock(orderId: number, reason: string, actor = 'system'): Promise<boolean> {
  const sql = requireDb();
  const orderRows = await sql`
    UPDATE orders
    SET stock_committed = TRUE,
        updated_at = NOW()
    WHERE id = ${orderId} AND stock_committed = FALSE
    RETURNING id, order_number AS "orderNumber", items, stock_released AS "stockReleased"`;

  if (orderRows.length === 0) return false;
  const order = orderRows[0];
  const items = (order.items as OrderItem[]) || [];
  const wasReleased = Boolean(order.stockReleased);

  const qtyByProduct = new Map<string, number>();
  for (const item of items) {
    qtyByProduct.set(item.id, (qtyByProduct.get(item.id) ?? 0) + item.qty);
  }

  for (const [productId, qty] of qtyByProduct) {
    const updated = await sql`
      UPDATE products
      SET stock = GREATEST(0, COALESCE(stock, 25) - ${qty}),
          reserved_stock = CASE
            WHEN ${wasReleased} THEN COALESCE(reserved_stock, 0)
            ELSE GREATEST(0, COALESCE(reserved_stock, 0) - ${qty})
          END,
          updated_at = NOW()
      WHERE id = ${productId}
      RETURNING COALESCE(stock, 0)::int AS stock, COALESCE(reserved_stock, 0)::int AS reserved`;

    if (updated.length > 0) {
      await sql`
        INSERT INTO stock_movements (product_id, order_id, movement_type, quantity_delta, stock_after, reserved_after, reason, actor)
        VALUES (${productId}, ${orderId}, 'commit', ${-qty}, ${updated[0].stock}, ${updated[0].reserved}, ${reason}, ${actor})`;
    }
  }

  return true;
}

/**
 * Libera el stock reservado o devuelve el stock físico si una orden se cancela o expira.
 * Idempotente: controla `stock_committed` y `stock_released`.
 */
export async function releaseOrderStock(orderId: number, reason: string, actor = 'system'): Promise<boolean> {
  const sql = requireDb();
  const rows = await sql`
    SELECT id, order_number AS "orderNumber", items,
      stock_committed AS "stockCommitted", stock_released AS "stockReleased"
    FROM orders WHERE id = ${orderId} LIMIT 1`;

  if (rows.length === 0) return false;
  const order = rows[0];
  if (order.stockReleased) return false;

  const mark = await sql`
    UPDATE orders SET stock_released = TRUE, updated_at = NOW()
    WHERE id = ${orderId} AND stock_released = FALSE
    RETURNING id`;
  if (mark.length === 0) return false;

  const items = (order.items as OrderItem[]) || [];
  const qtyByProduct = new Map<string, number>();
  for (const item of items) {
    qtyByProduct.set(item.id, (qtyByProduct.get(item.id) ?? 0) + item.qty);
  }

  for (const [productId, qty] of qtyByProduct) {
    if (order.stockCommitted) {
      // Ya se había descontado del stock físico -> reingresar stock físico (return)
      const updated = await sql`
        UPDATE products
        SET stock = COALESCE(stock, 0) + ${qty},
            updated_at = NOW()
        WHERE id = ${productId}
        RETURNING COALESCE(stock, 0)::int AS stock, COALESCE(reserved_stock, 0)::int AS reserved`;
      if (updated.length > 0) {
        await sql`
          INSERT INTO stock_movements (product_id, order_id, movement_type, quantity_delta, stock_after, reserved_after, reason, actor)
          VALUES (${productId}, ${orderId}, 'return', ${qty}, ${updated[0].stock}, ${updated[0].reserved}, ${reason}, ${actor})`;
      }
    } else {
      // Solo estaba en reserva -> liberar reserva
      const updated = await sql`
        UPDATE products
        SET reserved_stock = GREATEST(0, COALESCE(reserved_stock, 0) - ${qty}),
            updated_at = NOW()
        WHERE id = ${productId}
        RETURNING COALESCE(stock, 0)::int AS stock, COALESCE(reserved_stock, 0)::int AS reserved`;
      if (updated.length > 0) {
        await sql`
          INSERT INTO stock_movements (product_id, order_id, movement_type, quantity_delta, stock_after, reserved_after, reason, actor)
          VALUES (${productId}, ${orderId}, 'release', 0, ${updated[0].stock}, ${updated[0].reserved}, ${reason}, ${actor})`;
      }
    }
  }

  return true;
}

const ORDER_SELECT_FIELDS = `
  id,
  COALESCE(order_number, 'SMQ-' || LPAD(id::text, 6, '0')) AS "orderNumber",
  customer_name AS "customerName",
  customer_doc AS "customerDoc",
  customer_phone AS "customerPhone",
  customer_email AS "customerEmail",
  COALESCE(invoice_type, 'boleta') AS "invoiceType",
  delivery_type AS "deliveryType",
  city,
  address,
  payment_method AS "paymentMethod",
  COALESCE(payment_gateway, 'manual_whatsapp') AS "paymentGateway",
  COALESCE(payment_status, 'unpaid') AS "paymentStatus",
  mp_preference_id AS "mpPreferenceId",
  mp_payment_id AS "mpPaymentId",
  COALESCE(subtotal, total)::float AS subtotal,
  COALESCE(shipping_cost, 0)::float AS "shippingCost",
  COALESCE(discount, 0)::float AS discount,
  total::float AS total,
  COALESCE(currency, 'PEN') AS currency,
  items,
  status,
  shipping_carrier AS "shippingCarrier",
  tracking_code AS "trackingCode",
  admin_notes AS "adminNotes",
  COALESCE(stock_committed, false) AS "stockCommitted",
  COALESCE(stock_released, false) AS "stockReleased",
  stock_reserved_until AS "stockReservedUntil",
  paid_at AS "paidAt",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export async function getAllOrders(): Promise<OrderRecord[]> {
  const sql = requireDb();
  await releaseExpiredReservations();
  const rows = await sql.query(
    `SELECT ${ORDER_SELECT_FIELDS} FROM orders ORDER BY created_at DESC LIMIT 500`
  );
  return rows as unknown as OrderRecord[];
}

export async function getOrderById(orderId: number): Promise<OrderRecord | null> {
  const sql = requireDb();
  const rows = await sql.query(
    `SELECT ${ORDER_SELECT_FIELDS} FROM orders WHERE id = $1 LIMIT 1`,
    [orderId]
  );
  if (rows.length === 0) return null;
  const order = rows[0] as unknown as OrderRecord;

  const payments = await sql`
    SELECT id, order_id AS "orderId", provider, external_payment_id AS "externalPaymentId",
      external_preference_id AS "externalPreferenceId", status, status_detail AS "statusDetail",
      payment_type AS "paymentType", payment_method_id AS "paymentMethodId",
      COALESCE(installments, 1)::int AS installments, amount::float AS amount,
      COALESCE(fee_amount, 0)::float AS "feeAmount", COALESCE(net_amount, 0)::float AS "netAmount",
      COALESCE(currency, 'PEN') AS currency, payer_email AS "payerEmail",
      payer_doc_type AS "payerDocType", payer_doc_number AS "payerDocNumber",
      approved_at AS "approvedAt", created_at AS "createdAt"
    FROM payments WHERE order_id = ${orderId} ORDER BY created_at DESC`;

  const events = await sql`
    SELECT id, order_id AS "orderId", event_type AS "eventType",
      from_state AS "fromState", to_state AS "toState",
      description, actor, metadata, created_at AS "createdAt"
    FROM order_events WHERE order_id = ${orderId} ORDER BY created_at DESC`;

  order.payments = payments as unknown as PaymentRecord[];
  order.events = events as unknown as OrderEventRecord[];
  return order;
}

export async function getOrderForPublicTracking(orderQuery: string, docNumber: string): Promise<OrderRecord | null> {
  const sql = requireDb();
  const cleanQuery = orderQuery.trim().toUpperCase();
  const numericId = Number(cleanQuery.replace(/\D/g, ''));
  const cleanDoc = docNumber.trim();

  const rows = await sql.query(
    `SELECT ${ORDER_SELECT_FIELDS} FROM orders
     WHERE customer_doc = $1 AND (UPPER(order_number) = $2 OR id = $3)
     LIMIT 1`,
    [cleanDoc, cleanQuery, Number.isFinite(numericId) && numericId > 0 ? numericId : -1]
  );
  if (rows.length === 0) return null;
  const order = rows[0] as unknown as OrderRecord;

  const events = await sql`
    SELECT id, order_id AS "orderId", event_type AS "eventType",
      from_state AS "fromState", to_state AS "toState",
      description, actor, created_at AS "createdAt"
    FROM order_events WHERE order_id = ${order.id} ORDER BY created_at DESC`;

  order.events = events as unknown as OrderEventRecord[];
  return order;
}

export async function saveOrderMpPreference(orderId: number, preferenceId: string): Promise<void> {
  const sql = requireDb();
  await sql`
    UPDATE orders
    SET mp_preference_id = ${preferenceId},
        payment_gateway = 'mercadopago',
        updated_at = NOW()
    WHERE id = ${orderId}`;
}

export interface UpsertPaymentInput {
  orderId: number;
  provider: 'mercadopago' | 'manual';
  externalPaymentId: string;
  externalPreferenceId?: string | null;
  status: string;
  statusDetail?: string | null;
  paymentType?: string | null;
  paymentMethodId?: string | null;
  installments?: number;
  amount: number;
  feeAmount?: number;
  netAmount?: number;
  currency?: string;
  payerEmail?: string | null;
  payerDocType?: string | null;
  payerDocNumber?: string | null;
  rawResponse?: Record<string, unknown> | null;
  approvedAt?: string | null;
  actor?: string;
}

/**
 * Registra o actualiza un pago (por ejemplo desde un webhook de Mercado Pago o verificación en vivo)
 * y sincroniza automáticamente el estado financiero, logístico y de stock de la orden.
 */
export async function recordOrderPayment(input: UpsertPaymentInput): Promise<{
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}> {
  const sql = requireDb();

  await sql`
    INSERT INTO payments (
      order_id, provider, external_payment_id, external_preference_id,
      status, status_detail, payment_type, payment_method_id, installments,
      amount, fee_amount, net_amount, currency,
      payer_email, payer_doc_type, payer_doc_number, raw_response, approved_at, updated_at
    )
    VALUES (
      ${input.orderId}, ${input.provider}, ${input.externalPaymentId}, ${input.externalPreferenceId ?? null},
      ${input.status}, ${input.statusDetail ?? null}, ${input.paymentType ?? null}, ${input.paymentMethodId ?? null}, ${input.installments ?? 1},
      ${input.amount}, ${input.feeAmount ?? 0}, ${input.netAmount ?? input.amount}, ${input.currency ?? 'PEN'},
      ${input.payerEmail ?? null}, ${input.payerDocType ?? null}, ${input.payerDocNumber ?? null},
      ${input.rawResponse ? JSON.stringify(input.rawResponse) : null}, ${input.approvedAt ?? null}, NOW()
    )
    ON CONFLICT (external_payment_id) DO UPDATE SET
      status = EXCLUDED.status,
      status_detail = EXCLUDED.status_detail,
      payment_type = COALESCE(EXCLUDED.payment_type, payments.payment_type),
      payment_method_id = COALESCE(EXCLUDED.payment_method_id, payments.payment_method_id),
      fee_amount = EXCLUDED.fee_amount,
      net_amount = EXCLUDED.net_amount,
      raw_response = COALESCE(EXCLUDED.raw_response, payments.raw_response),
      approved_at = COALESCE(EXCLUDED.approved_at, payments.approved_at),
      updated_at = NOW()`;

  const orderRows = await sql`
    SELECT id, order_number AS "orderNumber", status, payment_status AS "paymentStatus", total::float AS total
    FROM orders WHERE id = ${input.orderId} LIMIT 1`;
  if (orderRows.length === 0) {
    throw new Error(`Orden #${input.orderId} no encontrada`);
  }
  const currentOrder = orderRows[0] as {
    id: number;
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    total: number;
  };

  let nextPaymentStatus: PaymentStatus = currentOrder.paymentStatus;
  let nextOrderStatus: OrderStatus = currentOrder.status;

  if (input.status === 'approved') {
    nextPaymentStatus = 'paid';
    if (currentOrder.status === 'pendiente_pago' || currentOrder.status === 'pendiente_whatsapp') {
      nextOrderStatus = 'confirmado';
    }
    await commitOrderStock(
      input.orderId,
      `Pago aprobado (${input.provider} #${input.externalPaymentId})`,
      input.actor ?? 'mercadopago_webhook'
    );
  } else if (input.status === 'in_process' || input.status === 'pending' || input.status === 'authorized') {
    if (currentOrder.paymentStatus !== 'paid') {
      nextPaymentStatus = 'pending';
    }
  } else if (input.status === 'rejected' || input.status === 'cancelled') {
    if (currentOrder.paymentStatus !== 'paid') {
      nextPaymentStatus = 'failed';
    }
  } else if (input.status === 'refunded') {
    nextPaymentStatus = 'refunded';
    nextOrderStatus = 'cancelado';
    await releaseOrderStock(
      input.orderId,
      `Reembolso procesado (${input.provider} #${input.externalPaymentId})`,
      input.actor ?? 'mercadopago_webhook'
    );
  } else if (input.status === 'charged_back') {
    nextPaymentStatus = 'charged_back';
  }

  await sql`
    UPDATE orders
    SET payment_status = ${nextPaymentStatus},
        status = ${nextOrderStatus},
        mp_payment_id = ${input.externalPaymentId},
        paid_at = CASE WHEN ${nextPaymentStatus} = 'paid' AND paid_at IS NULL THEN NOW() ELSE paid_at END,
        updated_at = NOW()
    WHERE id = ${input.orderId}`;

  if (nextPaymentStatus !== currentOrder.paymentStatus || nextOrderStatus !== currentOrder.status) {
    await recordOrderEvent({
      orderId: input.orderId,
      eventType: 'payment_update',
      fromState: `${currentOrder.status}/${currentOrder.paymentStatus}`,
      toState: `${nextOrderStatus}/${nextPaymentStatus}`,
      description: `Pago #${input.externalPaymentId} (${input.paymentMethodId || input.provider}): estado ${input.status} (${input.statusDetail || 'OK'}) por S/ ${input.amount}`,
      actor: input.actor ?? 'mercadopago',
    });
  }

  return { orderStatus: nextOrderStatus, paymentStatus: nextPaymentStatus };
}

export interface UpdateOrderAdminInput {
  orderId: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingCarrier?: string;
  trackingCode?: string;
  adminNotes?: string;
  actor: string;
}

export async function updateOrderAdmin(input: UpdateOrderAdminInput): Promise<boolean> {
  const sql = requireDb();
  const existing = await sql`
    SELECT id, order_number AS "orderNumber", status, payment_status AS "paymentStatus",
      shipping_carrier AS "shippingCarrier", tracking_code AS "trackingCode", total::float AS total
    FROM orders WHERE id = ${input.orderId} LIMIT 1`;

  if (existing.length === 0) return false;
  const current = existing[0] as {
    id: number;
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    shippingCarrier: string | null;
    trackingCode: string | null;
    total: number;
  };

  const nextStatus = input.status ?? current.status;
  let nextPaymentStatus = input.paymentStatus ?? current.paymentStatus;

  // Si pasa a confirmado/en_preparacion/en_despacho/entregado y no estaba pagado, confirmar stock
  if (
    ['confirmado', 'en_preparacion', 'en_despacho', 'entregado'].includes(nextStatus) &&
    current.paymentStatus === 'unpaid' &&
    !input.paymentStatus
  ) {
    nextPaymentStatus = 'paid';
  }

  if (nextPaymentStatus === 'paid' || ['confirmado', 'en_preparacion', 'en_despacho', 'entregado'].includes(nextStatus)) {
    await commitOrderStock(input.orderId, `Confirmación de orden por ${input.actor}`, input.actor);
  }

  if (nextStatus === 'cancelado') {
    await releaseOrderStock(input.orderId, `Orden cancelada por ${input.actor}`, input.actor);
  }

  await sql`
    UPDATE orders
    SET status = ${nextStatus},
        payment_status = ${nextPaymentStatus},
        shipping_carrier = COALESCE(${input.shippingCarrier ?? null}, shipping_carrier),
        tracking_code = COALESCE(${input.trackingCode ?? null}, tracking_code),
        admin_notes = COALESCE(${input.adminNotes ?? null}, admin_notes),
        paid_at = CASE WHEN ${nextPaymentStatus} = 'paid' AND paid_at IS NULL THEN NOW() ELSE paid_at END,
        updated_at = NOW()
    WHERE id = ${input.orderId}`;

  if (nextStatus !== current.status || nextPaymentStatus !== current.paymentStatus) {
    await recordOrderEvent({
      orderId: input.orderId,
      eventType: 'status_change',
      fromState: `${current.status} (${current.paymentStatus})`,
      toState: `${nextStatus} (${nextPaymentStatus})`,
      description: `Actualizado por administrador (${input.actor})`,
      actor: input.actor,
    });
  }

  if (input.trackingCode && input.trackingCode !== current.trackingCode) {
    await recordOrderEvent({
      orderId: input.orderId,
      eventType: 'tracking_updated',
      fromState: current.trackingCode,
      toState: input.trackingCode,
      description: `Despacho asignado: ${input.shippingCarrier || current.shippingCarrier || 'Agencia'} - Guía #${input.trackingCode}`,
      actor: input.actor,
    });
  }

  return true;
}

export async function updateOrderStatus(orderId: number, status: OrderStatus, actor = 'admin'): Promise<boolean> {
  return updateOrderAdmin({ orderId, status, actor });
}

// ---------------------------------------------------------------------------
// Registro de Webhooks
// ---------------------------------------------------------------------------

export interface WebhookEventRecord {
  id: number;
  provider: string;
  eventId: string | null;
  topic: string;
  resourceId: string;
  signatureValid: boolean;
  status: string;
  attempts: number;
  errorMessage: string | null;
  payload?: Record<string, unknown> | null;
  processedAt: string | null;
  createdAt: string;
}

export async function logWebhookEvent(params: {
  provider?: string;
  eventId?: string | null;
  topic: string;
  resourceId: string;
  signatureValid: boolean;
  status: 'received' | 'processed' | 'failed' | 'ignored';
  errorMessage?: string | null;
  payload?: unknown;
}): Promise<number> {
  const sql = requireDb();
  const rows = await sql`
    INSERT INTO webhook_events (provider, event_id, topic, resource_id, signature_valid, status, error_message, payload, processed_at)
    VALUES (
      ${params.provider ?? 'mercadopago'},
      ${params.eventId ?? null},
      ${params.topic},
      ${params.resourceId},
      ${params.signatureValid},
      ${params.status},
      ${params.errorMessage ?? null},
      ${params.payload ? JSON.stringify(params.payload) : null},
      CASE WHEN ${params.status} IN ('processed', 'ignored') THEN NOW() ELSE NULL END
    )
    RETURNING id`;
  return Number(rows[0].id);
}

export async function updateWebhookEventStatus(
  id: number,
  status: 'processed' | 'failed' | 'ignored',
  errorMessage?: string | null
) {
  const sql = getDb();
  if (!sql) return;
  await sql`
    UPDATE webhook_events
    SET status = ${status},
        error_message = ${errorMessage ?? null},
        processed_at = NOW()
    WHERE id = ${id}`;
}

export async function getRecentWebhookEvents(limit = 50): Promise<WebhookEventRecord[]> {
  const sql = requireDb();
  const rows = await sql`
    SELECT id::int AS id, provider, event_id AS "eventId", topic, resource_id AS "resourceId",
      signature_valid AS "signatureValid", status, attempts, error_message AS "errorMessage",
      processed_at AS "processedAt", created_at AS "createdAt"
    FROM webhook_events
    ORDER BY created_at DESC
    LIMIT ${limit}`;
  return rows as unknown as WebhookEventRecord[];
}

// ---------------------------------------------------------------------------
// Leads B2B y mensajes de contacto
// ---------------------------------------------------------------------------

export interface NewLead {
  salonName: string;
  docNumber: string;
  contactName: string;
  phone: string;
  city: string;
  interest: string;
  notes?: string;
}

export async function createLead(l: NewLead) {
  const sql = requireDb();
  await sql`
    INSERT INTO b2b_leads (salon_name, doc_number, contact_name, phone, city, interest, notes)
    VALUES (${l.salonName}, ${l.docNumber}, ${l.contactName}, ${l.phone}, ${l.city}, ${l.interest}, ${l.notes || null})`;
}

export interface NewContactMessage {
  name: string;
  reason: string;
  email?: string;
  phone?: string;
  message: string;
}

export async function createContactMessage(m: NewContactMessage) {
  const sql = requireDb();
  await sql`
    INSERT INTO contact_messages (name, reason, email, phone, message)
    VALUES (${m.name}, ${m.reason}, ${m.email || null}, ${m.phone || null}, ${m.message})`;
}

export async function getAllLeads() {
  const sql = requireDb();
  return await sql`
    SELECT id, salon_name AS "salonName", doc_number AS "docNumber", contact_name AS "contactName",
      phone, city, interest, notes, created_at AS "createdAt"
    FROM b2b_leads ORDER BY created_at DESC LIMIT 200`;
}

// ---------------------------------------------------------------------------
// Rate limiting respaldado en BD (funciona entre instancias serverless)
// ---------------------------------------------------------------------------

/**
 * Registra un evento y devuelve true si NO se superó el límite.
 * Si no hay BD, no limita (entorno local).
 */
export async function checkRateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const sql = getDb();
  if (!sql) return true;
  const rows = await sql`
    SELECT count(*)::int AS count FROM rate_events
    WHERE key = ${key} AND created_at > now() - (${windowSeconds} || ' seconds')::interval`;
  if ((rows[0].count as number) >= max) return false;
  await sql`INSERT INTO rate_events (key) VALUES (${key})`;
  // Limpieza oportunista de eventos viejos (~1% de las llamadas)
  if (Math.random() < 0.01) await sql`DELETE FROM rate_events WHERE created_at < now() - interval '1 day'`;
  return true;
}
