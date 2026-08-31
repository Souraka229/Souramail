// Server-only: webmail facade (docs/05 §7). One interface, two backends:
//   - JMAP (Stalwart) when STALWART_JMAP_URL is set — real mailbox, folders, push
//   - DB fallback (managed/serverless path) — reads the `message` table that the
//     inbound webhook fills; compose goes straight through EmailProvider
import { randomBytes } from 'node:crypto';
import { decryptSecret, encryptSecret } from '@souramail/core';
import { getDb, schema, withTenant } from '@souramail/db';
import { basicAuth, emailText, JmapClient } from '@souramail/jmap';
import { getEmailProvider, getStalwartAdmin } from '@souramail/providers';
import { and, desc, eq, sql } from 'drizzle-orm';

const { mailbox, message, outboundJob } = schema;

export class WebmailUnavailable extends Error {}

export interface MailFolder {
  id: string;
  label: string;
  unread: number;
}
export interface MailListItem {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  unread: boolean;
}
export interface MailMessage extends MailListItem {
  text: string;
  inReplyTo?: string;
}
export interface SendInput {
  to: string[];
  subject: string;
  text: string;
  inReplyTo?: string;
}

export interface Mailbox {
  address: string;
  backend: 'jmap' | 'db';
  folders(): Promise<MailFolder[]>;
  list(folderId: string, limit?: number): Promise<MailListItem[]>;
  get(id: string): Promise<MailMessage | null>;
  markRead(id: string, seen: boolean): Promise<void>;
  send(msg: SendInput): Promise<void>;
}

/** Resolve a webmail interface for a mailbox the session's workspace owns. */
export async function getMailbox(tenantId: string, mailboxId: string): Promise<Mailbox> {
  const row = await withTenant(getDb(), tenantId, async (tx) => {
    const [m] = await tx
      .select({ address: mailbox.address, enc: mailbox.webmailSecretEnc, type: mailbox.type })
      .from(mailbox)
      .where(and(eq(mailbox.id, mailboxId), eq(mailbox.tenantId, tenantId)))
      .limit(1);
    return m;
  });
  if (!row) throw new WebmailUnavailable('Mailbox not found in this workspace.');
  if (row.type === 'alias')
    throw new WebmailUnavailable('Aliases have no inbox — open the target mailbox.');

  return process.env.STALWART_JMAP_URL
    ? jmapBackend(tenantId, mailboxId, row.address, row.enc)
    : dbBackend(tenantId, mailboxId, row.address);
}

// ─── DB backend (managed path) ───────────────────────────────────────────

const FOLDER_LABEL: Record<string, string> = {
  inbox: 'Inbox',
  sent: 'Sent',
  spam: 'Spam',
  trash: 'Trash',
  drafts: 'Drafts',
};

function dbBackend(tenantId: string, mailboxId: string, address: string): Mailbox {
  const seen = (flags: string[]) => flags.some((f) => f === '\\Seen' || f === '$seen');

  return {
    address,
    backend: 'db',
    async folders() {
      const rows = await withTenant(getDb(), tenantId, (tx) =>
        tx
          .select({
            folder: message.folder,
            total: sql<number>`count(*)::int`,
            unread: sql<number>`count(*) filter (where not (message.flags ? '\\Seen') and not (message.flags ? '$seen'))::int`,
          })
          .from(message)
          .where(eq(message.mailboxId, mailboxId))
          .groupBy(message.folder),
      );
      const present = new Map(rows.map((r) => [r.folder, r.unread]));
      if (!present.has('inbox')) present.set('inbox', 0);
      return [...present.entries()]
        .sort((a, b) => (a[0] === 'inbox' ? -1 : b[0] === 'inbox' ? 1 : a[0].localeCompare(b[0])))
        .map(([id, unread]) => ({ id, label: FOLDER_LABEL[id] ?? id, unread }));
    },
    async list(folderId, limit = 40) {
      const rows = await withTenant(getDb(), tenantId, (tx) =>
        tx
          .select()
          .from(message)
          .where(and(eq(message.mailboxId, mailboxId), eq(message.folder, folderId)))
          .orderBy(desc(message.receivedAt))
          .limit(limit),
      );
      return rows.map((m) => ({
        id: m.id,
        from: m.fromAddr,
        subject: m.subject ?? '(no subject)',
        preview: m.snippet ?? '',
        date: m.receivedAt.toISOString(),
        unread: !seen(m.flags),
      }));
    },
    async get(id) {
      const [m] = await withTenant(getDb(), tenantId, (tx) =>
        tx
          .select()
          .from(message)
          .where(and(eq(message.id, id), eq(message.mailboxId, mailboxId)))
          .limit(1),
      );
      if (!m) return null;
      return {
        id: m.id,
        from: m.fromAddr,
        subject: m.subject ?? '(no subject)',
        preview: m.snippet ?? '',
        date: m.receivedAt.toISOString(),
        unread: !seen(m.flags),
        text: m.bodyText ?? (m.bodyHtml ? stripHtml(m.bodyHtml) : (m.snippet ?? '')),
        inReplyTo: m.rfcMessageId ?? undefined,
      };
    },
    async markRead(id, wantSeen) {
      await withTenant(getDb(), tenantId, async (tx) => {
        const [m] = await tx
          .select({ flags: message.flags })
          .from(message)
          .where(eq(message.id, id))
          .limit(1);
        if (!m) return;
        const next = new Set(m.flags);
        if (wantSeen) next.add('\\Seen');
        else next.delete('\\Seen');
        await tx
          .update(message)
          .set({ flags: [...next] })
          .where(eq(message.id, id));
      });
    },
    async send(msg) {
      const email = await getEmailProvider();
      const { providerMessageId } = await email.send({
        from: address,
        to: msg.to,
        subject: msg.subject || '(no subject)',
        text: msg.text,
        tenantId,
        returnPath: 'bounce@bounce.souramail.com',
        headers: msg.inReplyTo ? { 'In-Reply-To': msg.inReplyTo } : undefined,
      });
      await withTenant(getDb(), tenantId, async (tx) => {
        const [saved] = await tx
          .insert(message)
          .values({
            tenantId,
            mailboxId,
            direction: 'outbound',
            folder: 'sent',
            fromAddr: address,
            toAddrs: msg.to,
            subject: msg.subject || '(no subject)',
            snippet: msg.text.slice(0, 280),
            bodyText: msg.text,
            flags: ['\\Seen'],
            sizeBytes: Buffer.byteLength(msg.text),
            receivedAt: new Date(),
          })
          .returning({ id: message.id });
        await tx.insert(outboundJob).values({
          tenantId,
          messageId: saved?.id,
          status: 'sent',
          provider: email.name,
          providerMessageId,
        });
      });
    },
  };
}

// ─── JMAP backend (Stalwart path) ────────────────────────────────────────

function jmapBackend(
  tenantId: string,
  mailboxId: string,
  address: string,
  enc: string | null,
): Mailbox {
  let clientP: Promise<JmapClient> | undefined;
  const client = () => {
    clientP ??= (async () => {
      const keyB64 = process.env.MAIL_SECRET_KEY;
      if (!keyB64) throw new WebmailUnavailable('Mail server not configured (MAIL_SECRET_KEY).');
      let secretEnc = enc;
      if (!secretEnc && process.env.STALWART_ADMIN_URL) {
        const fresh = randomBytes(18).toString('base64url');
        const admin = await getStalwartAdmin();
        await admin.addSecret(address, fresh);
        secretEnc = encryptSecret(fresh, keyB64);
        await withTenant(getDb(), tenantId, (tx) =>
          tx.update(mailbox).set({ webmailSecretEnc: secretEnc }).where(eq(mailbox.id, mailboxId)),
        ).catch(() => {});
      }
      if (!secretEnc) throw new WebmailUnavailable('This mailbox has no webmail credential yet.');
      return new JmapClient(sessionUrl(), basicAuth(address, decryptSecret(secretEnc, keyB64)));
    })();
    return clientP;
  };

  const roleLabel: Record<string, string> = {
    inbox: 'Inbox',
    sent: 'Sent',
    drafts: 'Drafts',
    trash: 'Trash',
    junk: 'Spam',
    archive: 'Archive',
  };

  return {
    address,
    backend: 'jmap',
    async folders() {
      const fs = await (await client()).listMailboxes();
      return fs.map((f) => ({
        id: f.id,
        label: roleLabel[f.role ?? ''] ?? f.name,
        unread: f.unreadEmails,
      }));
    },
    async list(folderId, limit = 40) {
      const { emails } = await (await client()).listEmails({ mailboxId: folderId, limit });
      return emails.map((m) => ({
        id: m.id,
        from: m.from?.[0]?.name || m.from?.[0]?.email || 'Unknown',
        subject: m.subject || '(no subject)',
        preview: m.preview ?? '',
        date: m.receivedAt,
        unread: !m.keywords?.$seen,
      }));
    },
    async get(id) {
      const m = await (await client()).getEmail(id);
      if (!m) return null;
      return {
        id: m.id,
        from: m.from?.[0]?.name
          ? `${m.from[0].name} <${m.from[0].email}>`
          : (m.from?.[0]?.email ?? ''),
        subject: m.subject || '(no subject)',
        preview: m.preview ?? '',
        date: m.receivedAt,
        unread: !m.keywords?.$seen,
        text: emailText(m),
        inReplyTo: m.messageId?.[0],
      };
    },
    async markRead(id, seen) {
      await (await client()).setKeywords(id, { $seen: seen });
    },
    async send(msg) {
      const c = await client();
      const fs = await c.listMailboxes();
      const drafts = fs.find((f) => f.role === 'drafts');
      const sent = fs.find((f) => f.role === 'sent');
      if (!drafts) throw new WebmailUnavailable('This mailbox has no Drafts folder.');
      await c.sendEmail({
        from: address,
        to: msg.to,
        subject: msg.subject || '(no subject)',
        text: msg.text,
        draftsMailboxId: drafts.id,
        sentMailboxId: sent?.id,
        inReplyTo: msg.inReplyTo,
      });
    },
  };
}

function sessionUrl(): string {
  const explicit = process.env.STALWART_JMAP_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const admin = process.env.STALWART_ADMIN_URL;
  if (admin) return `${admin.replace(/\/$/, '')}/.well-known/jmap`;
  throw new WebmailUnavailable('Mail server not configured (STALWART_JMAP_URL).');
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
