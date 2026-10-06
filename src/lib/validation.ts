import { z } from 'zod';
import { ORDER_STATUSES } from './db';

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1);

/** Quita acentos y deja a-z0-9 con "_" como separador (compatible con los slugs existentes). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
}

const imageUrl = z
  .string()
  .trim()
  .url()
  .max(500)
  .refine((u) => u.startsWith('https://'), 'Las imágenes deben usar https');

export const productInputSchema = z.object({
  id: text(100).optional(),
  slug: text(150).optional(),
  category: z.enum(['hair', 'barber']).default('hair'),
  name: required(255),
  badge: text(100).optional().default(''),
  punchline: text(500).optional().default(''),
  temp: text(50).optional().default('N/A'),
  voltage: z.array(required(20)).max(6).default(['220V']),
  options: z.array(required(100)).max(20).default([]),
  prices: z.object({
    reg: z.coerce.number().positive().max(100000),
    min: z.coerce.number().min(0).max(100000).default(0),
    salonPack: z.coerce.number().min(0).max(100000).default(0),
  }),
  images: z.array(imageUrl).max(10).default([]),
  specs: z.record(z.string().max(60), z.string().max(300)).default({}),
  shortDesc: text(2000).optional().default(''),
  longDesc: text(8000).optional().default(''),
  isFeatured: z.boolean().optional().default(false),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const orderStatusSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  status: z.enum(ORDER_STATUSES),
});

export const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        id: required(100),
        qty: z.coerce.number().int().min(1).max(50),
        voltage: text(20).optional(),
      })
    )
    .min(1)
    .max(40),
  deliveryType: z.enum(['domicilio', 'almacen']).default('domicilio'),
  city: required(100).default('Lima'),
});

export const orderSchema = quoteSchema.extend({
  fullName: required(150),
  dniRuc: z.string().trim().regex(/^(\d{8}|\d{11})$/, 'DNI (8 dígitos) o RUC (11 dígitos)'),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, 'Teléfono inválido'),
  address: text(300).optional().default(''),
  paymentMethod: text(50).default('Yape / Plin'),
});

export const leadSchema = z.object({
  salonName: required(150),
  docNumber: z.string().trim().regex(/^(\d{8}|\d{11})$/, 'DNI (8 dígitos) o RUC (11 dígitos)'),
  contactName: required(150),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, 'Teléfono inválido'),
  city: required(100),
  interest: required(100),
  notes: text(1000).optional().default(''),
});

export const contactSchema = z.object({
  name: required(150),
  reason: required(150),
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().default(''),
  message: required(3000),
});

/** Resumen legible de errores zod para respuestas 400. */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || 'datos'}: ${i.message}`).join('; ');
}
