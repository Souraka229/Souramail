import { timingSafeEqual } from 'node:crypto';
import { type MtaHookResponse, mtaHookRequest } from '@souramail/contracts';
import { resolveMailboxByAddress } from '@souramail/db';
import type { FastifyInstance } from 'fastify';
import { inboundQueue } from '../queues.ts';

/**
 * Stalwart MTA hook (docs/05 §4.1). Stalwart POSTs every accepted inbound
 * message here at the `data` stage — *after* auth + Rspamd + ClamAV + reputation
 * have run on the mail edge. We resolve each recipient to a mailbox and enqueue
 * an `inbound-process` job, then tell Stalwart to accept.
 *
 * We never reject here: Stalwart already validated recipients against its own
 * directory, and losing mail to a transient DB blip is worse than a late bounce.
 */
export function registerStalwartHook(app: FastifyInstance): void {
  const secret = process.env.MTA_HOOK_SECRET ?? '';

  app.post('/hooks/stalwart/inbound', async (req, reply) => {
    if (!secret || !bearerOk(req.headers.authorization, secret)) {
      return reply.code(401).send({ error: 'unauthorized' });
    }

    const parsed = mtaHookRequest.safeParse(req.body);
    if (!parsed.success) {
      req.log.warn({ issues: parsed.error.issues }, 'mta-hook: bad payload');
      return accept(reply); // don't hold the SMTP transaction on our parse error
    }
    const hook = parsed.data;
    const rawMimeBase64 = hook.message?.contents ?? '';
    const recipients = hook.envelope?.to?.map((t) => t.address).filter(Boolean) ?? [];
    const queueId = hook.context?.queue?.id ?? crypto.randomUUID();

    const { spamScore, isSpam } = readRspamdVerdict(hook.message?.headers ?? []);

    let enqueued = 0;
    for (const address of recipients) {
      const mbx = await resolveMailboxByAddress(address).catch((err) => {
        req.log.error({ err, address }, 'mta-hook: mailbox lookup failed');
        return null;
      });
      if (!mbx) {
        req.log.warn({ address }, 'mta-hook: no local mailbox mirror — accepted, not filed');
        continue;
      }
      await inboundQueue.add(
        'inbound',
        {
          tenantId: mbx.tenantId,
          mailboxId: mbx.mailboxId,
          rawMimeBase64,
          spamScore,
          isSpam,
        },
        {
          jobId: `${queueId}:${mbx.mailboxId}`, // idempotent on Stalwart retries
          removeOnComplete: 1000,
          removeOnFail: 5000,
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
      enqueued += 1;
    }

    req.log.info({ queueId, recipients: recipients.length, enqueued }, 'mta-hook: inbound');
    return accept(reply);
  });
}

function accept(reply: { send: (b: MtaHookResponse) => unknown }) {
  return reply.send({ action: 'accept' });
}

function bearerOk(header: string | undefined, secret: string): boolean {
  const got = header?.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Rspamd (via the Stalwart milter) stamps these headers (docs/05 §4.1 step 6). */
function readRspamdVerdict(headers: [string, string][]): { spamScore?: number; isSpam?: boolean } {
  let spamScore: number | undefined;
  let isSpam: boolean | undefined;
  for (const [name, value] of headers) {
    const n = name.toLowerCase();
    if (n === 'x-spam-status' || n === 'x-spamd-status') {
      isSpam = /^yes/i.test(value.trim());
      const m = value.match(/score=(-?\d+(?:\.\d+)?)/i);
      if (m) spamScore = Number(m[1]);
    } else if (n === 'x-spamd-result' && spamScore == null) {
      const m = value.match(/\[(-?\d+(?:\.\d+)?)\s*\/\s*-?\d/);
      if (m) spamScore = Number(m[1]);
    } else if (n === 'x-spam-score' && spamScore == null) {
      const v = Number(value.trim());
      if (!Number.isNaN(v)) spamScore = v;
    }
  }
  if (isSpam == null && spamScore != null) isSpam = spamScore >= 6;
  return { spamScore, isSpam };
}
