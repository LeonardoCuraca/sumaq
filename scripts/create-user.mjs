// Crea o actualiza un usuario. Uso:
//   npm run user:create -- correo@dominio.pe "Nombre" admin|salon_partner
// La contraseña se lee de la variable USER_PASSWORD (no se pasa por argumentos para que no quede en el historial).
import { neon } from '@neondatabase/serverless';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import { loadEnv, getDatabaseUrl } from './env.mjs';

loadEnv();
const [email, name, role = 'salon_partner'] = process.argv.slice(2);
const password = process.env.USER_PASSWORD;

if (!email || !name || !password) {
  console.error('Uso: USER_PASSWORD=*** npm run user:create -- correo "Nombre" [admin|salon_partner]');
  process.exit(1);
}
if (!['admin', 'salon_partner'].includes(role)) {
  console.error('Rol inválido. Usa admin o salon_partner.');
  process.exit(1);
}
if (password.length < 10) {
  console.error('La contraseña debe tener al menos 10 caracteres.');
  process.exit(1);
}

const scrypt = promisify(scryptCb);
const salt = randomBytes(16);
const hash = await scrypt(password, salt, 64);
const passwordHash = `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;

const sql = neon(getDatabaseUrl());
await sql`
  INSERT INTO users (email, name, password_hash, role)
  VALUES (${email.trim().toLowerCase()}, ${name}, ${passwordHash}, ${role})
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, active = TRUE`;
console.log(`Usuario ${email} (${role}) listo.`);
