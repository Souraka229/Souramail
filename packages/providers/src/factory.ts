/**
 * Env-driven provider selection. Application code calls `getEmailProvider()` etc.
 * and never learns which backend it got — that's the whole point of §4.5.
 *
 *   EMAIL_PROVIDER = smtp-relay | dev        (phase 5 adds: kumomta)
 *   S3_ENDPOINT / S3_* ................ StorageProvider (R2 · S3 · MinIO)
 *   CLOUDFLARE_API_TOKEN ............. CloudflareDnsProvider
 *   STALWART_ADMIN_URL / _USER / _SECRET ... StalwartAdmin
 *
 * Concrete adapters are `import()`-ed on first use so a caller that only needs
 * DNS never pulls in the SMTP stack (keeps Next server bundles lean).
 */
import type { DnsProvider, EmailProvider, StorageProvider } from './interfaces.ts';
import type { StalwartAdmin } from './stalwart/admin.ts';

function env(key: string): string | undefined {
  const v = process.env[key];
  return v && v.length > 0 ? v : undefined;
}
function require_(key: string): string {
  const v = env(key);
  if (!v) throw new Error(`provider factory: missing env ${key}`);
  return v;
}

let _email: Promise<EmailProvider> | undefined;
export function getEmailProvider(): Promise<EmailProvider> {
  if (_email) return _email;
  const kind = env('EMAIL_PROVIDER') ?? 'dev';
  _email = (async () => {
    if (kind === 'smtp-relay') {
      const { SmtpRelayProvider } = await import('./email/smtp-relay.ts');
      return new SmtpRelayProvider({
        host: require_('SMTP_RELAY_HOST'),
        port: Number(env('SMTP_RELAY_PORT') ?? 587),
        user: require_('SMTP_RELAY_USER'),
        pass: require_('SMTP_RELAY_PASS'),
        sender: env('SMTP_RELAY_SENDER'),
      });
    }
    if (kind === 'dev') {
      const { createDevEmailProvider } = await import('./email/dev.ts');
      return createDevEmailProvider((l) => console.log(l));
    }
    throw new Error(`EMAIL_PROVIDER="${kind}" is not supported yet`);
  })();
  return _email;
}

let _storage: Promise<StorageProvider> | undefined;
export function getStorageProvider(): Promise<StorageProvider> {
  if (_storage) return _storage;
  _storage = (async () => {
    const { S3StorageProvider } = await import('./storage/s3.ts');
    return new S3StorageProvider({
      endpoint: require_('S3_ENDPOINT'),
      region: env('S3_REGION') ?? 'auto',
      bucket: env('S3_BUCKET') ?? 'souramail-mail',
      accessKeyId: require_('S3_ACCESS_KEY_ID'),
      secretAccessKey: require_('S3_SECRET_ACCESS_KEY'),
      forcePathStyle: env('S3_FORCE_PATH_STYLE') === 'true',
    });
  })();
  return _storage;
}

/** DnsProvider for a customer domain. Today only Cloudflare auto-configures. */
export async function getDnsProvider(): Promise<DnsProvider | null> {
  const token = env('CLOUDFLARE_API_TOKEN');
  if (!token) return null;
  const { CloudflareDnsProvider } = await import('./dns/cloudflare.ts');
  return new CloudflareDnsProvider({ apiToken: token, accountId: env('CLOUDFLARE_ACCOUNT_ID') });
}

export async function getStalwartAdmin(): Promise<StalwartAdmin> {
  const { StalwartAdmin } = await import('./stalwart/admin.ts');
  return new StalwartAdmin({
    baseUrl: require_('STALWART_ADMIN_URL'),
    adminUser: env('STALWART_ADMIN_USER') ?? 'admin',
    adminSecret: require_('STALWART_ADMIN_SECRET'),
  });
}
