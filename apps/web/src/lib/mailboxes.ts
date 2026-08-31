// Server-only: mailbox provisioning (docs/05 §4, Phase 1).
import { randomBytes } from 'node:crypto';
import { PLAN_LIMITS, type Plan } from '@souramail/core';
import {
  countMailboxes,
  getDb,
  insertMailbox,
  listMailboxes,
  type MailboxRow,
  schema,
  withTenant,
} from '@souramail/db';
import { getStalwartAdmin } from '@souramail/providers';
import { and, eq } from 'drizzle-orm';
import { normaliseDomain } from './domains';

const { domain } = schema;

export type StalwartOutcome = 'provisioned' | 'skipped-no-server' | 'error';

export interface ProvisionResult {
  mailbox: MailboxRow;
  /** One-time — shown to the user once, never stored by SouraMAIL. */
  password: string;
  stalwart: StalwartOutcome;
  detail?: string;
}

export class MailboxError extends Error {}

const LOCALPART_RE = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/i;

export async function listMailboxesForDomain(
  tenantId: string,
  domainId: string,
): Promise<MailboxRow[]> {
  return listMailboxes(tenantId, domainId);
}

export async function provisionMailbox(opts: {
  tenantId: string;
  domainId: string;
  plan: Plan;
  localPart: string;
}): Promise<ProvisionResult> {
  const localPart = opts.localPart.trim().toLowerCase();
  if (!LOCALPART_RE.test(localPart)) {
    throw new MailboxError('Use letters, digits, dot, dash or underscore (2–64 chars).');
  }

  const dom = await withTenant(getDb(), opts.tenantId, async (tx) => {
    const [d] = await tx
      .select()
      .from(domain)
      .where(and(eq(domain.id, opts.domainId), eq(domain.tenantId, opts.tenantId)))
      .limit(1);
    return d;
  });
  if (!dom) throw new MailboxError('Domain not found in this workspace.');

  const name = normaliseDomain(dom.name);
  const address = `${localPart}@${name ?? dom.name}`;

  // Plan limit (docs/05 §4.4 — never a hard-blocking of *receiving*, but we do
  // gate creating new addresses).
  const limits = PLAN_LIMITS[opts.plan];
  if (limits.addresses !== 'unlimited') {
    const used = await countMailboxes(opts.tenantId);
    if (used >= limits.addresses) {
      throw new MailboxError(
        `Your ${opts.plan} plan allows ${limits.addresses} addresses. Upgrade for more.`,
      );
    }
  }

  const password = randomBytes(18).toString('base64url');
  const quotaBytes = limits.mailboxBytes;

  // Best-effort Stalwart provisioning. If the mail server isn't wired yet (dev,
  // or before infra/DEPLOY.md is done) we still record the mailbox — a reconcile
  // job pushes it to Stalwart once it's reachable.
  let stalwart: StalwartOutcome = 'skipped-no-server';
  let detail: string | undefined;
  try {
    const admin = await getStalwartAdmin();
    await admin.createDomain(name ?? dom.name).catch(() => {
      /* already registered — fine */
    });
    await admin.createMailbox({ address, secret: password, quotaBytes });
    stalwart = 'provisioned';
  } catch (err) {
    if (
      err instanceof Error &&
      /missing env STALWART_ADMIN_URL|missing env STALWART_ADMIN_SECRET/.test(err.message)
    ) {
      stalwart = 'skipped-no-server';
    } else {
      stalwart = 'error';
      detail = err instanceof Error ? err.message : String(err);
    }
  }

  const { id } = await insertMailbox({
    tenantId: opts.tenantId,
    domainId: opts.domainId,
    address,
    quotaBytes,
  });

  const [row] = await listMailboxes(opts.tenantId, opts.domainId).then((rows) =>
    rows.filter((r) => r.id === id),
  );

  return {
    mailbox: row ?? {
      id,
      domainId: opts.domainId,
      address,
      type: 'mailbox',
      targetMailboxId: null,
      quotaBytes,
      createdAt: new Date(),
    },
    password,
    stalwart,
    detail,
  };
}
