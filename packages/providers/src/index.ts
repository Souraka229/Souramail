/**
 * Provider abstraction layer (docs/05 §0, §4.5). Interfaces + concrete adapters +
 * an env-driven factory. Application code imports the factory, never a concrete
 * class, so managed bricks can be swapped for self-hosted ones without touching it.
 */

export { type CloudflareDnsConfig, CloudflareDnsProvider } from './dns/cloudflare.ts';
export { createDevEmailProvider } from './email/dev.ts';
export { type SmtpRelayConfig, SmtpRelayProvider } from './email/smtp-relay.ts';
export {
  getDnsProvider,
  getEmailProvider,
  getStalwartAdmin,
  getStorageProvider,
} from './factory.ts';
export * from './interfaces.ts';
export {
  type CreateMailboxInput,
  StalwartAdmin,
  type StalwartAdminConfig,
} from './stalwart/admin.ts';
export { type S3Config, S3StorageProvider } from './storage/s3.ts';
