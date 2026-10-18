import type { OrderItem } from './db';
import type { Product } from './products-data';

export const OUT_OF_LIMA_SHIPPING = 19;
export const MAX_QTY_PER_ITEM = 50;

export type Role = 'admin' | 'salon_partner' | undefined | null;

export interface QuoteInput {
  items: { id: string; qty: number; voltage?: string }[];
  deliveryType: 'domicilio' | 'almacen';
  city: string;
}

export interface Quote {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

/**
 * Precio unitario según el rol: los salones aliados acceden al precio de pack salón
 * (si está definido); el resto paga el precio regular.
 */
export function unitPriceFor(product: Product, role: Role): number {
  if (role === 'salon_partner' && product.prices.salonPack > 0) return product.prices.salonPack;
  return product.prices.reg;
}

export function shippingFor(deliveryType: string, city: string): number {
  if (deliveryType === 'almacen') return 0;
  return city === 'Lima' ? 0 : OUT_OF_LIMA_SHIPPING;
}

export class QuoteError extends Error {}

/** Calcula el pedido SOLO con datos del servidor (productos de BD). Nunca confiar en precios del cliente. */
export function buildQuote(input: QuoteInput, products: Product[], role: Role): Quote {
  const byId = new Map(products.map((p) => [p.id, p]));
  const merged = new Map<string, { qty: number; voltage?: string }>();
  const qtyByProductId = new Map<string, number>();

  for (const it of input.items) {
    const key = `${it.id}|${it.voltage ?? ''}`;
    const prev = merged.get(key);
    merged.set(key, { qty: (prev?.qty ?? 0) + it.qty, voltage: it.voltage });
    qtyByProductId.set(it.id, (qtyByProductId.get(it.id) ?? 0) + it.qty);
  }

  for (const [productId, totalQty] of qtyByProductId) {
    const product = byId.get(productId);
    if (!product) throw new QuoteError(`Producto no disponible: ${productId}`);
    if (product.trackInventory !== false && typeof product.stock === 'number') {
      const available = Math.max(0, product.stock - (product.reservedStock ?? 0));
      if (available <= 0) {
        throw new QuoteError(`El producto "${product.name}" se encuentra agotado temporalmente.`);
      }
      if (totalQty > available) {
        throw new QuoteError(
          `Stock insuficiente para "${product.name}". Disponible: ${available} unidad(es).`
        );
      }
    }
  }

  const items: OrderItem[] = [];
  for (const [key, line] of merged) {
    const id = key.split('|')[0];
    const product = byId.get(id);
    if (!product) throw new QuoteError(`Producto no disponible: ${id}`);
    if (line.qty < 1 || line.qty > MAX_QTY_PER_ITEM) {
      throw new QuoteError(`Cantidad inválida para ${product.name}`);
    }
    if (line.voltage && product.voltage.length > 0 && !product.voltage.includes(line.voltage)) {
      throw new QuoteError(`Voltaje no disponible para ${product.name}`);
    }
    items.push({
      id: product.id,
      name: product.name,
      qty: line.qty,
      voltage: line.voltage,
      price: unitPriceFor(product, role),
    });
  }

  if (items.length === 0) throw new QuoteError('El carrito está vacío');

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = shippingFor(input.deliveryType, input.city);
  return { items, subtotal, shipping, total: subtotal + shipping };
}
