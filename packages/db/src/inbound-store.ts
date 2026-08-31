/**
 * Persist a parsed inbound message under RLS. Shared by the worker (Stalwart
 * path, raw MIME in object storage) and the web webhook (managed/serverless
 * path, parsed bodies inline). Idempotent on Message-ID + mailbox_id.
 */
import { and, eq } from 'drizzle-orm';
import { getDb } from './client.ts';
import { attachment, message, thread } from './schema.ts';
import { withTenant } from './tenant.ts';

export interface StoreInboundInput {
  tenantId: string;
  mailboxId: string;
  rfcMessageId: string;
  fromAddr: string;
  toAddrs: string[];
  subject: string | null;
  snippet: string | null;
  receivedAt: Date;
  sizeBytes: number;
  folder?: string;
  spamScore?: number | null;
  /** Object-storage key for the raw MIME (Stalwart path). */
  mimeKey?: string;
  /** Parsed bodies (managed path — no object storage). */
  bodyText?: string | null;
  bodyHtml?: string | null;
  attachments?: {
    filename: string | null;
    contentType: string | null;
    sizeBytes: number;
    storageKey: string;
  }[];
}

export type StoreInboundResult = { messageId: string } | { skipped: 'duplicate' };

const RE_PREFIX = /^\s*(re|fwd?|tr)\s*:\s*/i;

export async function storeInboundMessage(input: StoreInboundInput): Promise<StoreInboundResult> {
  return withTenant(getDb(), input.tenantId, async (tx) => {
    const dupe = await tx
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.mailboxId, input.mailboxId), eq(message.rfcMessageId, input.rfcMessageId)),
      )
      .limit(1);
    if (dupe[0]) return { skipped: 'duplicate' as const };

    let normSubject = input.subject ?? '';
    let prev: string;
    do {
      prev = normSubject;
      normSubject = normSubject.replace(RE_PREFIX, '');
    } while (normSubject !== prev);
    normSubject = normSubject.trim();

    let threadId: string | undefined;
    if (normSubject) {
      const [t] = await tx
        .select({ id: thread.id })
        .from(thread)
        .where(and(eq(thread.mailboxId, input.mailboxId), eq(thread.subject, normSubject)))
        .limit(1);
      threadId = t?.id;
      if (threadId) {
        await tx.update(thread).set({ lastAt: new Date() }).where(eq(thread.id, threadId));
      } else {
        const [created] = await tx
          .insert(thread)
          .values({
            tenantId: input.tenantId,
            mailboxId: input.mailboxId,
            subject: normSubject,
            lastAt: new Date(),
          })
          .returning({ id: thread.id });
        threadId = created?.id;
      }
    }

    const [msg] = await tx
      .insert(message)
      .values({
        tenantId: input.tenantId,
        mailboxId: input.mailboxId,
        threadId,
        direction: 'inbound',
        rfcMessageId: input.rfcMessageId,
        folder: input.folder ?? 'inbox',
        fromAddr: input.fromAddr,
        toAddrs: input.toAddrs,
        subject: input.subject,
        snippet: input.snippet,
        ...(input.mimeKey ? { mimeKey: input.mimeKey } : {}),
        ...(input.bodyText != null ? { bodyText: input.bodyText } : {}),
        ...(input.bodyHtml != null ? { bodyHtml: input.bodyHtml } : {}),
        sizeBytes: input.sizeBytes,
        spamScore: input.spamScore ?? null,
        receivedAt: input.receivedAt,
      })
      .returning({ id: message.id });
    const messageId = msg!.id;

    for (const att of input.attachments ?? []) {
      await tx.insert(attachment).values({
        tenantId: input.tenantId,
        messageId,
        filename: att.filename,
        contentType: att.contentType,
        sizeBytes: att.sizeBytes,
        storageKey: att.storageKey,
      });
    }

    return { messageId };
  });
}
