import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret, generateMailSecretKey } from '../src/index.ts';

describe('secret box', () => {
  const key = generateMailSecretKey();

  it('round-trips', () => {
    const token = encryptSecret('hunter2-π-😀', key);
    expect(token.startsWith('v1.')).toBe(true);
    expect(decryptSecret(token, key)).toBe('hunter2-π-😀');
  });

  it('is non-deterministic (random IV)', () => {
    expect(encryptSecret('same', key)).not.toBe(encryptSecret('same', key));
  });

  it('rejects a wrong key', () => {
    const token = encryptSecret('x', key);
    expect(() => decryptSecret(token, generateMailSecretKey())).toThrow();
  });

  it('rejects a tampered token', () => {
    const parts = encryptSecret('secret', key).split('.');
    const ct = Buffer.from(parts[2] as string, 'base64url');
    ct[0] = (ct[0] as number) ^ 0xff; // flip a ciphertext byte → GCM tag mismatch
    parts[2] = ct.toString('base64url');
    expect(() => decryptSecret(parts.join('.'), key)).toThrow();
  });

  it('rejects a non-32-byte key', () => {
    expect(() => encryptSecret('x', 'c2hvcnQ=')).toThrow(/32 bytes/);
  });
});
