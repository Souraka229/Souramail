# Phase 1 — Email core MVP · suivi

> Réf. : [`05-roadmap-developpement.md`](05-roadmap-developpement.md) Phase 1.
> DoD Phase 1 : un utilisateur connecte `myapp.com`, corrige le DNS, crée `hello@myapp.com`,
> **envoie et reçoit un vrai email en < 3 min** ; SPF/DKIM/DMARC pass sur Gmail + Outlook.

## Fait — couche produit (sans serveur mail)

| Workstream | État | Où |
| ---------- | ---- | -- |
| Onboarding domaine | ✅ saisie domaine / URL → normalisation → détection provider DNS (NS lookup) | `apps/web/src/app/app/domains/*`, `apps/web/src/lib/domains.ts` |
| Génération des enregistrements attendus | ✅ MX / SPF / DKIM / DMARC par domaine | `packages/core` → `expectedDnsRecords()` |
| Scanner DNS | ✅ résolution live (`node:dns`), diff vs attendu, états `missing`/`pending`/`verified` | `scanDomain()` |
| Email Health score | ✅ 0–100 pondéré (auth 40 / deliverability 25 / dns 15 / security 10 / reputation 10) | `packages/core` → `emailHealthScore()` |
| UI « copiez / Verify » + écran Health | ✅ maquette `app-domains-health.html` portée | `app/app/domains/[id]/page.tsx` |

## Fait — couche infra (`infra/` + `packages/providers`)

| Brique | État | Où |
| ------ | ---- | -- |
| **Abstraction fournisseurs** (`EmailProvider` · `DnsProvider` · `StorageProvider` + `StalwartAdmin`) | ✅ interfaces + impls + factory env-driven | `packages/providers/src/*` |
| `SmtpRelayProvider` (SES / relais transactionnel via nodemailer, Return-Path aligné) | ✅ | `providers/src/email/smtp-relay.ts` |
| `S3StorageProvider` (R2 · S3 · MinIO via `aws4fetch`, SigV4) | ✅ | `providers/src/storage/s3.ts` |
| `CloudflareDnsProvider` (token scopé, create/update idempotent — « Fix automatically ») | ✅ | `providers/src/dns/cloudflare.ts` |
| `StalwartAdmin` (créer domaine, DKIM `soura`, mailbox, alias) | ✅ | `providers/src/stalwart/admin.ts` |
| **Config Stalwart** (listeners 25/587/465/143/993/8080, directory interne, milter Rspamd, relais sortant, résolveur Unbound) | ✅ | `infra/stalwart/config/config.toml` |
| **Config Rspamd** (redis, resolver→unbound, `dkim_signing` sélecteur `soura`, `antivirus`→clamav, `ratelimit` sortant, bayes, arc, greylist, reputation, milter proxy) | ✅ | `infra/rspamd/local.d/*.conf` |
| **docker-compose** profil `mail` (stalwart + rspamd + clamav + unbound), env câblés, volume DKIM | ✅ | `infra/docker-compose.yml` |
| **Worker `send`** : charge `outbound_job`+`message` sous RLS → `EmailProvider.send()` → statut `sent` + `delivery_event` + `usage_counter` | ✅ | `apps/worker/src/processors/send.ts` |
| **Worker `inbound-process`** : parse MIME (`mailparser`) → MIME brut + PJ vers `StorageProvider` → `message`/`thread`/`attachment` sous RLS, idempotent `Message-ID`+`mailbox_id` | ✅ | `apps/worker/src/processors/inbound.ts` |
| **Dockerfiles** `api` / `worker` (multi-stage pnpm, Node 22, type-stripping runtime) + `.dockerignore` | ✅ | `apps/{api,worker}/Dockerfile` |
| **Terraform** (zone Cloudflare, bucket R2 EU, DNS `mx1`/`send`/`_spf`/`_dmarc`) | ✅ scaffold | `infra/terraform/*` |
| Runbook de mise en service du mail edge | ✅ | `infra/DEPLOY.md` |

## Reste — provisioning (toi) puis câblage final

1. **Serveur mail** : VPS Linux, IPv4 dédiée, **PTR = `mx1.souramail.com`**, port 25 entrant → `docker compose --profile mail up -d` (cf. `infra/DEPLOY.md`).
2. **Amazon SES** : domaine `send.souramail.com` vérifié, hors sandbox, identifiants SMTP → `EMAIL_PROVIDER=smtp-relay` + `SMTP_RELAY_*`.
3. **Cloudflare** : token `Zone:DNS:Edit` + `Zone:Zone:Read` → `CLOUDFLARE_API_TOKEN` / `ACCOUNT_ID` / `ZONE_ID` ; `terraform apply` pour le socle.
4. **DKIM réel** : générer la clé par domaine (`StalwartAdmin.createDkim` ou KMS), déposer `<domaine>.soura.key` dans le volume `infra/.data/dkim`, publier le TXT via `CloudflareDnsProvider`.

## Câblage restant (code, une fois le mail joignable)

- **MTA hook Stalwart → `apps/api`** : endpoint qui reçoit le message accepté + verdict Rspamd et enqueue `inbound-process`.
- **Provisioning à la création de mailbox** : `apps/web` action → `StalwartAdmin.createMailbox` + `CloudflareDnsProvider.createRecords` + `domain.status = active`.
- **Bounce/complaint** : ingestion webhook SES / FBL → `delivery_event` → suppression list + réputation.
- **Webmail JMAP** : client `apps/web` sur `STALWART_JMAP_URL` + push WebSocket.
