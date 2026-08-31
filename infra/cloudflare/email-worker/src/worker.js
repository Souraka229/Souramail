/**
 * SouraMAIL — Cloudflare Email Routing Worker
 * -------------------------------------------
 * Managed inbound path, no mail server. Cloudflare receives mail for the zone,
 * this Worker forwards the raw RFC822 (base64) to the SouraMAIL webhook, which
 * parses it, resolves the recipient to a mailbox, and stores it — the webmail
 * then reads it exactly like the Stalwart path would.
 *
 * Deploy:
 *   cd infra/cloudflare/email-worker
 *   npx wrangler deploy
 *   npx wrangler secret put INBOUND_WEBHOOK_SECRET   # same value as Vercel
 *
 * Then: Cloudflare dashboard → your domain → Email → Email Routing →
 *   - enable Email Routing (adds MX + SPF records automatically)
 *   - Routing rules → Catch-all address → Action: "Send to a Worker" →
 *     souramail-email-inbound
 */

export default {
  /**
   * @param {ForwardableEmailMessage} message
   * @param {{ INBOUND_WEBHOOK_URL: string, INBOUND_WEBHOOK_SECRET: string }} env
   */
  async email(message, env) {
    const raw = new Uint8Array(await new Response(message.raw).arrayBuffer());

    const res = await fetch(env.INBOUND_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.INBOUND_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({
        to: message.to,
        from: message.from,
        rawBase64: toBase64(raw),
      }),
    });

    if (!res.ok) {
      // Throwing makes Cloudflare treat delivery as failed and retry, instead of
      // silently dropping the message.
      const detail = await res.text().catch(() => '');
      throw new Error(`SouraMAIL webhook ${res.status}: ${detail.slice(0, 200)}`);
    }
  },
};

/** base64 of a byte array, chunked so large messages don't blow the call stack. */
function toBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
