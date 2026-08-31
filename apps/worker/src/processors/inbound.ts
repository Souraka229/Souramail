/**
 * Inbound pipeline (docs/05 §4.1). Consumes `inbound-process` jobs posted by
 * apps/api from Stalwart's MTA hook, after security (auth + Rspamd + ClamAV +
 * reputation) has already decided acceptance and spam placement.
 *
 *   1. parse MIME (headers, bodies, attachments)
 *   2. raw MIME + attachments → object storage  (StorageProvider)
 *   3. metadata → Postgres  (message, thread, attachment)  under RLS
 *   4. idempotent on Message-ID + mailbox_id
 *
 * AI Rules / classification (step 5) run afterwards as a separate ai-job — this
 * processor only does the deterministic filing.
 */
import { Buffer } from 'node:buffer';
import { inboundJob } from '@souramail/contracts';
import { getDb, schema, withTenant } from '@souramail/db';
import { getStorageProvider } from '@souramail/providers';
import type { Job } from 'bullmq';
import { and, eq } from 'drizzle-orm';
import { simpleParser } from 'mailparser';

const { message, thread, attachment } = schema;

export async function processInbound(
  job: Job,
): Promise<{ messageId: string } | { skipped: 'duplicate' }> {
  const { tenantId, mailboxId, rawMimeBase64, spamScore, isSpam } = inboundJob.parse(job.data);
  const raw = Buffer.from(rawMimeBase64, 'base64');
  const storage = getStorageProvider();

  const parsed = await simpleParser(raw);
  const rfcMessageId = parsed.messageId ?? `no-id-${job.id}`;
  const folder = isSpam ? 'spam' : 'inbox';

  return withTenant(getDb(), tenantId, async (tx) => {
    // Idempotence: Message-ID + mailbox_id (docs/05 §4.1).
    const dupe = await tx
      .select({ id: message.id })
      .from(message)
      .where(and(eq(message.mailboxId, mailboxId), eq(message.rfcMessageId, rfcMessageId)))
      .limit(1);
    if (dupe[0]) return { skipped: 'duplicate' as const };

    const mimeKey = `mime/${tenantId}/${mailboxId}/${crypto.randomUUID()}.eml`;
    await storage.put(mimeKey, raw, 'message/rfc822');

    const subject = parsed.subject ?? null;
    const fromAddr = parsed.from?.value?.[0]?.address ?? 'unknown@unknown';
    const toAddrs = (parsed.to ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to]) : []).flatMap(
      (a) => a.value.map((v) => v.address ?? '').filter(Boolean),
    );

    // Thread: naive grouping by normalised subject within the mailbox.
    const normSubject = subject?.replace(/^((re|fwd?|tr)\s*:\s*)+/i, '').trim() ?? null;
    let threadId: string | undefined;
    if (normSubject) {
      const [t] = await tx
        .select({ id: thread.id })
        .from(thread)
        .where(and(eq(thread.mailboxId, mailboxId), eq(thread.subject, normSubject)))
        .limit(1);
      threadId = t?.id;
      if (!threadId) {
        const [created] = await tx
          .insert(thread)
          .values({ tenantId, mailboxId, subject: normSubject, lastAt: new Date() })
          .returning({ id: thread.id });
        threadId = created?.id;
      } else {
        await tx.update(thread).set({ lastAt: new Date() }).where(eq(thread.id, threadId));
      }
    }

    const [msg] = await tx
      .insert(message)
      .values({
        tenantId,
        mailboxId,
        threadId,
        direction: 'inbound',
        rfcMessageId,
        folder,
        fromAddr,
        toAddrs,
        subject,
        snippet: parsed.text?.slice(0, 280) ?? null,
        mimeKey,
        sizeBytes: raw.byteLength,
        spamScore: spamScore != null ? Math.round(spamScore) : null,
        receivedAt: parsed.date ?? new Date(),
      })
      .returning({ id: message.id });
    const messageId = msg!.id;

    for (const att of parsed.attachments ?? []) {
      const key = `att/${tenantId}/${messageId}/${att.filename ?? att.checksum}`;
      await storage.put(key, att.content, att.contentType ?? 'application/octet-stream');
      await tx.insert(attachment).values({
        tenantId,
        messageId,
        filename: att.filename ?? null,
        contentType: att.contentType ?? null,
        sizeBytes: att.size,
        storageKey: key,
      });
    }

    return { messageId };
  });
}
