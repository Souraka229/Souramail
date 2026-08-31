/**
 * Email onboarding domain logic — pure functions, no IO.
 *
 * Two jobs:
 *  1. `expectedDnsRecords()` — given a customer domain + the SouraMAIL sending
 *     config, produce the exact MX / SPF / DKIM / DMARC records the domain needs.
 *  2. `emailHealthScore()` — given expected-vs-observed record states, produce the
 *     0–100 "Email Health" score shown in the product (docs/05 §8).
 *
 * The DNS *lookup* (resolving what's actually published) is IO and lives in the
 * app layer; it feeds observed values back into `scoreRecords()`.
 */

export type DnsRecordType = 'MX' | 'TXT' | 'CNAME' | 'A' | 'AAAA';
export type DnsRecordState = 'missing' | 'pending' | 'verified';

export interface ExpectedDnsRecord {
  /** Stable id so the UI can diff expected vs observed. */
  key: string;
  type: DnsRecordType;
  /** Host name, already fully-qualified for the customer domain. */
  name: string;
  /** Value the customer must publish. For MX, host only (see `priority`). */
  expectedValue: string;
  priority?: number;
  /** Can SouraMAIL write this itself if the DNS provider is connected? */
  autoFixable: boolean;
  /** Which health category this record contributes to. */
  category: HealthCategory;
  /** Short human explanation for the onboarding UI. */
  purpose: string;
}

export interface SendingConfig {
  /** Dedicated sending subdomain, e.g. `send.souramail.com` (never the root). */
  sendingDomain: string;
  /** Host mail is routed to for inbound, e.g. `mx1.souramail.com`. */
  mxHost: string;
  /** DKIM selector, e.g. `soura`. */
  dkimSelector: string;
  /** Base64 public key body for the DKIM TXT record (no `v=DKIM1;` prefix). */
  dkimPublicKey: string;
  /** Address that receives DMARC aggregate reports. */
  dmarcRua: string;
}

export const DEFAULT_SENDING_CONFIG: SendingConfig = {
  sendingDomain: 'send.souramail.com',
  mxHost: 'mx1.souramail.com',
  dkimSelector: 'soura',
  dkimPublicKey: 'REPLACE_WITH_GENERATED_DKIM_PUBLIC_KEY',
  dmarcRua: 'mailto:dmarc@souramail.com',
};

export function expectedDnsRecords(
  domain: string,
  config: SendingConfig = DEFAULT_SENDING_CONFIG,
): ExpectedDnsRecord[] {
  const d = domain.trim().toLowerCase().replace(/\.$/, '');
  return [
    {
      key: 'mx',
      type: 'MX',
      name: d,
      expectedValue: config.mxHost,
      priority: 10,
      autoFixable: true,
      category: 'deliverability',
      purpose: 'Routes inbound mail for your domain to SouraMAIL.',
    },
    {
      key: 'spf',
      type: 'TXT',
      name: d,
      expectedValue: `v=spf1 include:_spf.${rootOf(config.sendingDomain)} ~all`,
      autoFixable: true,
      category: 'authentication',
      purpose: 'Authorises SouraMAIL to send on behalf of your domain (SPF).',
    },
    {
      key: 'dkim',
      type: 'TXT',
      name: `${config.dkimSelector}._domainkey.${d}`,
      expectedValue: `v=DKIM1; k=rsa; p=${config.dkimPublicKey}`,
      autoFixable: true,
      category: 'authentication',
      purpose: 'Lets receivers cryptographically verify your mail (DKIM).',
    },
    {
      key: 'dmarc',
      type: 'TXT',
      name: `_dmarc.${d}`,
      expectedValue: `v=DMARC1; p=none; rua=${config.dmarcRua}; adkim=s; aspf=s`,
      autoFixable: true,
      category: 'authentication',
      purpose: 'Sets your DMARC policy and turns on reporting (start at p=none).',
    },
  ];
}

/** `send.souramail.com` -> `souramail.com` (naive: last two labels). */
function rootOf(host: string): string {
  const parts = host.split('.');
  return parts.length <= 2 ? host : parts.slice(-2).join('.');
}

// ─── health scoring ────────────────────────────────────────────────────────

export type HealthCategory =
  | 'authentication'
  | 'deliverability'
  | 'security'
  | 'dns'
  | 'reputation';

/** Weights sum to 100 (docs/05 §8). */
export const HEALTH_WEIGHTS: Record<HealthCategory, number> = {
  authentication: 40,
  deliverability: 25,
  dns: 15,
  security: 10,
  reputation: 10,
};

export interface ScoredRecord {
  key: string;
  category: HealthCategory;
  state: DnsRecordState;
}

export interface HealthResult {
  score: number; // 0..100
  band: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
  byCategory: Record<HealthCategory, { earned: number; possible: number }>;
}

/**
 * Score = sum over categories of `weight * (verified share of that category)`.
 * `pending` counts as half credit; `missing` as zero. Categories with no records
 * are treated as fully satisfied (nothing to fix there yet).
 */
export function emailHealthScore(records: ScoredRecord[]): HealthResult {
  const cats = Object.keys(HEALTH_WEIGHTS) as HealthCategory[];
  const byCategory = {} as HealthResult['byCategory'];
  let score = 0;

  for (const cat of cats) {
    const weight = HEALTH_WEIGHTS[cat];
    const inCat = records.filter((r) => r.category === cat);
    if (inCat.length === 0) {
      byCategory[cat] = { earned: weight, possible: weight };
      score += weight;
      continue;
    }
    const credit = inCat.reduce((sum, r) => sum + stateCredit(r.state), 0) / inCat.length;
    const earned = weight * credit;
    byCategory[cat] = { earned: round1(earned), possible: weight };
    score += earned;
  }

  const rounded = Math.round(score);
  return { score: rounded, band: healthBand(rounded), byCategory };
}

function stateCredit(state: DnsRecordState): number {
  return state === 'verified' ? 1 : state === 'pending' ? 0.5 : 0;
}

export function healthBand(score: number): HealthResult['band'] {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 25) return 'poor';
  return 'critical';
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
