import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createPool } from '@souramail/db';
import Fastify from 'fastify';
import { Redis } from 'ioredis';
import { apiKeyAuth } from './auth.ts';
import { closeQueues } from './queues.ts';
import { registerSesWebhook } from './routes/ses-webhook.ts';
import { registerStalwartHook } from './routes/stalwart-hook.ts';
import { registerV1 } from './routes/v1.ts';

// Better Auth is served by the Next.js app (apps/web, /api/auth/*). This Fastify
// service is the public developer API (docs/05 §6) + the mail webhooks.

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' }, trustProxy: true });

const pool = createPool();
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

app.get('/healthz', async () => ({ status: 'ok', service: 'api', ts: new Date().toISOString() }));

app.get('/readyz', async (_req, reply) => {
  const checks: Record<string, 'ok' | 'fail'> = {};
  try {
    await pool.query('select 1');
    checks.postgres = 'ok';
  } catch {
    checks.postgres = 'fail';
  }
  try {
    await redis.connect().catch(() => {});
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'fail';
  }
  const ready = Object.values(checks).every((v) => v === 'ok');
  return reply.code(ready ? 200 : 503).send({ ready, checks });
});

// Mail webhooks (no API-key auth — their own bearer/signature).
registerStalwartHook(app);
registerSesWebhook(app);

async function start(): Promise<void> {
  // API-key auth first, so rate-limit can key by the resolved key.
  app.addHook('onRequest', apiKeyAuth);

  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.apiCtx?.apiKeyId ?? req.ip,
    allowList: (req) => req.url === '/healthz' || req.url === '/readyz',
  });

  await app.register(swagger, {
    openapi: {
      info: { title: 'SouraMAIL API', version: '1.0.0' },
      servers: [{ url: process.env.API_PUBLIC_URL ?? 'http://localhost:4000' }],
      components: {
        securitySchemes: {
          apiKey: { type: 'http', scheme: 'bearer', bearerFormat: 'soura_live_…' },
        },
      },
      security: [{ apiKey: [] }],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  registerV1(app, redis);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`api listening on :${port}`);
}

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    await app.close();
    await closeQueues();
    await pool.end();
    redis.disconnect();
    process.exit(0);
  });
}
