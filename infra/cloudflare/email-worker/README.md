# Cloudflare Email Routing → SouraMAIL webmail (inbound, no mail server)

This is the **free, no-VPS** way to receive real mail in the SouraMAIL webmail.
Mail flow:

```
someone@example.com  →  hello@gala-guema.xyz
        │ (MX → Cloudflare)
        ▼
Cloudflare Email Routing
        │ "Send to a Worker"
        ▼
souramail-email-inbound  (this Worker)
        │ POST /api/webhooks/email-inbound   (Bearer INBOUND_WEBHOOK_SECRET)
        ▼
Next route → simpleParser → resolveMailboxByAddress → storeInboundMessage
        ▼
message / thread rows  →  /app/inbox  (webmail, DB backend)
```

It does **not** give you sending, IMAP/JMAP, or an external mail client — only
inbound into the webmail. Swap the MX to a Stalwart VPS later and the webmail
switches to the full JMAP backend automatically (`STALWART_JMAP_URL`).

---

## 1. One shared secret, set in two places

Generate it once and set the **same value** in Vercel and in the Worker. It never
needs to appear in a file or a chat.

```bash
# from repo root — generates, sets Vercel, then Cloudflare, printing nothing
SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")

printf '%s' "$SECRET" | vercel env add INBOUND_WEBHOOK_SECRET production --scope sourakas-projects

cd infra/cloudflare/email-worker
printf '%s' "$SECRET" | npx wrangler secret put INBOUND_WEBHOOK_SECRET
unset SECRET
```

Then redeploy the web app so it picks up the new env var:

```bash
vercel deploy --prod --scope sourakas-projects
```

## 2. Deploy the Worker

```bash
cd infra/cloudflare/email-worker
npx wrangler deploy
```

First run opens a browser to authorise Wrangler against your Cloudflare account
(the one that holds the `gala-guema.xyz` zone).

## 3. Enable Email Routing + point the catch-all at the Worker

Cloudflare dashboard → **gala-guema.xyz** → **Email** → **Email Routing**:

1. **Enable Email Routing** — Cloudflare adds the MX records and an SPF include
   for you. Wait until it shows *Active*.
2. **Routing rules** tab → **Catch-all address** → **Edit** →
   - Action: **Send to a Worker**
   - Destination: **souramail-email-inbound**
   - Save, and toggle the catch-all **On**.

(Optionally add a specific rule for one address instead of catch-all.)

## 4. Create the mailbox in the app

The webhook only stores mail whose recipient matches a known mailbox.

1. `https://gala-guema.xyz/app/domains` → add **gala-guema.xyz**
   (DNS scan will flag records as missing — fine, not needed for inbound-only).
2. `https://gala-guema.xyz/app/mailboxes` → create e.g. **hello@gala-guema.xyz**
   (Stalwart provisioning reports `skipped-no-server` — expected, the row is
   still created).

## 5. Test

Send an email from any account to `hello@gala-guema.xyz`. Within a few seconds it
appears in `https://gala-guema.xyz/app/inbox`.

Debug:

```bash
npx wrangler tail souramail-email-inbound        # live Worker logs
```

- `webhook 401` → secret mismatch between Vercel and the Worker (redo step 1).
- webhook returns `{"ok":true,"unmatched":"..."}` → no mailbox for that address
  (step 4), or the domain/`resolveMailboxByAddress` lookup needs the Neon
  bring-up re-run.
- Nothing in `wrangler tail` → catch-all not pointed at the Worker (step 3).

## Limits

- Messages over ~25 MB are rejected by Cloudflare before the Worker.
- Cloudflare Email Routing requires the domain to use Cloudflare DNS.
- Forwarding/replies as the address are not possible here — that needs the MTA.
