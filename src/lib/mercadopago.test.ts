import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { verifyMercadoPagoWebhookSignature } from './mercadopago';

describe('Mercado Pago HMAC-SHA256 webhook signature verification', () => {
  const originalSecret = process.env.MP_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.MP_WEBHOOK_SECRET = 'test_mp_webhook_secret_2026';
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.MP_WEBHOOK_SECRET;
    } else {
      process.env.MP_WEBHOOK_SECRET = originalSecret;
    }
  });

  it('accepts a valid HMAC-SHA256 x-signature header', () => {
    const dataId = '9988776655';
    const xRequestId = 'req-uuid-12345';
    const ts = String(Math.floor(Date.now() / 1000));
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const v1 = crypto
      .createHmac('sha256', 'test_mp_webhook_secret_2026')
      .update(manifest)
      .digest('hex');

    const result = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId,
      dataId,
    });

    expect(result).toBe(true);
  });

  it('rejects a tampered signature', () => {
    const dataId = '9988776655';
    const xRequestId = 'req-uuid-12345';
    const ts = String(Math.floor(Date.now() / 1000));
    const fakeV1 = '0'.repeat(64);

    const result = verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${fakeV1}`,
      xRequestId,
      dataId,
    });

    expect(result).toBe(false);
  });

  it('rejects missing x-signature when MP_WEBHOOK_SECRET is configured', () => {
    const result = verifyMercadoPagoWebhookSignature({
      xSignature: null,
      xRequestId: 'req-1',
      dataId: '12345',
    });

    expect(result).toBe(false);
  });
});
