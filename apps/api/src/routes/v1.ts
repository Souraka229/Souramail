import { randomUUID } from 'node:crypto';
import { sendEmailRequest } from '@souramail/contracts';
import { filterSuppressed, getDb, schema, withTenant } from '@souramail/db';
import { getEmailProvider } from '@souramail/providers';
import { and, desc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { Redis } from 'ioredis';
import { requireScope } from '../auth.ts';

const { message, outboundJob, deliveryEvent, domain, webhookEndpoint } = schema;

export function registerV1(app: FastifyInstance, redis: Redis): void {
  app.get('/v1', async () => ({
    name: 'SouraMAIL API',
    version: 'v1',
    docs: '/docs',
    endpoints: [
      'POST /v1/emails',
      'GET /v1/emails/:id',
      'GET /v1/messages',
      'GET /v1/messages/:id',
      'GET /v1/domains',
      'GET /v1/domains/:id',
      'GET|POST /v1/webhooks',
      'DELETE /v1/webhooks/:id',
    ],
  }));

  // ─── emails.send ───────────────────────────────────────────────────────
  app.post('/v1/emails', { preHandler: requireScope('emails:send') }, async (req, reply) => {
    const ctx = req.apiCtx!;
    const parsed = sendEmailRequest.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send({ error: 'invalid_body', issues: parsed.error.issues });
    }
    const body = parsed.data;

    const idem = req.headers['idempotency-key'];
    const idemKey = typeof idem === 'string' && idem ? `idem:${ctx.tenantId}:${idem}` : null;
    if (idemKey) {
      const prior = await redis.get(idemKey);
      if (prior) return reply.code(200).send(JSON.parse(prior));
    }

    const fromDomain = body.from.split('@')[1]?.toLowerCase() ?? '';
    const dom = await withTenant(getDb(), ctx.tenantId, async (tx) => {
      const [d] = await tx
        .select({ status: domain.status })
        .from(domain)
        .where(and(eq(domain.tenantId, ctx.tenantId), eq(domain.name, fromDomain)))
        .limit(1);
      return d;
    });
    if (!dom) {
      return reply
        .code(422)
        .send({ error: 'domain_not_connected', message: `Connect ${fromDomain} first.` });
    }
    if (dom.status !== 'active') {
      return reply
        .code(422)
        .send({ error: 'domain_not_verified', message: `${fromDomain} is not verified yet.` });
    }

    const { allowed, suppressed } = await filterSuppressed(ctx.tenantId, body.to);
    if (allowed.length === 0) {
      return reply.code(422).send({ error: 'all_recipients_suppressed', suppressed });
    }

    const email = await getEmailProvider();
    let providerMessageId: string;
    try {
      ({ providerMessageId } = await email.send({
        from: body.from,
        to: allowed,
        subject: body.subject,
        text: body.text,
        html: body.html,
        headers: body.headers,
        tenantId: ctx.tenantId,
        idempotencyKey: typeof idem === 'string' ? idem : undefined,
        returnPath: 'bounce@bounce.souramail.com',
      }));
    } catch (err) {
      req.log.error({ err }, 'v1/emails send failed');
      return reply.code(502).send({ error: 'send_failed' });
    }

    // API-originated mail isn't in a mailbox — record just the outbound_job
    // (the delivery-event webhook joins back to it by provider_message_id).
    await withTenant(getDb(), ctx.tenantId, (tx) =>
      tx.insert(outboundJob).values({
        tenantId: ctx.tenantId,
        status: 'sent',
        provider: email.name,
        providerMessageId,
        idempotencyKey: typeof idem === 'string' ? idem : null,
      }),
    );

    const result = {
      id: providerMessageId,
      status: 'sent',
      to: allowed,
      ...(suppressed.length ? { skipped_suppressed: suppressed } : {}),
    };
    if (idemKey) await redis.set(idemKey, JSON.stringify(result), 'EX', 86400);
    return reply.code(202).send(result);
  });

  // ─── emails.get (delivery status) ─────────────────────────────────────
  app.get<{ Params: { id: string } }>(
    '/v1/emails/:id',
    { preHandler: requireScope('emails:read') },
    async (req, reply) => {
      const ctx = req.apiCtx!;
      const row = await withTenant(getDb(), ctx.tenantId, async (tx) => {
        const [job] = await tx
          .select()
          .from(outboundJob)
          .where(eq(outboundJob.providerMessageId, req.params.id))
          .limit(1);
        if (!job) return null;
        const events = await tx
          .select({ type: deliveryEvent.type, at: deliveryEvent.at })
          .from(deliveryEvent)
          .where(eq(deliveryEvent.outboundJobId, job.id))
          .orderBy(deliveryEvent.at);
        return { job, events };
      });
      if (!row) return reply.code(404).send({ error: 'not_found' });
      return {
        id: req.params.id,
        status: row.job.status,
        attempts: row.job.attempts,
        last_error: row.job.lastError,
        events: row.events,
      };
    },
  );

  // ─── messages (inbound) ──────────────────────────────────────────────
  app.get<{ Querystring: { limit?: string; folder?: string } }>(
    '/v1/messages',
    { preHandler: requireScope('emails:read') },
    async (req) => {
      const ctx = req.apiCtx!;
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 40)));
      const rows = await withTenant(getDb(), ctx.tenantId, (tx) => {
        const base = tx
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
          .$dynamic();
        const where = req.query.folder
          ? and(eq(message.direction, 'inbound'), eq(message.folder, req.query.folder))
          : eq(message.direction, 'inbound');
        return base.where(where).orderBy(desc(message.receivedAt)).limit(limit);
      });
      return { data: rows, has_more: rows.length === limit };
    },
  );

  app.get<{ Params: { id: string } }>(
    '/v1/messages/:id',
    { preHandler: requireScope('emails:read') },
    async (req, reply) => {
      const ctx = req.apiCtx!;
      const [m] = await withTenant(getDb(), ctx.tenantId, (tx) =>
        tx.select().from(message).where(eq(message.id, req.params.id)).limit(1),
      );
      if (!m) return reply.code(404).send({ error: 'not_found' });
      return {
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
      };
    },
  );

  // ─── domains (read) ─────────────────────────────────────────────────
  app.get('/v1/domains', { preHandler: requireScope('domains:read') }, async (req) => {
    const ctx = req.apiCtx!;
    const rows = await withTenant(getDb(), ctx.tenantId, (tx) =>
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
    return { data: rows };
  });

  app.get<{ Params: { id: string } }>(
    '/v1/domains/:id',
    { preHandler: requireScope('domains:read') },
    async (req, reply) => {
      const ctx = req.apiCtx!;
      const found = await withTenant(getDb(), ctx.tenantId, async (tx) => {
        const [d] = await tx.select().from(domain).where(eq(domain.id, req.params.id)).limit(1);
        if (!d) return null;
        const recs = await tx
          .select({
            type: schema.dnsRecord.type,
            name: schema.dnsRecord.name,
            expected_value: schema.dnsRecord.expectedValue,
            state: schema.dnsRecord.state,
          })
          .from(schema.dnsRecord)
          .where(eq(schema.dnsRecord.domainId, d.id));
        return { d, recs };
      });
      if (!found) return reply.code(404).send({ error: 'not_found' });
      return {
        id: found.d.id,
        name: found.d.name,
        status: found.d.status,
        health_score: found.d.healthScore,
        dns_records: found.recs,
      };
    },
  );

  // ─── webhooks CRUD ─────────────────────────────────────────────────
  app.get('/v1/webhooks', { preHandler: requireScope('webhooks:manage') }, async (req) => {
    const ctx = req.apiCtx!;
    const rows = await withTenant(getDb(), ctx.tenantId, (tx) =>
      tx
        .select({
          id: webhookEndpoint.id,
          url: webhookEndpoint.url,
          events: webhookEndpoint.events,
          enabled: webhookEndpoint.enabled,
          failure_count: webhookEndpoint.failureCount,
        })
        .from(webhookEndpoint),
    );
    return { data: rows };
  });

  app.post<{ Body: { url?: string; events?: string[] } }>(
    '/v1/webhooks',
    { preHandler: requireScope('webhooks:manage') },
    async (req, reply) => {
      const ctx = req.apiCtx!;
      const url = String(req.body?.url ?? '');
      if (!/^https:\/\//.test(url)) {
        return reply.code(422).send({ error: 'invalid_url', message: 'Must be an https URL.' });
      }
      const events = Array.isArray(req.body?.events) ? req.body!.events : [];
      const secret = `whsec_${randomUUID().replace(/-/g, '')}`;
      const [row] = await withTenant(getDb(), ctx.tenantId, (tx) =>
        tx
          .insert(webhookEndpoint)
          .values({ tenantId: ctx.tenantId, url, events, secret })
          .returning({ id: webhookEndpoint.id, url: webhookEndpoint.url }),
      );
      return reply.code(201).send({ ...row, events, secret });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/v1/webhooks/:id',
    { preHandler: requireScope('webhooks:manage') },
    async (req, reply) => {
      const ctx = req.apiCtx!;
      await withTenant(getDb(), ctx.tenantId, (tx) =>
        tx
          .delete(webhookEndpoint)
          .where(
            and(eq(webhookEndpoint.id, req.params.id), eq(webhookEndpoint.tenantId, ctx.tenantId)),
          ),
      );
      return reply.code(204).send();
    },
  );
}
