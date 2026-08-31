import { describe, expect, it } from 'vitest';
import { classifyDomain, type DomainKind, platformDomainMessage } from '../src/index.ts';

const platform = (k: DomainKind) => (k.kind === 'owned' ? null : k.platform);

describe('classifyDomain', () => {
  it('flags a platform subdomain', () => {
    expect(classifyDomain('myproject.vercel.app')).toEqual({
      kind: 'platform',
      platform: 'vercel',
      label: 'Vercel',
      suffix: 'vercel.app',
    });
    expect(platform(classifyDomain('site.netlify.app'))).toBe('netlify');
    expect(platform(classifyDomain('acme.pages.dev'))).toBe('cloudflare');
    expect(platform(classifyDomain('user.github.io'))).toBe('github');
  });

  it('flags the bare platform suffix', () => {
    expect(classifyDomain('vercel.app')).toMatchObject({
      kind: 'platform-root',
      platform: 'vercel',
    });
  });

  it('treats a real domain as owned', () => {
    expect(classifyDomain('myapp.com')).toEqual({ kind: 'owned' });
    expect(classifyDomain('mail.acme.co.uk')).toEqual({ kind: 'owned' });
    // not a subdomain of vercel.app — just contains the string
    expect(classifyDomain('vercel.app.attacker.com')).toEqual({ kind: 'owned' });
  });

  it('normalises case + trailing dot', () => {
    expect(platform(classifyDomain('X.VERCEL.APP.'))).toBe('vercel');
  });

  it('message names the platform', () => {
    expect(platformDomainMessage('Vercel', 'x.vercel.app')).toContain('Vercel');
    expect(platformDomainMessage('Vercel', 'x.vercel.app')).toContain('x.vercel.app');
  });
});
