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

## Fait — câblage MTA-hook + provisioning mailbox

| Brique | État | Où |
| ------ | ---- | -- |
| **MTA-hook Stalwart → `apps/api`** : `POST /hooks/stalwart/inbound` (bearer `MTA_HOOK_SECRET` timing-safe) → parse payload → verdict Rspamd depuis `X-Spam-Status` / `X-Spamd-Result` → `resolveMailboxByAddress` par destinataire → enqueue `inbound-process` (jobId idempotent `queueId:mailboxId`) → répond `{action:"accept"}` | `apps/api/src/routes/stalwart-hook.ts`, `apps/api/src/queues.ts` |
| Fonction SQL `mailbox_by_address(text)` SECURITY DEFINER (bootstrap avant contexte tenant ; alias → mailbox cible) | `packages/db/src/rls.ts` + `resolveMailboxByAddress()` | + test `mailbox-lookup.test.ts` |
| Bloc `[session.hook."souramail-inbound"]` dans la config Stalwart (stage `data`, body base64, header Authorization) + env compose (`MTA_HOOK_URL`/`MTA_HOOK_SECRET`) | `infra/stalwart/config/config.toml`, `infra/docker-compose.yml` | |
| **Provisioning mailbox** : `provisionMailbox()` → garde plan (`PLAN_LIMITS.addresses`) → mot de passe aléatoire (jamais stocké) → best-effort `StalwartAdmin.createDomain` + `createMailbox` → `insertMailbox` (métadonnée) ; dégrade proprement si serveur mail absent (`skipped-no-server`) | `apps/web/src/lib/mailboxes.ts` |
| UI **Mailboxes** sur `/app/domains/[id]` : liste + form « hello@domaine », mot de passe affiché une seule fois | `apps/web/src/app/app/domains/[id]/mailboxes-card.tsx` |
| **« Fix automatically »** : `autoFixDns()` → `getDnsProvider()` (Cloudflare) → `createRecords` idempotent → re-scan ; bouton visible si `dnsProvider === 'cloudflare'` | `apps/web/src/lib/domains.ts`, `[id]/mailbox-actions.ts` |

## Fait — bounce/complaint + webmail JMAP

| Brique | État | Où |
| ------ | ---- | -- |
| **Webhook SES→SNS** `POST /webhooks/ses` : **signature SNS vérifiée** (cert allow-listé `*.amazonaws.com`, RSA-SHA1/256) → SubscriptionConfirmation auto → Bounce/Complaint/Delivery | `apps/api/src/routes/ses-webhook.ts` | hard bounce → job `bounced` + suppression + risk +8 ; soft bounce → event seul ; complaint → job `spam` + suppression + risk +15 ; delivery → job `delivered` |
| Fonction SQL `outbound_job_by_provider_msg(text)` SECURITY DEFINER + `applyDeliveryEvent` / `isSuppressed` / `filterSuppressed` | `packages/db/src/deliverability.ts` + `rls.ts` | test `deliverability.test.ts` |
| `SmtpRelayProvider` : `providerMessageId` = **id SES** extrait de la réponse SMTP (`250 Ok <id>`), pas le Message-ID header | `providers/src/email/smtp-relay.ts` | (les notifications SES référencent l'id SES) |
| Worker `send` : **skip des adresses en suppression list** (`filterSuppressed`) ; tout supprimé → job `failed` ; event provisoire « delivered » retiré (vient du webhook) | `apps/worker/src/processors/send.ts` | |
| **Client JMAP typé** (`session`, `Mailbox/get`, `Email/query`+`Email/get` par back-reference, `Email/set` keywords, `emailText`) | `packages/jmap` | 6 tests |
| Boîte à secret **AES-256-GCM** (`MAIL_SECRET_KEY`) pour le credential webmail au repos | `packages/core/src/crypto.ts` | 5 tests ; migration `0002` (`mailbox.webmail_secret_enc`) |
| Provisioning : **2 mots de passe** — celui montré une fois (clients externes) + `webmailSecret` chiffré-stocké (proxy JMAP) ; `StalwartAdmin.createMailbox` accepte un tableau | `apps/web/src/lib/mailboxes.ts` | |
| **Webmail `/app/inbox`** : sélecteur mailbox + chips dossiers (rôles JMAP) + liste + volet de lecture, `?mailbox&folder&email` ; action `markReadAction` ; états « aucune mailbox » / « serveur mail non joignable » propres | `apps/web/src/app/app/inbox/*`, `apps/web/src/lib/webmail.ts` | |

## Fait — composer + liveness + self-heal

| Brique | Où |
| ------ | -- |
| **Composer JMAP** : `packages/jmap` → `getIdentities()` + `sendEmail()` = batch `Email/set` draft → `EmailSubmission/set` → move Drafts→Sent (`onSuccessUpdateEmail`). DKIM signé par Rspamd-out, le webmail n'y touche pas. Test dédié. | `packages/jmap/src/index.ts` |
| **UI** : bouton *Compose*, volet composeur (`?compose=1`), bouton *Reply* dans le volet de lecture (`?reply=<id>` — préremplit To / `Re:` / `inReplyTo` / citation). Action `sendEmailAction` (valide les adresses, choisit Drafts/Sent par rôle). | `apps/web/src/app/app/inbox/{compose.tsx,actions.ts,page.tsx}` |
| **Liveness** : `<Live />` rafraîchit au focus fenêtre + toutes les 20 s (le vrai push EventSource JMAP arrive quand le proxy tourne sur un conteneur, pas une fonction serverless). | `apps/web/src/app/app/inbox/live.tsx` |
| **Self-heal du credential webmail** : `getWebmailClient` — si `webmail_secret_enc` absent mais Stalwart joignable → `StalwartAdmin.addSecret()` + persiste le chiffré. Remplace le reconcile job pour ce cas. | `apps/web/src/lib/webmail.ts`, `providers/src/stalwart/admin.ts` |

## Câblage restant

- **Push temps réel natif** : proxy EventSource JMAP (`eventSourceUrl`) → SSE/WebSocket — pertinent quand `apps/api` tourne en conteneur.
- **Reconcile job périodique** : re-pousser vers Stalwart les mailboxes `skipped-no-server` (le self-heal couvre déjà l'accès webmail).
- **`apps/api` déployé** : webhook SES + MTA-hook y vivent ; relancer le bring-up Neon pour les 3 fonctions SECURITY DEFINER + migrations `0001`+`0002`.
- Provisioning externe : VPS mail (PTR `mx1`), SES hors sandbox, token Cloudflare.
