import { describe, expect, it } from 'vitest';
import { abuseScore, checkQuota, riskBand } from '../src/index.ts';

describe('checkQuota', () => {
  it('blocks a free account at its daily send limit', () => {
    expect(checkQuota('free', 'dailySend', 100).allowed).toBe(false);
    expect(checkQuota('free', 'dailySend', 82)).toMatchObject({ allowed: true, remaining: 18 });
  });

  it('never blocks unlimited metrics on pro', () => {
    const q = checkQuota('pro', 'aiActionsPerDay', 999_999);
    expect(q.allowed).toBe(true);
    expect(q.remaining).toBe('unlimited');
  });

  it('applies pro higher-but-finite daily send limit', () => {
    expect(checkQuota('pro', 'dailySend', 4_000).allowed).toBe(true);
    expect(checkQuota('pro', 'dailySend', 5_000).allowed).toBe(false);
  });
});

describe('abuseScore', () => {
  it('scores a fresh account with high complaints as high/critical', () => {
    const score = abuseScore({
      accountAgeDays: 1,
      bounceRate: 0.05,
      complaintRate: 0.02,
      sendVelocityPerHour: 300,
      recipientDiversity: 0.1,
      paymentInGoodStanding: false,
    });
    expect(score).toBeGreaterThan(50);
    expect(['high', 'critical']).toContain(riskBand(score));
  });

  it('scores an established clean account as low', () => {
    const score = abuseScore({
      accountAgeDays: 120,
      bounceRate: 0.005,
      complaintRate: 0,
      sendVelocityPerHour: 20,
      recipientDiversity: 0.8,
      paymentInGoodStanding: true,
    });
    expect(riskBand(score)).toBe('low');
  });
});
