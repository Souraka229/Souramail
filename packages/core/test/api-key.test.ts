import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { apiKeyHashEquals, hashApiKey, mintApiKey } from '../src/index.ts';

describe('api key', () => {
  it('mints a soura_live_ key with a matching hash + prefix', () => {
    const k = mintApiKey('live');
    expect(k.key).toMatch(/^soura_live_[A-Za-z0-9_-]{40,}$/);
    expect(k.prefix).toBe(k.key.slice(0, 12));
    expect(k.hash).toBe(createHash('sha256').update(k.key).digest('hex'));
    expect(k.hash).toHaveLength(64);
  });

  it('test env uses the test prefix', () => {
    expect(mintApiKey('test').key.startsWith('soura_test_')).toBe(true);
  });

  it('keys are unique', () => {
    expect(mintApiKey().key).not.toBe(mintApiKey().key);
  });

  it('hashApiKey is stable and apiKeyHashEquals is constant-time-safe', () => {
    const h = hashApiKey('soura_live_abc');
    expect(hashApiKey('soura_live_abc')).toBe(h);
    expect(apiKeyHashEquals(h, h)).toBe(true);
    expect(apiKeyHashEquals(h, hashApiKey('soura_live_abd'))).toBe(false);
    expect(apiKeyHashEquals(h, 'ff')).toBe(false); // length mismatch
  });
});
