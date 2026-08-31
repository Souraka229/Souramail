# Phase 0 — Fondations · suivi

> Objectif : un dev clone le repo, `docker compose up`, crée un compte + un workspace ;
> CI verte ; RLS prouvée par un test « pas de fuite entre tenants ».
> Réf. : [`05-roadmap-developpement.md`](05-roadmap-developpement.md) Phase 0.

## Décisions provisoires prises pour démarrer

| Sujet | Choix | Statut |
| ----- | ----- | ------ |
| Package manager | **pnpm 10** + workspaces | verrouillé |
| Build orchestrator | **Turborepo** | verrouillé |
| Lint / format | **Biome** (outil unique) | verrouillé |
| Langage / runtime | TypeScript strict · **Node 22+** (type-stripping natif, pas de bundler en dev) | verrouillé |
| ORM / migrations | **Drizzle** + drizzle-kit, driver `pg` | verrouillé |
| Isolation multi-tenant | schéma partagé + `tenant_id` + **RLS FORCE** + `withTenant()` (session var `app.tenant_id`, transaction-local) | verrouillé |
| API | **Fastify 5** | verrouillé |
| Front | **Next.js 15** App Router | verrouillé |
| Workers | **BullMQ** | verrouillé |
| Stockage objet (dev) | **MinIO** (prod : R2/S3) | verrouillé |
| **Auth** | build maison vs WorkOS/Clerk | ⏳ **à trancher** (impacte SSO Business + OAuth MCP) |
| Région prod + hébergeur nœuds mail | — | ⏳ à trancher (hors Phase 0) |

## Checklist

### Repo & CI/CD
- [ ] **Décider** : SouraMAIL devient son propre repo git → `cd souramail && git init`
      (aujourd'hui le dossier est imbriqué dans le repo `C:\Users\DELL`).
- [x] Monorepo pnpm + Turborepo (`package.json`, `pnpm-workspace.yaml`, `turbo.json`).
- [x] `tsconfig.base.json`, `biome.json`, `.editorconfig`, `.gitignore`, `.nvmrc`, `.env.example`.
- [x] Workflow CI (`.github/workflows/ci.yml`) : lint + typecheck + test + job d'isolation DB.
- [x] `pnpm install` OK — `pnpm-lock.yaml` généré (à committer).
- [ ] Déploiement staging automatique (Vercel pour `web`, conteneur pour `api`/`worker`) — **TODO**.
- [ ] Images Docker `api` / `worker` + `Dockerfile` par app — **TODO**.

### Infra de base
- [x] `infra/docker-compose.yml` : postgres, redis, minio (+ profil `mail` : stalwart, rspamd, clamav, unbound).
- [x] `infra/postgres/init/01-roles.sql` : rôle applicatif **non-superuser** — vérifié (`souramail_app`, sans BYPASSRLS).
- [x] **Staging Postgres = Neon** (projet SOURAMAIL) : `.env.staging`, `infra/neon/setup.sql`,
      `migrate.ts`/`drizzle.config.ts` lisent `DIRECT_URL`. Bring-up à faire côté user (réseau).
- [ ] Staging Redis = **Upstash** — **TODO** (`REDIS_URL`).
- [ ] `infra/terraform/` : zone Cloudflare, bucket R2, secrets — **TODO**.

### Schéma DB + RLS
- [x] `packages/db` : schéma Drizzle — **21 tables** (§3 du doc 05), enums, index.
- [x] `applyRls()` : `ENABLE` + `FORCE ROW LEVEL SECURITY` + policy `tenant_isolation` sur toutes les tables tenant-scoped.
- [x] `withTenant(db, tenantId, fn)` + `withoutTenant()`.
- [x] `src/migrate.ts` : migrations Drizzle **puis** RLS — exécuté avec succès sur PG local.
- [x] 1ʳᵉ migration générée : `packages/db/drizzle/0000_warm_tinkerer.sql` (+ meta) — à committer.
- [x] Test `test/tenant-isolation.test.ts` (DoD) : **4/4 verts contre la DB live** (975 ms).

### Auth & workspaces
- [x] Choix : **Better Auth + Better Auth Infra** (`dash()` actif ; `sentinel()` en attente du plan Pro).
- [x] `packages/auth` : `betterAuth()` + adapter Drizzle ; tables `user/session/account/verification`
      générées dans `packages/db/src/auth-schema.ts` ; migrées + testées.
- [x] `apps/web` : route handler `/api/auth/[...all]` + `lib/auth-client.ts` (dash + sentinel client).
- [x] Pages **sign-up / sign-in / sign-out** (UI) — `app/(auth)/*`, `app/app/sign-out-button.tsx`.
- [ ] MFA (TOTP) — via plugin Better Auth `twoFactor` — obligatoire owner/admin. **reporté Phase 4 (durcissement)**.
- [x] **Création workspace + `membership` (`owner`) à l'inscription** — hook `databaseHooks.user.create.after`
      → `createWorkspaceWithOwner()` (`packages/db/src/provisioning.ts`), sous RLS via `withTenant` + id workspace généré côté app.
- [x] **Résolution tenant depuis la session** — `requireAppContext()` (`apps/web/src/lib/session.ts`)
      + `listUserWorkspaces()` via la fonction SQL `app_user_workspaces` SECURITY DEFINER (bootstrap avant contexte tenant).
      Middleware `app/*` = garde cookie de session (redirect `/sign-in`).
- [ ] **Toi** : régénérer `BETTER_AUTH_API_KEY`, « Connect App » dans le dashboard Infra (URL = celle du déploiement).

### Design system
- [x] `packages/ui/tokens.ts` (palette produit doc 04, grille 8px, radius, ombres).
- [x] Primitives de base (Button, Input, Select, Field, Card, Callout, Badge) — `apps/web/src/components/ui.tsx`.
      **À faire** : les remonter dans `packages/ui` (peer `react` + Storybook/ladle).
- [ ] Thème clair/sombre — **TODO**.

### Apps (squelettes)
- [x] `apps/api` : Fastify 5, `/healthz` + `/readyz` (checks PG + Redis) — **boot vérifié** sur :4000.
- [x] `apps/worker` : hôte BullMQ, 1 processeur no-op par queue (`send`, `inbound-process`, `ai-job`, `webhook-deliver`, `warmup`).
- [x] `apps/web` : Next.js 15 App Router minimal (layout + page, tokens `@souramail/ui`).
- [x] `apps/mcp`, `apps/admin` : placeholders (Phase 2 / Phase 4).

### Observabilité
- [ ] OpenTelemetry (traces + métriques) dans `api` et `worker` — **TODO**.
- [ ] Sentry (erreurs) — **TODO**.
- [x] Logs structurés (`api` via pino/Fastify).
- [ ] Dashboards Grafana squelettes — **TODO**.

## Definition of Done — Phase 0
- [x] `pnpm install` · `pnpm typecheck` (11/11) · `pnpm test` (core 12, db 4+3) · `pnpm lint` — **verts en local**.
- [x] `pnpm infra:up` + `pnpm db:generate` + `pnpm db:migrate` — **OK** (migrations + RLS + fonction `app_user_workspaces`).
- [x] Le test d'isolation prouve : A ne voit que A, B que B, sans contexte = 0 ligne, write cross-tenant rejeté.
- [x] **Provisioning workspace prouvé** — `test/provisioning.test.ts` : inscription → workspace + membership `owner`
      sous RLS, `listUserWorkspaces` sans contexte tenant, pas de fuite entre users.
- [x] CI verte sur `main` (repo `github.com/Souraka229/Souramail`, workflow CI, 2 jobs).
- [x] **Un compte + un workspace créables** — flux sign-up UI → hook `after` → dashboard `/app` qui lit le workspace.
- [x] `api` boot OK ; `/readyz` = 200 avec postgres + redis up — testé.

## Build & deploy — LIVE ✅

**Production : https://souramail.vercel.app** (projet Vercel `souramail` sous le compte `sourakas-projects`).

- [x] `apps/web` `next build` vert (9 routes, middleware 34 kB).
- [x] `vercel.json` : `installCommand pnpm`, build `--filter @souramail/web` — corrige l'échec prod `npm workspace:` protocol.
- [x] **Vercel env vars** (Production) : `DATABASE_URL` (Neon pooled), `BETTER_AUTH_SECRET`,
      `BETTER_AUTH_API_KEY`, `BETTER_AUTH_URL` + `BETTER_AUTH_TRUSTED_ORIGINS` = `https://souramail.vercel.app`.
- [x] **Migration Neon appliquée** via `neon-bringup.ts` : migrations `0000`+`0001` (colonne `account.issuer`,
      Better Auth 1.7 — cf. PR #2), RLS, fonction `app_user_workspaces`. Isolation re-vérifiée.
- [x] **E2E prod vérifié** : `POST /api/auth/sign-up/email` → 200 + workspace `owner` auto ;
      `/app` rend le workspace ; `/app/domains` OK ; middleware `/app` sans cookie → 307 `/sign-in`.
- [ ] Env vars **Preview** (optionnel — pour les déploiements de branche).
- [ ] Domaine `gala-guema.xyz` : servi par le projet `gala-ceg-5` (même compte `sourakas-projects`).
      Pour l'utiliser sur SouraMAIL : déplacer le domaine vers le projet `souramail` + repointer `BETTER_AUTH_URL`.
- [ ] Images Docker `api` / `worker` + déploiement conteneur — **TODO** (hors chemin critique webmail).

> Note : un user de test `e2e1788159007@example.com` a été créé en prod lors de la vérif E2E — à supprimer si besoin.

## Démarrage rapide (état actuel)

```bash
cd souramail
corepack enable && pnpm install
cp .env.example .env
pnpm infra:up                              # postgres + redis + minio
psql "postgres://postgres:postgres@localhost:5432/souramail" -f infra/postgres/init/01-roles.sql  # si volume déjà existant
pnpm db:generate                           # 1re migration
pnpm db:migrate                            # migrations + RLS
pnpm --filter @souramail/db test           # test d'isolation (DoD)
pnpm --filter @souramail/api dev           # http://localhost:4000/healthz
pnpm --filter @souramail/web dev           # http://localhost:3000
```
