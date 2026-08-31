/**
 * Abstract provider interfaces. Everything that touches an external system goes
 * through one of these so SouraMAIL can swap managed bricks for self-hosted ones
 * without touching application code (docs/05-roadmap-developpement.md §0, §4.5).
 */

// ─── EmailProvider ─────────────────────────────────────────────────────────
export interface OutboundMessage {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
  /** Optional pre-rendered RFC822; when set, provider sends it verbatim. */
  raw?: Uint8Array | string;
  replyTo?: string;
  /** Envelope MAIL FROM — align with SPF (bounce.souramail.com). */
  returnPath?: string;
  tenantId: string;
  idempotencyKey?: string;
}

export interface SuppressionEntry {
  address: string;
  reason: 'bounce' | 'complaint' | 'manual';
}

export interface DeliveryEvent {
  providerMessageId: string;
  type: 'delivered' | 'bounced' | 'complaint' | 'opened' | 'clicked' | 'failed';
  at: string;
  raw: unknown;
}

export interface EmailProvider {
  readonly name: string;
  send(msg: OutboundMessage): Promise<{ providerMessageId: string }>;
  getSuppression?(address: string): Promise<SuppressionEntry | null>;
  streamEvents?(): AsyncIterable<DeliveryEvent>;
}

// ─── DnsProvider ───────────────────────────────────────────────────────────
export interface DnsRecordInput {
  type: 'MX' | 'TXT' | 'CNAME' | 'A' | 'AAAA';
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
}

export interface DnsProviderDetection {
  provider: string;
  canAutoConfigure: boolean;
}

export interface DnsProvider {
  readonly name: string;
  detect(domain: string): Promise<DnsProviderDetection | null>;
  listRecords(domain: string): Promise<DnsRecordInput[]>;
  createRecords?(domain: string, records: DnsRecordInput[]): Promise<void>;
}

// ─── LlmProvider (thin client over the AI Gateway) ─────────────────────────
export interface LlmRequest {
  tenantId: string;
  task: string; // 'summarize' | 'draft_reply' | 'classify' | 'compile_rule' | ...
  model?: string;
  input: unknown;
  scope: 'message' | 'thread' | 'selection' | 'mailbox';
}

export interface LlmProvider {
  readonly name: string;
  run<T = unknown>(req: LlmRequest): Promise<{ output: T; costUsd: number; model: string }>;
}

// ─── StorageProvider (raw MIME + attachments) ─────────────────────────────
export interface StorageProvider {
  readonly name: string;
  put(key: string, body: Uint8Array | string, contentType?: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  signedUrl(key: string, expiresInSec: number): Promise<string>;
  delete(key: string): Promise<void>;
}
