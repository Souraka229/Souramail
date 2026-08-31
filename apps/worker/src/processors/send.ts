/**
 * Outbound pipeline (docs/05 §4.2). Consumes `send` jobs:
 *   1. load the outbound_job + its message under the tenant context (RLS)
 *   2. dedup on status; drop suppressed recipients (bounce/complaint list)
 *   3. hand a formed message to EmailProvider (SES relay today, KumoMTA at ph5)
 *   4. persist provider_msg_id, status = sent
 *
 * Rspamd-out signs DKIM (selector `soura`) and rate-limits on the mail edge;
 * this worker doesn't re-implement that. The provisional "delivered" event is
 * gone — real delivery/bounce/complaint comes from the SES→SNS webhook.
 */
import { filterSuppressed, getDb, schema, withTenant } from '@souramail/db';
import { getEmailProvider } from '@souramail/providers';
import type { Job } from 'bullmq';
import { eq, sql } from 'drizzle-orm';

const { outboundJob, message, usageCounter } = schema;

export async function processSend(
  job: Job,
): Promise<{ providerMessageId: string } | { skipped: string }> {
  const { tenantId, outboundJobId } = job.data as { tenantId: string; outboundJobId: string };
  const email = await getEmailProvider();

  const ctx = await withTenant(getDb(), tenantId, async (tx) => {
    const [ob] = await tx
      .select()
      .from(outboundJob)
      .where(eq(outboundJob.id, outboundJobId))
      .limit(1);
    if (!ob) throw new Error(`send: outbound_job ${outboundJobId} not found`);
    if (ob.status === 'sent' || ob.status === 'delivered') return null; // idempotent replay

    const [msg] = ob.messageId
      ? await tx.select().from(message).where(eq(message.id, ob.messageId)).limit(1)
      : [undefined];
    if (!msg) throw new Error(`send: message for outbound_job ${outboundJobId} missing`);

    await tx
      .update(outboundJob)
      .set({ status: 'sending', attempts: ob.attempts + 1, updatedAt: new Date() })
      .where(eq(outboundJob.id, outboundJobId));

    return { ob, msg };
  });
  if (!ctx) return { skipped: 'already-sent' };

  const { allowed, suppressed } = await filterSuppressed(tenantId, ctx.msg.toAddrs);
  if (allowed.length === 0) {
    await withTenant(getDb(), tenantId, (tx) =>
      tx
        .update(outboundJob)
        .set({ status: 'failed', lastError: 'all recipients suppressed', updatedAt: new Date() })
        .where(eq(outboundJob.id, outboundJobId)),
    );
    return { skipped: 'all-suppressed' };
  }

  let providerMessageId: string;
  try {
    ({ providerMessageId } = await email.send({
      from: ctx.msg.fromAddr,
      to: allowed,
      subject: ctx.msg.subject ?? '(no subject)',
      text: ctx.msg.snippet ?? undefined,
      tenantId,
      idempotencyKey: ctx.ob.idempotencyKey ?? undefined,
      returnPath: 'bounce@bounce.souramail.com',
    }));
  } catch (err) {
    await withTenant(getDb(), tenantId, (tx) =>
      tx
        .update(outboundJob)
        .set({
          status: 'failed',
          lastError: err instanceof Error ? err.message : String(err),
          updatedAt: new Date(),
        })
        .where(eq(outboundJob.id, outboundJobId)),
    );
    throw err; // BullMQ retries per the job's backoff
  }

  const day = new Date().toISOString().slice(0, 10);
  await withTenant(getDb(), tenantId, async (tx) => {
    await tx
      .update(outboundJob)
      .set({
        status: 'sent',
        provider: email.name,
        providerMessageId,
        lastError: suppressed.length ? `skipped suppressed: ${suppressed.join(', ')}` : null,
        updatedAt: new Date(),
      })
      .where(eq(outboundJob.id, outboundJobId));

    await tx
      .insert(usageCounter)
      .values({ tenantId, metric: 'emails_sent', window: day, value: 1 })
      .onConflictDoUpdate({
        target: [usageCounter.tenantId, usageCounter.metric, usageCounter.window],
        set: { value: sql`${usageCounter.value} + 1`, updatedAt: new Date() },
      });
  });

  return { providerMessageId };
}
