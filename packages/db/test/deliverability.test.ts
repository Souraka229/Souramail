/**
 * Proves the SES→SNS delivery-event path (docs/05 §4.2):
 *   provider msg id → outbound_job (SECURITY DEFINER, no tenant ctx)
 *   hard bounce  → job `bounced` + suppression + risk score bump
 *   filterSuppressed keeps the rest of a recipient list sendable
 *
 * Seed via OWNER, exercise via APP role, skip if no DB.
 */
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, createPool } from '../src/client.ts';
import {
  applyDeliveryEvent,
  filterSuppressed,
  isSuppressed,
  resolveOutboundJobByProviderMsg,
} from '../src/deliverability.ts';
import { schema } from '../src/index.ts';
import { withTenant } from '../src/tenant.ts';

const OWNER_URL =
  process.env.TEST_OWNER_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/souramail';
const APP_URL =
  process.env.DATABASE_URL ?? 'postgres://souramail_app:souramail_app@localhost:5432/souramail';

const ownerPool = createPool(OWNER_URL);
const appPool = createPool(APP_URL);
const appDb = createDb(appPool);

const ws = randomUUID();
const jobId = randomUUID();
const providerMsgId = `ses-${randomUUID()}`;
let dbReady = false;

beforeAll(async () => {
  try {
    await ownerPool.query('select 1 from "outbound_job" limit 1');
    dbReady = true;
  } catch {
    return;
  }
  await ownerPool.query(
    `insert into "workspace" (id,name,slug,risk_score) values ($1,'DEL','del-${ws.slice(0, 8)}',10)`,
    [ws],
  );
  await ownerPool.query(
    `insert into "outbound_job" (id,tenant_id,status,provider,provider_message_id) values ($1,$2,'sent','smtp-relay',$3)`,
    [jobId, ws, providerMsgId],
  );
});

afterAll(async () => {
  if (dbReady) await ownerPool.query('delete from "workspace" where id = $1', [ws]);
  await ownerPool.end();
  await appPool.end();
});

describe('delivery events', () => {
  it('resolves a provider message id to its outbound_job with no tenant context', async () => {
    if (!dbReady) return;
    const ref = await resolveOutboundJobByProviderMsg(providerMsgId, appDb);
    expect(ref?.outboundJobId).toBe(jobId);
    expect(ref?.tenantId).toBe(ws);
  });

  it('hard bounce → job bounced + recipient suppressed + risk bumped', async () => {
    if (!dbReady) return;
    await applyDeliveryEvent({
      tenantId: ws,
      outboundJobId: jobId,
      type: 'bounced',
      status: 'bounced',
      suppress: [{ address: 'Nope@Example.com', reason: 'bounce' }],
      riskDelta: 8,
    });

    const job = await withTenant(appDb, ws, (tx) =>
      tx.select().from(schema.outboundJob).where(eq(schema.outboundJob.id, jobId)),
    );
    expect(job[0]?.status).toBe('bounced');

    expect(await isSuppressed(ws, 'nope@example.com', appDb)).toBe(true);

    const wsRow = await withTenant(appDb, ws, (tx) => tx.select().from(schema.workspace));
    expect(wsRow[0]?.riskScore).toBe(18); // 10 + 8
  });

  it('filterSuppressed splits a recipient list', async () => {
    if (!dbReady) return;
    const { allowed, suppressed } = await filterSuppressed(
      ws,
      ['nope@example.com', 'ok@example.com'],
      appDb,
    );
    expect(suppressed).toEqual(['nope@example.com']);
    expect(allowed).toEqual(['ok@example.com']);
  });
});
