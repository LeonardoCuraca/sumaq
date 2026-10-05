import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing and verification', () => {
  it('hashes password and verifies successfully with correct password', async () => {
    const raw = 'MiClaveSecreta2026!';
    const hashed = await hashPassword(raw);

    expect(hashed).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);

    const isValid = await verifyPassword(raw, hashed);
    expect(isValid).toBe(true);
  });

  it('rejects incorrect passwords', async () => {
    const raw = 'PasswordCorrecta123';
    const hashed = await hashPassword(raw);

    const isInvalid = await verifyPassword('PasswordErrada999', hashed);
    expect(isInvalid).toBe(false);
  });

  it('handles malformed stored hashes gracefully without throwing', async () => {
    expect(await verifyPassword('test', '')).toBe(false);
    expect(await verifyPassword('test', 'plainTextPassword')).toBe(false);
    expect(await verifyPassword('test', 'bcrypt$invalid')).toBe(false);
  });
});
