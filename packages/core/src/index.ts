/**
 * Domain logic that is transport-agnostic: plan limits, quota checks, abuse scoring,
 * email-health scoring, rule-graph validation. Pure functions where possible.
 *
 * Phase 0: plan limits + quota check + abuse score skeleton. Everything else is a
 * typed stub to be filled in its phase.
 */

export type Plan = 'free' | 'pro' | 'business';

export interface PlanLimits {
  domains: number | 'unlimited';
  addresses: number | 'unlimited';
  mailboxBytes: number;
  dailySend: number;
  aiActionsPerDay: number | 'unlimited';
}

/** Source of truth: docs/01 §44, docs/03 §19-21. */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    domains: 1,
    addresses: 3,
    mailboxBytes: 1_073_741_824,
    dailySend: 100,
    aiActionsPerDay: 20,
  },
  pro: {
    domains: 'unlimited',
    addresses: 'unlimited',
    mailboxBytes: 10_737_418_240,
    dailySend: 5_000,
    aiActionsPerDay: 'unlimited',
  },
  business: {
    domains: 'unlimited',
    addresses: 'unlimited',
    mailboxBytes: 53_687_091_200,
    dailySend: 50_000,
    aiActionsPerDay: 'unlimited',
  },
};

export interface QuotaCheck {
  allowed: boolean;
  metric: string;
  used: number;
  limit: number | 'unlimited';
  remaining: number | 'unlimited';
}

export function checkQuota(
  plan: Plan,
  metric: keyof Pick<PlanLimits, 'dailySend' | 'aiActionsPerDay' | 'domains' | 'addresses'>,
  used: number,
): QuotaCheck {
  const limit = PLAN_LIMITS[plan][metric];
  if (limit === 'unlimited') {
    return { allowed: true, metric, used, limit, remaining: 'unlimited' };
  }
  return {
    allowed: used < limit,
    metric,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

// ─── abuse scoring (docs/02 §77, docs/03 §53) — skeleton ─────────────────
export interface AbuseSignals {
  accountAgeDays: number;
  bounceRate: number; // 0..1
  complaintRate: number; // 0..1
  sendVelocityPerHour: number;
  recipientDiversity: number; // 0..1, 1 = very diverse
  paymentInGoodStanding: boolean;
}

/** Returns 0 (low risk) .. 100 (critical). Dynamic send limits derive from this. */
export function abuseScore(s: AbuseSignals): number {
  let score = 0;
  if (s.accountAgeDays < 7) score += 15;
  score += Math.min(35, s.bounceRate * 100 * 3.5);
  score += Math.min(35, s.complaintRate * 100 * 20);
  if (s.sendVelocityPerHour > 200) score += 10;
  if (s.recipientDiversity < 0.15) score += 10;
  if (!s.paymentInGoodStanding) score += 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function riskBand(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 20) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 80) return 'high';
  return 'critical';
}

// ─── secret box (AES-256-GCM) — webmail credential at rest ──────────────
export { decryptSecret, encryptSecret, generateMailSecretKey } from './crypto.ts';
// ─── DNS provider fingerprinting (docs/05 §8) ───────────────────────────
export {
  DNS_PROVIDER_SIGNATURES,
  type DnsProviderGuess,
  detectDnsProviderFromNameservers,
} from './dns-provider.ts';
// ─── owned domain vs platform subdomain (docs/05 Phase 3) ───────────────
export {
  classifyDomain,
  type DomainKind,
  PLATFORM_SUBDOMAINS,
  type PlatformSubdomain,
  platformDomainMessage,
} from './domain-kind.ts';
// ─── email onboarding: expected DNS + health score (docs/05 §8) ──────────
export {
  DEFAULT_SENDING_CONFIG,
  type DnsRecordState,
  type DnsRecordType,
  type ExpectedDnsRecord,
  emailHealthScore,
  expectedDnsRecords,
  HEALTH_WEIGHTS,
  type HealthCategory,
  type HealthResult,
  healthBand,
  type ScoredRecord,
  type SendingConfig,
} from './email-health.ts';
