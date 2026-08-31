/**
 * Applies Drizzle migrations, then (re)applies RLS policies.
 *
 * Connects with (in order): DIRECT_URL → MIGRATION_DATABASE_URL → DATABASE_URL → local default.
 * Use the DB OWNER role and a DIRECT (non-pooled) connection:
 *   - local:   MIGRATION_DATABASE_URL=postgres://postgres:postgres@localhost:5432/souramail
 *   - Neon:    DIRECT_URL=<the "-pooler"-less connection string, as neondb_owner>
 * The pooled URL (DATABASE_URL) is fine for the app but not for DDL migrations.
 */
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb, createPool } from './client.ts';
import { applyRls } from './rls.ts';

const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

async function main() {
  const url =
    process.env.DIRECT_URL ??
    process.env.MIGRATION_DATABASE_URL ??
    process.env.DATABASE_URL ??
    'postgres://postgres:postgres@localhost:5432/souramail';

  const pool = createPool(url);
  const db = createDb(pool);

  console.log('▸ running migrations…');
  await migrate(db, { migrationsFolder });

  console.log('▸ applying RLS policies…');
  await applyRls(pool);

  await pool.end();
  console.log('✓ migrate done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
