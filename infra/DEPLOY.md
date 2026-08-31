# Deploying the mail edge (Phase 1)

The **mail core is one solid, invisible piece**: Stalwart (SMTP/IMAP/JMAP) +
Rspamd (in/out) + ClamAV + Unbound. SouraMAIL's "magic" (onboarding, Copilot,
Rules, MCP) runs in `apps/*` and talks to this edge through `packages/providers`.

```
Internet ──MX──▶ Stalwart :25 ──milter──▶ Rspamd-in ──▶ worker inbound-process
                     ▲                         │
        submission :587/465 ──▶ Rspamd-out (DKIM soura) ──▶ SMTP relay (SES)
```

## 0. Host requirements (docs/05 §1, PROVISIONING §2 item 5)

- Linux VPS/bare-metal, **dedicated static IPv4**, **PTR = `mx1.souramail.com`**.
- Inbound **:25** open. Outbound :25 only matters at Phase 5 (KumoMTA).
- Docker + Docker Compose.

## 1. DNS the mail edge needs (published once, for the SouraMAIL sending infra)

| Record | Name | Value |
| ------ | ---- | ----- |
| A | `mx1.souramail.com` | `<host IPv4>` |
| A | `send.souramail.com` | `<relay/host IPv4>` |
| TXT | `_spf.souramail.com` | `v=spf1 ip4:<IPv4> include:amazonses.com -all` |
| MTA-STS / TLS-RPT | later (Phase 4) | — |

Customer domains get their own MX/SPF/DKIM/DMARC generated per-domain by
`@souramail/core` `expectedDnsRecords()` and applied via `CloudflareDnsProvider`.

## 2. Bring it up

```bash
cd infra
cp ../.env.example ../.env    # then fill the mail + relay vars (see below)

# core services (already used by the app)
docker compose up -d postgres redis minio

# mail edge
MAIL_HOSTNAME=mx1.souramail.com \
STALWART_ADMIN_SECRET="$(openssl rand -base64 24)" \
docker compose --profile mail up -d
```

Required env (`.env`, consumed by `docker-compose.yml` → the containers):

```
MAIL_HOSTNAME=mx1.souramail.com
STALWART_ADMIN_SECRET=...            # also STALWART_ADMIN_URL=http://<host>:8080 for the app
STALWART_ADMIN_USER=admin

EMAIL_PROVIDER=smtp-relay
SMTP_RELAY_HOST=email-smtp.eu-west-1.amazonaws.com
SMTP_RELAY_PORT=587
SMTP_RELAY_USER=...                  # SES SMTP credentials
SMTP_RELAY_PASS=...

CLOUDFLARE_API_TOKEN=...             # Zone:DNS:Edit + Zone:Zone:Read
CLOUDFLARE_ACCOUNT_ID=...
```

## 3. Per-customer-domain provisioning (done by the app, shown here for ops)

```ts
import { getStalwartAdmin, getDnsProvider } from '@souramail/providers';
import { expectedDnsRecords } from '@souramail/core';

const st = getStalwartAdmin();
await st.createDomain('acme.com');
const { publicKey } = await st.createDkim('acme.com', 'soura');   // → publish TXT
await st.createMailbox({ address: 'hello@acme.com', secret, quotaBytes: 1_073_741_824 });

const cf = getDnsProvider();
await cf?.createRecords('acme.com', expectedDnsRecords('acme.com').map(toDnsInput));
```

## 4. Verify

```bash
docker compose --profile mail logs -f stalwart rspamd
# Rspamd web UI: http://<host>:11334
# send a test to hello@acme.com from Gmail; check SPF/DKIM/DMARC = pass in the headers
```

## 5. Terraform (`infra/terraform/`)

Provisions the **non-mail** managed pieces: Cloudflare zone + R2 bucket + records
for `mx1` / `send` / `_spf`. The mail host itself is provisioned out of band
(bare-metal with a controlled PTR). See `infra/terraform/README.md`.
