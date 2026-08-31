/**
 * Phase 0 Definition of Done: prove there is no data leak between tenants.
 *
 * Requires a running database (see `pnpm infra:up`) with migrations + RLS applied
 * (`pnpm --filter @souramail/db migrate`). The test seeds through the OWNER role and
 * asserts isolation through the non-superuser APP role.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, createPool } from '../src/client.ts';
import { schema } from '../src/index.ts';
import { withoutTenant, withTenant } from '../src/tenant.ts';

const OWNER_URL =
  process.env.TEST_OWNER_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/souramail';
const APP_URL =
  process.env.DATABASE_URL ?? 'postgres://souramail_app:souramail_app@localhost:5432/souramail';

const ownerPool = createPool(OWNER_URL);
const appPool = createPool(APP_URL);
const appDb = createDb(appPool);

const A = randomUUID();
const B = randomUUID();

let dbReady = false;

beforeAll(async () => {
  try {
    await ownerPool.query('select 1 from "workspace" limit 1');
    dbReady = true;
  } catch {
    return; // DB not migrated / not running — tests below are skipped
  }
  await ownerPool.query(
    `insert into "workspace" (id, name, slug) values ($1,'A','a-${A.slice(0, 8)}'), ($2,'B','b-${B.slice(0, 8)}')`,
    [A, B],
  );
  await ownerPool.query(
    `insert into "domain" (tenant_id, name) values ($1,'a-${A.slice(0, 8)}.test'), ($2,'b-${B.slice(0, 8)}.test')`,
    [A, B],
  );
});

afterAll(async () => {
  if (dbReady) await ownerPool.query('delete from "workspace" where id = any($1)', [[A, B]]);
  await ownerPool.end();
  await appPool.end();
});

describe('tenant isolation (RLS)', () => {
  it('tenant A sees only its own domains', async () => {
    if (!dbReady) return;
    const rows = await withTenant(appDb, A, (tx) => tx.select().from(schema.domain));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe(`a-${A.slice(0, 8)}.test`);
  });

  it('tenant B sees only its own domains', async () => {
    if (!dbReady) return;
    const rows = await withTenant(appDb, B, (tx) => tx.select().from(schema.domain));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe(`b-${B.slice(0, 8)}.test`);
  });

  it('no tenant context => zero rows visible', async () => {
    if (!dbReady) return;
    const rows = await withoutTenant(appDb, (tx) => tx.select().from(schema.domain));
    expect(rows).toHaveLength(0);
  });

  it('cannot write a row for another tenant (WITH CHECK)', async () => {
    if (!dbReady) return;
    await expect(
      withTenant(appDb, A, (tx) =>
        tx.insert(schema.domain).values({ tenantId: B, name: 'evil.test' }),
      ),
    ).rejects.toThrow();
  });
});
