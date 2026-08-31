/**
 * Shared types + runtime schemas: webhook events, public API payloads, queue jobs.
 * One source of truth for `apps/api`, `apps/worker`, `packages/sdk-*`.
 */
import { z } from 'zod';

// ─── webhook / domain events ──────────────────────────────────────────────
export const webhookEventName = z.enum([
  'email.received',
  'email.sent',
  'email.delivered',
  'email.bounced',
  'email.spam',
  'domain.verified',
  'automation.completed',
]);
export type WebhookEventName = z.infer<typeof webhookEventName>;

export const webhookEnvelope = z.object({
  id: z.string().uuid(),
  type: webhookEventName,
  createdAt: z.string().datetime(),
  tenantId: z.string().uuid(),
  data: z.record(z.unknown()),
});
export type WebhookEnvelope = z.infer<typeof webhookEnvelope>;

// ─── public API: POST /v1/emails ─────────────────────────────────────────
export const sendEmailRequest = z.object({
  from: z.string().email(),
  to: z.array(z.string().email()).min(1).max(50),
  subject: z.string().min(1).max(998),
  html: z.string().optional(),
  text: z.string().optional(),
  headers: z.record(z.string()).optional(),
});
export type SendEmailRequest = z.infer<typeof sendEmailRequest>;

// ─── queue jobs (BullMQ) ────────────────────────────────────────────────
export const QUEUES = {
  send: 'send',
  inboundProcess: 'inbound-process',
  aiJob: 'ai-job',
  webhookDeliver: 'webhook-deliver',
  warmup: 'warmup',
} as const;
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const sendJob = z.object({
  tenantId: z.string().uuid(),
  outboundJobId: z.string().uuid(),
  idempotencyKey: z.string(),
});
export type SendJob = z.infer<typeof sendJob>;

// Enqueued by apps/api when Stalwart's MTA hook posts an accepted inbound message
// (docs/05 §4.1). `rawMimeBase64` is the full RFC822; the worker parses it,
// offloads it to object storage, and writes the message/thread/attachment rows.
export const inboundJob = z.object({
  tenantId: z.string().uuid(),
  mailboxId: z.string().uuid(),
  rawMimeBase64: z.string().min(1),
  /** Rspamd verdict passed through from the milter (docs/05 §4.1 step 6). */
  spamScore: z.number().optional(),
  isSpam: z.boolean().optional(),
});
export type InboundJob = z.infer<typeof inboundJob>;

// ─── Stalwart MTA hook (docs/05 §4.1) ──────────────────────────────────────
// Stalwart POSTs this at the `data` stage of an accepted inbound message; the
// api resolves each recipient to a mailbox and enqueues an `inbound-process`
// job, then replies with an action.
const mtaHookAddr = z.object({ address: z.string(), parameters: z.record(z.unknown()).optional() });

export const mtaHookRequest = z.object({
  context: z
    .object({
      stage: z.string().optional(),
      client: z
        .object({ ip: z.string().optional(), helo: z.string().optional() })
        .partial()
        .optional(),
      sasl: z.object({ login: z.string().optional() }).partial().optional(),
      queue: z.object({ id: z.string().optional() }).partial().optional(),
    })
    .partial()
    .optional(),
  envelope: z
    .object({ from: mtaHookAddr.optional(), to: z.array(mtaHookAddr).default([]) })
    .optional(),
  message: z
    .object({
      headers: z.array(z.tuple([z.string(), z.string()])).default([]),
      contents: z.string().default(''), // base64 of the full RFC822
      size: z.number().optional(),
    })
    .optional(),
});
export type MtaHookRequest = z.infer<typeof mtaHookRequest>;

export const mtaHookResponse = z.object({
  action: z.enum(['accept', 'discard', 'reject', 'quarantine']),
  response: z
    .object({
      status: z.number(),
      enhancedStatus: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
});
export type MtaHookResponse = z.infer<typeof mtaHookResponse>;

// ─── API key scopes (least privilege) ───────────────────────────────────
export const apiScopes = [
  'emails:send',
  'emails:read',
  'emails:delete',
  'domains:read',
  'domains:manage',
  'webhooks:manage',
] as const;
export type ApiScope = (typeof apiScopes)[number];
