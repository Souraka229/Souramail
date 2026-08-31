import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

export type Db = ReturnType<typeof createDb>;

export function createPool(connectionString = requireEnv('DATABASE_URL')): Pool {
  return new Pool({ connectionString, max: 10 });
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
