import { describe, it, expect } from 'vitest';
import { buildQuote, shippingFor, unitPriceFor, QuoteError } from './pricing';
import type { Product } from './products-data';

const mockProduct: Product = {
  id: 'plancha-test',
  slug: 'plancha_test',
  category: 'hair',
  name: 'Plancha Test',
  punchline: 'Test punchline',
  temp: '250°C',
  voltage: ['220V', '127V'],
  prices: { reg: 380, min: 360, salonPack: 350 },
  images: ['https://example.com/img.jpg'],
  specs: {},
  shortDesc: 'Desc',
  longDesc: 'Long',
};

describe('pricing unit tests', () => {
  it('applies regular price for public users and salonPack for salon_partner', () => {
    expect(unitPriceFor(mockProduct, null)).toBe(380);
    expect(unitPriceFor(mockProduct, undefined)).toBe(380);
    expect(unitPriceFor(mockProduct, 'admin')).toBe(380);
    expect(unitPriceFor(mockProduct, 'salon_partner')).toBe(350);
  });

  it('calculates shipping correctly based on delivery type and city', () => {
    expect(shippingFor('almacen', 'Lima')).toBe(0);
    expect(shippingFor('almacen', 'Arequipa')).toBe(0);
    expect(shippingFor('domicilio', 'Lima')).toBe(0);
    expect(shippingFor('domicilio', 'Cusco')).toBe(19);
  });

  it('builds quote accurately for multiple units and adds shipping', () => {
    const quote = buildQuote(
      {
        items: [{ id: 'plancha-test', qty: 2, voltage: '220V' }],
        deliveryType: 'domicilio',
        city: 'Trujillo',
      },
      [mockProduct],
      null
    );

    expect(quote.subtotal).toBe(760);
    expect(quote.shipping).toBe(19);
    expect(quote.total).toBe(779);
    expect(quote.items[0].qty).toBe(2);
  });

  it('throws QuoteError when item id is not in product catalog', () => {
    expect(() =>
      buildQuote(
        {
          items: [{ id: 'non-existent', qty: 1 }],
          deliveryType: 'domicilio',
          city: 'Lima',
        },
        [mockProduct],
        null
      )
    ).toThrow(QuoteError);
  });

  it('throws QuoteError on invalid voltage', () => {
    expect(() =>
      buildQuote(
        {
          items: [{ id: 'plancha-test', qty: 1, voltage: '380V' }],
          deliveryType: 'domicilio',
          city: 'Lima',
        },
        [mockProduct],
        null
      )
    ).toThrow(QuoteError);
  });

  it('throws QuoteError when quantity exceeds max or is zero', () => {
    expect(() =>
      buildQuote(
        {
          items: [{ id: 'plancha-test', qty: 0 }],
          deliveryType: 'domicilio',
          city: 'Lima',
        },
        [mockProduct],
        null
      )
    ).toThrow(QuoteError);

    expect(() =>
      buildQuote(
        {
          items: [{ id: 'plancha-test', qty: 100 }],
          deliveryType: 'domicilio',
          city: 'Lima',
        },
        [mockProduct],
        null
      )
    ).toThrow(QuoteError);
  });
});
