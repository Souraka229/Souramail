import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { resolveApiKey, touchApiKey } from '@souramail/db';
import { buildMcpServer } from '@/lib/mcp/server';
import { StatelessTransport } from '@/lib/mcp/transport';

/**
 * Remote MCP server (docs/05 §5.4), Streamable HTTP, JSON-response (stateless)
 * mode so it runs in a serverless function. Auth: a SouraMAIL API key as the
 * bearer token; the key's scopes gate each tool. OAuth 2.1 + PKCE is the
 * production hardening step — this is the v1.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UNAUTH = {
  jsonrpc: '2.0' as const,
  error: { code: -32001, message: 'Unauthorized — send Authorization: Bearer soura_live_…' },
  id: null,
};

export async function POST(request: Request): Promise<Response> {
  const header = request.headers.get('authorization') ?? '';
  const key = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!key.startsWith('soura_')) {
    return json(UNAUTH, 401, {
      'www-authenticate': 'Bearer realm="SouraMAIL MCP"',
    });
  }
  const resolved = await resolveApiKey(key).catch(() => null);
  if (!resolved) return json(UNAUTH, 401);
  void touchApiKey(resolved.apiKeyId).catch(() => {});

  let body: JSONRPCMessage | JSONRPCMessage[];
  try {
    body = (await request.json()) as JSONRPCMessage | JSONRPCMessage[];
  } catch {
    return json({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }, 400);
  }

  const server = buildMcpServer({
    tenantId: resolved.tenantId,
    scopes: resolved.scopes,
    actor: `mcp:${resolved.name}`,
  });
  const transport = new StatelessTransport();
  await server.connect(transport);

  const messages = Array.isArray(body) ? body : [body];
  const out: JSONRPCMessage[] = [];
  for (const m of messages) {
    out.push(...(await transport.handle(m)));
  }
  await server.close();

  if (out.length === 0) return new Response(null, { status: 202 });
  return json(out.length === 1 ? out[0] : out, 200);
}

export function GET(): Response {
  return json(
    {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Use POST (JSON-response mode; no SSE).' },
      id: null,
    },
    405,
  );
}

function json(data: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...extra },
  });
}
