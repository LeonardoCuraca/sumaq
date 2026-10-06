// Crea o actualiza un usuario. Uso:
//   npm run user:create -- correo@dominio.pe "Nombre" admin|salon_partner
// La contraseña se lee de la variable USER_PASSWORD (no se pasa por argumentos para que no quede en el historial).
import { neon } from '@neondatabase/serverless';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import { loadEnv, getDatabaseUrl } from './env.mjs';

loadEnv();
const args = process.argv.slice(2);

let email = '';
let name = '';
let role = 'salon_partner';
let password = process.env.USER_PASSWORD || '';

if (args.length >= 4 && ['admin', 'salon_partner'].includes(args[2])) {
  // Variante: email password role name
  [email, password, role, name] = args;
} else if (args.length >= 3 && ['admin', 'salon_partner'].includes(args[2])) {
  // Variante: email name role [password]
  [email, name, role] = args;
  if (args[3]) password = args[3];
} else if (args.length >= 2) {
  [email, name] = args;
  if (args[2] && ['admin', 'salon_partner'].includes(args[2])) {
    role = args[2];
  } else if (args[2]) {
    password = args[2];
  }
  if (args[3]) password = args[3];
}

if (!email || !name || !password) {
  console.error('Uso:');
  console.error('  node scripts/create-user.mjs correo "password123" admin "Nombre"');
  console.error('O vía variable de entorno:');
  console.error('  $env:USER_PASSWORD="..."; npm run user:create -- correo "Nombre" admin');
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
