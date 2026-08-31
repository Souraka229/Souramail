# Email — final audit (2026-08-31)

No projections, no invented numbers. Every "✅ done" line below was verified
against the Resend API or the repo in this session.

---

## 1. What is actually done and verified

### Resend account + domain
- Domain `gala-guema.xyz` — Resend id `0624b290-…`, region **eu-west-1**
- **Sending: `enabled`** — `resend._domainkey` DKIM TXT, `send` SPF MX, `send` SPF TXT
  all report `verified` (the user added them to Vercel DNS)
- **Receiving: `enabled`** (set via API this session)
- One receiving DNS record still **`pending`**:
  `MX  @  inbound-smtp.eu-west-1.amazonaws.com` — must be added in Vercel DNS
- Webhook `d8c166aa-…` → `https://gala-guema.xyz/api/webhooks/resend`,
  status `enabled`, events: `email.sent`, `email.delivered`, `email.bounced`,
  `email.complained`, `email.received`
- Receiving API `GET /emails/receiving/{id}` confirmed reachable (404 on a fake id
  = correct route + auth OK)

### Code (PR #15 — CI green: quality, db-isolation, SonarCloud, CodeRabbit)
- `ResendProvider` (`EMAIL_PROVIDER=resend`) — `POST /emails`, returns the Resend
  `id` used by every webhook → delivery events correlate exactly
- `/api/webhooks/resend` — one Svix-signed endpoint for all 5 events:
  `email.received` → Receiving API fetch → `resolveMailboxByAddress` →
  `storeInboundMessage`; `delivered`/`bounced`/`complained` → `applyDeliveryEvent`
  (+ suppression + risk score)
- `SMTP_RELAY_SENDER` forced-sender mode (fallback path, not used now)
- unit tests: `ResendProvider` send + error path — green

### Local
- `souramail/.env`: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`,
  `RESEND_WEBHOOK_SECRET=whsec_…` — set, not echoed to chat

---

## 2. Blocked for the agent — you must do these (finite list)

| # | Action | Why the agent can't |
|---|---|---|
| 1 | **Merge PR #15** | `gh pr merge` blocked by the Claude Code classifier |
| 2 | **3 Vercel prod env vars**: `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` (values in `souramail/.env`) | `vercel env add` returns "Could not retrieve Project Settings" this session |
| 3 | **1 Vercel DNS record**: `MX`, name `@`, value `inbound-smtp.eu-west-1.amazonaws.com`, priority `10` | classifier blocks DNS writes |
| 4 | `vercel deploy --prod` | classifier |
| 5 | **Neon migrations 0002 + 0003** — paste `DIRECT_URL=` (Neon owner, non-pooled) into `souramail/.env`, then the agent runs `pnpm --filter @souramail/db migrate` | no Neon owner connection string available |
| 6 | In `/app`: connect `gala-guema.xyz`, create `hello@gala-guema.xyz` | needs a logged-in session |
| 7 | Test: send from `/app/inbox`; send a mail **to** `hello@gala-guema.xyz` | needs an external inbox |

Without #5 the inbound insert 500s (the `message` table lacks `body_text` /
`body_html` on Neon until 0003 lands).

---

## 3. Every solution considered — final verdict

| Path | Cost | Card | Third-party trace | Verdict |
|---|---|---|---|---|
| **Resend (chosen)** — send + inbound + events, DNS on Vercel | €0 (free tier) | none | `Received:` shows `amazonses.com` (Resend runs on SES); DKIM `d=gala-guema.xyz` ✅ | **selected** — one provider, one webhook, swappable via `EMAIL_PROVIDER` with no code change |
| Cloudflare Email Routing | €0 | none | none for inbound | rejected — needs the **whole zone moved to Cloudflare NS**; the auto-imported records were stale → live-site risk at cut-over |
| ForwardEmail.net | €0 | none | minimal | viable alt; needs a payload adapter + free-tier aliases are public |
| Mailgun | €0 (100/day) | none for inbound | `mailgun.org` in headers | viable alt |
| Own Stalwart on a VPS | ~$1–4/mo (RackNerd PayPal / Oracle + Revolut virtual card) | PayPal/prepaid | **none — 100% yours** | the true-independence endgame (roadmap Phase 5); needs a VPS, port 25, PTR, IP warmup |
| Gmail SMTP relay | €0 | none | Gmail rewrites `From:` | proof-only; `SMTP_RELAY_SENDER` mode supports it |

The "totally independent of Resend" goal from earlier is **not abandoned** — it's
deferred to Phase 5. The `EmailProvider` interface + the `getMailbox()` facade
already abstract the swap: change `EMAIL_PROVIDER`, repoint the `MX`, delete the
Resend account. No product code changes.

---

## 4. "On commercialise" — the honest gap

The pipeline **can work end-to-end after §2**. That is not the same as
sellable-to-paying-customers. Before charging money:

**Email / deliverability**
- Add a **DMARC** record: `_dmarc TXT "v=DMARC1; p=none; rua=mailto:dmarc@gala-guema.xyz"` — start `p=none`, move to `quarantine` after a week of clean reports
- Resend free tier = **100 emails/day, 3 000/month, 1 domain**. Real customers → a paid Resend plan, or Phase 5 self-hosting. This is a hard ceiling, not an estimate.
- Resend **Inbound** is a newer feature — validate the `email.received` → `storeInboundMessage` field mapping against the first real payload (the route returns diagnostic JSON; check `wrangler`-style logs in Vercel)

**Product**
- `apps/api` (`/v1/*`, `/docs`) is **not deployed** — needs a container host (Fly/Railway/VPS). The Dockerfile is ready.
- MCP + API-key auth need the **Neon bring-up re-run** (adds `api_key_by_hash` + the 3 other SECURITY DEFINER fns) — separate from §2's migrations
- **No billing** — no Stripe, no plan enforcement beyond `PLAN_LIMITS` constants, no usage metering surfaced to customers
- **Monitoring not wired** — `SENTRY_DSN` empty, `OTEL_EXPORTER_OTLP_ENDPOINT` is `localhost`
- Multi-tenant RLS is built and tested in CI (`db-isolation`) but never load-tested

**Legal / compliance**
- No Terms of Service, Privacy Policy, DPA, or acceptable-use policy published
- EU data residency is OK (Resend `eu-west-1`, Neon region TBD-confirm)
- GDPR: suppression list + audit log exist; no data-export / delete-me flow

**Realistic status:** *technical demo of the full product, one manual checklist
away from a working staging send+receive.* Commercial launch is a distinct body
of work (billing, apps/api deploy, monitoring, legal, a paid email plan).
