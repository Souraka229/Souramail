/**
 * Outbound pipeline (docs/05 §4.2). Consumes `send` jobs:
 *   1. load the outbound_job + its message under the tenant context (RLS)
 *   2. dedup on idempotency_key
 *   3. hand a formed message to EmailProvider (SES relay today, KumoMTA at ph5)
 *   4. persist provider_msg_id, status = sent; emit a delivery_event
 *
 * Rspamd-out signs DKIM (selector `soura`) and rate-limits on the mail edge;
 * this worker doesn't re-implement that.
 */
import { getDb, schema, withTenant } from '@souramail/db';
import { getEmailProvider } from '@souramail/providers';
import type { Job } from 'bullmq';
import { eq, sql } from 'drizzle-orm';

const { outboundJob, message, deliveryEvent, usageCounter } = schema;

export async function processSend(
  job: Job,
): Promise<{ providerMessageId: string } | { skipped: true }> {
  const { tenantId, outboundJobId } = job.data as { tenantId: string; outboundJobId: string };
  const email = getEmailProvider();

  return withTenant(getDb(), tenantId, async (tx) => {
    const [ob] = await tx
      .select()
      .from(outboundJob)
      .where(eq(outboundJob.id, outboundJobId))
      .limit(1);
    if (!ob) throw new Error(`send: outbound_job ${outboundJobId} not found`);
    if (ob.status === 'sent' || ob.status === 'delivered') {
      return { skipped: true as const }; // already done — idempotent replay
    }

    const [msg] = ob.messageId
      ? await tx.select().from(message).where(eq(message.id, ob.messageId)).limit(1)
      : [undefined];
    if (!msg) throw new Error(`send: message for outbound_job ${outboundJobId} missing`);

    await tx
      .update(outboundJob)
      .set({ status: 'sending', attempts: ob.attempts + 1, updatedAt: new Date() })
      .where(eq(outboundJob.id, outboundJobId));

    let providerMessageId: string;
    try {
      ({ providerMessageId } = await email.send({
        from: msg.fromAddr,
        to: msg.toAddrs,
        subject: msg.subject ?? '(no subject)',
        text: msg.snippet ?? undefined,
        tenantId,
        idempotencyKey: ob.idempotencyKey ?? undefined,
        returnPath: 'bounce@bounce.souramail.com',
      }));
    } catch (err) {
      await tx
        .update(outboundJob)
        .set({
          status: 'failed',
          lastError: err instanceof Error ? err.message : String(err),
          updatedAt: new Date(),
        })
        .where(eq(outboundJob.id, outboundJobId));
      throw err;
    }

    await tx
      .update(outboundJob)
      .set({
        status: 'sent',
        provider: email.name,
        providerMessageId,
        updatedAt: new Date(),
      })
      .where(eq(outboundJob.id, outboundJobId));

    await tx.insert(deliveryEvent).values({
      tenantId,
      outboundJobId,
      type: 'delivered', // provisional; real delivered/bounced comes from the FBL/webhook
      payload: { provider: email.name, providerMessageId },
    });

    const window = new Date().toISOString().slice(0, 10);
    await tx
      .insert(usageCounter)
      .values({ tenantId, metric: 'emails_sent', window, value: 1 })
      .onConflictDoUpdate({
        target: [usageCounter.tenantId, usageCounter.metric, usageCounter.window],
        set: { value: sql`${usageCounter.value} + 1`, updatedAt: new Date() },
      });

    return { providerMessageId };
  });
}
