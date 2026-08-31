/**
 * Mailbox reads/writes.
 *
 * `resolveMailboxByAddress()` runs *before* a tenant context (the Stalwart
 * MTA-hook only knows the recipient address) and goes through the
 * `mailbox_by_address(text)` SECURITY DEFINER function — the one sanctioned way
 * across that boundary. Everything else is tenant-scoped through `withTenant`.
 */
import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { type Db, getDb } from './client.ts';
import { domain, mailbox } from './schema.ts';
import { withTenant } from './tenant.ts';

export interface ResolvedMailbox {
  mailboxId: string;
  tenantId: string;
  type: 'mailbox' | 'alias';
  targetMailboxId: string | null;
}

export async function resolveMailboxByAddress(
  address: string,
  db: Db = getDb(),
): Promise<ResolvedMailbox | null> {
  const res = await db.execute<{
    mailbox_id: string;
    tenant_id: string;
    mailbox_type: 'mailbox' | 'alias';
    target_mailbox_id: string | null;
  }>(sql`select * from mailbox_by_address(${address})`);
  const rows = (res as unknown as { rows?: unknown[] }).rows ?? (res as unknown as unknown[]);
  const r = rows[0] as
    | {
        mailbox_id: string;
        tenant_id: string;
        mailbox_type: 'mailbox' | 'alias';
        target_mailbox_id: string | null;
      }
    | undefined;
  if (!r) return null;
  return {
    mailboxId: r.mailbox_id,
    tenantId: r.tenant_id,
    type: r.mailbox_type,
    targetMailboxId: r.target_mailbox_id,
  };
}

export interface MailboxRow {
  id: string;
  domainId: string;
  address: string;
  type: 'mailbox' | 'alias';
  targetMailboxId: string | null;
  quotaBytes: number;
  createdAt: Date;
}

export async function listMailboxes(tenantId: string, domainId: string): Promise<MailboxRow[]> {
  return withTenant(getDb(), tenantId, (tx) =>
    tx.select().from(mailbox).where(eq(mailbox.domainId, domainId)).orderBy(mailbox.address),
  ) as Promise<MailboxRow[]>;
}

/** Every mailbox in the workspace, across all domains. */
export async function listAllMailboxes(tenantId: string): Promise<MailboxRow[]> {
  return withTenant(getDb(), tenantId, (tx) =>
    tx.select().from(mailbox).orderBy(mailbox.address),
  ) as Promise<MailboxRow[]>;
}

export async function countMailboxes(tenantId: string): Promise<number> {
  return withTenant(getDb(), tenantId, async (tx) => {
    const [row] = await tx.select({ n: sql<number>`count(*)::int` }).from(mailbox);
    return row?.n ?? 0;
  });
}

export interface CreateMailboxRow {
  tenantId: string;
  domainId: string;
  address: string;
  quotaBytes: number;
  type?: 'mailbox' | 'alias';
  targetMailboxId?: string;
  /** AES-GCM box of the webmail-only app password (see schema). */
  webmailSecretEnc?: string;
}

/** Insert the metadata row. The actual account lives in Stalwart (StalwartAdmin). */
export async function insertMailbox(input: CreateMailboxRow): Promise<{ id: string }> {
  const id = randomUUID();
  await withTenant(getDb(), input.tenantId, async (tx) => {
    // guard: the domain must belong to this tenant (RLS already enforces it, but
    // a clear error beats a silent 0-row insert)
    const [d] = await tx
      .select({ id: domain.id })
      .from(domain)
      .where(and(eq(domain.id, input.domainId), eq(domain.tenantId, input.tenantId)))
      .limit(1);
    if (!d) throw new Error('insertMailbox: domain not found in this workspace');

    await tx.insert(mailbox).values({
      id,
      tenantId: input.tenantId,
      domainId: input.domainId,
      address: input.address.toLowerCase(),
      type: input.type ?? 'mailbox',
      targetMailboxId: input.targetMailboxId ?? null,
      quotaBytes: input.quotaBytes,
      webmailSecretEnc: input.webmailSecretEnc ?? null,
    });
  });
  return { id };
}

export async function deleteMailbox(tenantId: string, id: string): Promise<void> {
  await withTenant(getDb(), tenantId, (tx) => tx.delete(mailbox).where(eq(mailbox.id, id)));
}
