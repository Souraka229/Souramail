/**
 * Delivery-event ingestion (docs/05 §4.2): the SES/FBL webhook maps a provider
 * message id back to its `outbound_job` (via a SECURITY DEFINER lookup, since the
 * webhook has no tenant context), then records the event, updates the job,
 * grows the suppression list, and nudges the workspace risk score.
 */
import { and, eq, inArray, sql } from 'drizzle-orm';
import { type Db, getDb } from './client.ts';
import { deliveryEvent, outboundJob, suppression, workspace } from './schema.ts';
import { withTenant } from './tenant.ts';

export interface OutboundJobRef {
  outboundJobId: string;
  tenantId: string;
  messageId: string | null;
}

export async function resolveOutboundJobByProviderMsg(
  providerMsgId: string,
  db: Db = getDb(),
): Promise<OutboundJobRef | null> {
  const res = await db.execute<{
    outbound_job_id: string;
    tenant_id: string;
    message_id: string | null;
  }>(sql`select * from outbound_job_by_provider_msg(${providerMsgId})`);
  const rows = (res as unknown as { rows?: unknown[] }).rows ?? (res as unknown as unknown[]);
  const r = rows[0] as
    | { outbound_job_id: string; tenant_id: string; message_id: string | null }
    | undefined;
  if (!r) return null;
  return { outboundJobId: r.outbound_job_id, tenantId: r.tenant_id, messageId: r.message_id };
}

export type DeliveryEventType =
  | 'delivered'
  | 'bounced'
  | 'complaint'
  | 'opened'
  | 'clicked'
  | 'failed';

export interface ApplyDeliveryEventInput {
  tenantId: string;
  outboundJobId: string;
  type: DeliveryEventType;
  payload?: Record<string, unknown>;
  /** New `outbound_job.status`, if this event changes it. */
  status?: 'delivered' | 'bounced' | 'failed' | 'spam';
  /** Addresses to add to the suppression list (hard bounce / complaint). */
  suppress?: { address: string; reason: 'bounce' | 'complaint' | 'manual' }[];
  /** Points to add to `workspace.risk_score` (clamped 0–100). */
  riskDelta?: number;
}

export async function applyDeliveryEvent(input: ApplyDeliveryEventInput): Promise<void> {
  await withTenant(getDb(), input.tenantId, async (tx) => {
    await tx.insert(deliveryEvent).values({
      tenantId: input.tenantId,
      outboundJobId: input.outboundJobId,
      type: input.type,
      payload: input.payload ?? {},
    });

    if (input.status) {
      await tx
        .update(outboundJob)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(outboundJob.id, input.outboundJobId));
    }

    for (const s of input.suppress ?? []) {
      await tx
        .insert(suppression)
        .values({ tenantId: input.tenantId, address: s.address.toLowerCase(), reason: s.reason })
        .onConflictDoNothing({ target: [suppression.tenantId, suppression.address] });
    }

    if (input.riskDelta) {
      await tx
        .update(workspace)
        .set({
          riskScore: sql`least(100, greatest(0, ${workspace.riskScore} + ${input.riskDelta}))`,
          updatedAt: new Date(),
        })
        .where(eq(workspace.id, input.tenantId));
    }
  });
}

/** True if `address` is on this workspace's suppression list. */
export async function isSuppressed(
  tenantId: string,
  address: string,
  db: Db = getDb(),
): Promise<boolean> {
  return withTenant(db, tenantId, async (tx) => {
    const [row] = await tx
      .select({ id: suppression.id })
      .from(suppression)
      .where(
        and(eq(suppression.tenantId, tenantId), eq(suppression.address, address.toLowerCase())),
      )
      .limit(1);
    return Boolean(row);
  });
}

/** Filter a recipient list down to the addresses that are NOT suppressed. */
export async function filterSuppressed(
  tenantId: string,
  addresses: string[],
  db: Db = getDb(),
): Promise<{ allowed: string[]; suppressed: string[] }> {
  if (addresses.length === 0) return { allowed: [], suppressed: [] };
  const lc = addresses.map((a) => a.toLowerCase());
  const hits = await withTenant(db, tenantId, (tx) =>
    tx
      .select({ address: suppression.address })
      .from(suppression)
      .where(and(eq(suppression.tenantId, tenantId), inArray(suppression.address, lc))),
  );
  const blocked = new Set(hits.map((h) => h.address));
  return {
    allowed: addresses.filter((a) => !blocked.has(a.toLowerCase())),
    suppressed: addresses.filter((a) => blocked.has(a.toLowerCase())),
  };
}
