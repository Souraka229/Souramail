/**
 * Symmetric secret box — AES-256-GCM. Used to store the per-mailbox webmail
 * credential at rest (the user-facing password is still shown once and never
 * stored). Key = `MAIL_SECRET_KEY`, 32 bytes base64.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function key(keyB64: string): Buffer {
  const k = Buffer.from(keyB64, 'base64');
  if (k.length !== 32) throw new Error('MAIL_SECRET_KEY must be 32 bytes (base64)');
  return k;
}

/** → `v1.<iv>.<ciphertext>.<tag>` (all base64url). */
export function encryptSecret(plaintext: string, keyB64: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(keyB64), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', b64u(iv), b64u(ct), b64u(tag)].join('.');
}

export function decryptSecret(token: string, keyB64: string): string {
  const [v, ivB64, ctB64, tagB64] = token.split('.');
  if (v !== 'v1' || !ivB64 || !ctB64 || !tagB64) throw new Error('decryptSecret: malformed token');
  const decipher = createDecipheriv('aes-256-gcm', key(keyB64), fromB64u(ivB64));
  decipher.setAuthTag(fromB64u(tagB64));
  return Buffer.concat([decipher.update(fromB64u(ctB64)), decipher.final()]).toString('utf8');
}

/** Handy for generating a fresh key: `node -e "..."`. */
export function generateMailSecretKey(): string {
  return randomBytes(32).toString('base64');
}

function b64u(b: Buffer): string {
  return b.toString('base64url');
}
function fromB64u(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}
