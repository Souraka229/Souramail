import { resolveApiKey, touchApiKey } from '@souramail/db';
import type { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    apiCtx?: { tenantId: string; scopes: string[]; apiKeyId: string; keyName: string };
  }
}

/** onRequest hook: authenticate `Authorization: Bearer soura_...`. */
export async function apiKeyAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  // health + docs are public
  if (req.url === '/healthz' || req.url === '/readyz' || req.url.startsWith('/docs')) return;
  if (!req.url.startsWith('/v1')) return;
  if (req.url === '/v1' || req.url === '/v1/') return;

  const header = req.headers.authorization ?? '';
  const key = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!key.startsWith('soura_')) {
    return reply
      .code(401)
      .header('www-authenticate', 'Bearer realm="SouraMAIL API"')
      .send({ error: 'missing_api_key', message: 'Send Authorization: Bearer soura_live_…' });
  }

  const resolved = await resolveApiKey(key).catch(() => null);
  if (!resolved) {
    return reply.code(401).send({ error: 'invalid_api_key' });
  }

  req.apiCtx = {
    tenantId: resolved.tenantId,
    scopes: resolved.scopes,
    apiKeyId: resolved.apiKeyId,
    keyName: resolved.name,
  };
  void touchApiKey(resolved.apiKeyId).catch(() => {});
}

/** preHandler factory: enforce a scope on the resolved key. */
export function requireScope(scope: string) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.apiCtx) return reply.code(401).send({ error: 'unauthenticated' });
    if (!req.apiCtx.scopes.includes(scope)) {
      return reply.code(403).send({
        error: 'insufficient_scope',
        message: `This key is missing the "${scope}" scope.`,
      });
    }
  };
}
