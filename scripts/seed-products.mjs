// Carga o sincroniza el catálogo inicial en la tabla products.
// Uso: npm run db:seed (o `node scripts/seed-products.mjs --sync` para actualizar nombres, fotos y stock)
import { neon } from '@neondatabase/serverless';
import { loadEnv, getDatabaseUrl } from './env.mjs';
import { INITIAL_PRODUCTS } from '../src/lib/products-data.ts';

loadEnv();
const sql = neon(getDatabaseUrl());
const syncMode = process.argv.includes('--sync');

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
