import { describe, expect, it } from 'vitest';
import {
  detectDnsProviderFromNameservers,
  emailHealthScore,
  expectedDnsRecords,
  type ScoredRecord,
} from '../src/index.ts';

describe('expectedDnsRecords', () => {
  it('produces MX + SPF + DKIM + DMARC for a domain', () => {
    const recs = expectedDnsRecords('MyApp.com.');
    expect(recs.map((r) => r.key)).toEqual(['mx', 'spf', 'dkim', 'dmarc']);
    expect(recs.find((r) => r.key === 'mx')?.name).toBe('myapp.com');
    expect(recs.find((r) => r.key === 'dkim')?.name).toBe('soura._domainkey.myapp.com');
    expect(recs.find((r) => r.key === 'dmarc')?.name).toBe('_dmarc.myapp.com');
    expect(recs.find((r) => r.key === 'spf')?.expectedValue).toContain(
      'include:_spf.souramail.com',
    );
  });
});

describe('emailHealthScore', () => {
  const recs = (state: ScoredRecord['state']): ScoredRecord[] => [
    { key: 'mx', category: 'deliverability', state },
    { key: 'spf', category: 'authentication', state },
    { key: 'dkim', category: 'authentication', state },
    { key: 'dmarc', category: 'authentication', state },
  ];

  it('is 100 / excellent when everything verifies', () => {
    const r = emailHealthScore(recs('verified'));
    expect(r.score).toBe(100);
    expect(r.band).toBe('excellent');
  });

  it('drops to critical when everything is missing', () => {
    const r = emailHealthScore(recs('missing'));
    // security + dns + reputation have no records => full credit (35); auth+deliverability = 0
    expect(r.score).toBe(35);
    expect(r.band).toBe('poor');
  });

  it('gives half credit for pending records', () => {
    const r = emailHealthScore(recs('pending'));
    expect(r.score).toBe(68); // 35 + (40+25)*0.5 = 67.5 -> 68
  });
});

describe('detectDnsProviderFromNameservers', () => {
  it('recognises Cloudflare as auto-configurable', () => {
    const g = detectDnsProviderFromNameservers(['gwen.ns.cloudflare.com', 'kip.ns.cloudflare.com']);
    expect(g.provider).toBe('cloudflare');
    expect(g.canAutoConfigure).toBe(true);
  });

  it('recognises Vercel (manual only)', () => {
    const g = detectDnsProviderFromNameservers(['ns1.vercel-dns.com.', 'ns2.vercel-dns.com.']);
    expect(g.provider).toBe('vercel');
    expect(g.canAutoConfigure).toBe(false);
  });

  it('falls back to unknown', () => {
    const g = detectDnsProviderFromNameservers(['ns1.weird-host.example']);
    expect(g.provider).toBe('unknown');
  });
});
