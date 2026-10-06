// Carga el catálogo inicial si la tabla products está vacía. Uso: npm run db:seed
// Requiere Node 22+ (importa el .ts directamente con type stripping).
import { neon } from '@neondatabase/serverless';
import { loadEnv, getDatabaseUrl } from './env.mjs';
import { INITIAL_PRODUCTS } from '../src/lib/products-data.ts';

loadEnv();
const sql = neon(getDatabaseUrl());

const [{ count }] = await sql`SELECT count(*)::int AS count FROM products`;
if (count > 0) {
  console.log(`products ya tiene ${count} filas. Nada que hacer.`);
  process.exit(0);
}

for (const p of INITIAL_PRODUCTS) {
  await sql`
    INSERT INTO products (id, slug, category, name, badge, punchline, temp, voltage, options, prices, images, specs, short_desc, long_desc, is_featured)
    VALUES (${p.id}, ${p.slug}, ${p.category}, ${p.name}, ${p.badge || null}, ${p.punchline}, ${p.temp},
      ${JSON.stringify(p.voltage)}, ${JSON.stringify(p.options || [])}, ${JSON.stringify(p.prices)},
      ${JSON.stringify(p.images)}, ${JSON.stringify(p.specs)}, ${p.shortDesc}, ${p.longDesc}, ${p.isFeatured || false})
    ON CONFLICT (slug) DO NOTHING`;
}
console.log(`Insertados ${INITIAL_PRODUCTS.length} productos.`);
