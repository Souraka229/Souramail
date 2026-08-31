/**
 * Inbound pipeline (docs/05 §4.1). Consumes `inbound-process` jobs posted by
 * apps/api from Stalwart's MTA hook, after security (auth + Rspamd + ClamAV +
 * reputation) has already decided acceptance and spam placement.
 *
 *   1. parse MIME (mailparser)
 *   2. raw MIME + attachments → object storage when configured
 *   3. metadata → Postgres via storeInboundMessage() — the same rows the managed
 *      inbound webhook (apps/web) writes, so the webmail reads both identically
 *   4. idempotent on Message-ID + mailbox_id
 */
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { inboundJob } from '@souramail/contracts';
import { storeInboundMessage } from '@souramail/db';
import { getStorageProvider } from '@souramail/providers';
import type { Job } from 'bullmq';
import { simpleParser } from 'mailparser';

export async function processInbound(
  job: Job,
): Promise<{ messageId: string } | { skipped: 'duplicate' }> {
  const { tenantId, mailboxId, rawMimeBase64, spamScore, isSpam } = inboundJob.parse(job.data);
  const raw = Buffer.from(rawMimeBase64, 'base64');
  const parsed = await simpleParser(raw);

  let mimeKey: string | undefined;
  const attachments: {
    filename: string | null;
    contentType: string | null;
    sizeBytes: number;
    storageKey: string;
  }[] = [];

  if (process.env.S3_ENDPOINT) {
    const storage = await getStorageProvider();
    mimeKey = `mime/${tenantId}/${mailboxId}/${randomUUID()}.eml`;
    await storage.put(mimeKey, raw, 'message/rfc822');
    for (const att of parsed.attachments ?? []) {
      const key = `att/${tenantId}/${randomUUID()}/${att.filename ?? att.checksum}`;
      await storage.put(key, att.content, att.contentType ?? 'application/octet-stream');
      attachments.push({
        filename: att.filename ?? null,
        contentType: att.contentType ?? null,
        sizeBytes: att.size,
        storageKey: key,
      });
    }
  }

  const toList = parsed.to ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to]) : [];
  const toAddrs = toList.flatMap((a) => a.value.map((v) => v.address ?? '').filter(Boolean));

  return storeInboundMessage({
    tenantId,
    mailboxId,
    rfcMessageId: parsed.messageId ?? `no-id-${job.id}`,
    fromAddr: parsed.from?.value?.[0]?.address ?? 'unknown@unknown',
    toAddrs,
    subject: parsed.subject ?? null,
    snippet: parsed.text?.slice(0, 280) ?? null,
    receivedAt: parsed.date ?? new Date(),
    sizeBytes: raw.byteLength,
    folder: isSpam ? 'spam' : 'inbox',
    spamScore: spamScore != null ? Math.round(spamScore) : null,
    ...(mimeKey
      ? { mimeKey }
      : {
          bodyText: parsed.text ?? null,
          bodyHtml: typeof parsed.html === 'string' ? parsed.html : null,
        }),
    attachments,
  });
}
