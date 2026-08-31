/**
 * Thin client for the Stalwart management API (docs/05 §4, references/README.md #1).
 *
 * SouraMAIL owns the "magic" layer; Stalwart is the solid, invisible mail core.
 * This wrapper is all we need from it in Phase 1: register a domain, mint its
 * DKIM key, and provision mailboxes/aliases. Everything else (SMTP, IMAP, JMAP,
 * Sieve) Stalwart does on its own.
 *
 * API shape targets Stalwart v0.10+; `basePath` / field names may need a bump
 * with a major Stalwart release — keep this the only place that knows them.
 */
export interface StalwartAdminConfig {
  /** e.g. http://stalwart:8080 */
  baseUrl: string;
  adminUser: string;
  adminSecret: string;
}

export interface CreateMailboxInput {
  address: string;
  /** bcrypt/argon hash or plaintext secret Stalwart will hash. */
  secret: string;
  quotaBytes?: number;
  displayName?: string;
}

export class StalwartAdmin {
  private readonly auth: string;
  constructor(private readonly cfg: StalwartAdminConfig) {
    // Stalwart's management API accepts the fallback-admin secret as a bearer
    // credential (v0.11+); `adminUser` is retained in config for older setups.
    // Container-internal HTTP — front the admin port with TLS when exposed.
    this.auth = `Bearer ${cfg.adminSecret}`;
  }

  private async req<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.cfg.baseUrl.replace(/\/$/, '')}${path}`, {
      method,
      headers: {
        authorization: this.auth,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(`Stalwart ${method} ${path} → ${res.status} ${await res.text()}`);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /** Register a domain so Stalwart accepts mail for it and can sign as it. */
  async createDomain(domain: string): Promise<void> {
    await this.req('POST', '/api/principal', { type: 'domain', name: domain });
  }

  async deleteDomain(domain: string): Promise<void> {
    await this.req('DELETE', `/api/principal/${encodeURIComponent(domain)}`);
  }

  /**
   * Generate a DKIM keypair for the domain under the given selector and wire it
   * into Stalwart's signing config. Returns the public key TXT value to publish.
   */
  async createDkim(
    domain: string,
    selector = 'soura',
    algorithm: 'ed25519' | 'rsa' = 'rsa',
  ): Promise<{ selector: string; publicKey: string }> {
    const res = await this.req<{ public_key?: string; publicKey?: string }>('POST', '/api/dkim', {
      id: domain,
      selector,
      algorithm,
    });
    return { selector, publicKey: res.public_key ?? res.publicKey ?? '' };
  }

  async createMailbox(input: CreateMailboxInput): Promise<void> {
    await this.req('POST', '/api/principal', {
      type: 'individual',
      name: input.address,
      secrets: [input.secret],
      emails: [input.address],
      ...(input.displayName ? { description: input.displayName } : {}),
      ...(input.quotaBytes ? { quota: input.quotaBytes } : {}),
    });
  }

  /** Alias = a "mailingList"/redirect principal that forwards to a real mailbox. */
  async createAlias(alias: string, target: string): Promise<void> {
    await this.req('POST', '/api/principal', {
      type: 'list',
      name: alias,
      emails: [alias],
      members: [target],
    });
  }

  async deletePrincipal(name: string): Promise<void> {
    await this.req('DELETE', `/api/principal/${encodeURIComponent(name)}`);
  }

  /** Liveness — the admin UI/API answers. */
  async ping(): Promise<boolean> {
    try {
      await this.req('GET', '/api/principal?limit=1');
      return true;
    } catch {
      return false;
    }
  }
}
