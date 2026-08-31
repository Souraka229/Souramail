import { createPool } from '@souramail/db';
import Fastify from 'fastify';
import { Redis } from 'ioredis';

// NOTE: Better Auth is served by the Next.js app (`apps/web`, /api/auth/*), matching
// the Better Auth Infra dashboard config (baseURL = the web app). This Fastify API
// validates sessions via `auth.api.getSession(...)` from `@souramail/auth` when needed.

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });

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

// v1 API surface is built in Phase 2 (see docs/05 §6).
app.get('/v1', async () => ({ version: 'v1', status: 'not-implemented-yet' }));

const port = Number(process.env.PORT ?? 4000);
app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`api listening on :${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    await app.close();
    await pool.end();
    redis.disconnect();
    process.exit(0);
  });
}
