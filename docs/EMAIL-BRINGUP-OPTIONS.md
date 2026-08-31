# Email bring-up — every path, and what's missing for each

> The product splits into **two independent functions**: **RECEIVE** (mail → webmail)
> and **SEND** (composer/API → real delivery). They can be solved with different
> providers. Underneath both sits the **DNS** question.
>
> Fact on the ground (2026-08-31): `gala-guema.xyz` is registered at **Vercel**,
> DNS served by **Vercel nameservers** (`ns1/ns2.vercel-dns.com`). Vercel DNS
> **does** support `MX` + `TXT` records. So any "add MX to Vercel DNS" solution
> works **without a nameserver migration**. Only Cloudflare Email Routing forces
> moving the whole zone.

---

## Already done (code + infra)

- `/api/webhooks/email-inbound` route — parses raw RFC822, resolves mailbox, `storeInboundMessage()`
- `storeInboundMessage()` — thread grouping, idempotent, writes `body_text`/`body_html`
- Webmail facade `getMailbox()` — DB backend now, JMAP backend when `STALWART_JMAP_URL` is set
- Composer + `EmailProvider` abstraction (`EMAIL_PROVIDER` env: `dev` | `smtp-relay`)
- SES bounce/complaint ingestion route
- Cloudflare Email Routing Worker deployed (`souramail-email-inbound`) + `INBOUND_WEBHOOK_SECRET` on the worker and in Vercel
- MCP server, API v1, Kinetic design

---

## A. RECEIVE — mail → webmail inbox

| Solution | Move nameservers? | Free | Card | Gaps to be operational |
| --- | --- | --- | --- | --- |
| **Mailgun Routes** | No — add MX+TXT in Vercel DNS | ✅ 100/day, 1 route | ❌ none (the 5-recipient cap is outbound-only) | sign up · add ~4 DNS records in Vercel · verify domain · 1 Route → webhook · **adapter route for Mailgun's multipart payload** · deploy |
| **ForwardEmail.net** | No — add MX+TXT in Vercel DNS | ✅ | ❌ none | same shape · free-tier aliases are publicly searchable · **adapter route + `X-Webhook-Signature` verify** |
| **CloudMailin** | No — add MX in Vercel DNS | trial (~200/mo) | varies | **adapter route** (raw MIME / JSON / multipart) |
| **Cloudflare Email Routing** | **Yes — whole zone to CF NS** | ✅ | ❌ none | apply the NS switch on Vercel (**not done** — live NS still Vercel) · fix CF's stale auto-imported records so the site survives cut-over · wait for zone `Active` · Enable + catch-all → worker (worker already live) |
| **SendGrid Inbound Parse** | No | ❌ paid only in 2026 | — | not free |
| **Postmark inbound** | No | ❌ $16.50/mo | — | not free |
| **Stalwart on a VPS** | No — MX in Vercel DNS → VPS IP | VPS ~$1–4/mo | PayPal / prepaid card | provision VPS · port 25 inbound open (usually is) · deploy `infra/docker-compose.yml` · MTA-hook → `/hooks/stalwart/inbound` · set `STALWART_JMAP_URL` → webmail switches to full JMAP backend automatically |

## B. SEND — composer / API → real delivery

| Solution | Free | Card | Third-party trace | Gaps to be operational |
| --- | --- | --- | --- | --- |
| **Brevo SMTP** | ✅ 300/day | ❌ none | `Received:` shows Brevo; DKIM can be your domain | 5 Vercel env vars (`EMAIL_PROVIDER=smtp-relay`, `SMTP_RELAY_HOST/PORT/USER/PASS`) · verify domain in Brevo (adds DKIM TXT to Vercel DNS) |
| **SMTP2GO** | ✅ 200/day, 1000/mo | ❌ none | same | same |
| **Maileroo** | ✅ 3000/mo | ❌ none | same | same |
| **Resend** | ✅ 100/day | card | *(user rejected — brand in headers)* | — |
| **Mailgun** | 100/day | card needed for >5 recipients | same | card · domain verify · 5 env vars |
| **Own Stalwart / KumoMTA on VPS** | VPS cost | PayPal / prepaid | **none — 100% yours** | VPS · **port 25 _outbound_ unblocked** (Hetzner/OVH/RackNerd yes; Oracle/GCP/AWS-default no) · PTR / reverse DNS · SPF+DKIM+DMARC aligned · IP warmup (slow ramp ~2–4 weeks) · TLS cert (Stalwart auto-ACME) |

---

## The full "vraiment opérationnel" checklist

### Receiving
1. `MX` on `gala-guema.xyz` → a receiver (VPS Stalwart, or Mailgun/ForwardEmail)
2. Inbound webhook adapter matching that receiver's payload
3. **Neon migrations 0002 + 0003** applied (`body_text` / `body_html` columns) — *blocked: needs `DIRECT_URL` (Neon owner, non-pooled) in `souramail/.env`*
4. A mailbox row whose address matches the recipient (`/app/mailboxes`)
5. `INBOUND_WEBHOOK_SECRET` in Vercel ✅ + **a prod redeploy to load it** — *blocked: classifier; user runs `vercel deploy --prod`*

### Sending
6. `EMAIL_PROVIDER=smtp-relay` + `SMTP_RELAY_HOST/PORT/USER/PASS` in Vercel (5 vars)
7. Sending domain **verified at the relay** — their DKIM CNAME/TXT added to Vercel DNS (else mail is rejected / spam-foldered)
8. `SPF` TXT including the relay
9. `DMARC` TXT (`p=none` to start)
10. Bounce handling — SES route exists; other relays need their bounce webhook → an adapter

### Deliverability (so it reaches the inbox, not spam)
11. **DKIM with the domain's own key** — `packages/core/src/email-health.ts` still has the placeholder `REPLACE_WITH_GENERATED_DKIM_PUBLIC_KEY`. A relay signs for you; an own MTA (Stalwart) generates + signs.
12. **PTR / reverse DNS** — own MTA only
13. **IP warmup** — own MTA only
14. **TLS cert** for the mail hostname — own MTA only (Stalwart auto-ACME)

### Roadmap Phase 2 leftovers (not blocking send/receive)
- SDKs (`@souramail/sdk` TS + `souramail` Python from OpenAPI)
- AI Gateway (LiteLLM) + Copilot, AI Rules, Automations
- Outbound webhook delivery (HMAC + retries + DLQ, `webhook-deliver` queue)
- MCP OAuth 2.1 + PKCE
- Re-run Neon **bring-up** to activate API-key / MCP auth (needs `NEON_API_KEY`, `NEON_PROJECT_ID`, `APP_DB_PASSWORD`)
- Deploy `apps/api` as a container for `/v1/*` + `/docs`

---

## Recommendation

**Fastest fully-operational, no card, no nameserver migration:**

- **Receive:** Mailgun free (no card) — MX+TXT in Vercel DNS, 1 Route → adapter webhook (~20 min)
- **Send:** Brevo free SMTP (no card, 300/day) — verify domain (DKIM), 5 Vercel env vars (~15 min)
- DNS stays on Vercel. Footprint = two accounts you can delete later. €0.

**Then, for true independence (roadmap Phase 5):**

One VPS (~$1/yr RackNerd via PayPal, or a Revolut/Wise virtual card on Oracle
Always Free). **Stalwart does both inbound and outbound.** Swap the `MX` to the
VPS and point `EMAIL_PROVIDER` at it; delete the Mailgun/Brevo accounts.
**No product code changes** — the `EmailProvider` interface and the webmail
facade already abstract it.

## Two blockers on the critical path regardless of provider

1. **Vercel prod redeploy** — classifier-blocked here; run `vercel deploy --prod` yourself
2. **Neon migrations 0002/0003** — paste `DIRECT_URL=` (Neon owner, non-pooled) into `souramail/.env` and I run `pnpm --filter @souramail/db migrate`
