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
  short_desc AS "shortDesc", long_desc AS "longDesc", is_featured AS "isFeatured"`;

/**
 * Catálogo. Solo usa el catálogo estático cuando NO hay base de datos configurada (desarrollo local).
 * Si hay BD y falla, el error se propaga: nunca mostramos precios potencialmente obsoletos en silencio.
 */
export async function getAllProducts(): Promise<Product[]> {
  const sql = getDb();
  if (!sql) return INITIAL_PRODUCTS;

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

  const rows = await sql.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ANY($1)`, [ids]);
  return rows as unknown as Product[];
}

/** Crea un producto nuevo. Devuelve false si el slug o id ya existen. */
export async function createProduct(p: Product): Promise<boolean> {
  const sql = requireDb();
  const rows = await sql`
    INSERT INTO products (id, slug, category, name, badge, punchline, temp, voltage, options, prices, images, specs, short_desc, long_desc, is_featured)
    VALUES (${p.id}, ${p.slug}, ${p.category}, ${p.name}, ${p.badge || null}, ${p.punchline}, ${p.temp},
      ${JSON.stringify(p.voltage)}, ${JSON.stringify(p.options || [])}, ${JSON.stringify(p.prices)},
      ${JSON.stringify(p.images)}, ${JSON.stringify(p.specs)}, ${p.shortDesc}, ${p.longDesc}, ${p.isFeatured || false})
    ON CONFLICT DO NOTHING
    RETURNING id`;
  return rows.length > 0;
}

/** Actualiza un producto existente por id. Devuelve false si no existe. */
export async function updateProduct(p: Product): Promise<boolean> {
  const sql = requireDb();
  const rows = await sql`
    UPDATE products SET
      slug = ${p.slug}, category = ${p.category}, name = ${p.name}, badge = ${p.badge || null},
      punchline = ${p.punchline}, temp = ${p.temp}, voltage = ${JSON.stringify(p.voltage)},
      options = ${JSON.stringify(p.options || [])}, prices = ${JSON.stringify(p.prices)},
      images = ${JSON.stringify(p.images)}, specs = ${JSON.stringify(p.specs)},
      short_desc = ${p.shortDesc}, long_desc = ${p.longDesc}, is_featured = ${p.isFeatured || false}
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
// Pedidos
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = [
  'pendiente_whatsapp',
  'confirmado',
  'en_despacho',
  'entregado',
  'cancelado',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  voltage?: string;
  price: number;
}

export interface OrderRecord {
  id: number;
  customerName: string;
  customerDoc: string;
  customerPhone: string;
  deliveryType: string;
  city: string;
  address: string;
  paymentMethod: string;
  total: number;
  items: OrderItem[];
  status: string;
  createdAt: string;
}

export interface NewOrder {
  customerName: string;
  customerDoc: string;
  customerPhone: string;
  deliveryType: string;
  city: string;
  address: string;
  paymentMethod: string;
  total: number;
  items: OrderItem[];
  userId?: number | null;
}

export async function createOrder(o: NewOrder): Promise<number> {
  const sql = requireDb();
  const rows = await sql`
    INSERT INTO orders (customer_name, customer_doc, customer_phone, delivery_type, city, address, payment_method, total, items, user_id)
    VALUES (${o.customerName}, ${o.customerDoc}, ${o.customerPhone}, ${o.deliveryType}, ${o.city}, ${o.address},
      ${o.paymentMethod}, ${o.total}, ${JSON.stringify(o.items)}, ${o.userId ?? null})
    RETURNING id`;
  return rows[0].id as number;
}

export async function getAllOrders(): Promise<OrderRecord[]> {
  const sql = requireDb();
  const rows = await sql`
    SELECT id, customer_name AS "customerName", customer_doc AS "customerDoc", customer_phone AS "customerPhone",
      delivery_type AS "deliveryType", city, address, payment_method AS "paymentMethod",
      total::float AS total, items, status, created_at AS "createdAt"
    FROM orders ORDER BY created_at DESC LIMIT 500`;
  return rows as unknown as OrderRecord[];
}

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<boolean> {
  const sql = requireDb();
  const rows = await sql`UPDATE orders SET status = ${status} WHERE id = ${orderId} RETURNING id`;
  return rows.length > 0;
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
