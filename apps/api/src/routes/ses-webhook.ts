import { verify as cryptoVerify, X509Certificate } from 'node:crypto';
import { applyDeliveryEvent, resolveOutboundJobByProviderMsg } from '@souramail/db';
import type { FastifyInstance } from 'fastify';

/**
 * SES → SNS delivery-event webhook (docs/05 §4.2). Handles subscription
 * confirmation + Bounce / Complaint / Delivery notifications:
 *   hard bounce  → job `bounced` + suppress recipient + risk +8
 *   soft bounce  → record event only (BullMQ retries own the retry curve)
 *   complaint    → job `spam` + suppress recipient + risk +15
 *   delivery     → job `delivered`
 *
 * SNS message signatures are verified (cert host allow-listed to AWS) before
 * anything touches the DB.
 */
export function registerSesWebhook(app: FastifyInstance): void {
  app.post('/webhooks/ses', async (req, reply) => {
    const body = req.body as Record<string, unknown>;
    if (!body || typeof body !== 'object') return reply.code(400).send({ error: 'bad body' });

    const ok = await verifySnsSignature(body).catch(() => false);
    if (!ok) {
      req.log.warn('ses-webhook: SNS signature verification failed');
      return reply.code(403).send({ error: 'bad signature' });
    }

    const type = String(body.Type ?? '');

    if (type === 'SubscriptionConfirmation' || type === 'UnsubscribeConfirmation') {
      const url = String(body.SubscribeURL ?? '');
      if (isAwsUrl(url)) await fetch(url).catch(() => {});
      req.log.info({ type }, 'ses-webhook: subscription handled');
      return reply.send({ ok: true });
    }

    if (type !== 'Notification') return reply.send({ ok: true, ignored: type });

    let msg: SesMessage;
    try {
      msg = JSON.parse(String(body.Message ?? '{}')) as SesMessage;
    } catch {
      return reply.code(400).send({ error: 'bad Message json' });
    }

    const providerMsgId = msg.mail?.messageId;
    if (!providerMsgId) return reply.send({ ok: true, ignored: 'no messageId' });

    const ref = await resolveOutboundJobByProviderMsg(providerMsgId);
    if (!ref) {
      req.log.info({ providerMsgId, kind: msg.notificationType }, 'ses-webhook: no matching job');
      return reply.send({ ok: true, unmatched: true });
    }

    const base = { tenantId: ref.tenantId, outboundJobId: ref.outboundJobId };

    if (msg.notificationType === 'Bounce' && msg.bounce) {
      const hard = msg.bounce.bounceType === 'Permanent';
      const addrs = (msg.bounce.bouncedRecipients ?? []).map((r) => r.emailAddress).filter(Boolean);
      await applyDeliveryEvent({
        ...base,
        type: 'bounced',
        payload: { ...msg.bounce, providerMsgId },
        status: hard ? 'bounced' : undefined,
        suppress: hard ? addrs.map((address) => ({ address, reason: 'bounce' as const })) : [],
        riskDelta: hard ? 8 : 1,
      });
    } else if (msg.notificationType === 'Complaint' && msg.complaint) {
      const addrs = (msg.complaint.complainedRecipients ?? [])
        .map((r) => r.emailAddress)
        .filter(Boolean);
      await applyDeliveryEvent({
        ...base,
        type: 'complaint',
        payload: { ...msg.complaint, providerMsgId },
        status: 'spam',
        suppress: addrs.map((address) => ({ address, reason: 'complaint' as const })),
        riskDelta: 15,
      });
    } else if (msg.notificationType === 'Delivery' && msg.delivery) {
      await applyDeliveryEvent({
        ...base,
        type: 'delivered',
        payload: { ...msg.delivery, providerMsgId },
        status: 'delivered',
      });
    }

    req.log.info(
      { providerMsgId, kind: msg.notificationType, tenant: ref.tenantId },
      'ses-webhook: applied',
    );
    return reply.send({ ok: true });
  });
}

// ─── SNS signature verification ───────────────────────────────────────────

const SIGN_KEYS: Record<string, string[]> = {
  Notification: ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'],
  SubscriptionConfirmation: [
    'Message',
    'MessageId',
    'SubscribeURL',
    'Timestamp',
    'Token',
    'TopicArn',
    'Type',
  ],
  UnsubscribeConfirmation: [
    'Message',
    'MessageId',
    'SubscribeURL',
    'Timestamp',
    'Token',
    'TopicArn',
    'Type',
  ],
};

function isAwsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && /(^|\.)amazonaws\.com$/.test(u.hostname);
  } catch {
    return false;
  }
}

async function verifySnsSignature(body: Record<string, unknown>): Promise<boolean> {
  const type = String(body.Type ?? '');
  const keys = SIGN_KEYS[type];
  const certUrl = String(body.SigningCertURL ?? '');
  const signature = String(body.Signature ?? '');
  if (!keys || !isAwsUrl(certUrl) || !signature) return false;

  const canonical = keys
    .filter((k) => body[k] !== undefined && body[k] !== null)
    .map((k) => `${k}\n${String(body[k])}\n`)
    .join('');

  const pem = await fetch(certUrl).then((r) => r.text());
  const cert = new X509Certificate(pem);
  const algo = String(body.SignatureVersion ?? '1') === '2' ? 'RSA-SHA256' : 'RSA-SHA1';

  return cryptoVerify(
    algo,
    Buffer.from(canonical, 'utf8'),
    cert.publicKey,
    Buffer.from(signature, 'base64'),
  );
}

interface SesRecipient {
  emailAddress: string;
}
interface SesMessage {
  notificationType?: 'Bounce' | 'Complaint' | 'Delivery';
  mail?: { messageId?: string; source?: string; destination?: string[] };
  bounce?: {
    bounceType?: 'Permanent' | 'Transient' | 'Undetermined';
    bounceSubType?: string;
    bouncedRecipients?: (SesRecipient & { diagnosticCode?: string; status?: string })[];
  };
  complaint?: {
    complainedRecipients?: SesRecipient[];
    complaintFeedbackType?: string;
  };
  delivery?: { recipients?: string[]; smtpResponse?: string };
}
