import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  applyDeliveryEvent,
  resolveMailboxByAddress,
  resolveOutboundJobByProviderMsg,
  storeInboundMessage,
} from '@souramail/db';
import { simpleParser } from 'mailparser';

/**
 * Single Resend webhook endpoint for every flow (docs/05 §4.2, §7):
 *
 *   email.received                 → fetch the body via the Receiving API,
 *                                    resolve the mailbox, storeInboundMessage()
 *   email.delivered                → outbound job `delivered`
 *   email.bounced                  → job `bounced` + suppress + risk +8
 *   email.complained               → job `spam`   + suppress + risk +15
 *   email.delivery_delayed / .sent → event only
 *
 * Requests are Svix-signed (svix-id / svix-timestamp / svix-signature, a
 * `whsec_` secret). Verified against the raw body before anything touches the DB.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESEND_API = 'https://api.resend.com';
const FIVE_MIN = 5 * 60 * 1000;

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.RESEND_WEBHOOK_SECRET ?? '';
  const apiKey = process.env.RESEND_API_KEY ?? '';
  if (!secret) return json({ error: 'RESEND_WEBHOOK_SECRET not set' }, 500);

  const raw = await request.text();
  const id = request.headers.get('svix-id') ?? '';
  const ts = request.headers.get('svix-timestamp') ?? '';
  const sig = request.headers.get('svix-signature') ?? '';
  if (!svixVerify({ secret, id, ts, sig, body: raw })) {
    return json({ error: 'bad signature' }, 401);
  }

  let evt: ResendEvent;
  try {
    evt = JSON.parse(raw) as ResendEvent;
  } catch {
    return json({ error: 'bad json' }, 400);
  }

  try {
    if (evt.type === 'email.received') {
      return json(await handleInbound(evt, apiKey));
    }
    if (
      evt.type === 'email.delivered' ||
      evt.type === 'email.bounced' ||
      evt.type === 'email.complained'
    ) {
      return json(await handleDeliveryEvent(evt));
    }
    return json({ ok: true, ignored: evt.type });
  } catch (err) {
    // 500 so Resend retries; the payload is already signature-verified.
    return json({ error: err instanceof Error ? err.message : 'handler failed' }, 500);
  }
}

// ─── inbound ──────────────────────────────────────────────────────────────

async function handleInbound(evt: ResendEvent, apiKey: string): Promise<unknown> {
  const emailId = evt.data.email_id;
  if (!emailId) return { ok: true, ignored: 'no email_id' };
  if (!apiKey) throw new Error('RESEND_API_KEY not set — cannot fetch inbound body');

  const res = await fetch(`${RESEND_API}/emails/receiving/${emailId}`, {
    headers: { authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`receiving.get ${res.status}`);
  const mail = (await res.json()) as ReceivingEmail;

  const rcpt =
    firstAddr(evt.data.to) ?? firstAddr(mail.to) ?? firstAddr(mail.received_for) ?? undefined;
  if (!rcpt) return { ok: true, ignored: 'no recipient' };

  const mbx = await resolveMailboxByAddress(rcpt).catch(() => null);
  if (!mbx) return { ok: true, unmatched: rcpt };

  // Prefer the true raw MIME (keeps every header) when Resend gives a link.
  let rawText: string | null = null;
  if (mail.raw?.download_url) {
    rawText = await fetch(mail.raw.download_url)
      .then((r) => (r.ok ? r.text() : null))
      .catch(() => null);
  }
  const parsed = rawText ? await simpleParser(rawText) : null;

  const toAddrs = addrList(evt.data.to ?? mail.to);
  const result = await storeInboundMessage({
    tenantId: mbx.tenantId,
    mailboxId: mbx.mailboxId,
    rfcMessageId: parsed?.messageId ?? mail.message_id ?? `resend-${emailId}`,
    fromAddr: firstAddr(mail.from) ?? firstAddr(evt.data.from) ?? 'unknown@unknown',
    toAddrs: toAddrs.length ? toAddrs : [rcpt],
    subject: mail.subject ?? evt.data.subject ?? null,
    snippet: (parsed?.text ?? mail.text ?? '').slice(0, 280) || null,
    bodyText: parsed?.text ?? mail.text ?? null,
    bodyHtml: (typeof parsed?.html === 'string' ? parsed.html : null) ?? mail.html ?? null,
    receivedAt: mail.created_at ? new Date(mail.created_at) : new Date(),
    sizeBytes: rawText ? Buffer.byteLength(rawText) : Buffer.byteLength(mail.text ?? ''),
  });
  return { ok: true, ...result };
}

// ─── delivery events ──────────────────────────────────────────────────────

async function handleDeliveryEvent(evt: ResendEvent): Promise<unknown> {
  const providerMsgId = evt.data.email_id;
  if (!providerMsgId) return { ok: true, ignored: 'no email_id' };

  const ref = await resolveOutboundJobByProviderMsg(providerMsgId);
  if (!ref) return { ok: true, unmatched: providerMsgId };

  const base = { tenantId: ref.tenantId, outboundJobId: ref.outboundJobId, payload: evt.data };
  const recipients = addrList(evt.data.to);

  if (evt.type === 'email.delivered') {
    await applyDeliveryEvent({ ...base, type: 'delivered', status: 'delivered' });
    return { ok: true };
  }
  if (evt.type === 'email.bounced') {
    await applyDeliveryEvent({
      ...base,
      type: 'bounced',
      status: 'bounced',
      suppress: recipients.map((address) => ({ address, reason: 'bounce' as const })),
      riskDelta: 8,
    });
    return { ok: true };
  }
  // email.complained
  await applyDeliveryEvent({
    ...base,
    type: 'complaint',
    status: 'spam',
    suppress: recipients.map((address) => ({ address, reason: 'complaint' as const })),
    riskDelta: 15,
  });
  return { ok: true };
}

// ─── Svix signature ───────────────────────────────────────────────────────

function svixVerify(p: {
  secret: string;
  id: string;
  ts: string;
  sig: string;
  body: string;
}): boolean {
  if (!p.id || !p.ts || !p.sig) return false;
  const drift = Math.abs(Date.now() - Number(p.ts) * 1000);
  if (!Number.isFinite(drift) || drift > FIVE_MIN) return false;

  const key = Buffer.from(p.secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${p.id}.${p.ts}.${p.body}`).digest('base64');
  const expBuf = Buffer.from(expected);

  // header: space-separated "v1,<sig>" entries
  for (const part of p.sig.split(' ')) {
    const value = part.split(',')[1];
    if (!value) continue;
    const got = Buffer.from(value);
    if (got.length === expBuf.length && timingSafeEqual(got, expBuf)) return true;
  }
  return false;
}

// ─── helpers / types ──────────────────────────────────────────────────────

type AddrIn = string | string[] | { address?: string; email?: string }[] | undefined | null;

function addrList(v: AddrIn): string[] {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr
    .map((x) => (typeof x === 'string' ? x : (x.address ?? x.email ?? '')))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
function firstAddr(v: AddrIn): string | null {
  return addrList(v)[0] ?? null;
}

interface ResendEvent {
  type: string;
  created_at?: string;
  data: {
    email_id?: string;
    from?: AddrIn;
    to?: AddrIn;
    subject?: string;
    [k: string]: unknown;
  };
}

interface ReceivingEmail {
  from?: AddrIn;
  to?: AddrIn;
  received_for?: AddrIn;
  subject?: string | null;
  html?: string | null;
  text?: string | null;
  headers?: Record<string, string>;
  message_id?: string | null;
  created_at?: string;
  raw?: { download_url?: string; expires_at?: string };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
