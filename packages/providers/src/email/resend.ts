import type { EmailProvider, OutboundMessage } from '../interfaces.ts';

export interface ResendConfig {
  apiKey: string;
  /** Override for tests. */
  baseUrl?: string;
}

/**
 * EmailProvider backed by the Resend HTTP API (`POST /emails`). Preferred over
 * the SMTP relay path for Resend because the returned `id` is the same
 * identifier the `email.sent` / `email.delivered` / `email.bounced` /
 * `email.received` webhooks reference — so delivery events correlate to the
 * outbound job with no guessing.
 *
 * Temporary outbound transport for the bring-up phase (docs/05 §4.5); swapped
 * for a self-hosted MTA later by changing `EMAIL_PROVIDER` — no app code change.
 */
export class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(cfg: ResendConfig) {
    this.apiKey = cfg.apiKey;
    this.baseUrl = (cfg.baseUrl ?? 'https://api.resend.com').replace(/\/+$/, '');
  }

  async send(msg: OutboundMessage): Promise<{ providerMessageId: string }> {
    if (!msg.html && !msg.text) {
      throw new Error('ResendProvider: message needs html or text (raw MIME is not supported)');
    }
    const body: Record<string, unknown> = {
      from: msg.from,
      to: msg.to,
      subject: msg.subject,
      ...(msg.html ? { html: msg.html } : {}),
      ...(msg.text ? { text: msg.text } : {}),
      ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      ...(msg.headers ? { headers: msg.headers } : {}),
    };

    const res = await fetch(`${this.baseUrl}/emails`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
        ...(msg.idempotencyKey ? { 'Idempotency-Key': msg.idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !json.id) {
      throw new Error(`ResendProvider: send failed ${res.status} ${json.message ?? ''}`.trim());
    }
    return { providerMessageId: json.id };
  }
}
