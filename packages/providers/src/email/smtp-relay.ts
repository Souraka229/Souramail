import { Buffer } from 'node:buffer';
import { createTransport, type Transporter } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer/index.js';
import type SMTPPool from 'nodemailer/lib/smtp-pool/index.js';
import type { EmailProvider, OutboundMessage } from '../interfaces.ts';

export interface SmtpRelayConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  /** STARTTLS on 587 (secure:false) vs implicit TLS on 465 (secure:true). */
  secure?: boolean;
}

/**
 * EmailProvider backed by a managed SMTP relay (Amazon SES + dedicated IP, or a
 * transactional provider) — the phases 1–4 outbound path (docs/05 §4.2, §4.5).
 * DKIM signing is done upstream by Rspamd-out; here we just hand the relay a
 * fully-formed message with an aligned Return-Path.
 */
export class SmtpRelayProvider implements EmailProvider {
  readonly name = 'smtp-relay';
  private readonly tx: Transporter;

  constructor(cfg: SmtpRelayConfig) {
    const opts: SMTPPool.Options = {
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure ?? cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    };
    this.tx = createTransport(opts);
  }

  async send(msg: OutboundMessage): Promise<{ providerMessageId: string }> {
    const headers: Record<string, string> = {
      ...msg.headers,
      ...(msg.idempotencyKey ? { 'X-Soura-Idempotency-Key': msg.idempotencyKey } : {}),
      'X-Soura-Tenant': msg.tenantId,
    };
    const envelope = { from: msg.returnPath ?? msg.from, to: msg.to };

    const mail: Mail.Options = msg.raw
      ? {
          envelope,
          headers,
          raw: typeof msg.raw === 'string' ? msg.raw : Buffer.from(msg.raw),
        }
      : {
          envelope,
          headers,
          from: msg.from,
          to: msg.to,
          replyTo: msg.replyTo,
          subject: msg.subject,
          text: msg.text,
          html: msg.html,
        };

    const info = await this.tx.sendMail(mail);
    // SES SMTP returns the SES message id in the SMTP response ("250 Ok <id>") —
    // that's what bounce/complaint notifications reference, not the RFC
    // Message-ID header. Prefer it; fall back to the header for other relays.
    const sesId = /(?:\bOk\b|queued as)\s+([A-Za-z0-9._-]{12,})/i.exec(info.response ?? '')?.[1];
    return { providerMessageId: sesId ?? info.messageId };
  }

  async verify(): Promise<boolean> {
    return this.tx.verify().then(
      () => true,
      () => false,
    );
  }

  close(): void {
    this.tx.close();
  }
}
