import {
  filterSuppressed,
  getDb,
  type ResolvedApiKey,
  resolveApiKey,
  schema,
  touchApiKey,
  withTenant,
} from '@souramail/db';
import { getEmailProvider } from '@souramail/providers';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

// Mirrors @souramail/contracts `sendEmailRequest` (kept inline so this route
// doesn't pull the contracts package into the web bundle).
const sendEmailRequest = z.object({
  from: z.string().email(),
  to: z.array(z.string().email()).min(1).max(50),
  subject: z.string().min(1).max(998),
  html: z.string().optional(),
  text: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

/**
 * Public API v1, served from the Next app so it lives on the same deploy as the
 * dashboard and MCP (no separate container). Auth: a SouraMAIL API key
 * (`Authorization: Bearer soura_live_…`); the key's scopes gate each route.
 *
 * The BullMQ-backed bits (outbound webhook delivery, queue introspection) stay
 * in apps/api.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const { message, outboundJob, deliveryEvent, domain, dnsRecord } = schema;
const BASE = process.env.API_PUBLIC_URL ?? 'https://gala-guema.xyz/api/v1';

const INDEX = {
  name: 'SouraMAIL API',
  version: 'v1',
  base_url: BASE,
  auth: 'Authorization: Bearer soura_live_… (create a key in the dashboard → API Keys)',
  openapi: `${BASE}/openapi.json`,
  endpoints: {
    'POST /v1/emails': {
      scope: 'emails:send',
      body: 'from, to[], subject, text?, html?, headers?',
    },
    'GET /v1/emails/:id': { scope: 'emails:read', note: ':id is the provider message id' },
    'GET /v1/messages': { scope: 'emails:read', query: 'limit?, folder?' },
    'GET /v1/messages/:id': { scope: 'emails:read' },
    'GET /v1/domains': { scope: 'domains:read' },
    'GET /v1/domains/:id': { scope: 'domains:read' },
  },
};

export async function GET(req: Request, ctx: RouteCtx): Promise<Response> {
  const path = await seg(ctx);

  if (path.length === 0) return json(INDEX);
  if (path.length === 1 && path[0] === 'openapi.json') return json(openapi());

  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;
  const { key } = auth;

  // GET /v1/emails/:id
  const emailId = path[0] === 'emails' ? path[1] : undefined;
  if (emailId) {
    if (!scoped(key, 'emails:read')) return forbidden('emails:read');
    const row = await withTenant(getDb(), key.tenantId, async (tx) => {
      const [job] = await tx
        .select()
        .from(outboundJob)
        .where(eq(outboundJob.providerMessageId, emailId))
        .limit(1);
      if (!job) return null;
      const events = await tx
        .select({ type: deliveryEvent.type, at: deliveryEvent.at })
        .from(deliveryEvent)
        .where(eq(deliveryEvent.outboundJobId, job.id))
        .orderBy(deliveryEvent.at);
      return { job, events };
    });
    if (!row) return json({ error: 'not_found' }, 404);
    return json({
      id: emailId,
      status: row.job.status,
      attempts: row.job.attempts,
      last_error: row.job.lastError,
      events: row.events,
    });
  }

  // GET /v1/messages , GET /v1/messages/:id
  if (path[0] === 'messages') {
    if (!scoped(key, 'emails:read')) return forbidden('emails:read');
    if (path.length === 1) {
      const url = new URL(req.url);
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 40)));
      const folder = url.searchParams.get('folder') ?? undefined;
      const rows = await withTenant(getDb(), key.tenantId, (tx) =>
        tx
          .select({
            id: message.id,
            from: message.fromAddr,
            to: message.toAddrs,
            subject: message.subject,
            snippet: message.snippet,
            folder: message.folder,
            direction: message.direction,
            received_at: message.receivedAt,
          })
          .from(message)
          .where(
            folder
              ? and(eq(message.direction, 'inbound'), eq(message.folder, folder))
              : eq(message.direction, 'inbound'),
          )
          .orderBy(desc(message.receivedAt))
          .limit(limit),
      );
      return json({ data: rows, has_more: rows.length === limit });
    }
    const msgId = path[1];
    if (msgId) {
      const [m] = await withTenant(getDb(), key.tenantId, (tx) =>
        tx.select().from(message).where(eq(message.id, msgId)).limit(1),
      );
      if (!m) return json({ error: 'not_found' }, 404);
      return json({
        id: m.id,
        direction: m.direction,
        from: m.fromAddr,
        to: m.toAddrs,
        subject: m.subject,
        text: m.bodyText,
        html: m.bodyHtml,
        folder: m.folder,
        spam_score: m.spamScore,
        received_at: m.receivedAt,
      });
    }
  }

  // GET /v1/domains , GET /v1/domains/:id
  if (path[0] === 'domains') {
    if (!scoped(key, 'domains:read')) return forbidden('domains:read');
    if (path.length === 1) {
      const rows = await withTenant(getDb(), key.tenantId, (tx) =>
        tx
          .select({
            id: domain.id,
            name: domain.name,
            status: domain.status,
            health_score: domain.healthScore,
            verified_at: domain.verifiedAt,
          })
          .from(domain)
          .orderBy(domain.createdAt),
      );
      return json({ data: rows });
    }
    const domId = path[1];
    if (domId) {
      const found = await withTenant(getDb(), key.tenantId, async (tx) => {
        const [d] = await tx.select().from(domain).where(eq(domain.id, domId)).limit(1);
        if (!d) return null;
        const recs = await tx
          .select({
            type: dnsRecord.type,
            name: dnsRecord.name,
            expected_value: dnsRecord.expectedValue,
            state: dnsRecord.state,
          })
          .from(dnsRecord)
          .where(eq(dnsRecord.domainId, d.id));
        return { d, recs };
      });
      if (!found) return json({ error: 'not_found' }, 404);
      return json({
        id: found.d.id,
        name: found.d.name,
        status: found.d.status,
        health_score: found.d.healthScore,
        dns_records: found.recs,
      });
    }
  }

  return json({ error: 'not_found' }, 404);
}

export async function POST(req: Request, ctx: RouteCtx): Promise<Response> {
  const path = await seg(ctx);
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;
  const { key } = auth;

  // POST /v1/emails
  if (path.length === 1 && path[0] === 'emails') {
    if (!scoped(key, 'emails:send')) return forbidden('emails:send');

    const parsed = sendEmailRequest.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return json({ error: 'invalid_body', issues: parsed.error.issues }, 422);
    }
    const body = parsed.data;
    const idem = req.headers.get('idempotency-key') || undefined;

    if (idem) {
      const [prior] = await withTenant(getDb(), key.tenantId, (tx) =>
        tx
          .select({ id: outboundJob.providerMessageId, status: outboundJob.status })
          .from(outboundJob)
          .where(eq(outboundJob.idempotencyKey, idem))
          .limit(1),
      );
      if (prior?.id) return json({ id: prior.id, status: prior.status, idempotent_replay: true });
    }

    const fromDomain = body.from.split('@')[1]?.toLowerCase() ?? '';
    const [dom] = await withTenant(getDb(), key.tenantId, (tx) =>
      tx
        .select({ status: domain.status })
        .from(domain)
        .where(and(eq(domain.tenantId, key.tenantId), eq(domain.name, fromDomain)))
        .limit(1),
    );
    if (!dom) {
      return json({ error: 'domain_not_connected', message: `Connect ${fromDomain} first.` }, 422);
    }
    if (dom.status !== 'active') {
      return json({ error: 'domain_not_verified', message: `${fromDomain} is not verified.` }, 422);
    }

    const { allowed, suppressed } = await filterSuppressed(key.tenantId, body.to);
    if (allowed.length === 0) return json({ error: 'all_recipients_suppressed', suppressed }, 422);

    let providerMessageId: string;
    try {
      const email = await getEmailProvider();
      ({ providerMessageId } = await email.send({
        from: body.from,
        to: allowed,
        subject: body.subject,
        text: body.text,
        html: body.html,
        headers: body.headers,
        tenantId: key.tenantId,
        idempotencyKey: idem,
        returnPath: 'bounce@bounce.souramail.com',
      }));
      await withTenant(getDb(), key.tenantId, (tx) =>
        tx.insert(outboundJob).values({
          tenantId: key.tenantId,
          status: 'sent',
          provider: email.name,
          providerMessageId,
          idempotencyKey: idem ?? null,
        }),
      );
    } catch (err) {
      return json(
        { error: 'send_failed', detail: err instanceof Error ? err.message : String(err) },
        502,
      );
    }

    return json(
      {
        id: providerMessageId,
        status: 'sent',
        to: allowed,
        ...(suppressed.length ? { skipped_suppressed: suppressed } : {}),
      },
      202,
    );
  }

  return json({ error: 'not_found' }, 404);
}

// ─── helpers ──────────────────────────────────────────────────────────────

type RouteCtx = { params: Promise<{ path?: string[] }> };

async function seg(ctx: RouteCtx): Promise<string[]> {
  const { path } = await ctx.params;
  return path ?? [];
}

async function authenticate(req: Request): Promise<{ key: ResolvedApiKey } | { error: Response }> {
  const header = req.headers.get('authorization') ?? '';
  const raw = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!raw.startsWith('soura_')) {
    return {
      error: json(
        { error: 'missing_api_key', message: 'Send Authorization: Bearer soura_live_…' },
        401,
        {
          'www-authenticate': 'Bearer realm="SouraMAIL API"',
        },
      ),
    };
  }
  const key = await resolveApiKey(raw).catch(() => null);
  if (!key) return { error: json({ error: 'invalid_api_key' }, 401) };
  void touchApiKey(key.apiKeyId).catch(() => {});
  return { key };
}

function scoped(key: ResolvedApiKey, scope: string): boolean {
  return key.scopes.includes(scope);
}

function forbidden(scope: string): Response {
  return json({ error: 'insufficient_scope', message: `This key is missing "${scope}".` }, 403);
}

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json', ...extra },
  });
}

function openapi() {
  const scheme = { type: 'http', scheme: 'bearer', bearerFormat: 'soura_live_…' } as const;
  const notFound = { description: 'Not found' };
  return {
    openapi: '3.1.0',
    info: { title: 'SouraMAIL API', version: 'v1' },
    servers: [{ url: BASE }],
    components: { securitySchemes: { apiKey: scheme } },
    security: [{ apiKey: [] }],
    paths: {
      '/emails': {
        post: {
          summary: 'Send an email',
          description: 'Requires the emails:send scope and a verified sending domain.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['from', 'to', 'subject'],
                  properties: {
                    from: { type: 'string', format: 'email' },
                    to: { type: 'array', items: { type: 'string', format: 'email' } },
                    subject: { type: 'string' },
                    text: { type: 'string' },
                    html: { type: 'string' },
                    headers: { type: 'object', additionalProperties: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: {
            '202': { description: 'Accepted' },
            '422': { description: 'Validation error' },
          },
        },
      },
      '/emails/{id}': {
        get: {
          summary: 'Delivery status for a sent email',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'OK' }, '404': notFound },
        },
      },
      '/messages': {
        get: {
          summary: 'List received (inbound) messages',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 100 } },
            { name: 'folder', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'OK' } },
        },
      },
      '/messages/{id}': {
        get: {
          summary: 'Get one received message',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'OK' }, '404': notFound },
        },
      },
      '/domains': {
        get: { summary: 'List connected domains', responses: { '200': { description: 'OK' } } },
      },
      '/domains/{id}': {
        get: {
          summary: 'Get a domain with its DNS records',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'OK' }, '404': notFound },
        },
      },
    },
  };
}
