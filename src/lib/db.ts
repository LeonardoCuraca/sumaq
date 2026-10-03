import { neon, neonConfig } from '@neondatabase/serverless';
import { INITIAL_PRODUCTS, Product } from './products-data';

// Neon Serverless PostgreSQL connection helper

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
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
