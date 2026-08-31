/**
 * Proves the public-API auth path: createApiKey (tenant-scoped) → resolveApiKey
 * by hash with NO tenant context (via the api_key_by_hash SECURITY DEFINER fn) →
 * revoke. Seeds identity via OWNER, exercises via APP role, skips if no DB.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiKey, listApiKeys, resolveApiKey, revokeApiKey } from '../src/api-keys.ts';
import { createDb, createPool } from '../src/client.ts';

const OWNER_URL =
  process.env.TEST_OWNER_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/souramail';
const APP_URL =
  process.env.DATABASE_URL ?? 'postgres://souramail_app:souramail_app@localhost:5432/souramail';

const ownerPool = createPool(OWNER_URL);
const appPool = createPool(APP_URL);
const appDb = createDb(appPool);
const ws = randomUUID();
let dbReady = false;

beforeAll(async () => {
  try {
    await ownerPool.query('select 1 from "api_key" limit 1');
    dbReady = true;
  } catch {
    return;
  }
  await ownerPool.query(
    `insert into "workspace" (id,name,slug) values ($1,'AK','ak-${ws.slice(0, 8)}')`,
    [ws],
  );
});

afterAll(async () => {
  if (dbReady) await ownerPool.query('delete from "workspace" where id = $1', [ws]);
  await ownerPool.end();
  await appPool.end();
});

describe('api keys', () => {
  it('creates, resolves by hash without tenant context, and revokes', async () => {
    if (!dbReady) return;
    const { row, secret } = await createApiKey({
      tenantId: ws,
      name: 'ci key',
      scopes: ['emails:send', 'emails:read'],
    });
    expect(secret.startsWith('soura_live_')).toBe(true);

    const resolved = await resolveApiKey(secret, appDb);
    expect(resolved?.tenantId).toBe(ws);
    expect(resolved?.scopes.sort()).toEqual(['emails:read', 'emails:send']);
    expect(resolved?.name).toBe('ci key');

    expect(await resolveApiKey('soura_live_not-a-real-key', appDb)).toBeNull();

    await revokeApiKey(ws, row.id);
    expect(await resolveApiKey(secret, appDb)).toBeNull();
    expect(await listApiKeys(ws)).toHaveLength(0);
  });
});
