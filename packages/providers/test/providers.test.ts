import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudflareDnsProvider } from '../src/dns/cloudflare.ts';
import { createDevEmailProvider } from '../src/email/dev.ts';
import { ResendProvider } from '../src/email/resend.ts';
import { getEmailProvider, getStorageProvider } from '../src/factory.ts';
import { S3StorageProvider } from '../src/storage/s3.ts';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('S3StorageProvider url()', () => {
  const cfg = {
    region: 'auto',
    bucket: 'souramail-mail',
    accessKeyId: 'k',
    secretAccessKey: 's',
  };

  it('path-style (MinIO): bucket in the path', () => {
    const p = new S3StorageProvider({
      ...cfg,
      endpoint: 'http://localhost:9000',
      forcePathStyle: true,
    });
    // @ts-expect-error private
    expect(p.url('mime/abc.eml')).toBe('http://localhost:9000/souramail-mail/mime/abc.eml');
  });

  it('vhost-style (R2/S3): bucket as a subdomain', () => {
    const p = new S3StorageProvider({
      ...cfg,
      endpoint: 'https://acc.r2.cloudflarestorage.com',
    });
    // @ts-expect-error private
    expect(p.url('/mime/abc.eml')).toBe(
      'https://souramail-mail.acc.r2.cloudflarestorage.com/mime/abc.eml',
    );
  });
});

describe('CloudflareDnsProvider.createRecords', () => {
  it('updates a matching record and creates a missing one (idempotent)', async () => {
    const calls: { method: string; path: string; body?: unknown }[] = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace('https://api.cloudflare.com/client/v4', '');
      calls.push({
        method: init?.method ?? 'GET',
        path,
        body: init?.body ? JSON.parse(init.body as string) : undefined,
      });
      if (path.startsWith('/zones?name=')) {
        return json({ success: true, result: [{ id: 'ZONE1', name: 'myapp.com' }] });
      }
      if (path === '/zones/ZONE1/dns_records?per_page=200') {
        return json({
          success: true,
          result: [{ id: 'R1', type: 'TXT', name: 'myapp.com', content: 'old', ttl: 1 }],
        });
      }
      return json({ success: true, result: {} });
    });
    vi.stubGlobal('fetch', fetchMock);

    const cf = new CloudflareDnsProvider({ apiToken: 't' });
    await cf.createRecords('myapp.com', [
      { type: 'TXT', name: 'myapp.com', value: 'v=spf1 -all' },
      { type: 'MX', name: 'myapp.com', value: 'mx1.souramail.com', priority: 10 },
    ]);

    const mutations = calls.filter((c) => c.method === 'PUT' || c.method === 'POST');
    expect(mutations.map((m) => `${m.method} ${m.path}`)).toEqual([
      'PUT /zones/ZONE1/dns_records/R1', // TXT existed → update
      'POST /zones/ZONE1/dns_records', // MX missing → create
    ]);
    expect(mutations[1]?.body).toMatchObject({ type: 'MX', priority: 10 });
  });
});

describe('provider factory', () => {
  it('defaults EmailProvider to the dev no-op', async () => {
    vi.stubEnv('EMAIL_PROVIDER', '');
    expect((await getEmailProvider()).name).toBe('dev-noop');
  });

  it('builds an S3StorageProvider from S3_* env', async () => {
    vi.stubEnv('S3_ENDPOINT', 'http://localhost:9000');
    vi.stubEnv('S3_ACCESS_KEY_ID', 'minioadmin');
    vi.stubEnv('S3_SECRET_ACCESS_KEY', 'minioadmin');
    expect((await getStorageProvider()).name).toBe('s3');
  });
});

describe('ResendProvider', () => {
  it('POSTs to /emails and returns the Resend id as providerMessageId', async () => {
    let seen: { url: string; body: Record<string, unknown>; auth?: string } | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        seen = {
          url,
          body: JSON.parse(init?.body as string),
          auth: new Headers(init?.headers).get('authorization') ?? undefined,
        };
        return json({ id: 'resend-abc-123' });
      }),
    );

    const p = new ResendProvider({ apiKey: 're_test' });
    const r = await p.send({
      from: 'hello@gala-guema.xyz',
      to: ['x@y.com'],
      subject: 'hi',
      text: 'body',
      tenantId: 't',
    });

    expect(r.providerMessageId).toBe('resend-abc-123');
    expect(seen?.url).toBe('https://api.resend.com/emails');
    expect(seen?.auth).toBe('Bearer re_test');
    expect(seen?.body).toMatchObject({
      from: 'hello@gala-guema.xyz',
      to: ['x@y.com'],
      text: 'body',
    });
  });

  it('throws when the API rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ message: 'domain not verified' }, 403)),
    );
    const p = new ResendProvider({ apiKey: 're_test' });
    await expect(
      p.send({ from: 'a@b.com', to: ['c@d.com'], subject: 's', text: 't', tenantId: 't' }),
    ).rejects.toThrow(/send failed 403/);
  });
});

describe('dev email provider', () => {
  it('logs and returns a synthetic id', async () => {
    const lines: string[] = [];
    const p = createDevEmailProvider((l) => lines.push(l));
    const r = await p.send({ from: 'a@x.com', to: ['b@y.com'], subject: 'hi', tenantId: 't' });
    expect(r.providerMessageId).toMatch(/^dev-/);
    expect(lines[0]).toContain('b@y.com');
  });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
