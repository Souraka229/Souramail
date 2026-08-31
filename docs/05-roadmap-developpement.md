# SouraMAIL — Roadmap de développement A → Z (Partie 5)

> Spécification technique + plan de build pour **finaliser l'infrastructure SouraMAIL**.
> Complète les parties 1–3 (produit) et 4 (design). Rédigé à partir d'une revue de l'état
> de l'art email / SaaS / IA **2026** — sources en fin de document.
>
> Voir aussi : [`01-vision-et-strategie.md`](01-vision-et-strategie.md) ·
> [`02-produit-saas-ecrans.md`](02-produit-saas-ecrans.md) ·
> [`03-growth-business-roadmap.md`](03-growth-business-roadmap.md) ·
> [`04-design-system.md`](04-design-system.md)

---

## 0. Principe directeur

> **La surface reste simple. L'infrastructure peut être extrêmement sophistiquée.**

Deux conséquences d'architecture :

1. **Tout ce qui touche l'email transite par des interfaces abstraites** (`EmailProvider`,
   `DnsProvider`, `LlmProvider`, `StorageProvider`). On démarre sur des briques managées,
   on internalise progressivement sans réécrire l'application.
2. **Multi-tenant et anti-abus dès la ligne 1.** Rétrofitter l'isolation ou la réputation
   plus tard coûte 10×.
3. **On ne repart pas de zéro.** On assemble des briques open source éprouvées (Stalwart,
   Rspamd, ClamAV, PostgreSQL, Redis, stockage objet, Cloudflare) — inventaire dans
   [`../references/README.md`](../references/README.md).

### La vraie innovation n'est pas le serveur mail

SouraMAIL **ne construit pas un nouveau Postfix.** Un concurrent peut avoir une meilleure
infrastructure d'acheminement. Ce qui différencie SouraMAIL, c'est la **couche d'intelligence
et d'expérience** posée au-dessus :

```text
Domaine → SouraMAIL détecte tout → « Il manque 2 configurations » →
« Voici exactement quoi faire » → [Configurer automatiquement] → hello@startup.com → Inbox prête
        puis :
Email reçu → SouraMAIL comprend → résumé → réponse suggérée → Automation → MCP
```

Le socle mail doit être **solide et invisible** ; l'effort d'ingénierie va sur l'onboarding
magique, le Copilot, les Rules, les Automations et le MCP.

### L'IA est une couche, pas le système de sécurité

Le LLM **ne décide jamais seul** qu'un email est du spam. La sécurité principale =
**authentification (SPF/DKIM/DMARC/ARC) + Rspamd + ClamAV + réputation**. La classification IA
n'ajoute que de l'intelligence produit (intent, priorité, labels) **après** ces couches
(pipeline en §4.1).

---

## 1. Décisions techniques à verrouiller

| Domaine | Choix retenu | Pourquoi (revue 2026) | Alternatives écartées |
| ------- | ------------ | --------------------- | --------------------- |
| **MTA / mailbox / IMAP** | **Stalwart** (Rust, tout-en-un : SMTP, IMAP, **JMAP**, POP3, ManageSieve, admin) | 1 binaire, ~100 Mo RAM (vs 1,5 Go pour la stack Postfix+Dovecot+Rspamd+…), JMAP natif (push temps réel), clustering natif. Idéal < 1 000 boîtes. | **Maddy** (Go, all-in-one — plan B) ; Postfix+Dovecot (assemblage lourd, pas de JMAP) ; **Haraka** (SMTP seul, pas de mail store/IMAP) ; mailcow (stack Docker lourde — **archi de référence à lire**) |
| **Anti-spam** | **Rspamd** — 2 instances séparées : *inbound* (verify) & *outbound* (sign + scan + ratelimit) | Standard de fait ; split inbound/outbound recommandé par la doc ; Redis pour persistance (greylist, ratelimit, bayes/neural) | SpamAssassin (plus lent, moins de modules) |
| **Antivirus** | **ClamAV** (`clamd`), appelé via le module `antivirus` de Rspamd-in sur les pièces jointes | Standard open source ; signatures auto (`freshclam`) | commercial (coût), pas d'antivirus (risque) |
| **Résolveur DNS** | **Unbound** local récursif sur chaque nœud mail | Les DNS publics rate-limitent les requêtes RBL/DKIM → Rspamd devient non fiable | DNS publics (1.1.1.1, 8.8.8.8) |
| **Envoi à l'échelle (phase 5)** | **KumoMTA** (Rust + Lua, remplaçant open-source de PowerMTA) | Traffic shaping granulaire, pools IP illimités, millions de messages/h | PowerMTA (commercial, cher) ; Haraka (Node, moins orienté bulk) ; Postal (Ruby/MariaDB/RabbitMQ — **référence d'archi à étudier**, pas à adopter tel quel) |
| **Envoi phases 1–4** | **Relais SMTP managé** derrière `EmailProvider` (Amazon SES + IP dédiée, ou provider transactionnel) | ~0,10 $/1 000 emails + IP dédiée ~25 $/mois ; délégue warmup/réputation le temps de construire | Tout self-host dès J1 (risque délivrabilité) |
| **App front** | **Next.js 15 (App Router)** | Standard SaaS 2026, SSR/RSC, edge | Remix, SvelteKit |
| **App back** | Service API **Node + Fastify** en conteneur, séparé du front | Découplage, scaling indépendant des workers | Tout dans les route handlers Next |
| **Base de données** | **PostgreSQL**, **schéma partagé + `tenant_id` + RLS** activée dès J1 | Recommandé par défaut B2B 2026 ; identité tenant **transaction-scoped** via `set_config` sous pooler transaction-mode (sinon fuite entre connexions) | Schema-per-tenant (complexité ops), DB-per-tenant |
| **Cache / ratelimit / sessions** | **Redis**, clés **préfixées par tenant** | ratelimit Rspamd + app, sessions, cache | Memcached |
| **Files de jobs** | **BullMQ** (Redis) pour le gros volume (envoi email, jobs IA, webhooks) ; **pg-boss** (Postgres) pour le faible volume où l'ACID prime (billing, provisioning) | Combo recommandé quand on a déjà Redis + PG | RabbitMQ (une dépendance de plus), Temporal (overkill au départ) |
| **Stockage objet** | **Cloudflare R2** (ou S3) pour **MIME brut + pièces jointes** | Jamais de gros blobs en PG ; R2 = pas de frais d'egress | Blob en base |
| **AI Gateway** | **LiteLLM** self-hosted (ou Portkey si gouvernance forte) | Endpoint unique compatible OpenAI : routing, fallback multi-provider, cost tracking, budgets, logs conformité — hors du code applicatif | Appels directs aux providers dans le code |
| **MCP** | Serveur **MCP distant** sur **Streamable HTTP**, **OAuth 2.1 + PKCE (S256)**, RFC 9728 (protected-resource-metadata) + RFC 8707 (resource indicators) | Spec MCP nov. 2025 : OAuth 2.1 obligatoire pour tout serveur exposé sur Internet. Le serveur MCP = *resource server* (valide le token, applique le RBAC), l'OAuth est délégué à une lib/gateway | MCP local stdio uniquement (pas multi-tenant) |
| **CDN / edge / WAF** | **Cloudflare** devant tout | DDoS, WAF, geo-routing (résidence EU), R2, DNS API | — |
| **IaC / runtime** | **Docker** + **Terraform** ; orchestration Nomad ou k8s léger | Reproductibilité | Provisioning manuel |
| **Observabilité** | **OpenTelemetry** → Prometheus/Grafana (métriques), Loki (logs), Tempo/Jaeger (traces), **Sentry** (erreurs) | Standard 2026 | Stack propriétaire |
| **Paiement** | **Stripe** (Billing + usage-based) | Standard | Paddle (si besoin merchant-of-record TVA) |

### À trancher par l'équipe avant le sprint 1

- [ ] Région primaire (UE recommandé pour la résidence RGPD) + stratégie multi-région.
- [ ] Provider de relais SMTP pour les phases 1–4 (SES vs autre).
- [ ] Hébergeur des nœuds mail (bare-metal/VPS avec **IPv4 dédiée + PTR/rDNS maîtrisé** — obligatoire).
- [ ] Nom du **sous-domaine d'envoi dédié** (ex. `send.souramail.com`) pour ne jamais risquer le domaine racine.
- [ ] Modèle d'isolation du stockage MIME (bucket unique préfixé tenant vs bucket/tenant).
- [ ] Auth : build maison (Better-Auth/Lucia) vs managé (WorkOS/Clerk) — impacte SSO Business et OAuth MCP.

---

## 2. Architecture cible

### 2.1 Vue composants

```text
                                   Internet
                                      │
                          ┌───────────┴───────────┐
                          │       Cloudflare       │  WAF · DDoS · geo-routing · R2 · DNS API
                          └───────────┬───────────┘
              ┌───────────────────────┼────────────────────────┐
              ▼                       ▼                        ▼
        WEB (Next.js 15)        API (Fastify)            MAIL EDGE
              │                  │      │                  │        │
              │                  │      │            SMTP in (MX)   JMAP/IMAP
              │                  │      │                  │        │
              │                  │      │            ┌─────▼────────▼─────┐
              │                  │      │            │     STALWART       │  boîtes, JMAP push
              │                  │      │            └─────┬────────┬─────┘
              │                  │      │           Rspamd-in    Rspamd-out
              │                  │      │                  │        │
              ▼                  ▼      ▼                  ▼        ▼
        ┌──────────────────────────────────────────────────────────────┐
        │                     CORE SERVICES (Node)                      │
        │  auth · domains/DNS · mailbox · rules-engine · automations    │
        │  ai-gateway(LiteLLM) · api-public · webhooks · mcp-server     │
        │  billing · usage/quotas · abuse-engine · admin               │
        └───────┬───────────────┬───────────────┬──────────────┬───────┘
                ▼               ▼               ▼              ▼
           PostgreSQL        Redis          R2 / S3      Outbound queue
           (RLS, tenant_id)  (cache/rl)   (MIME+PJ)     (BullMQ) ──► EmailProvider
                                                                    ├─ SMTP relay (SES)  [phases 1-4]
                                                                    └─ KumoMTA + IP pools [phase 5]
```

### 2.2 Monorepo

```text
souramail/                         (à créer — code applicatif)
├── apps/
│   ├── web/                        Next.js 15 (landing + app authentifiée + webmail)
│   ├── api/                        Fastify — API interne + API publique v1
│   ├── worker/                     BullMQ workers (send, inbound-process, ai-jobs, webhooks, warmup)
│   ├── mcp/                        serveur MCP distant (Streamable HTTP + OAuth 2.1)
│   └── admin/                      back-office / Abuse Center
├── packages/
│   ├── db/                         schéma Prisma/Drizzle + migrations + politiques RLS
│   ├── core/                       domain logic (rules engine, abuse scoring, quotas)
│   ├── providers/                  EmailProvider · DnsProvider · LlmProvider · StorageProvider
│   ├── sdk-js/  sdk-python/        SDK publics
│   ├── ui/                         design system (tokens partie 4, composants)
│   └── contracts/                  types partagés + schémas events/webhooks (zod)
├── infra/                          Terraform · Docker · configs Stalwart / Rspamd / ClamAV / Unbound / KumoMTA
├── references/                     inventaire des briques open source (submodules optionnels)
└── docs/                           ce dossier
```

---

## 3. Modèle de données (noyau)

Toutes les tables métier portent `tenant_id` (= `workspace_id`) + **RLS** `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.

| Table | Rôle | Champs clés |
| ----- | ---- | ----------- |
| `workspace` | tenant (pensé équipe dès le départ, cf. partie 2 §64) | `plan`, `risk_score`, `created_at` |
| `user`, `membership` | comptes + rôle dans le workspace | `role` (owner/admin/member), `mfa_enabled` |
| `domain` | domaine connecté | `status`, `dns_provider`, `health_score`, `verified_at` |
| `dns_record` | attendu vs constaté | `type`, `name`, `value`, `state` (missing/pending/verified), `auto_fixable` |
| `mailbox` | boîte / adresse | `address`, `type` (mailbox/alias), `quota_bytes`, `target_mailbox_id` |
| `message` | métadonnées email | `direction`, `folder`, `thread_id`, `mime_key` (R2), `size`, `spam_score`, `flags` |
| `thread` | fil | `subject`, `participants`, `last_at` |
| `attachment` | PJ | `message_id`, `storage_key`, `content_type`, `size` |
| `outbound_job` | envoi | `status` (queued→sending→sent→delivered→bounced→failed→spam), `provider`, `provider_msg_id`, `attempts` |
| `delivery_event` | bounce/complaint/open/delivered (FBL + webhooks provider) | `type`, `payload`, `at` |
| `suppression` | adresses à ne plus contacter | `address`, `reason` (bounce/complaint/manual), `scope` |
| `ai_rule` | règle NL compilée | `nl_source`, `compiled_graph` (json), `enabled`, `max_action_level` |
| `automation_run` | exécution | `rule_id`, `message_id`, `steps`, `status` |
| `api_key` | clé API | `hash`, `scopes[]`, `last_used_at` |
| `webhook_endpoint` | endpoint client | `url`, `events[]`, `secret`, `failure_count` |
| `mcp_connection` | agent connecté | `client_id`, `granted_scopes[]`, `status` |
| `mcp_action_log` / `audit_log` | traçabilité (partie 2 §53, §67) | `actor`, `action`, `resource`, `approved_by`, `at` |
| `usage_counter` | compteurs quotas (jour/mois) | `metric` (emails_sent, ai_actions, storage, api_calls), `window`, `value` |
| `subscription` | Stripe | `stripe_id`, `plan`, `status`, `current_period_end` |
| `analytics_event` | funnel (partie 3 §47) | `name`, `props`, `at` |

**Cycle de vie d'un email sortant** : `queued → sending → sent → delivered | bounced | failed | spam`
(cf. partie 2 §79). Chaque transition émet un `delivery_event` + un webhook + met à jour l'`usage_counter`.

---

## 4. Sous-système Email — le cœur

### 4.1 Réception (inbound)

```text
Internet ──MX──► Stalwart SMTP-in
        ─► [SÉCURITÉ]  Rspamd-in : SPF / DKIM / DMARC / ARC · ClamAV · réputation (domaine/IP) · score spam · greylist
        ─► accepté → worker `inbound-process` :
             1. parse MIME (headers, corps text+html, PJ)
             2. PJ + MIME brut → R2  (StorageProvider)
             3. métadonnées → Postgres (message, thread, attachment)
             4. routing alias → mailbox cible
             5. [INTELLIGENCE]  AI Rules utilisateur → classification IA (intent, priorité, labels)
             6. placement : Inbox / Spam / Quarantine
             7. push temps réel → client (JMAP push / WebSocket)
             8. émet `email.received` (webhooks + MCP notifications)  — pas d'event `received` si Spam
```

L'ordre est strict : **la sécurité (auth + Rspamd + ClamAV + réputation) décide de l'acceptation
et du classement spam** ; l'IA n'intervient qu'ensuite, comme couche d'enrichissement produit.

- **Idempotence** : clé = `Message-ID` + `mailbox_id`. Rejouable.
- **Quarantaine** : score Rspamd élevé → dossier `Spam`, pas de webhook `received` (webhook `spam` séparé).
- **Payload webhook léger** + endpoint `GET /messages/{id}` pour le contenu complet.

### 4.2 Envoi (outbound)

```text
API /emails.send  ou  webmail composer  ou  AI Rule action
        ─► validations : auth, scope clé API, domaine vérifié, quota, suppression list
        ─► enqueue BullMQ `send`  (idempotency-key obligatoire)
        ─► worker `send` :
             1. rate limiter (par domaine, par IP, par workspace — token bucket Redis)
             2. abuse-engine : risk score, vélocité, diversité destinataires → allow / throttle / hold
             3. rendu (MJML/React Email → HTML), injection List-Unsubscribe + headers
             4. Rspamd-out : scan + signature DKIM (sélecteur `soura._domainkey`)
             5. EmailProvider.send()  ── SMTP relay (SES)  ► phases 1-4
                                       └─ KumoMTA (pool IP selon réputation/plan) ► phase 5
             6. persiste provider_msg_id, statut = sent
        ─► delivery-events (webhook provider / FBL) → delivered | bounced | complaint
             → maj suppression list · maj réputation · webhook client · maj usage
```

- **Return-Path personnalisé** aligné pour que SPF s'aligne (bounce vers `bounce.souramail.com`).
- **Traitement des bounces** : hard bounce → suppression immédiate ; soft bounce → retries dégressifs
  (5 tentatives sur 72 h) puis `failed`.
- **Idempotence** : `idempotency_key` (client) + dédup Redis 24 h.

### 4.3 Délivrabilité (baseline Google/Microsoft 2025, obligatoire à l'échelle)

| Mécanisme | Mise en œuvre | Phase |
| --------- | ------------- | ----- |
| **Sous-domaine d'envoi dédié** | `send.souramail.com` — le domaine racine ne sert jamais à l'envoi | 1 |
| **SPF** | `v=spf1 include:_spf.souramail.com ~all` généré par domaine client | 1 |
| **DKIM** | clé par domaine, sélecteur `soura`, rotation ; signature côté Rspamd-out | 1 |
| **DMARC** | `p=none` + `rua=` (reporting) → resserrer vers `quarantine` puis `reject` une fois les rapports OK | 1 → 4 |
| **Return-Path / alignement** | custom bounce domain aligné SPF | 1 |
| **PTR / rDNS** | sur chaque IP d'envoi (bloquant) | 1 |
| **ARC** | signature sur le flux entrant retransféré | 2 |
| **MTA-STS + TLS-RPT** | policy `enforce` + endpoint de rapports ; Gmail/MS en font un signal de confiance | 4 |
| **List-Unsubscribe + One-Click (RFC 8058)** | headers sur tout envoi non strictement transactionnel | 2 |
| **IP warmup** | rampe automatisée 30–60 j, < 20 destinataires « froids » / boîte / jour au démarrage ; planificateur `warmup` | 5 |
| **Feedback Loops (FBL)** | inscription Google Postmaster, Microsoft SNDS/JMRP, Yahoo CFL → ingestion `delivery_event` | 4 → 5 |
| **BIMI** | après `p=reject` stable ; VMC (~1 500 $/an, marque déposée) ou CMC (Gmail) | 5 |
| **Seed tests / reputation monitoring** | comptes témoins multi-fournisseurs, tableau de bord réputation | 5 |

### 4.4 Anti-abus (partie 2 §76–78, partie 3 §52–54)

- **Risk score 0–100 par workspace**, recalculé sur : âge du compte, bounce rate, plaintes,
  vélocité d'envoi, diversité destinataires, réputation domaine/IP, statut paiement, comportement API.
- **Limites dynamiques** : nouveau compte = 100 emails/j ; compte fiable après N semaines = palier
  supérieur ; compte suspect = palier réduit. Jamais bloquer la **réception**.
- **Actions graduées** : monitor → throttle → hold pour revue → suspend.
- **Vérifications à l'inscription** : email vérifié, détection jetables, rate-limit création de comptes/mailboxes par IP/ASN, captcha adaptatif.
- **Politique** : SouraMAIL n'est pas une plateforme de bulk/spam ; favoriser transactionnel + pro légitime.

### 4.5 Interface `EmailProvider` (indépendance fournisseur — partie 3 §57)

```ts
interface EmailProvider {
  send(msg: OutboundMessage): Promise<{ providerMessageId: string }>;
  // capacités optionnelles selon backend
  getSuppression?(address: string): Promise<SuppressionEntry | null>;
  streamEvents?(): AsyncIterable<DeliveryEvent>; // webhooks/FBL normalisés
}
// impls : SmtpRelayProvider(SES) · KumoMtaProvider · (futur) autre
```

Migration phase 5 = router un % croissant du trafic vers `KumoMtaProvider` par plan / par
réputation, sans toucher au code applicatif.

---

## 5. IA

### 5.1 AI Gateway (LiteLLM self-hosted)

Endpoint unique compatible OpenAI. Responsabilités : routing modèle, **fallback multi-provider**,
**budgets par workspace**, cost tracking (→ `usage_counter` `ai_actions`), cache, **logs de
conformité** (jamais dans le code métier). Politique par défaut : **ne pas utiliser le contenu
privé pour entraîner** (partie 2 §71).

### 5.2 Copilot (contextuel, jamais un chatbot dans un coin — partie 2 §19, §105)

Actions : `summarize`, `draft_reply`, `translate`, `extract`, `classify`, `create_rule`,
`smart_autocomplete` (Tab). **Scope explicite par requête** : email courant / thread / sélection /
mailbox (partie 2 §70). L'IA **ne fait qu'assister** : `AI → suggestion → l'utilisateur décide`.

### 5.3 AI Rules & Automations

- Entrée langage naturel → **compilateur** (LLM) → graphe `WHEN / IF / THEN` validé par schéma zod → stocké.
- **Niveaux d'action** (partie 2 §40) : **Safe** (read, classify, summarize, label) exécutés
  librement · **Sensitive** (forward, draft, webhook) · **Dangerous** (send, delete) → **approbation requise**.
- `ai_rule.max_action_level` plafonne ce qu'une règle peut faire.
- Moteur d'exécution = workers BullMQ, chaque étape journalisée dans `automation_run.steps`.

### 5.4 Serveur MCP (partie 2 §48–53, partie 3 §68)

- **Transport** : Streamable HTTP. **Auth** : OAuth 2.1 + PKCE (S256), découverte via
  `WWW-Authenticate` → `/.well-known/oauth-protected-resource` → `/.well-known/oauth-authorization-server`,
  RFC 8707 (token lié à ce serveur MCP).
- Le serveur MCP = **resource server** : valide le token, applique le **RBAC** (`granted_scopes`).
  L'émission de tokens est déléguée (lib/gateway : WorkOS, Stytch, Auth0, workers-oauth-provider…).
- **Tools v1** : `search_emails`, `read_email`, `get_thread`, `draft_email`, `reply_to_email`,
  `send_email`, `forward_email`, `create_rule`, `list_rules`, `check_domain`, `get_email_health`,
  `get_delivery_status`.
- **Permissions** : READ / WRITE autorisés selon scope ; **SENSITIVE (`send_email`, `delete_email`)
  → confirmation** (`Allow once / Always allow / Deny`).
- **Agent activity** : chaque appel → `mcp_action_log` (auditable, partie 2 §53).

---

## 6. API publique, SDK, Webhooks

- **API v1** REST, versionnée (`/v1`), auth `Authorization: Bearer soura_live_…`, **scopes least-privilege**
  par clé (`emails:send`, `emails:read`, `domains:manage`, `emails:delete`…).
- Endpoints noyau : `emails.send`, `emails.get`, `domains.create/verify/list`, `addresses.*`,
  `webhooks.*`, `api-keys.*`.
- **Idempotency-Key** sur tous les POST mutatifs. **Rate limiting** par clé (headers `RateLimit-*`).
- **SDK** : `@souramail/sdk` (TS, typé) + `souramail` (Python). Générés depuis un schéma OpenAPI.
- **Webhooks** : events `email.received|sent|delivered|bounced|spam`, `domain.verified`,
  `automation.completed`. Signature HMAC (`secret`), horodatage, **retries** exponentiels + DLQ,
  page « deliveries » avec rejeu manuel.

---

## 7. Webmail

- **Stalwart parle JMAP nativement** → le webmail consomme JMAP directement + **push WebSocket**
  (fallback EventSource) : plus de polling, arrivée instantanée.
- Objectif perf : **ouverture Inbox < 1 s perçu** (skeletons, cache local, pagination par curseur).
- Raccourcis clavier (partie 2 §84), Command Palette ⌘K, composer avec AI + smart autocomplete.
- Offline-tolérant : file d'actions locale (star, archive, mark read) rejouée à la reconnexion.

---

## 8. Automatisation DNS (`DnsProvider`)

- **Détection** du provider DNS/hébergeur à partir du domaine ou d'une URL Vercel/Netlify
  (NS lookup, entêtes HTTP, empreintes).
- **Adapters** : `CloudflareDnsProvider` (token Bearer *scopé DNS edit*, `zone_id` + création
  d'enregistrements), puis Vercel, Namecheap, GoDaddy, Porkbun, OVH.
- Flux « Fix automatically » (partie 2 §34–35) : si l'utilisateur connecte son compte provider →
  SouraMAIL crée MX/SPF/DKIM/DMARC et vérifie. Sinon : affichage humain « copiez cette valeur → Verify ».
- **Email Health score** (0–100) = pondération Authentication / Deliverability / Security / DNS / Reputation.

---

## 9. DevOps, sécurité, conformité

### 9.1 Plateforme

- **Environnements** : `dev` (docker-compose) · `staging` · `prod` (UE) — IaC Terraform, secrets via Vault/SM.
- **CI/CD** : lint + typecheck + tests unitaires + tests d'intégration (Stalwart + Rspamd + PG + Redis
  éphémères) + e2e Playwright + scan SAST/deps + build images signées → déploiement bleu/vert.
- **Migrations DB** : versionnées, réversibles, appliquées hors chemin critique.

### 9.2 Observabilité & fiabilité

- **OpenTelemetry** partout ; dashboards : latence API, profondeur des queues, taux
  livraison/bounce/plaintes, santé MTA, coût IA/jour, quotas.
- **Alerting** : bounce > 2 %, plaintes > 0,1 %, DKIM/SPF fail spike, queue backlog, IP blacklistée.
- **Backups** : PG PITR quotidien + WAL ; R2 versioning ; test de restauration mensuel.
- **DR** : RPO 15 min / RTO 1 h ; runbooks incident (IP blacklist, fuite tenant, panne MTA, abus massif).
- **Status page** publique + `changelog`.

### 9.3 Sécurité

- **Chiffrement** : AES-256 au repos (DB + R2 + backups, clés KMS avec rotation), **TLS 1.3** en transit.
- **AuthZ** : RBAC par workspace, **MFA** (obligatoire pour owner/admin et actions sensibles),
  sessions + appareils, rotation des clés API, `least privilege` sur clés API & tokens MCP.
- **Audit log** immuable (partie 2 §67) : clé API créée, action MCP `send` approuvée, DNS modifié,
  domaine supprimé, export/suppression RGPD.
- **Pentest** externe avant GA ; bug bounty ensuite.
- Isolation des secrets ; pas de PII dans les logs.

### 9.4 Conformité

- **RGPD** : base légale, DPA + liste de sous-traitants publiée, résidence UE, outils
  **export** et **suppression** self-service, rétention configurable.
- **SOC 2** : implémenter les contrôles dès le départ → **Type I** en phase 4, **Type II** ~6 mois après.
- **CAN-SPAM / anti-abus** : List-Unsubscribe, adresse physique dans les emails marketing SouraMAIL,
  opt-out honoré.
- Politique de confidentialité IA : contenu privé **non** utilisé pour l'entraînement par défaut.

---

## 10. Roadmap phasée A → Z

> Cadence : **sprints de 2 semaines**. Chaque phase liste ses **workstreams**, ses **livrables**
> et sa **Definition of Done (DoD)**. Les durées supposent l'équipe minimale du §11 ; ajuster.

### Phase 0 — Fondations · Semaines 1–3

| Workstream | Livrables |
| ---------- | --------- |
| Repo & CI/CD | Monorepo, pipelines lint/test/build, images, déploiement staging auto |
| Infra de base | Terraform : réseau, PG, Redis, R2, Cloudflare zone, secrets |
| Schéma DB + RLS | `packages/db` : tables §3, **RLS activée**, helper `withTenant()` (set_config transaction-scoped) |
| Auth & workspaces | inscription/login, MFA, workspace + membership + rôles |
| Design system | `packages/ui` : tokens partie 4, composants de base, thème clair/sombre |
| Observabilité | OTel + dashboards vides + Sentry + logs structurés |

**DoD Phase 0** : un dev clone le repo, `docker-compose up`, crée un compte, un workspace ;
CI verte ; déploiement staging automatique ; RLS prouvée par un test « pas de fuite entre tenants ».

---

### Phase 1 — Email core MVP · Semaines 4–12

| Workstream | Tâches clés |
| ---------- | ----------- |
| MTA | Déployer **Stalwart** (staging + prod), Unbound local, PTR sur IP dédiée, TLS |
| Onboarding domaine | Saisie domaine / URL Vercel-Netlify → détection provider ; génération MX/SPF/DKIM/DMARC attendus |
| Scanner DNS + auto-fix | `DnsProvider` + `CloudflareDnsProvider` ; flux « copiez / Verify » + « Fix automatically » ; **Email Health score** |
| Inbound pipeline | Rspamd-in ; worker `inbound-process` (parse → R2 → PG → routing alias → push) ; idempotence |
| Outbound pipeline | `EmailProvider = SmtpRelayProvider(SES)` + IP dédiée ; queue `send` BullMQ ; rate limiter ; Rspamd-out + **DKIM signing** ; Return-Path aligné ; bounces (hard/soft) |
| Webmail | JMAP + WebSocket push ; Inbox / thread / composer ; dossiers (Inbox, Starred, Drafts, Sent, Spam, Trash) ; raccourcis ; ⌘K |
| Adresses | créer mailbox, alias → mailbox cible, quotas |
| Onboarding « wow » | « Send yourself a test email » ; écran *You're ready* ; empty states |

**DoD Phase 1** : un nouvel utilisateur connecte `myapp.com`, corrige le DNS (auto ou guidé),
crée `hello@myapp.com`, **envoie et reçoit un vrai email en < 3 min** ; SPF/DKIM/DMARC **pass**
sur un test Gmail + Outlook ; bounce d'une adresse invalide → statut `bounced` + suppression ;
Email Health affiche un score cohérent.

---

### Phase 2 — Différenciation IA & Developer · Semaines 13–22

| Workstream | Tâches clés |
| ---------- | ----------- |
| AI Gateway | LiteLLM self-hosted, budgets/workspace, cost tracking → `usage_counter`, fallback, logs |
| Copilot | summarize / draft / translate / extract / classify / smart autocomplete ; **scope par requête** ; panneau contextuel |
| AI Rules | compilateur NL → graphe validé ; niveaux Safe/Sensitive/Dangerous ; approbations |
| Automations | builder visuel + mode « décris ce que tu veux » ; moteur d'exécution + `automation_run` |
| API publique v1 | endpoints noyau, scopes, Idempotency-Key, rate limit, OpenAPI |
| SDK | `@souramail/sdk` (TS) + `souramail` (Python) générés |
| Webhooks | events, signature HMAC, retries + DLQ, page deliveries + rejeu |
| MCP | serveur Streamable HTTP + OAuth 2.1/PKCE ; tools v1 ; confirmations SENSITIVE ; `mcp_action_log` / Agent activity |
| Délivrabilité+ | ARC ; List-Unsubscribe One-Click ; DMARC → `quarantine` |

**DoD Phase 2** : `souramail.emails.send()` fonctionne depuis le SDK avec une clé scopée ;
un agent (Claude/Cursor) se connecte en MCP, lit des emails, propose un `send_email` **qui exige
une confirmation** ; une AI Rule « résume les emails clients et notifie » tourne de bout en bout
et apparaît dans l'audit ; webhook `email.received` livré et rejouable.

---

### Phase 3 — Growth & Monétisation · Semaines 23–30

| Workstream | Tâches clés |
| ---------- | ----------- |
| Billing | Stripe : plans **Free / Pro (7,90 €/mo, 79 €/an)** ; portail client ; `subscription` |
| Quotas & limites | `usage_counter` (emails/j, AI actions, storage, API) ; **limites dynamiques** liées au risk score ; jamais bloquer la réception |
| Paywalls contextuels | messages « quelle limite + quelle valeur Pro » ; page **Usage** ; pas de dark patterns |
| Referral | liens `?ref=`, récompenses en ressources produit (crédits, +Pro) |
| SouraMAIL for Startups | page + formulaire ; **revue IA/auto** du site ; benefits + badge ; dashboard programme |
| Analytics | `analytics_event` + funnel (visitor→signup→domain verified→first email→7-day active→API→AI→upgrade) ; North Star **Weekly Active Mailboxes** |
| Onboarding adaptatif | branches Vercel/Netlify vs domaine possédé ; « keep it simple / advanced » |
| Contenu SEO | pages `email-for-vercel`, `email-for-nextjs`, guides SPF/DKIM/DMARC (contenu réel) |

**DoD Phase 3** : un utilisateur Free atteint une limite → paywall contextuel → upgrade Stripe →
limites relevées immédiatement ; funnel visible en dashboard interne ; une candidature Startup
est revue automatiquement et approuvée avec benefits appliqués.

---

### Phase 4 — Durcissement production · Semaines 31–38

| Workstream | Tâches clés |
| ---------- | ----------- |
| Anti-abus complet | risk scoring live, behavior analysis, création de comptes rate-limitée, suppression lists, FBL (Google Postmaster / MS SNDS) |
| Bounce/complaint pipeline | normalisation multi-provider, boucles de rétroaction → réputation |
| Admin & Abuse Center | back-office (users, domains, mailboxes, emails, abuse, revenue, deliverability) ; actions monitor/limit/suspend ; accès journalisé |
| Sécurité | 2FA généralisée, audit log complet, revue des permissions, **pentest externe**, durcissement infra |
| Conformité | **SOC 2 Type I** prêt ; DPA + sous-traitants ; outils RGPD export/suppression ; MTA-STS + TLS-RPT `enforce` |
| Fiabilité | load testing (envoi + inbound + webmail), chaos léger, **DR test**, runbooks, status page |
| DMARC | passage à `p=reject` sur `send.souramail.com` une fois les rapports propres |

**DoD Phase 4** : rapport de pentest traité (0 critique/haut ouvert) ; restauration backup testée
sous RTO ; charge cible tenue (p95 API < 300 ms, envoi soutenu au débit visé) ; SOC 2 Type I
enclenché ; un compte abuseur simulé est détecté et throttlé automatiquement.

---

### Phase 5 — Infrastructure email propriétaire · Semaines 39+ (continu)

| Workstream | Tâches clés |
| ---------- | ----------- |
| MTA sortant | Déployer **KumoMTA** ; `KumoMtaProvider` derrière `EmailProvider` ; traffic shaping par domaine destinataire |
| Pools IP & warmup | IP dédiées par plan/réputation ; **planificateur de warmup** automatisé 30–60 j ; bascule progressive du trafic (%) |
| Réputation | seed tests multi-fournisseurs, dashboard réputation, ingestion Postmaster/SNDS/CFL |
| BIMI | après `p=reject` stable ; VMC ou CMC |
| Multi-région | nœuds UE + US, résidence des données par workspace, routage edge |
| Optimisation coûts | mesurer **coût/email** et **coût IA/utilisateur** ; arbitrage relay vs infra propre par segment |

**DoD Phase 5 (itératif)** : ≥ 50 % du volume routé via l'infra propre sans régression de
délivrabilité (bounce < 2 %, plaintes < 0,1 %, inbox placement mesuré) ; coût/email en baisse
documentée ; warmup d'une nouvelle IP entièrement automatisé.

---

## 11. Équipe minimale & effort

| Rôle | Charge | Focus |
| ---- | ------ | ----- |
| Lead / backend email | plein temps | MTA, pipelines inbound/outbound, délivrabilité, anti-abus |
| Full-stack | plein temps | webmail, onboarding, dashboard, billing |
| Full-stack / IA | plein temps | AI Gateway, Copilot, Rules, MCP, API/SDK |
| DevOps / SRE | mi-temps → plein temps dès phase 4 | infra, IaC, observabilité, sécurité, conformité |
| Design (partie 4) | mi-temps | UI, design system, contenus |

**Ordre de grandeur** : MVP activable (fin phase 1) ≈ **3 mois** à 3 devs ; produit
différenciant (fin phase 2) ≈ **+2,5 mois** ; prêt monétisation + prod (fin phase 4) ≈ **~9 mois** ;
infra propriétaire = chantier continu au-delà.

---

## 12. Coûts d'infrastructure (ordres de grandeur 2026)

| Poste | Phases 1–4 | Phase 5 / échelle |
| ----- | ---------- | ----------------- |
| Relais SMTP sortant | SES ≈ 0,10 $/1 000 emails + IP dédiée ≈ 25 $/mois | remplacé par infra propre |
| Nœuds mail (Stalwart/Rspamd/Unbound) | VPS/bare-metal ≈ 30–80 $/mois + IPv4 dédiées | + nœuds KumoMTA + pools IP (≈ 2–5 $/IP/mois) |
| PostgreSQL managé + Redis | ≈ 50–200 $/mois | scale vertical/lecture |
| R2 / stockage objet | usage (pas d'egress) | idem |
| AI (via Gateway) | **coût variable dominant** — suivre coût IA/utilisateur dès le début | budgets stricts par workspace |
| Cloudflare (WAF, R2, DNS) | plan Pro/Business | Business/Enterprise |
| BIMI VMC | — | ≈ 1 500 $/an |
| Conformité (SOC 2, pentest) | pentest ponctuel | audit SOC 2 Type II annuel |

> Le self-hosting sortant devient rentable **au-dessus de ~1 M emails/mois** ; en dessous, le
> relais managé + IP dédiée reste le meilleur rapport effort/délivrabilité — d'où la bascule en phase 5.

---

## 13. Risques & mitigations

| Risque | Impact | Mitigation |
| ------ | ------ | ---------- |
| Mauvaise délivrabilité au lancement | produit inutilisable | démarrer sur relais managé + IP dédiée + warmup ; sous-domaine d'envoi ; DMARC progressif |
| Abus du plan gratuit (spam de masse) | IP blacklistées, coûts | anti-abus + limites dynamiques **avant** la croissance ; risk score ; suppression lists |
| Coût IA non maîtrisé | marge négative | AI Gateway avec budgets/workspace, cache, quotas Free stricts, suivi coût/utilisateur |
| Fuite de données entre tenants | incident majeur | RLS dès J1 + tests anti-fuite en CI + tenant transaction-scoped |
| Stalwart (codebase jeune) | bugs/limites à > 1 000 boîtes | rester dans son domaine de validité ; abstraction mailbox ; plan de bascule Postfix+Dovecot director si besoin HA massive |
| Dépendance à un fournisseur d'envoi | blocage commercial/technique | interface `EmailProvider` + internalisation KumoMTA en phase 5 |
| Conformité RGPD/SOC 2 tardive | ventes B2B bloquées | contrôles dès phase 0, Type I en phase 4 |

---

## 14. Sources (revue 2026)

**Dépôts open source de référence** — inventaire détaillé dans
[`../references/README.md`](../references/README.md) : Stalwart, Rspamd, ClamAV,
mailcow (archi), Postal (archi ESP), Maddy, Haraka, KumoMTA, LiteLLM, MCP SDK.

**MTA / self-hosted**
- Self-hosted email in 2026: mailcow vs Stalwart vs Mailu — https://profor.pro/blog/self-hosted-email-2026-mailcow-stalwart-mailu/
- Dovecot vs Stalwart for production IMAP — https://graphwiz.ai/devops/dovecot-vs-stalwart-imap-production-comparison
- Best Self-Hosted Email Servers 2026 — https://vectismail.com/guides/best-self-hosted-email-servers-2026/
- Stalwart Mail Server — https://stalw.art/mail-server/

**MTA sortant / architecture ESP**
- MTA Selection Guide 2026 — PowerMTA & Alternatives — https://www.cloudserverforemail.com/blog/mta-administration/mta-selection-guide-powermta-alternatives-2026.html
- Mail Transfer Agent Software: 2026 Architecture Guide — https://xmit.sh/blog/mail-transfer-agent/software-the-2025-architecture-guide
- Postal Mail Server 2026: Setup & Config — https://smtpedia.com/postal-guide/
- Self-Hosting Postal — https://pinkyspy.com/en/posts/postal-mail-server/
- Haraka MTA Guide 2026 — https://smtpedia.com/haraka-mta-guide/

**Anti-spam**
- Scanning outbound mail — Rspamd docs — https://docs.rspamd.com/tutorials/scanning_outbound/
- DKIM signing module — Rspamd docs — https://docs.rspamd.com/modules/dkim_signing/
- How to Configure Rspamd for Mail Filtering (2026) — https://oneuptime.com/blog/post/2026-03-02-how-to-configure-rspamd-for-mail-filtering-on-ubuntu/view

**Délivrabilité**
- Email Deliverability — The 2026 Guide (SPF, DKIM, DMARC, Warmup, Bounces) — https://www.acellemail.com/guide/email-deliverability
- Email Deliverability 2026: Best Practices & Updates — https://messageflow.com/blog/email-deliverability-2026/
- DMARC Best Practices Guide 2026 — EasyDMARC — https://easydmarc.com/blog/dmarc-best-practices/
- Email Deliverability in 2026: What's Actually Changed — https://www.mailpool.ai/blog/email-deliverability-in-2026-whats-actually-changed-and-what-hasnt

**Inbound / parsing**
- kriiv/inbound-email (SMTP → parse → S3 → webhook) — https://github.com/kriiv/inbound-email
- Inbound Email Webhooks: Process Incoming Emails (2026) — https://www.pingram.io/blog/inbound-email-notification-webhooks-how-to-process-incoming-emails-api-2026
- Email Inbox Design: Webhooks, Polling, and Storage — https://mailhook.co/blog/email-inbox-design-webhooks-polling-and-storage
- Build an AI email pipeline with Bedrock + SES Mail Manager — https://aws.amazon.com/blogs/messaging-and-targeting/build-an-ai-email-pipeline-with-amazon-bedrock-and-ses-mail-manager/

**Webmail / protocoles**
- From IMAP to JMAP: Why Modern Email Needs a Modern Protocol — https://dev.to/nubo_mail/from-imap-to-jmap-why-modern-email-needs-a-modern-protocol-3l70
- Real-Time Email: How JMAP Push Eliminates the 15-Minute Delay — https://dev.to/nubo_mail/real-time-email-how-jmap-push-eliminates-the-15-minute-delay-36bf
- Why JMAP? — https://jmap.io/why-jmap/

**Multi-tenant SaaS / queues**
- How to architect multi-tenant SaaS on Postgres — ClickHouse — https://clickhouse.com/resources/engineering/multi-tenant-saas-postgres-architecture
- BullMQ vs Bee-Queue vs pg-boss 2026 — https://www.pkgpulse.com/guides/bullmq-vs-bee-queue-vs-pg-boss-job-queues-nodejs-2026
- Best SaaS Tech Stack 2026 — https://www.agilesoftlabs.com/blog/2026/03/best-saas-tech-stack-architecture-2026

**AI Gateway**
- LLM Gateway Architecture: 2026 Engineering Reference — https://www.digitalapplied.com/blog/llm-gateway-architecture-2026-engineering-reference
- AI Gateway Patterns: Cost Control and Reliability at Scale (2026) — https://virtido.com/blog/ai-gateway-patterns-production-guide
- Best LLM Gateways in 2026 (LiteLLM alternatives) — https://contabo.com/blog/best-llm-gateways/

**MCP**
- OAuth 2.1 for Remote MCP Servers (2026) — https://mcp.directory/blog/oauth-21-for-remote-mcp-servers-streamable-http-explained-2026
- Diving Into the MCP Authorization Specification — Descope — https://www.descope.com/blog/post/mcp-auth-spec
- Authentication and authorization in Model Context Protocol — Stack Overflow — https://stackoverflow.blog/2026/01/21/is-that-allowed-authentication-and-authorization-in-model-context-protocol/

**DNS automation**
- Cloudflare API — DNS Records create — https://developers.cloudflare.com/api/node/resources/dns/subresources/records/methods/create/
- Automating DNS Management with Cloudflare's API — https://reintech.io/blog/automating-dns-management-cloudflare-api

**Coûts**
- Cost to Send 1 Million Emails a Month (2026) — https://bulkemailsetup.com/blog/cost-to-send-1-million-emails-per-month/
- Amazon SES Pricing 2026 — https://www.emercury.net/blog/email-marketing-tips/amazon-ses-pricing/
- Self-Hosted Email vs AWS SES — https://mailflowauthority.com/self-hosted-smtp/self-hosted-vs-aws-ses

**Conformité**
- SOC 2 vs GDPR for SaaS — https://complydog.com/blog/soc-2-vs-gdpr-security-privacy-compliance-integration-saas
- From GDPR to SOC 2: Building Compliance into Your Software — https://medium.com/@aleyacyrus/from-gdpr-to-soc-2-a-practical-guide-to-building-compliance-into-your-software-7416422ba374
