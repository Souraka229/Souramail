/**
 * API key storage (docs/05 §6). Creation / listing / revocation are tenant-scoped
 * through `withTenant`; `resolveApiKey()` runs before any tenant context (the
 * public API only has the bearer token) via the `api_key_by_hash` SECURITY
 * DEFINER function.
 */
import { hashApiKey, type MintedApiKey, mintApiKey } from '@souramail/core';
import { and, eq, sql } from 'drizzle-orm';
import { type Db, getDb } from './client.ts';
import { apiKey } from './schema.ts';
import { withTenant } from './tenant.ts';

export type ApiScope =
  | 'emails:send'
  | 'emails:read'
  | 'emails:delete'
  | 'domains:read'
  | 'domains:manage'
  | 'webhooks:manage';

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface ResolvedApiKey {
  apiKeyId: string;
  tenantId: string;
  scopes: string[];
  name: string;
}

export async function resolveApiKey(key: string, db: Db = getDb()): Promise<ResolvedApiKey | null> {
  const res = await db.execute<{
    api_key_id: string;
    tenant_id: string;
    scopes: string[];
    key_name: string;
  }>(sql`select * from api_key_by_hash(${hashApiKey(key)})`);
  const rows = (res as unknown as { rows?: unknown[] }).rows ?? (res as unknown as unknown[]);
  const r = rows[0] as
    | { api_key_id: string; tenant_id: string; scopes: string[]; key_name: string }
    | undefined;
  if (!r) return null;
  return {
    apiKeyId: r.api_key_id,
    tenantId: r.tenant_id,
    scopes: Array.isArray(r.scopes) ? r.scopes : [],
    name: r.key_name,
  };
}

export async function touchApiKey(id: string, db: Db = getDb()): Promise<void> {
  await db.execute(sql`update api_key set last_used_at = now() where id = ${id}`);
}

export async function listApiKeys(tenantId: string): Promise<ApiKeyRow[]> {
  return withTenant(getDb(), tenantId, (tx) =>
    tx
      .select({
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        scopes: apiKey.scopes,
        lastUsedAt: apiKey.lastUsedAt,
        createdAt: apiKey.createdAt,
      })
      .from(apiKey)
      .orderBy(apiKey.createdAt),
  );
}

export async function createApiKey(opts: {
  tenantId: string;
  name: string;
  scopes: string[];
  env?: 'live' | 'test';
}): Promise<{ row: ApiKeyRow; secret: string }> {
  const minted: MintedApiKey = mintApiKey(opts.env ?? 'live');
  const [row] = await withTenant(getDb(), opts.tenantId, (tx) =>
    tx
      .insert(apiKey)
      .values({
        tenantId: opts.tenantId,
        name: opts.name,
        hash: minted.hash,
        prefix: minted.prefix,
        scopes: opts.scopes,
      })
      .returning({
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        scopes: apiKey.scopes,
        lastUsedAt: apiKey.lastUsedAt,
        createdAt: apiKey.createdAt,
      }),
  );
  if (!row) throw new Error('createApiKey: insert returned no row');
  return { row, secret: minted.key };
}

export async function revokeApiKey(tenantId: string, id: string): Promise<void> {
  await withTenant(getDb(), tenantId, (tx) =>
    tx.delete(apiKey).where(and(eq(apiKey.id, id), eq(apiKey.tenantId, tenantId))),
  );
}
