import { Buffer } from 'node:buffer';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { resolveMailboxByAddress, storeInboundMessage } from '@souramail/db';
import { simpleParser } from 'mailparser';

/**
 * Managed inbound path (no mail server): a Cloudflare Email Routing Worker (or
 * SES Inbound → SNS, or any provider inbound webhook) POSTs the raw RFC822 here.
 * We parse it, resolve the recipient to a mailbox, and store it — same
 * `message` / `thread` / `attachment` rows the Stalwart path writes, so the
 * webmail reads it identically.
 *
 * Body: { to?: string, from?: string, rawBase64: string }  (or `raw` plain text)
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.INBOUND_WEBHOOK_SECRET ?? '';
  if (!secret || !bearerOk(request.headers.get('authorization'), secret)) {
    return json({ error: 'unauthorized' }, 401);
  }

  let body: { to?: string; from?: string; rawBase64?: string; raw?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'bad json' }, 400);
  }

  let raw: Buffer | null = null;
  if (body.rawBase64) raw = Buffer.from(body.rawBase64, 'base64');
  else if (body.raw) raw = Buffer.from(body.raw, 'utf8');
  if (!raw) return json({ error: 'no message' }, 400);

  const parsed = await simpleParser(raw);
  const toList = Array.isArray(parsed.to) ? parsed.to : parsed.to ? [parsed.to] : [];
  const rcpt = body.to ?? toList[0]?.value[0]?.address;
  if (!rcpt) return json({ ok: true, ignored: 'no recipient' });

  const mbx = await resolveMailboxByAddress(rcpt).catch(() => null);
  if (!mbx) return json({ ok: true, unmatched: rcpt });

  const toAddrs = toList.flatMap((a) => a.value.map((v) => v.address ?? '').filter(Boolean));

  const result = await storeInboundMessage({
    tenantId: mbx.tenantId,
    mailboxId: mbx.mailboxId,
    rfcMessageId: parsed.messageId ?? `no-id-${randomUUID()}`,
    fromAddr: body.from ?? parsed.from?.value[0]?.address ?? 'unknown@unknown',
    toAddrs: toAddrs.length ? toAddrs : [rcpt],
    subject: parsed.subject ?? null,
    snippet: (parsed.text ?? '').slice(0, 280) || null,
    bodyText: parsed.text ?? null,
    bodyHtml: typeof parsed.html === 'string' ? parsed.html : null,
    receivedAt: parsed.date ?? new Date(),
    sizeBytes: raw.byteLength,
  });

  return json({ ok: true, ...result });
}

function bearerOk(header: string | null, secret: string): boolean {
  const got = header?.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
