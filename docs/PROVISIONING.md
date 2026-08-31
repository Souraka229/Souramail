# Comptes & secrets à fournir

Liste de tout ce que tu dois créer, par phase, et **exactement quelle valeur me donner**
(nom de la variable → où elle atterrit). Rien de secret ne va dans le code ou le chat.

---

## 0. Comment me transmettre les secrets

1. Crée le fichier **`souramail/.env`** (déjà git-ignoré) à partir de `.env.example` et colle
   les valeurs dedans. Je lis ce fichier, jamais le chat.
2. Pour la CI : **GitHub → Settings → Secrets and variables → Actions** (je te donne la liste des noms).
3. Pour la prod plus tard : un gestionnaire de secrets (Doppler / Infisical / le secret-manager
   de l'hébergeur). Pas maintenant.
4. **Ne colle jamais** une clé « root / admin / full-access ». Toujours un **token scopé** (je
   précise le périmètre pour chacun).

---

## 1. Auth — CHOISI : Better Auth + Better Auth Infra

✅ **Câblé** dans le code (`packages/auth`, servi par `apps/web` sur `/api/auth/*`) :

- `better-auth` (lib self-hosted) + adapter Drizzle sur le Postgres partagé
  (tables `user` / `session` / `account` / `verification` générées dans
  `packages/db/src/auth-schema.ts`).
- `@better-auth/infra` → plugin **`dash()`** actif (analytics, audit log, admin API).
- Plugin **`sentinel()`** (anti-abus : credential stuffing, impossible travel, bot, geo…)
  → **nécessite le plan Infra Pro** ; le code client est déjà prêt, il suffira d'ajouter
  `sentinel({...})` côté serveur quand le plan le permet.

**À faire de ton côté :**
1. Better Auth Infra dashboard → « Connect Your App » : URL `https://souramail.vercel.app`, path `/api/auth`.
   Quand tu basculeras sur le domaine acheté, ajoute la nouvelle URL ici + change `BETTER_AUTH_URL`.
2. **Régénère `BETTER_AUTH_API_KEY`** (l'actuelle a transité en clair) → colle la nouvelle dans `.env`.
3. Passe au plan **Pro** si tu veux activer Sentinel (recommandé avant la prod).

> Le serveur MCP (Phase 2) utilisera l'OAuth de Better Auth ; pas de brique auth supplémentaire à prévoir.

---

## 2. À créer MAINTENANT (Phases 0 → 1)

| # | Service | Plan / coût | À créer/configurer dedans | À me donner (`.env` ou GitHub) |
| - | ------- | ----------- | ------------------------- | ------------------------------ |
| 1 | **GitHub** | gratuit | Repo privé `souramail` (je te donne les commandes de push). Activer Actions. | rien de secret. Plus tard : secrets Actions (liste fournie au moment du deploy). |
| 2 | **Registrar domaine** (Cloudflare Registrar, Porkbun, Namecheap…) | ~10–12 $/an | Acheter **`souramail.com`**. Pointer les **nameservers vers Cloudflare**. | rien à me donner (juste confirmer que c'est fait). |
| 3 | **Cloudflare** | gratuit (Pro 20 $/mo plus tard) | Ajouter la zone `souramail.com`. Créer un **API Token** scopé : `Zone → DNS → Edit` + `Zone → Zone → Read`, limité à cette zone. | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID` |
| 4 | **Cloudflare R2** (ou AWS S3) | gratuit < 10 Go, puis ~0,015 $/Go, **pas de frais d'egress** | Créer un bucket **`souramail-mail`** (région EU). Créer un **API token R2** scope *Object Read & Write* sur ce bucket. | `S3_ENDPOINT` (`https://<accountid>.r2.cloudflarestorage.com`), `S3_REGION=auto`, `S3_BUCKET=souramail-mail`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` |
| 5 | **Hébergeur du/des nœud(s) mail** (Hetzner, OVH, Vultr, Scaleway) | VPS ~5–15 €/mo + IPv4 | 1 VPS Linux (Debian/Ubuntu), **IPv4 dédiée**, **contrôle du PTR / reverse DNS** (mettre `mx1.souramail.com`). Ouvrir le port **25 entrant**. Me créer un **user SSH** (ou clé) + éventuellement un **token API** de l'hébergeur. ⚠️ *Le port 25 **sortant** n'est requis qu'en Phase 5 — vérifie quand même que l'hébergeur l'autorise sur demande.* | IP publique du serveur, accès SSH (clé publique à moi / identifiants), nom d'hôte souhaité. (pas dans `.env` — infra) |
| 6 | **Relais SMTP sortant** — **Amazon SES** (reco) *ou* un provider transactionnel | SES : 0,10 $/1 000 emails + **IP dédiée 24,95 $/mo** | Compte AWS. Vérifier le domaine d'envoi **`send.souramail.com`**. **Sortir du sandbox** (demande "production access", ~24 h). Créer un **user IAM** limité à `ses:SendRawEmail` → générer les **identifiants SMTP SES**. (Option IP dédiée à activer.) | `EMAIL_PROVIDER=smtp-relay`, `SMTP_RELAY_HOST` (`email-smtp.<region>.amazonaws.com`), `SMTP_RELAY_PORT=587`, `SMTP_RELAY_USER`, `SMTP_RELAY_PASS`, `AWS_SES_REGION` |
| 7 | **Sentry** | gratuit < 5k events/mo | Projet `souramail` (Node). | `SENTRY_DSN` |
| 8 | **Better Auth Infra** ✅ | gratuit (Pro pour Sentinel) | Projet créé. « Connect Your App » → `https://souramail.vercel.app` + `/api/auth`. **Régénérer la clé API.** | `BETTER_AUTH_API_KEY` (dans `.env` — à régénérer), `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` (généré) |

### Pas nécessaire maintenant (dev = Docker local)
- Postgres/Redis managés : le `docker-compose` local suffit pour Phases 0–2. Pour le **staging**
  (Phase 0 workstream restant) : **Neon** (Postgres, gratuit) + **Upstash** (Redis, gratuit) →
  `DATABASE_URL`, `REDIS_URL`.
- Hébergement des apps : **Vercel** (`web`, gratuit) + **Railway/Render/Fly.io** (`api`, `worker`)
  → tokens de déploiement (je te donne la liste quand on met en place la CD).

---

## 3. Phase 2 — IA & MCP

| # | Service | Coût | À créer dedans | À me donner |
| - | ------- | ---- | -------------- | ----------- |
| 9 | **Anthropic API** (Claude — modèle principal Copilot/Rules/classification) | usage (~3 $/M tokens in) | Clé API, **limite de dépense mensuelle** (garde-fou). | `ANTHROPIC_API_KEY` |
| 10 | **Fallback / classification pas chère** (optionnel) : OpenAI *ou* un hébergeur open-weight (Together, Fireworks, Groq) | usage | Clé API + budget. | `OPENAI_API_KEY` *ou* `TOGETHER_API_KEY` (au choix) |
| 11 | **AI Gateway** | **LiteLLM self-hosted = 0 €, pas de compte** (déjà prévu). Alternative managée : **Portkey** (gratuit < 10k req/mo). | LiteLLM : rien. Portkey : clé. | LiteLLM : `AI_GATEWAY_KEY` (tu choisis une valeur) · Portkey : `PORTKEY_API_KEY` |
| 12 | **OAuth du serveur MCP** | inclus si Auth = WorkOS/Clerk | Si Auth = **C (maison)** : soit tu ajoutes Stytch Connected Apps / Auth0 (gratuit au début), soit je code l'OAuth 2.1. | selon le choix (`STYTCH_*` / `AUTH0_*`) — sinon rien |

---

## 4. Phase 3 — Billing

| # | Service | Coût | À créer dedans | À me donner |
| - | ------- | ---- | -------------- | ----------- |
| 13 | **Stripe** | 1,5 % + 0,25 € / transaction EU | Compte + activation. 1 produit **"SouraMAIL Pro"** avec 2 prix : **7,90 €/mois** et **79 €/an**. Un **endpoint webhook** `/(api)/stripe/webhook` (URL prod + tunnel en dev). | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY` |

---

## 5. Phases 4–5 — Délivrabilité & production

| # | Service | Coût | À créer dedans | À me donner |
| - | ------- | ---- | -------------- | ----------- |
| 14 | **Google Postmaster Tools** | gratuit | Ajouter `souramail.com` + les domaines d'envoi, valider par TXT. | accès (tu te connectes avec un compte Google dédié) — pas de clé |
| 15 | **Microsoft SNDS + JMRP** | gratuit | Enregistrer les **IP d'envoi** (Phase 5). | rien (déclaratif) |
| 16 | **IP dédiées d'envoi** | SES 24,95 $/mo/IP *ou* incluses avec KumoMTA (Phase 5) | Réserver 1–2 IPv4 propres + PTR. | IP(s) + PTR |
| 17 | **BIMI / certificat VMC** (optionnel, après DMARC `p=reject`) | ~1 000–1 500 $/an, **marque déposée requise** | Commander un VMC (DigiCert/Entrust) ou un CMC (Gmail). | le certificat `.pem` + le SVG du logo |
| 18 | **Status page** (Better Stack / Instatus) | gratuit au début | Page publique `status.souramail.com`. | clé API (pour publier les incidents automatiquement) |
| 19 | **Monitoring** (Grafana Cloud) | gratuit (10k séries) | Stack Prometheus/Loki/Tempo hébergée. | `GRAFANA_CLOUD_*` (endpoint + token OTLP) |
| 20 | **Registry d'images** | GitHub Container Registry, **gratuit avec le repo** | rien à créer. | rien (le `GITHUB_TOKEN` de la CI suffit) |

---

## 6. Minimum vital pour débloquer la **Phase 1**

Si tu ne fais que **6 choses** cette semaine :

1. **GitHub** — repo `souramail` créé.
2. **`souramail.com`** acheté + NS sur **Cloudflare**.
3. **Cloudflare** — token DNS scopé → `CLOUDFLARE_API_TOKEN` / `ACCOUNT_ID` / `ZONE_ID`.
4. **Cloudflare R2** — bucket + token → les 5 vars `S3_*`.
5. **Amazon SES** — domaine `send.souramail.com` vérifié, hors sandbox, identifiants SMTP → les 4 vars `SMTP_RELAY_*`.
6. **1 VPS mail** (Hetzner/OVH) avec IPv4 + PTR + port 25 entrant → IP + accès SSH.

+ ta **décision Auth** (§1). Le reste peut suivre phase par phase.

---

## 7. Récap des variables `.env` (état cible Phase 1)

```
# infra locale : déjà OK via docker-compose
DATABASE_URL=            # staging : Neon
REDIS_URL=               # staging : Upstash

CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ZONE_ID=

S3_ENDPOINT=
S3_REGION=auto
S3_BUCKET=souramail-mail
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

EMAIL_PROVIDER=smtp-relay
SMTP_RELAY_HOST=
SMTP_RELAY_PORT=587
SMTP_RELAY_USER=
SMTP_RELAY_PASS=
AWS_SES_REGION=eu-west-1

BETTER_AUTH_URL=https://souramail.vercel.app     # → domaine acheté plus tard
BETTER_AUTH_SECRET=               # généré automatiquement
BETTER_AUTH_API_KEY=             # Better Auth Infra — À RÉGÉNÉRER

SENTRY_DSN=
```

---

## 8. Commandes à lancer toi-même (logins OAuth / installation d'outils)

Je ne peux pas m'authentifier à ta place. Tape-les avec le préfixe `!` dans cette session
(ou dans un terminal). Ordre conseillé :

```bash
# Cloudflare — installe le plugin + les MCP servers dans Claude Code, puis OAuth au 1er appel
! claude plugin marketplace add cloudflare/skills
! claude plugin install cloudflare@cloudflare
#   puis dans Claude : /reload-plugins

# Sentry — CLI + login (le MCP est déjà scopé : https://mcp.sentry.dev/mcp/9a312c537587)
! curl https://cli.sentry.dev/install -fsS | bash
! sentry auth login
! claude mcp add --transport http sentry https://mcp.sentry.dev/mcp/9a312c537587

# Neon — skills + CLI + MCP, puis connexion au projet
! npx neon@latest skills -s neon -s neon-postgres -y
! neon auth
#   projet : SOURAMAIL  (winter-silence-61658608) — org MAIL (org-nameless-lab-20356794)
```

### Bring-up de la DB Neon — ✅ FAIT (2026-08-31)

Provisionné par `packages/db/src/neon-bringup.ts` (tourne sur le driver HTTP de Neon,
port 443) : rôle `souramail_app` créé (no superuser / no BYPASSRLS), schéma migré,
policies RLS appliquées, **isolation multi-tenant vérifiée contre la vraie DB**.

Pour rejouer (ex. après rotation du mot de passe `neondb_owner`) :

```bash
! bash -c 'set -a; . ./.env; set +a; NEON_PROJECT_ID=winter-silence-61658608 \
    node --experimental-strip-types packages/db/src/neon-bringup.ts'
```

Le script relit `NEON_API_KEY` dans `.env`, récupère les URLs de connexion via l'API
Neon, et réimprime les lignes `DATABASE_URL` / `DIRECT_URL` à coller dans `.env.staging`.

- **Neon Auth** (`...neonauth...`) : non utilisé — on est sur Better Auth.
- **Rotation** (à faire) : le mot de passe `neondb_owner` a transité en clair → régénère-le
  (Neon → Roles), relance le script ci-dessus, il régénère `.env.staging`.
- Ces valeurs vont dans **Vercel → souramail → Settings → Environment Variables**
  (Production + Preview) : `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_API_KEY`. (`DIRECT_URL` seulement si tu migres depuis la CI.)
