// Server-only: domain onboarding + DNS scanning for Phase 1 (no mail server yet).
import { promises as dns } from 'node:dns';
import {
  classifyDomain,
  DEFAULT_SENDING_CONFIG,
  type DnsRecordState,
  detectDnsProviderFromNameservers,
  emailHealthScore,
  expectedDnsRecords,
  type HealthResult,
  platformDomainMessage,
  type ScoredRecord,
} from '@souramail/core';
import { getDb, schema, withTenant } from '@souramail/db';
import { type DnsRecordInput, getDnsProvider } from '@souramail/providers';
import { and, eq } from 'drizzle-orm';

const { domain, dnsRecord } = schema;

export interface DomainRow {
  id: string;
  name: string;
  status: string;
  dnsProvider: string | null;
  healthScore: number;
  verifiedAt: Date | null;
  createdAt: Date;
}

export interface DnsRecordRow {
  id: string;
  key: string;
  type: string;
  name: string;
  expectedValue: string;
  observedValue: string | null;
  state: DnsRecordState;
  autoFixable: boolean;
  purpose: string;
}

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

export function normaliseDomain(raw: string): string | null {
  let d = raw.trim().toLowerCase();
  d = d
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '');
  if (d.startsWith('www.')) d = d.slice(4);
  return DOMAIN_RE.test(d) ? d : null;
}

export async function listDomains(tenantId: string): Promise<DomainRow[]> {
  return withTenant(getDb(), tenantId, (tx) =>
    tx.select().from(domain).orderBy(domain.createdAt),
  ) as Promise<DomainRow[]>;
}

export async function getDomainWithRecords(
  tenantId: string,
  domainId: string,
): Promise<{ domain: DomainRow; records: DnsRecordRow[] } | null> {
  return withTenant(getDb(), tenantId, async (tx) => {
    const [row] = await tx.select().from(domain).where(eq(domain.id, domainId)).limit(1);
    if (!row) return null;
    const recs = await tx
      .select()
      .from(dnsRecord)
      .where(eq(dnsRecord.domainId, domainId))
      .orderBy(dnsRecord.createdAt);
    return {
      domain: row as DomainRow,
      records: recs.map((r) => ({
        id: r.id,
        key: keyFromName(r.name, r.type),
        type: r.type,
        name: r.name,
        expectedValue: r.expectedValue,
        observedValue: r.observedValue,
        state: r.state as DnsRecordState,
        autoFixable: r.autoFixable,
        purpose: purposeFor(keyFromName(r.name, r.type)),
      })),
    };
  });
}

export class DomainError extends Error {}

/** Add a domain: persist it + the expected MX/SPF/DKIM/DMARC records. */
export async function createDomain(tenantId: string, rawName: string): Promise<string> {
  const name = normaliseDomain(rawName);
  if (!name) throw new DomainError('That does not look like a valid domain name.');

  const kind = classifyDomain(name);
  if (kind.kind !== 'owned') {
    throw new DomainError(platformDomainMessage(kind.label, name));
  }

  const provider = await detectProvider(name);
  const expected = expectedDnsRecords(name, DEFAULT_SENDING_CONFIG);

  return withTenant(getDb(), tenantId, async (tx) => {
    const existing = await tx
      .select({ id: domain.id })
      .from(domain)
      .where(and(eq(domain.tenantId, tenantId), eq(domain.name, name)))
      .limit(1);
    if (existing[0]) throw new DomainError('That domain is already connected.');

    const [row] = await tx
      .insert(domain)
      .values({ tenantId, name, status: 'pending', dnsProvider: provider })
      .returning({ id: domain.id });
    if (!row) throw new DomainError('Could not create the domain. Please try again.');
    const domainId = row.id;

    await tx.insert(dnsRecord).values(
      expected.map((e) => ({
        tenantId,
        domainId,
        type: e.type,
        name: e.name,
        expectedValue:
          e.type === 'MX' && e.priority != null
            ? `${e.priority} ${e.expectedValue}`
            : e.expectedValue,
        state: 'missing' as const,
        autoFixable: e.autoFixable,
      })),
    );

    return domainId;
  });
}

/** Resolve live DNS, diff against expected, persist states + recompute health. */
export async function scanDomain(tenantId: string, domainId: string): Promise<HealthResult | null> {
  const found = await getDomainWithRecords(tenantId, domainId);
  if (!found) return null;

  const scored: ScoredRecord[] = [];
  const updates: { id: string; observedValue: string | null; state: DnsRecordState }[] = [];

  for (const rec of found.records) {
    const observed = await resolveRecord(rec.type, rec.name);
    const state = matchState(rec, observed);
    updates.push({ id: rec.id, observedValue: observed.join(' | ') || null, state });
    scored.push({ key: rec.key, category: categoryFor(rec.key), state });
  }

  const health = emailHealthScore(scored);
  const allVerified = updates.every((u) => u.state === 'verified');

  await withTenant(getDb(), tenantId, async (tx) => {
    for (const u of updates) {
      await tx
        .update(dnsRecord)
        .set({ observedValue: u.observedValue, state: u.state, updatedAt: new Date() })
        .where(eq(dnsRecord.id, u.id));
    }
    await tx
      .update(domain)
      .set({
        healthScore: health.score,
        status: allVerified ? 'active' : 'verifying',
        verifiedAt: allVerified ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(domain.id, domainId));
  });

  return health;
}

export interface AutoFixResult {
  applied: boolean;
  reason?: string;
  health?: HealthResult | null;
}

/**
 * "Fix automatically" (docs/05 §8, §4.1). If a scoped Cloudflare token is
 * configured *and* the domain is on Cloudflare, write the expected MX/SPF/DKIM/
 * DMARC records, then re-scan. Otherwise this is a no-op and the guided
 * copy/Verify flow stays the path.
 */
export async function autoFixDns(tenantId: string, domainId: string): Promise<AutoFixResult> {
  const found = await getDomainWithRecords(tenantId, domainId);
  if (!found) return { applied: false, reason: 'not-found' };

  const provider = await getDnsProvider();
  if (!provider) return { applied: false, reason: 'no-token' };

  const detected = await provider.detect(found.domain.name).catch(() => null);
  if (!detected?.canAutoConfigure) {
    return { applied: false, reason: 'provider-not-auto-configurable' };
  }

  const inputs: DnsRecordInput[] = found.records.map((r) => {
    if (r.type === 'MX') {
      const [prio, ...host] = r.expectedValue.split(' ');
      return {
        type: 'MX',
        name: r.name,
        value: host.join(' ') || r.expectedValue,
        priority: Number(prio) || 10,
      };
    }
    return { type: r.type as DnsRecordInput['type'], name: r.name, value: r.expectedValue };
  });

  try {
    await provider.createRecords?.(found.domain.name, inputs);
  } catch (err) {
    return { applied: false, reason: err instanceof Error ? err.message : String(err) };
  }

  const health = await scanDomain(tenantId, domainId);
  return { applied: true, health };
}

// ─── DNS helpers ──────────────────────────────────────────────────────────

async function detectProvider(name: string): Promise<string | null> {
  try {
    const ns = await dns.resolveNs(name);
    return detectDnsProviderFromNameservers(ns).provider;
  } catch {
    return null;
  }
}

async function resolveRecord(type: string, name: string): Promise<string[]> {
  try {
    if (type === 'MX') {
      const mx = await dns.resolveMx(name);
      return mx.map((m) => `${m.priority} ${m.exchange.replace(/\.$/, '')}`);
    }
    if (type === 'TXT') {
      const txt = await dns.resolveTxt(name);
      return txt.map((chunks) => chunks.join(''));
    }
    if (type === 'CNAME') return await dns.resolveCname(name);
    if (type === 'A') return await dns.resolve4(name);
    if (type === 'AAAA') return await dns.resolve6(name);
  } catch {
    // NXDOMAIN / ENODATA / timeout — treated as "not published yet".
  }
  return [];
}

function matchState(rec: DnsRecordRow, observed: string[]): DnsRecordState {
  if (observed.length === 0) return 'missing';
  const want = rec.expectedValue.toLowerCase().replace(/\s+/g, ' ').trim();
  const norm = observed.map((o) => o.toLowerCase().replace(/\s+/g, ' ').trim());
  if (norm.some((o) => o === want)) return 'verified';

  // Partial credit: SPF/DMARC present but not exactly ours; MX host present.
  if (rec.type === 'MX') {
    const host = want.split(' ').pop() ?? want;
    return norm.some((o) => o.endsWith(host)) ? 'pending' : 'missing';
  }
  const tag = want.split(';')[0];
  return tag && norm.some((o) => o.startsWith(tag)) ? 'pending' : 'missing';
}

function keyFromName(name: string, type: string): string {
  if (type === 'MX') return 'mx';
  if (name.startsWith('_dmarc.')) return 'dmarc';
  if (name.includes('._domainkey.')) return 'dkim';
  return 'spf';
}

function categoryFor(key: string): ScoredRecord['category'] {
  return key === 'mx' ? 'deliverability' : 'authentication';
}

function purposeFor(key: string): string {
  return (
    (
      {
        mx: 'Routes inbound mail for your domain to SouraMAIL.',
        spf: 'Authorises SouraMAIL to send on behalf of your domain (SPF).',
        dkim: 'Lets receivers cryptographically verify your mail (DKIM).',
        dmarc: 'Sets your DMARC policy and turns on reporting (start at p=none).',
      } as Record<string, string>
    )[key] ?? ''
  );
}
