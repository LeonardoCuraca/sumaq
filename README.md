# SUMAQ Importaciones • E-Commerce & B2B Portal

Plataforma oficial de comercio electrónico y distribución de herramientas térmicas profesionales **Lizze Brasil** para peluquerías, barberías y salones en Perú.

---

## 🛠 Stack Tecnológico

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + TypeScript.
- **Base de Datos**: [Neon Serverless PostgreSQL](https://neon.tech/) con `@neondatabase/serverless` y migraciones versionadas en `/migrations`.
- **Almacenamiento de Archivos**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) con validación por magic-bytes y tamaños máximos.
- **Autenticación**: [Auth.js (NextAuth v5)](https://authjs.dev/) con credenciales seguras hasheadas con `scrypt` y rate limiting serverless en Neon DB.
- **Seguridad perimetral**: Capa `src/proxy.ts` (Next 16) + `requireAdmin()` en cada route handler privado + headers HTTP estrictos.
- **Estilos**: Tailwind CSS v4, Lucide Icons, clsx, tailwind-merge.
- **Pruebas**: Vitest.

---

## 🚀 Puesta en Marcha en Local

### 1. Requisitos
- Node.js 22+
- npm 10+
- Instancia activa de Neon PostgreSQL

### 2. Configurar variables de entorno
Copia el archivo de ejemplo:
```bash
cp .env.example .env.local
```
Edita `.env.local` configurando al menos:
- `DATABASE_URL`
- `AUTH_SECRET`
- `BLOB_READ_WRITE_TOKEN`

### 3. Migraciones y Datos Semilla
Ejecuta las migraciones de esquemas SQL:
```bash
npm run db:migrate
```

Carga el catálogo inicial de productos (si la tabla está vacía):
```bash
npm run db:seed
```

Crea tu primer usuario administrador:
```bash
USER_PASSWORD="TuPasswordSegura2026" npm run user:create -- admin@sumaq.pe "Administrador SUMAQ" admin
```

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 🧪 Comandos Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el entorno local de desarrollo |
| `npm run build` | Compila la aplicación para producción |
| `npm run start` | Arranca la aplicación compilada |
| `npm run typecheck` | Comprueba tipos con `tsc --noEmit` |
| `npm run lint` | Ejecuta ESLint |
| `npm run test` | Ejecuta la suite de pruebas unitarias con Vitest |
| `npm run db:migrate` | Aplica todas las migraciones SQL pendientes |
| `npm run db:seed` | Carga el catálogo base de herramientas |
| `npm run user:create` | Crea o actualiza usuarios (admin / salon_partner) |

---

## 🔐 Seguridad y Producción

- **Sin bypasses cliente**: La autenticación y autorización se verifican estrictamente en el servidor en cada llamada API y vista `/admin`.
- **Precios autoritativos**: El cálculo de subtotales, descuentos de salón y fletes se realiza exclusivamente en el backend (`src/lib/pricing.ts`).
- **Defensa contra abusos**: Intentos de login, cotizaciones, órdenes y envíos de contacto cuentan con rate limiting distribuido en PostgreSQL (`checkRateLimit`).
- **Validación Zod**: Todo input externo (imágenes, productos, leads, formularios) está validado con esquemas estrictos.
