import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

export type Db = ReturnType<typeof createDb>;

export function createPool(connectionString = requireEnv('DATABASE_URL')): Pool {
  // Serverless (Vercel) + Neon: the function instance — and this module-scope
  // pool — is reused for minutes, but Neon closes idle server connections (and
  // autosuspends the compute) after ~5 min. A pooled client whose socket has
  // since died throws "Connection terminated"/"Connection closed" on the next
  // query. Close our idle clients well before Neon does so the pool hands out
  // fresh connections, and don't let a stale client wedge acquisition.
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    allowExitOnIdle: true,
  });
  // A pool 'error' on an *idle* client is not fatal — pg has already removed it.
  // Without a listener, Node treats it as an unhandled error and crashes.
  pool.on('error', () => {});
  return pool;
}

export function createDb(pool: Pool = createPool()) {
  return drizzle(pool, { schema, casing: 'snake_case' });
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

/**
 * Lazily-created shared instance. Constructed on first access so importing this
 * package never requires DATABASE_URL to be set (tests, codegen, CI lint).
 * Tenant context is applied per-transaction — see ./tenant.ts.
 */
let _pool: Pool | undefined;
let _db: Db | undefined;

export function getPool(): Pool {
  if (!_pool) _pool = createPool();
  return _pool;
}

export function getDb(): Db {
  if (!_db) _db = createDb(getPool());
  return _db;
}
