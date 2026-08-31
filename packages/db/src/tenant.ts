import { sql } from 'drizzle-orm';
import type { Db } from './client.ts';

/**
 * Run `fn` inside a transaction where the tenant context is set, so Row-Level
 * Security scopes every query to `tenantId`.
 *
 * `set_config(..., true)` makes the setting transaction-local: it is automatically
 * cleared at COMMIT/ROLLBACK, which is what makes this safe under a transaction-mode
 * connection pooler (no tenant state leaks between pooled connections).
 *
 *   const rows = await withTenant(db, ws.id, (tx) => tx.select().from(domain));
 */
export async function withTenant<T>(
  db: Db,
  tenantId: string,
  fn: (tx: Parameters<Parameters<Db['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  if (!/^[0-9a-f-]{36}$/i.test(tenantId)) {
    throw new Error(`withTenant: invalid tenantId "${tenantId}"`);
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx);
  });
}

/** Escape hatch for pre-tenant-context work (login, webhook routing). Use sparingly. */
export async function withoutTenant<T>(
  db: Db,
  fn: (tx: Parameters<Parameters<Db['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  return db.transaction(fn);
}
