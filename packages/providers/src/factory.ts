/**
 * Env-driven provider selection. Application code calls `getEmailProvider()` etc.
 * and never learns which backend it got — that's the whole point of §4.5.
 *
 *   EMAIL_PROVIDER = smtp-relay | dev        (phase 5 adds: kumomta)
 *   S3_ENDPOINT / S3_* ................ StorageProvider (R2 · S3 · MinIO)
 *   CLOUDFLARE_API_TOKEN ............. CloudflareDnsProvider
 *   STALWART_ADMIN_URL / _USER / _SECRET ... StalwartAdmin
 */
import { CloudflareDnsProvider } from './dns/cloudflare.ts';
import { createDevEmailProvider } from './email/dev.ts';
import { SmtpRelayProvider } from './email/smtp-relay.ts';
import type { DnsProvider, EmailProvider, StorageProvider } from './interfaces.ts';
import { StalwartAdmin } from './stalwart/admin.ts';
import { S3StorageProvider } from './storage/s3.ts';

function env(key: string): string | undefined {
  const v = process.env[key];
  return v && v.length > 0 ? v : undefined;
}
function require_(key: string): string {
  const v = env(key);
  if (!v) throw new Error(`provider factory: missing env ${key}`);
  return v;
}

let _email: EmailProvider | undefined;
export function getEmailProvider(): EmailProvider {
  if (_email) return _email;
  const kind = env('EMAIL_PROVIDER') ?? 'dev';
  switch (kind) {
    case 'smtp-relay':
      _email = new SmtpRelayProvider({
        host: require_('SMTP_RELAY_HOST'),
        port: Number(env('SMTP_RELAY_PORT') ?? 587),
        user: require_('SMTP_RELAY_USER'),
        pass: require_('SMTP_RELAY_PASS'),
      });
      break;
    case 'dev':
      _email = createDevEmailProvider((l) => console.log(l));
      break;
    default:
      throw new Error(`EMAIL_PROVIDER="${kind}" is not supported yet`);
  }
  return _email;
}

let _storage: StorageProvider | undefined;
export function getStorageProvider(): StorageProvider {
  if (_storage) return _storage;
  _storage = new S3StorageProvider({
    endpoint: require_('S3_ENDPOINT'),
    region: env('S3_REGION') ?? 'auto',
    bucket: env('S3_BUCKET') ?? 'souramail-mail',
    accessKeyId: require_('S3_ACCESS_KEY_ID'),
    secretAccessKey: require_('S3_SECRET_ACCESS_KEY'),
    forcePathStyle: env('S3_FORCE_PATH_STYLE') === 'true',
  });
  return _storage;
}

/** DnsProvider for a customer domain. Today only Cloudflare auto-configures. */
export function getDnsProvider(): DnsProvider | null {
  const token = env('CLOUDFLARE_API_TOKEN');
  if (!token) return null;
  return new CloudflareDnsProvider({
    apiToken: token,
    accountId: env('CLOUDFLARE_ACCOUNT_ID'),
  });
}

let _stalwart: StalwartAdmin | undefined;
export function getStalwartAdmin(): StalwartAdmin {
  if (_stalwart) return _stalwart;
  _stalwart = new StalwartAdmin({
    baseUrl: require_('STALWART_ADMIN_URL'),
    adminUser: env('STALWART_ADMIN_USER') ?? 'admin',
    adminSecret: require_('STALWART_ADMIN_SECRET'),
  });
  return _stalwart;
}
