/**
 * Guess a domain's DNS provider from its nameservers, so onboarding can offer
 * "Connect <provider> and let SouraMAIL fix your DNS" vs. the manual copy/verify
 * path (docs/05 §8). Pure: the NS lookup itself happens in the app layer.
 */

export interface DnsProviderGuess {
  /** Machine id: matches a `DnsProvider` adapter name when we have one. */
  provider: string;
  /** Human label for the UI. */
  label: string;
  /** Do we have an adapter that can write records for this provider? */
  canAutoConfigure: boolean;
  /** The nameserver suffix that matched. */
  matchedOn: string | null;
}

interface Signature {
  provider: string;
  label: string;
  canAutoConfigure: boolean;
  /** Lower-cased nameserver suffixes that identify this provider. */
  nsSuffixes: string[];
}

export const DNS_PROVIDER_SIGNATURES: Signature[] = [
  {
    provider: 'cloudflare',
    label: 'Cloudflare',
    canAutoConfigure: true,
    nsSuffixes: ['ns.cloudflare.com'],
  },
  {
    provider: 'vercel',
    label: 'Vercel',
    canAutoConfigure: false,
    nsSuffixes: ['vercel-dns.com'],
  },
  {
    provider: 'route53',
    label: 'Amazon Route 53',
    canAutoConfigure: false,
    nsSuffixes: ['awsdns'],
  },
  {
    provider: 'namecheap',
    label: 'Namecheap',
    canAutoConfigure: false,
    nsSuffixes: ['registrar-servers.com'],
  },
  {
    provider: 'godaddy',
    label: 'GoDaddy',
    canAutoConfigure: false,
    nsSuffixes: ['domaincontrol.com'],
  },
  {
    provider: 'porkbun',
    label: 'Porkbun',
    canAutoConfigure: false,
    nsSuffixes: ['porkbun.com'],
  },
  {
    provider: 'ovh',
    label: 'OVH',
    canAutoConfigure: false,
    nsSuffixes: ['ovh.net'],
  },
  {
    provider: 'google',
    label: 'Google Domains / Cloud DNS',
    canAutoConfigure: false,
    nsSuffixes: ['googledomains.com', 'google.com'],
  },
  {
    provider: 'netlify',
    label: 'Netlify',
    canAutoConfigure: false,
    nsSuffixes: ['nsone.net', 'netlify.com'],
  },
];

export function detectDnsProviderFromNameservers(nameservers: readonly string[]): DnsProviderGuess {
  const ns = nameservers.map((n) => n.trim().toLowerCase().replace(/\.$/, ''));
  for (const sig of DNS_PROVIDER_SIGNATURES) {
    for (const suffix of sig.nsSuffixes) {
      const hit = ns.find((n) => n.endsWith(suffix) || n.includes(`.${suffix}`));
      if (hit) {
        return {
          provider: sig.provider,
          label: sig.label,
          canAutoConfigure: sig.canAutoConfigure,
          matchedOn: hit,
        };
      }
    }
  }
  return {
    provider: 'unknown',
    label: ns[0] ? `Unrecognised (${ns[0]})` : 'Unknown',
    canAutoConfigure: false,
    matchedOn: null,
  };
}
