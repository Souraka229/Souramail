// Server-only: webmail data access (docs/05 §7). Bridges a SouraMAIL session to
// a Stalwart mailbox over JMAP, using the per-mailbox encrypted app password.
import { randomBytes } from 'node:crypto';
import { decryptSecret, encryptSecret } from '@souramail/core';
import { getDb, schema, withTenant } from '@souramail/db';
import { basicAuth, JmapClient } from '@souramail/jmap';
import { getStalwartAdmin } from '@souramail/providers';
import { and, eq } from 'drizzle-orm';

const { mailbox } = schema;

export class WebmailUnavailable extends Error {}

export interface WebmailClient {
  address: string;
  jmap: JmapClient;
}

function sessionUrl(): string {
  const explicit = process.env.STALWART_JMAP_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const admin = process.env.STALWART_ADMIN_URL;
  if (admin) return `${admin.replace(/\/$/, '')}/.well-known/jmap`;
  throw new WebmailUnavailable('Mail server not configured (STALWART_JMAP_URL).');
}

/** Resolve a webmail JMAP client for a mailbox the session's workspace owns. */
export async function getWebmailClient(
  tenantId: string,
  mailboxId: string,
): Promise<WebmailClient> {
  const keyB64 = process.env.MAIL_SECRET_KEY;
  if (!keyB64) throw new WebmailUnavailable('Mail server not configured (MAIL_SECRET_KEY).');

  const row = await withTenant(getDb(), tenantId, async (tx) => {
    const [m] = await tx
      .select({
        address: mailbox.address,
        enc: mailbox.webmailSecretEnc,
        type: mailbox.type,
      })
      .from(mailbox)
      .where(and(eq(mailbox.id, mailboxId), eq(mailbox.tenantId, tenantId)))
      .limit(1);
    return m;
  });

  if (!row) throw new WebmailUnavailable('Mailbox not found in this workspace.');
  if (row.type === 'alias')
    throw new WebmailUnavailable('Aliases have no inbox — open the target mailbox.');

  // Self-heal: a mailbox created before the mail server was connected has no
  // webmail credential. If Stalwart is reachable now, mint one, register it on
  // the principal, and persist it — the webmail then "just works" from here.
  let enc = row.enc;
  if (!enc) {
    if (!process.env.STALWART_ADMIN_URL) {
      throw new WebmailUnavailable(
        'This mailbox has no webmail credential yet — it lands once the mail server is connected.',
      );
    }
    const fresh = randomBytes(18).toString('base64url');
    try {
      const admin = await getStalwartAdmin();
      await admin.addSecret(row.address, fresh);
    } catch (err) {
      throw new WebmailUnavailable(
        `Could not provision a webmail credential: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    enc = encryptSecret(fresh, keyB64);
    await withTenant(getDb(), tenantId, (tx) =>
      tx.update(mailbox).set({ webmailSecretEnc: enc }).where(eq(mailbox.id, mailboxId)),
    ).catch(() => {
      /* column may predate migration 0002 — the credential still works now */
    });
  }

  const secret = decryptSecret(enc, keyB64);
  return {
    address: row.address,
    jmap: new JmapClient(sessionUrl(), basicAuth(row.address, secret)),
  };
}

/** Map JMAP mailbox roles to the folder names the webmail shows. */
export function folderLabel(role: string | null, name: string): string {
  switch (role) {
    case 'inbox':
      return 'Inbox';
    case 'sent':
      return 'Sent';
    case 'drafts':
      return 'Drafts';
    case 'trash':
      return 'Trash';
    case 'junk':
      return 'Spam';
    case 'archive':
      return 'Archive';
    default:
      return name;
  }
}
