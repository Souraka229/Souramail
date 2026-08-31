/**
 * SouraMAIL database schema (Drizzle).
 *
 * Multi-tenant model: every business table carries `tenantId` (= workspace id) and is
 * protected by Row-Level Security. RLS policies are defined in `drizzle/rls.sql` and
 * applied by `src/migrate.ts`. The app connects as a non-superuser role so RLS is enforced.
 *
 * See docs/05-roadmap-developpement.md §3 for the data model rationale.
 */
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Auth tables (`user`, `session`, `account`, `verification`) are owned by Better Auth
// and generated into ./auth-schema.ts (`pnpm --filter @souramail/auth gen`).
export * from './auth-schema.ts';

import { user } from './auth-schema.ts';

// ─── shared column helpers ──────────────────────────────────────────────────
const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const tenantId = () =>
  uuid('tenant_id')
    .notNull()
    .references(() => workspace.id, { onDelete: 'cascade' });

// ─── enums ─────────────────────────────────────────────────────────────────
export const planEnum = pgEnum('plan', ['free', 'pro', 'business']);
export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member']);
export const domainStatusEnum = pgEnum('domain_status', [
  'pending',
  'verifying',
  'active',
  'error',
]);
export const dnsRecordTypeEnum = pgEnum('dns_record_type', ['MX', 'TXT', 'CNAME', 'A', 'AAAA']);
export const dnsRecordStateEnum = pgEnum('dns_record_state', ['missing', 'pending', 'verified']);
export const mailboxTypeEnum = pgEnum('mailbox_type', ['mailbox', 'alias']);
export const messageDirectionEnum = pgEnum('message_direction', ['inbound', 'outbound']);
export const outboundStatusEnum = pgEnum('outbound_status', [
  'queued',
  'sending',
  'sent',
  'delivered',
  'bounced',
  'failed',
  'spam',
]);
export const deliveryEventTypeEnum = pgEnum('delivery_event_type', [
  'delivered',
  'bounced',
  'complaint',
  'opened',
  'clicked',
  'failed',
]);
export const suppressionReasonEnum = pgEnum('suppression_reason', [
  'bounce',
  'complaint',
  'manual',
]);
export const actionLevelEnum = pgEnum('action_level', ['safe', 'sensitive', 'dangerous']);
export const usageMetricEnum = pgEnum('usage_metric', [
  'emails_sent',
  'ai_actions',
  'storage_bytes',
  'api_calls',
]);

// ─── tenancy & identity ────────────────────────────────────────────────────
export const workspace = pgTable('workspace', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: planEnum('plan').notNull().default('free'),
  riskScore: integer('risk_score').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// `user` is the Better Auth table (text id) — re-exported from ./auth-schema.ts.
// SouraMAIL-specific per-user flags (e.g. MFA) live on `membership` or a future
// `user_profile` table, never by editing the Better Auth-owned schema.

export const membership = pgTable(
  'membership',
  {
    id: id(),
    tenantId: tenantId(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull().default('member'),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('membership_tenant_user_uq').on(t.tenantId, t.userId)],
);

// ─── domains & DNS ─────────────────────────────────────────────────────────
export const domain = pgTable(
  'domain',
  {
    id: id(),
    tenantId: tenantId(),
    name: text('name').notNull(),
    status: domainStatusEnum('status').notNull().default('pending'),
    dnsProvider: text('dns_provider'),
    healthScore: integer('health_score').notNull().default(0),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('domain_name_uq').on(t.name)],
);

export const dnsRecord = pgTable(
  'dns_record',
  {
    id: id(),
    tenantId: tenantId(),
    domainId: uuid('domain_id')
      .notNull()
      .references(() => domain.id, { onDelete: 'cascade' }),
    type: dnsRecordTypeEnum('type').notNull(),
    name: text('name').notNull(),
    expectedValue: text('expected_value').notNull(),
    observedValue: text('observed_value'),
    state: dnsRecordStateEnum('state').notNull().default('missing'),
    autoFixable: boolean('auto_fixable').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('dns_record_domain_idx').on(t.domainId)],
);

// ─── mailboxes & messages ──────────────────────────────────────────────────
export const mailbox = pgTable(
  'mailbox',
  {
    id: id(),
    tenantId: tenantId(),
    domainId: uuid('domain_id')
      .notNull()
      .references(() => domain.id, { onDelete: 'cascade' }),
    address: text('address').notNull(),
    type: mailboxTypeEnum('type').notNull().default('mailbox'),
    targetMailboxId: uuid('target_mailbox_id'),
    quotaBytes: bigint('quota_bytes', { mode: 'number' }).notNull().default(1_073_741_824),
    // AES-256-GCM box of a webmail-only app password (distinct from the one shown
    // once to the user). Used by the JMAP proxy; never returned to the client.
    webmailSecretEnc: text('webmail_secret_enc'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('mailbox_address_uq').on(t.address)],
);

export const thread = pgTable(
  'thread',
  {
    id: id(),
    tenantId: tenantId(),
    mailboxId: uuid('mailbox_id')
      .notNull()
      .references(() => mailbox.id, { onDelete: 'cascade' }),
    subject: text('subject'),
    lastAt: timestamp('last_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [index('thread_mailbox_last_idx').on(t.mailboxId, t.lastAt)],
);

export const message = pgTable(
  'message',
  {
    id: id(),
    tenantId: tenantId(),
    mailboxId: uuid('mailbox_id')
      .notNull()
      .references(() => mailbox.id, { onDelete: 'cascade' }),
    threadId: uuid('thread_id').references(() => thread.id, { onDelete: 'set null' }),
    direction: messageDirectionEnum('direction').notNull(),
    rfcMessageId: text('rfc_message_id'),
    folder: text('folder').notNull().default('inbox'),
    fromAddr: text('from_addr').notNull(),
    toAddrs: jsonb('to_addrs').$type<string[]>().notNull().default([]),
    subject: text('subject'),
    snippet: text('snippet'),
    // Raw MIME goes to object storage when configured (mimeKey). Without storage
    // (managed/serverless path) the parsed bodies live inline instead.
    mimeKey: text('mime_key'),
    bodyText: text('body_text'),
    bodyHtml: text('body_html'),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull().default(0),
    spamScore: integer('spam_score'),
    flags: jsonb('flags').$type<string[]>().notNull().default([]),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [
    index('message_mailbox_folder_idx').on(t.mailboxId, t.folder, t.receivedAt),
    uniqueIndex('message_rfcid_mailbox_uq').on(t.rfcMessageId, t.mailboxId),
  ],
);

export const attachment = pgTable('attachment', {
  id: id(),
  tenantId: tenantId(),
  messageId: uuid('message_id')
    .notNull()
    .references(() => message.id, { onDelete: 'cascade' }),
  filename: text('filename'),
  contentType: text('content_type'),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull().default(0),
  storageKey: text('storage_key').notNull(),
  createdAt: createdAt(),
});

// ─── outbound / deliverability ─────────────────────────────────────────────
export const outboundJob = pgTable(
  'outbound_job',
  {
    id: id(),
    tenantId: tenantId(),
    messageId: uuid('message_id').references(() => message.id, { onDelete: 'set null' }),
    status: outboundStatusEnum('status').notNull().default('queued'),
    provider: text('provider'),
    providerMessageId: text('provider_message_id'),
    idempotencyKey: text('idempotency_key'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('outbound_job_status_idx').on(t.status),
    uniqueIndex('outbound_job_idem_uq').on(t.tenantId, t.idempotencyKey),
  ],
);

export const deliveryEvent = pgTable(
  'delivery_event',
  {
    id: id(),
    tenantId: tenantId(),
    outboundJobId: uuid('outbound_job_id').references(() => outboundJob.id, {
      onDelete: 'cascade',
    }),
    type: deliveryEventTypeEnum('type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('delivery_event_job_idx').on(t.outboundJobId)],
);

export const suppression = pgTable(
  'suppression',
  {
    id: id(),
    tenantId: tenantId(),
    address: text('address').notNull(),
    reason: suppressionReasonEnum('reason').notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('suppression_tenant_addr_uq').on(t.tenantId, t.address)],
);

// ─── AI rules & automations ───────────────────────────────────────────────
export const aiRule = pgTable('ai_rule', {
  id: id(),
  tenantId: tenantId(),
  nlSource: text('nl_source').notNull(),
  compiledGraph: jsonb('compiled_graph').$type<Record<string, unknown>>().notNull().default({}),
  enabled: boolean('enabled').notNull().default(true),
  maxActionLevel: actionLevelEnum('max_action_level').notNull().default('safe'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const automationRun = pgTable(
  'automation_run',
  {
    id: id(),
    tenantId: tenantId(),
    ruleId: uuid('rule_id').references(() => aiRule.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id').references(() => message.id, { onDelete: 'set null' }),
    steps: jsonb('steps').$type<unknown[]>().notNull().default([]),
    status: text('status').notNull().default('running'),
    createdAt: createdAt(),
  },
  (t) => [index('automation_run_rule_idx').on(t.ruleId)],
);

// ─── developer surface ────────────────────────────────────────────────────
export const apiKey = pgTable(
  'api_key',
  {
    id: id(),
    tenantId: tenantId(),
    name: text('name').notNull(),
    hash: text('hash').notNull(),
    prefix: text('prefix').notNull(),
    scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('api_key_hash_uq').on(t.hash), index('api_key_prefix_idx').on(t.prefix)],
);

export const webhookEndpoint = pgTable('webhook_endpoint', {
  id: id(),
  tenantId: tenantId(),
  url: text('url').notNull(),
  events: jsonb('events').$type<string[]>().notNull().default([]),
  secret: text('secret').notNull(),
  failureCount: integer('failure_count').notNull().default(0),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: createdAt(),
});

export const mcpConnection = pgTable('mcp_connection', {
  id: id(),
  tenantId: tenantId(),
  clientId: text('client_id').notNull(),
  grantedScopes: jsonb('granted_scopes').$type<string[]>().notNull().default([]),
  status: text('status').notNull().default('active'),
  createdAt: createdAt(),
});

// ─── audit, usage, billing, analytics ─────────────────────────────────────
export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    tenantId: tenantId(),
    actor: text('actor').notNull(),
    action: text('action').notNull(),
    resource: text('resource'),
    approvedBy: text('approved_by'),
    meta: jsonb('meta').$type<Record<string, unknown>>().notNull().default({}),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_log_tenant_at_idx').on(t.tenantId, t.at)],
);

export const usageCounter = pgTable(
  'usage_counter',
  {
    id: id(),
    tenantId: tenantId(),
    metric: usageMetricEnum('metric').notNull(),
    window: text('window').notNull(), // e.g. '2026-08-31' (day) or '2026-08' (month)
    value: bigint('value', { mode: 'number' }).notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('usage_counter_uq').on(t.tenantId, t.metric, t.window)],
);

export const subscription = pgTable('subscription', {
  id: id(),
  tenantId: tenantId(),
  stripeId: text('stripe_id').unique(),
  plan: planEnum('plan').notNull().default('free'),
  status: text('status').notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const analyticsEvent = pgTable(
  'analytics_event',
  {
    id: id(),
    tenantId: tenantId(),
    name: text('name').notNull(),
    props: jsonb('props').$type<Record<string, unknown>>().notNull().default({}),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('analytics_event_name_at_idx').on(t.name, t.at)],
);

/**
 * Tables that carry `tenant_id` and must have RLS enabled + a tenant-isolation policy.
 * Keep in sync with `drizzle/rls.sql`. `workspace` / `app_user` are handled separately
 * (workspace is filtered by membership, app_user is global identity).
 */
export const TENANT_SCOPED_TABLES = [
  'membership',
  'domain',
  'dns_record',
  'mailbox',
  'thread',
  'message',
  'attachment',
  'outbound_job',
  'delivery_event',
  'suppression',
  'ai_rule',
  'automation_run',
  'api_key',
  'webhook_endpoint',
  'mcp_connection',
  'audit_log',
  'usage_counter',
  'subscription',
  'analytics_event',
] as const;
