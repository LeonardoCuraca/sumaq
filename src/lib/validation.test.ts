import { describe, it, expect } from 'vitest';
import { slugify, orderSchema, leadSchema } from './validation';

describe('validation logic and schemas', () => {
  it('slugify cleans accents, special characters, and trims dashes', () => {
    expect(slugify('Plancha Lizze Extreme 250°C')).toBe('plancha_lizze_extreme_250_c');
    expect(slugify('  Secador Turbo 2400W  ')).toBe('secador_turbo_2400w');
    expect(slugify('Máquina de Barbería & Accesorios')).toBe('maquina_de_barberia_accesorios');
  });

  it('orderSchema validates DNI (8 digits) and RUC (11 digits)', () => {
    const baseOrder = {
      fullName: 'Juan Perez',
      phone: '957709262',
      deliveryType: 'domicilio',
      city: 'Lima',
      address: 'Av. Brasil 1234',
      paymentMethod: 'Yape / Plin',
      items: [{ id: 'prod-1', qty: 1 }],
    };

    // 8 digits DNI
    expect(orderSchema.safeParse({ ...baseOrder, dniRuc: '71234567' }).success).toBe(true);
    // 11 digits RUC
    expect(orderSchema.safeParse({ ...baseOrder, dniRuc: '20601234567' }).success).toBe(true);

    // Invalid docs
    expect(orderSchema.safeParse({ ...baseOrder, dniRuc: '123' }).success).toBe(false);
    expect(orderSchema.safeParse({ ...baseOrder, dniRuc: 'letras1234' }).success).toBe(false);
  });

  it('leadSchema requires all mandatory contact fields', () => {
    const validLead = {
      salonName: 'Studio Glow',
      docNumber: '20609876543',
      contactName: 'Maria Silva',
      phone: '+51 987654321',
      city: 'Arequipa',
      interest: 'Planchas Térmicas',
    };

    expect(leadSchema.safeParse(validLead).success).toBe(true);
    expect(leadSchema.safeParse({ ...validLead, salonName: '' }).success).toBe(false);
  });
});
