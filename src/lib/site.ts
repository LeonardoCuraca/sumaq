/** Datos de contacto centralizados (sobrescribibles por variables de entorno públicas). */
export const SITE = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '51957709262',
  whatsappSecondary: '+51 983 459 490',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'sumaq.2025import@gmail.com',
  address: 'Av. 6 de Agosto 589, Jesús María, Lima, Perú',
  warehouseShort: 'Av. 6 de Agosto 589, Jesús María',
} as const;

export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
