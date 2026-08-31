import type { DnsProvider, DnsProviderDetection, DnsRecordInput } from '../interfaces.ts';

export interface CloudflareDnsConfig {
  /** API token scoped to Zone:DNS:Edit + Zone:Zone:Read for the target zone. */
  apiToken: string;
  /** Optional account id — narrows the zone lookup. */
  accountId?: string;
}

interface CfZone {
  id: string;
  name: string;
}
interface CfRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
}

const API = 'https://api.cloudflare.com/client/v4';

/**
 * DnsProvider adapter for Cloudflare (docs/05 §8) — the "Fix automatically" path.
 * Auto-configurable: given a scoped token it creates the MX/SPF/DKIM/DMARC records
 * itself and verifies them.
 */
export class CloudflareDnsProvider implements DnsProvider {
  readonly name = 'cloudflare';
  private zoneCache = new Map<string, string>();

  constructor(private readonly cfg: CloudflareDnsConfig) {}

  private async api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${this.cfg.apiToken}`,
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    const json = (await res.json()) as { success: boolean; result: T; errors: unknown[] };
    if (!res.ok || !json.success) {
      throw new Error(`Cloudflare ${path} → ${res.status} ${JSON.stringify(json.errors)}`);
    }
    return json.result;
  }

  private async zoneId(domain: string): Promise<string> {
    const root = domain.trim().toLowerCase().replace(/\.$/, '');
    const cached = this.zoneCache.get(root);
    if (cached) return cached;
    const q = this.cfg.accountId ? `&account.id=${this.cfg.accountId}` : '';
    const zones = await this.api<CfZone[]>(`/zones?name=${encodeURIComponent(root)}${q}`);
    const zone = zones[0];
    if (!zone) throw new Error(`Cloudflare: no zone for ${root} (token scoped to it?)`);
    this.zoneCache.set(root, zone.id);
    return zone.id;
  }

  /** `detect()` only confirms "yes, this token can manage this zone". */
  async detect(domain: string): Promise<DnsProviderDetection | null> {
    try {
      await this.zoneId(domain);
      return { provider: 'cloudflare', canAutoConfigure: true };
    } catch {
      return null;
    }
  }

  async listRecords(domain: string): Promise<DnsRecordInput[]> {
    const zid = await this.zoneId(domain);
    const recs = await this.api<CfRecord[]>(`/zones/${zid}/dns_records?per_page=200`);
    return recs.map((r) => ({
      type: r.type as DnsRecordInput['type'],
      name: r.name,
      value: r.content,
      ttl: r.ttl,
      ...(r.priority != null ? { priority: r.priority } : {}),
    }));
  }

  /** Idempotent: updates an existing matching record, else creates it. */
  async createRecords(domain: string, records: DnsRecordInput[]): Promise<void> {
    const zid = await this.zoneId(domain);
    const existing = await this.api<CfRecord[]>(`/zones/${zid}/dns_records?per_page=200`);

    for (const rec of records) {
      const match = existing.find(
        (e) => e.type === rec.type && e.name.replace(/\.$/, '') === rec.name.replace(/\.$/, ''),
      );
      const body = JSON.stringify({
        type: rec.type,
        name: rec.name,
        content: rec.value,
        ttl: rec.ttl ?? 1,
        ...(rec.priority != null ? { priority: rec.priority } : {}),
        comment: 'Managed by SouraMAIL',
      });
      if (match) {
        await this.api(`/zones/${zid}/dns_records/${match.id}`, { method: 'PUT', body });
      } else {
        await this.api(`/zones/${zid}/dns_records`, { method: 'POST', body });
      }
    }
  }
}
