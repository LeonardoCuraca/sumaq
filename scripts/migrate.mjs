// Aplica las migraciones SQL de /migrations en orden. Uso: npm run db:migrate
import { readdirSync, readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { loadEnv, getDatabaseUrl } from './env.mjs';

loadEnv();
const sql = neon(getDatabaseUrl());

await sql.query(
  'CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)'
);
const applied = new Set((await sql.query('SELECT name FROM schema_migrations')).map((r) => r.name));

const files = readdirSync('migrations').filter((f) => f.endsWith('.sql')).sort();
for (const file of files) {
  if (applied.has(file)) continue;
  console.log(`Aplicando ${file}...`);
  const statements = readFileSync(`migrations/${file}`, 'utf8')
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) await sql.query(stmt);
  await sql.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
}
console.log('Migraciones al día.');
