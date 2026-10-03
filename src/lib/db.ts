import { neon } from '@neondatabase/serverless';
import { INITIAL_PRODUCTS, Product } from './products-data';

// Neon Serverless PostgreSQL connection helper

export function getDb() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.STORAGE_URL ||
    process.env.NEON_DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }
  return neon(databaseUrl);
}

/**
 * Initializes the required PostgreSQL schema in Neon DB if not present.
 */
export async function initializeNeonDatabase() {
  const sql = getDb();
  if (!sql) {
    console.warn("DATABASE_URL not defined. Skipping database initialization.");
    return false;
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        slug VARCHAR(150) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        badge VARCHAR(100),
        punchline TEXT NOT NULL,
        temp VARCHAR(50) NOT NULL,
        voltage JSONB NOT NULL,
        options JSONB,
        prices JSONB NOT NULL,
        images JSONB NOT NULL,
        specs JSONB NOT NULL,
        short_desc TEXT NOT NULL,
        long_desc TEXT NOT NULL,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_doc VARCHAR(50) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        delivery_type VARCHAR(50) NOT NULL,
        city VARCHAR(100) NOT NULL,
        address TEXT,
        payment_method VARCHAR(50) NOT NULL,
        total NUMERIC(10, 2) NOT NULL,
        items JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pendiente_whatsapp',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS b2b_leads (
        id SERIAL PRIMARY KEY,
        salon_name VARCHAR(255) NOT NULL,
        doc_number VARCHAR(50) NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        city VARCHAR(100) NOT NULL,
        interest VARCHAR(100) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_logins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'salon',
        ip VARCHAR(100),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Seed products if table is empty
    const existing = await sql`SELECT count(*) as count FROM products`;
    if (Number(existing[0]?.count || 0) === 0) {
      for (const p of INITIAL_PRODUCTS) {
        await sql`
          INSERT INTO products (
            id, slug, category, name, badge, punchline, temp, voltage, options, prices, images, specs, short_desc, long_desc, is_featured
          ) VALUES (
            ${p.id}, ${p.slug}, ${p.category}, ${p.name}, ${p.badge || null}, ${p.punchline}, ${p.temp},
            ${JSON.stringify(p.voltage)}, ${JSON.stringify(p.options || [])}, ${JSON.stringify(p.prices)},
            ${JSON.stringify(p.images)}, ${JSON.stringify(p.specs)}, ${p.shortDesc}, ${p.longDesc}, ${p.isFeatured || false}
          )
          ON CONFLICT (slug) DO NOTHING;
        `;
      }
    }

    return true;
  } catch (error) {
    console.error("Error initializing Neon database:", error);
    return false;
  }
}

/**
 * Fetch all products from Neon or fallback to static catalog
 */
export async function getAllProducts(): Promise<Product[]> {
  const sql = getDb();
  if (!sql) {
    return INITIAL_PRODUCTS;
  }

  try {
    const rows = await sql`
      SELECT id, slug, category, name, badge, punchline, temp, voltage, options, prices, images, specs, short_desc as "shortDesc", long_desc as "longDesc", is_featured as "isFeatured"
      FROM products
      ORDER BY id ASC;
    `;

    if (!rows || rows.length === 0) {
      return INITIAL_PRODUCTS;
    }

    return rows as unknown as Product[];
  } catch {
    return INITIAL_PRODUCTS;
  }
}

/**
 * Fetch product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const sql = getDb();
  if (!sql) {
    return INITIAL_PRODUCTS.find(p => p.slug === slug) || null;
  }

  try {
    const rows = await sql`
      SELECT id, slug, category, name, badge, punchline, temp, voltage, options, prices, images, specs, short_desc as "shortDesc", long_desc as "longDesc", is_featured as "isFeatured"
      FROM products
      WHERE slug = ${slug}
      LIMIT 1;
    `;
    if (rows.length === 0) {
      return INITIAL_PRODUCTS.find(p => p.slug === slug) || null;
    }
    return rows[0] as unknown as Product;
  } catch {
    return INITIAL_PRODUCTS.find(p => p.slug === slug) || null;
  }
}

/**
 * Upsert (Create or Update) Product in Neon DB
 */
export async function upsertProduct(p: Product): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`
      INSERT INTO products (
        id, slug, category, name, badge, punchline, temp, voltage, options, prices, images, specs, short_desc, long_desc, is_featured
      ) VALUES (
        ${p.id}, ${p.slug}, ${p.category}, ${p.name}, ${p.badge || null}, ${p.punchline}, ${p.temp || 'N/A'},
        ${JSON.stringify(p.voltage || ['220V'])}, ${JSON.stringify(p.options || [])}, ${JSON.stringify(p.prices)},
        ${JSON.stringify(p.images || [])}, ${JSON.stringify(p.specs || {})}, ${p.shortDesc || ''}, ${p.longDesc || ''}, ${p.isFeatured || false}
      )
      ON CONFLICT (slug) DO UPDATE SET
        category = EXCLUDED.category,
        name = EXCLUDED.name,
        badge = EXCLUDED.badge,
        punchline = EXCLUDED.punchline,
        temp = EXCLUDED.temp,
        voltage = EXCLUDED.voltage,
        options = EXCLUDED.options,
        prices = EXCLUDED.prices,
        images = EXCLUDED.images,
        specs = EXCLUDED.specs,
        short_desc = EXCLUDED.short_desc,
        long_desc = EXCLUDED.long_desc,
        is_featured = EXCLUDED.is_featured;
    `;
    return true;
  } catch (err) {
    console.error('Error upserting product:', err);
    return false;
  }
}

/**
 * Delete a product by slug
 */
export async function deleteProductBySlug(slug: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`DELETE FROM products WHERE slug = ${slug}`;
    return true;
  } catch (err) {
    console.error('Error deleting product:', err);
    return false;
  }
}

/**
 * Record a user login in Neon DB
 */
export async function recordUserLogin(email: string, role: string = 'salon') {
  const sql = getDb();
  if (!sql) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_logins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'salon',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      INSERT INTO user_logins (email, role)
      VALUES (${email}, ${role});
    `;
  } catch (err) {
    console.warn('Could not record user login:', err);
  }
}

/**
 * Get all user login history
 */
export async function getAllUserLogins() {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, email, role, created_at as "createdAt"
      FROM user_logins
      ORDER BY created_at DESC
      LIMIT 100;
    `;
    return rows;
  } catch {
    return [];
  }
}

/**
 * Order record interface
 */
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
  items: Array<{ name: string; qty: number; voltage?: string; price: number }>;
  status: string;
  createdAt: string;
}

/**
 * Get all orders from Neon DB
 */
export async function getAllOrders(): Promise<OrderRecord[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT 
        id, 
        customer_name as "customerName", 
        customer_doc as "customerDoc", 
        customer_phone as "customerPhone", 
        delivery_type as "deliveryType", 
        city, 
        address, 
        payment_method as "paymentMethod", 
        total, 
        items, 
        status, 
        created_at as "createdAt"
      FROM orders
      ORDER BY created_at DESC;
    `;
    return rows as unknown as OrderRecord[];
  } catch {
    return [];
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: number, status: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`
      UPDATE orders 
      SET status = ${status}
      WHERE id = ${orderId};
    `;
    return true;
  } catch (err) {
    console.error('Error updating order status:', err);
    return false;
  }
}
