/**
 * Proves `mailbox_by_address(text)` (SECURITY DEFINER) resolves an inbound
 * recipient to (tenant, mailbox) with NO tenant context — the path the Stalwart
 * MTA-hook takes — and that aliases resolve to their target mailbox.
 *
 * Same shape as tenant-isolation.test.ts: seed via OWNER, read via APP role,
 * skip if no DB.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, createPool } from '../src/client.ts';
import { resolveMailboxByAddress } from '../src/mailbox.ts';

const OWNER_URL =
  process.env.TEST_OWNER_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/souramail';
const APP_URL =
  process.env.DATABASE_URL ?? 'postgres://souramail_app:souramail_app@localhost:5432/souramail';

const ownerPool = createPool(OWNER_URL);
const appPool = createPool(APP_URL);
const appDb = createDb(appPool);

const ws = randomUUID();
const domId = randomUUID();
const boxId = randomUUID();
const aliasId = randomUUID();
let dbReady = false;

beforeAll(async () => {
  try {
    await ownerPool.query('select 1 from "mailbox" limit 1');
    dbReady = true;
  } catch {
    return;
  }
  await ownerPool.query(
    `insert into "workspace" (id,name,slug) values ($1,'MX','mx-${ws.slice(0, 8)}')`,
    [ws],
  );
  await ownerPool.query(
    `insert into "domain" (id,tenant_id,name) values ($1,$2,'mx-${ws.slice(0, 8)}.test')`,
    [domId, ws],
  );
  await ownerPool.query(
    `insert into "mailbox" (id,tenant_id,domain_id,address,type) values ($1,$2,$3,$4,'mailbox')`,
    [boxId, ws, domId, `hello@mx-${ws.slice(0, 8)}.test`],
  );
  await ownerPool.query(
    `insert into "mailbox" (id,tenant_id,domain_id,address,type,target_mailbox_id) values ($1,$2,$3,$4,'alias',$5)`,
    [aliasId, ws, domId, `sales@mx-${ws.slice(0, 8)}.test`, boxId],
  );
});

afterAll(async () => {
  if (dbReady) await ownerPool.query('delete from "workspace" where id = $1', [ws]);
  await ownerPool.end();
  await appPool.end();
});

describe('mailbox_by_address', () => {
  it('resolves a mailbox address to (tenant, mailbox)', async () => {
    if (!dbReady) return;
    const r = await resolveMailboxByAddress(`HELLO@mx-${ws.slice(0, 8)}.test`, appDb);
    expect(r).not.toBeNull();
    expect(r?.tenantId).toBe(ws);
    expect(r?.mailboxId).toBe(boxId);
    expect(r?.type).toBe('mailbox');
  });

  it('resolves an alias to its target mailbox', async () => {
    if (!dbReady) return;
    const r = await resolveMailboxByAddress(`sales@mx-${ws.slice(0, 8)}.test`, appDb);
    expect(r?.mailboxId).toBe(boxId); // target, not the alias row
    expect(r?.type).toBe('alias');
    expect(r?.targetMailboxId).toBe(boxId);
  });

  it('returns null for an unknown address', async () => {
    if (!dbReady) return;
    expect(await resolveMailboxByAddress('nobody@nowhere.test', appDb)).toBeNull();
  });
});
