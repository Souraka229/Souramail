/**
 * Tell a domain the user actually controls from a platform-issued subdomain
 * (docs/05 Phase 3 "onboarding adaptatif" — the Vercel/Netlify branch).
 *
 * `myproject.vercel.app` belongs to Vercel: nobody but Vercel can publish MX /
 * SPF / DKIM there, so generating records for it would send the user on a
 * wild-goose chase. Detect it up front and offer the two real paths instead:
 * connect a domain you own, or take a SouraMAIL identity.
 */

export interface PlatformSubdomain {
  /** Machine id. */
  platform: string;
  /** Human label for the UI. */
  label: string;
  /** Registrable suffixes the platform owns. */
  suffixes: string[];
}

export const PLATFORM_SUBDOMAINS: PlatformSubdomain[] = [
  { platform: 'vercel', label: 'Vercel', suffixes: ['vercel.app', 'now.sh'] },
  { platform: 'netlify', label: 'Netlify', suffixes: ['netlify.app', 'netlify.com'] },
  { platform: 'cloudflare', label: 'Cloudflare Pages', suffixes: ['pages.dev', 'workers.dev'] },
  { platform: 'github', label: 'GitHub Pages', suffixes: ['github.io'] },
  { platform: 'heroku', label: 'Heroku', suffixes: ['herokuapp.com'] },
  { platform: 'render', label: 'Render', suffixes: ['onrender.com'] },
  { platform: 'fly', label: 'Fly.io', suffixes: ['fly.dev'] },
  { platform: 'railway', label: 'Railway', suffixes: ['railway.app', 'up.railway.app'] },
  { platform: 'firebase', label: 'Firebase', suffixes: ['web.app', 'firebaseapp.com'] },
  { platform: 'surge', label: 'Surge', suffixes: ['surge.sh'] },
  { platform: 'replit', label: 'Replit', suffixes: ['repl.co', 'replit.app'] },
];

export type DomainKind =
  | { kind: 'owned' }
  | { kind: 'platform'; platform: string; label: string; suffix: string }
  /** The bare platform suffix itself, e.g. someone typed "vercel.app". */
  | { kind: 'platform-root'; platform: string; label: string };

export function classifyDomain(domain: string): DomainKind {
  const d = domain.trim().toLowerCase().replace(/\.$/, '');
  for (const p of PLATFORM_SUBDOMAINS) {
    for (const suffix of p.suffixes) {
      if (d === suffix) {
        return { kind: 'platform-root', platform: p.platform, label: p.label };
      }
      if (d.endsWith(`.${suffix}`)) {
        return { kind: 'platform', platform: p.platform, label: p.label, suffix };
      }
    }
  }
  return { kind: 'owned' };
}

/** Copy for the onboarding screen when the user pastes a platform subdomain. */
export function platformDomainMessage(label: string, domain: string): string {
  return (
    `${domain} belongs to ${label} — only ${label} can publish MX/SPF/DKIM records there, ` +
    `so email can't be hosted on it. Connect a domain you own (or one you can buy), ` +
    `and SouraMAIL will generate its records.`
  );
}
