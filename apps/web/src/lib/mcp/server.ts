import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { emailHealthScore, type ScoredRecord } from '@souramail/core';
import { filterSuppressed, getDb, schema, withTenant } from '@souramail/db';
import { getEmailProvider } from '@souramail/providers';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

const { message, domain, dnsRecord, outboundJob, deliveryEvent, auditLog } = schema;

export interface McpCtx {
  tenantId: string;
  scopes: string[];
  actor: string; // e.g. "mcp:Production key"
}

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] });

async function audit(ctx: McpCtx, action: string, resource: string, meta: Record<string, unknown>) {
  await withTenant(getDb(), ctx.tenantId, (tx) =>
    tx
      .insert(auditLog)
      .values({ tenantId: ctx.tenantId, actor: ctx.actor, action, resource, meta }),
  ).catch(() => {});
}

function has(ctx: McpCtx, scope: string): boolean {
  return ctx.scopes.includes(scope);
}

/** Build a per-request MCP server scoped to the caller's workspace + key scopes. */
export function buildMcpServer(ctx: McpCtx): McpServer {
  const server = new McpServer(
    { name: 'souramail', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    'search_emails',
    {
      description: 'Search the workspace mail by text in subject/sender/snippet.',
      inputSchema: {
        query: z.string().describe('substring to match'),
        folder: z.string().optional().describe('inbox | sent | spam …'),
        limit: z.number().int().min(1).max(50).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, folder, limit }) => {
      if (!has(ctx, 'emails:read')) return text('Denied: key lacks emails:read.');
      const q = query.toLowerCase();
      const rows = await withTenant(getDb(), ctx.tenantId, (tx) =>
        tx
          .select({
            id: message.id,
            from: message.fromAddr,
            subject: message.subject,
            snippet: message.snippet,
            folder: message.folder,
            received_at: message.receivedAt,
          })
          .from(message)
          .where(folder ? eq(message.folder, folder) : undefined)
          .orderBy(desc(message.receivedAt))
          .limit(200),
      );
      const hits = rows
        .filter(
          (r) =>
            (r.subject ?? '').toLowerCase().includes(q) ||
            r.from.toLowerCase().includes(q) ||
            (r.snippet ?? '').toLowerCase().includes(q),
        )
        .slice(0, limit ?? 20);
      await audit(ctx, 'mcp.search_emails', 'messages', { query, hits: hits.length });
      return text(JSON.stringify(hits, null, 2));
    },
  );

  server.registerTool(
    'read_email',
    {
      description: 'Get one message by id, with its body.',
      inputSchema: { id: z.string().uuid() },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => {
      if (!has(ctx, 'emails:read')) return text('Denied: key lacks emails:read.');
      const [m] = await withTenant(getDb(), ctx.tenantId, (tx) =>
        tx.select().from(message).where(eq(message.id, id)).limit(1),
      );
      if (!m) return text('Not found.');
      await audit(ctx, 'mcp.read_email', `message:${id}`, {});
      return text(
        JSON.stringify(
          {
            id: m.id,
            direction: m.direction,
            from: m.fromAddr,
            to: m.toAddrs,
            subject: m.subject,
            folder: m.folder,
            received_at: m.receivedAt,
            body: m.bodyText ?? m.bodyHtml ?? m.snippet,
          },
          null,
          2,
        ),
      );
    },
  );

  server.registerTool(
    'list_domains',
    {
      description: 'List the workspace domains and their verification status.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      if (!has(ctx, 'domains:read')) return text('Denied: key lacks domains:read.');
      const rows = await withTenant(getDb(), ctx.tenantId, (tx) =>
        tx
          .select({
            id: domain.id,
            name: domain.name,
            status: domain.status,
            health_score: domain.healthScore,
          })
          .from(domain),
      );
      return text(JSON.stringify(rows, null, 2));
    },
  );

  server.registerTool(
    'check_domain',
    {
      description: 'DNS record state + Email Health for one domain (by name).',
      inputSchema: { name: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ name }) => {
      if (!has(ctx, 'domains:read')) return text('Denied: key lacks domains:read.');
      const found = await withTenant(getDb(), ctx.tenantId, async (tx) => {
        const [d] = await tx
          .select()
          .from(domain)
          .where(eq(domain.name, name.toLowerCase()))
          .limit(1);
        if (!d) return null;
        const recs = await tx.select().from(dnsRecord).where(eq(dnsRecord.domainId, d.id));
        return { d, recs };
      });
      if (!found) return text(`Domain "${name}" is not connected to this workspace.`);
      const scored: ScoredRecord[] = found.recs.map((r) => ({
        key: r.name.startsWith('_dmarc')
          ? 'dmarc'
          : r.name.includes('_domainkey')
            ? 'dkim'
            : r.type === 'MX'
              ? 'mx'
              : 'spf',
        category: r.type === 'MX' ? 'deliverability' : 'authentication',
        state: r.state as ScoredRecord['state'],
      }));
      return text(
        JSON.stringify(
          {
            name: found.d.name,
            status: found.d.status,
            health: emailHealthScore(scored),
            records: found.recs.map((r) => ({
              type: r.type,
              name: r.name,
              expected: r.expectedValue,
              state: r.state,
            })),
          },
          null,
          2,
        ),
      );
    },
  );

  server.registerTool(
    'get_delivery_status',
    {
      description: 'Delivery status + events for a sent message (by provider message id).',
      inputSchema: { provider_message_id: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ provider_message_id }) => {
      if (!has(ctx, 'emails:read')) return text('Denied: key lacks emails:read.');
      const row = await withTenant(getDb(), ctx.tenantId, async (tx) => {
        const [job] = await tx
          .select()
          .from(outboundJob)
          .where(eq(outboundJob.providerMessageId, provider_message_id))
          .limit(1);
        if (!job) return null;
        const events = await tx
          .select({ type: deliveryEvent.type, at: deliveryEvent.at })
          .from(deliveryEvent)
          .where(eq(deliveryEvent.outboundJobId, job.id));
        return { status: job.status, attempts: job.attempts, last_error: job.lastError, events };
      });
      return text(row ? JSON.stringify(row, null, 2) : 'Not found.');
    },
  );

  server.registerTool(
    'send_email',
    {
      description:
        'Send an email from a verified domain in this workspace. SENSITIVE — the client should confirm before calling.',
      inputSchema: {
        from: z.string().email(),
        to: z.array(z.string().email()).min(1).max(50),
        subject: z.string().min(1).max(998),
        text: z.string(),
      },
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async ({ from, to, subject, text: bodyText }) => {
      if (!has(ctx, 'emails:send')) return text('Denied: key lacks emails:send.');
      const fromDomain = from.split('@')[1]?.toLowerCase() ?? '';
      const dom = await withTenant(getDb(), ctx.tenantId, async (tx) => {
        const [d] = await tx
          .select({ status: domain.status })
          .from(domain)
          .where(and(eq(domain.tenantId, ctx.tenantId), eq(domain.name, fromDomain)))
          .limit(1);
        return d;
      });
      if (!dom) return text(`Domain ${fromDomain} is not connected.`);
      if (dom.status !== 'active') return text(`Domain ${fromDomain} is not verified yet.`);

      const { allowed, suppressed } = await filterSuppressed(ctx.tenantId, to);
      if (allowed.length === 0) return text('All recipients are on the suppression list.');

      const email = await getEmailProvider();
      const { providerMessageId } = await email.send({
        from,
        to: allowed,
        subject,
        text: bodyText,
        tenantId: ctx.tenantId,
        returnPath: 'bounce@bounce.souramail.com',
      });
      await withTenant(getDb(), ctx.tenantId, (tx) =>
        tx.insert(outboundJob).values({
          tenantId: ctx.tenantId,
          status: 'sent',
          provider: email.name,
          providerMessageId,
        }),
      );
      await audit(ctx, 'mcp.send_email', `email:${providerMessageId}`, { to: allowed, subject });
      return text(
        `Sent. id=${providerMessageId}${suppressed.length ? ` (skipped suppressed: ${suppressed.join(', ')})` : ''}`,
      );
    },
  );

  return server;
}
