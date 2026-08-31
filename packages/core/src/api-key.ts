/**
 * API key minting + hashing (docs/05 §6). Format: `soura_<env>_<44 base64url>`.
 * We store only the SHA-256 of the full key + a short prefix for display; the
 * plaintext is shown to the user exactly once.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export interface MintedApiKey {
  /** Full secret — return to the caller once, never persist. */
  key: string;
  /** `sha256(key)` hex — the stored lookup value. */
  hash: string;
  /** First 12 chars, safe to show in a list. */
  prefix: string;
}

export function mintApiKey(env: 'live' | 'test' = 'live'): MintedApiKey {
  const key = `soura_${env}_${randomBytes(33).toString('base64url')}`;
  return { key, hash: hashApiKey(key), prefix: key.slice(0, 12) };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

/** Constant-time compare of two hex hashes. */
export function apiKeyHashEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
