/**
 * Proves the sign-up bootstrap path: `createWorkspaceWithOwner()` writes a
 * workspace + an `owner` membership under RLS (no escape hatch), and
 * `listUserWorkspaces()` reads them back through the `app_user_workspaces`
 * SECURITY DEFINER function before any tenant context exists.
 *
 * Same shape as tenant-isolation.test.ts: seeds identity via the OWNER role,
 * exercises everything through the non-superuser APP role, skips if no DB.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, createPool } from '../src/client.ts';
import { schema } from '../src/index.ts';
import { listUserWorkspaces } from '../src/membership.ts';
import { createWorkspaceWithOwner } from '../src/provisioning.ts';
import { withTenant } from '../src/tenant.ts';

const OWNER_URL =
  process.env.TEST_OWNER_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/souramail';
const APP_URL =
  process.env.DATABASE_URL ?? 'postgres://souramail_app:souramail_app@localhost:5432/souramail';

const ownerPool = createPool(OWNER_URL);
const appPool = createPool(APP_URL);
const appDb = createDb(appPool);

const userId = `usr_${randomUUID()}`;
const otherUserId = `usr_${randomUUID()}`;
let dbReady = false;

beforeAll(async () => {
  try {
    await ownerPool.query('select 1 from "user" limit 1');
    dbReady = true;
  } catch {
    return;
  }
  for (const uid of [userId, otherUserId]) {
    await ownerPool.query(
      `insert into "user" (id, name, email, email_verified) values ($1, 'Test', $2, true)`,
      [uid, `${uid}@example.test`],
    );
  }
});

afterAll(async () => {
  if (dbReady) {
    await ownerPool.query('delete from "workspace" where name like $1', ['%bootstrap%']);
    await ownerPool.query('delete from "user" where id = any($1)', [[userId, otherUserId]]);
  }
  await ownerPool.end();
  await appPool.end();
});

describe('workspace provisioning', () => {
  it('creates a workspace + owner membership under RLS', async () => {
    if (!dbReady) return;
    const { workspaceId } = await createWorkspaceWithOwner(
      { userId, name: 'bootstrap one' },
      appDb,
    );
    expect(workspaceId).toMatch(/^[0-9a-f-]{36}$/i);

    const rows = await withTenant(appDb, workspaceId, (tx) => tx.select().from(schema.membership));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.role).toBe('owner');
    expect(rows[0]?.userId).toBe(userId);
  });

  it('listUserWorkspaces returns the user’s workspaces with no tenant context', async () => {
    if (!dbReady) return;
    await createWorkspaceWithOwner({ userId, name: 'bootstrap two' }, appDb);

    const list = await listUserWorkspaces(userId, appDb);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(new Set(list.map((w) => w.name))).toEqual(new Set(['bootstrap one', 'bootstrap two']));
    expect(list.every((w) => w.role === 'owner')).toBe(true);
    expect(list.every((w) => w.plan === 'free')).toBe(true);
  });

  it('does not leak another user’s workspaces', async () => {
    if (!dbReady) return;
    await createWorkspaceWithOwner({ userId: otherUserId, name: 'bootstrap other' }, appDb);

    const mine = await listUserWorkspaces(userId, appDb);
    expect(mine.some((w) => w.name === 'bootstrap other')).toBe(false);
  });
});
