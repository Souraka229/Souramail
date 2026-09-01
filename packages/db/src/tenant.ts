import { sql } from 'drizzle-orm';
import type { Db } from './client.ts';

/**
 * A dead pooled connection (Neon idle-close / compute autosuspend) surfaces as
 * one of these when the transaction's first statement runs. It's transient and
 * safe to retry once: nothing was committed.
 */
function isRetryableConnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string })?.code;
  return (
    /Connection terminated|Connection closed|connection terminated unexpectedly|server closed the connection|ECONNRESET|read ECONNRESET|socket hang up/i.test(
      msg,
    ) ||
    code === 'ECONNRESET' ||
    code === '57P01' || // admin_shutdown
    code === '08006' || // connection_failure
    code === '08003' // connection_does_not_exist
  );
}

async function txWithRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (!isRetryableConnError(err)) throw err;
    // One retry: the pool has already discarded the bad client, so this call
    // opens a fresh connection.
    return run();
  }
}

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
  return txWithRetry(() =>
    db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
      return fn(tx);
    }),
  );
}

/** Escape hatch for pre-tenant-context work (login, webhook routing). Use sparingly. */
export async function withoutTenant<T>(
  db: Db,
  fn: (tx: Parameters<Parameters<Db['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  return txWithRetry(() => db.transaction(fn));
}
