// Carga o sincroniza el catálogo inicial y configuración de pasarela en la base de datos.
// Uso: npm run db:seed (o `node scripts/seed-products.mjs --sync` para actualizar nombres, fotos, stock y pasarela)
import { neon } from '@neondatabase/serverless';
import { loadEnv, getDatabaseUrl } from './env.mjs';
import { INITIAL_PRODUCTS } from '../src/lib/products-data.ts';

loadEnv();
const sql = neon(getDatabaseUrl());
const syncMode = process.argv.includes('--sync');

if (syncMode && process.env.MERCADOPAGO_ACCESS_TOKEN) {
  await sql`
    INSERT INTO gateway_config (provider, access_token, public_key, webhook_secret, site_url, updated_at)
    VALUES (
      'mercadopago',
      ${process.env.MERCADOPAGO_ACCESS_TOKEN},
      ${process.env.MERCADOPAGO_PUBLIC_KEY || null},
      ${process.env.MERCADOPAGO_WEBHOOK_SECRET || null},
      ${process.env.NEXT_PUBLIC_SITE_URL || 'https://sumaq-tau.vercel.app'},
      NOW()
    )
    ON CONFLICT (provider) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      public_key = EXCLUDED.public_key,
      webhook_secret = EXCLUDED.webhook_secret,
      site_url = EXCLUDED.site_url,
      updated_at = NOW()`;
  console.log('Credenciales de Mercado Pago sincronizadas en gateway_config.');
}

const [{ count }] = await sql`SELECT count(*)::int AS count FROM products`;
if (count > 0 && !syncMode) {
  console.log(`products ya tiene ${count} filas. Usa --sync para sincronizar catálogo.`);
  process.exit(0);
}

if (syncMode) {
  await sql`DELETE FROM products WHERE slug = 'prueba_a'`;
}

for (const p of INITIAL_PRODUCTS) {
  const sku = p.sku || `LZ-${p.id.toUpperCase()}`;
  const stock = typeof p.stock === 'number' ? p.stock : 25;
  await sql`
    INSERT INTO products (id, slug, category, name, badge, punchline, temp, voltage, options, prices, images, specs, short_desc, long_desc, is_featured, stock, reserved_stock, low_stock_threshold, sku, track_inventory)
    VALUES (${p.id}, ${p.slug}, ${p.category}, ${p.name}, ${p.badge || null}, ${p.punchline}, ${p.temp},
      ${JSON.stringify(p.voltage)}, ${JSON.stringify(p.options || [])}, ${JSON.stringify(p.prices)},
      ${JSON.stringify(p.images)}, ${JSON.stringify(p.specs)}, ${p.shortDesc}, ${p.longDesc}, ${p.isFeatured || false},
      ${stock}, 0, ${p.lowStockThreshold ?? 3}, ${sku}, ${p.trackInventory ?? true})
    ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug,
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
      is_featured = EXCLUDED.is_featured,
      stock = EXCLUDED.stock,
      sku = EXCLUDED.sku,
      updated_at = NOW()`;
}
console.log(`Sincronizados ${INITIAL_PRODUCTS.length} productos exitosamente.`);
