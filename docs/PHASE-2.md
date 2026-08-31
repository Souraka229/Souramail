# Phase 2 — Différenciation IA & Developer · suivi

> Réf. : [`05-roadmap-developpement.md`](05-roadmap-developpement.md) Phase 2.

## Fait — API publique v1 + MCP

| Brique | État | Où |
| ------ | ---- | -- |
| **Clés API** `soura_live_…` — sha256 stocké + préfixe ; fonction SQL `api_key_by_hash` SECURITY DEFINER (auth avant contexte tenant) | ✅ | `packages/core/src/api-key.ts`, `packages/db/src/api-keys.ts`, `rls.ts` — tests |
| **API v1** (`apps/api`, Fastify) : `onRequest` auth clé → `req.apiCtx {tenantId, scopes}` ; `requireScope()` ; `@fastify/rate-limit` (300/min par clé) ; `@fastify/swagger` + UI sur `/docs` | ✅ | `apps/api/src/{auth,server}.ts`, `routes/v1.ts` |
| Endpoints : `POST /v1/emails` (scope `emails:send`, Idempotency-Key via Redis, domaine vérifié + suppression list) · `GET /v1/emails/:id` · `GET /v1/messages[/:id]` · `GET /v1/domains[/:id]` · `GET|POST|DELETE /v1/webhooks` | ✅ | `routes/v1.ts` |
| **Dashboard clés API** : créer (cases à cocher scopes, secret montré une fois) + lister + révoquer | ✅ | `apps/web/src/app/app/settings/api-keys/*` |
| **Serveur MCP distant** `/api/mcp` — SDK officiel `@modelcontextprotocol/sdk`, Streamable HTTP mode JSON-réponse (tourne en fonction serverless, aucune infra) | ✅ | `apps/web/src/app/api/mcp/route.ts`, `lib/mcp/{server,transport}.ts` |
| Auth MCP : clé API en bearer, scope vérifié par tool ; 401 avec `WWW-Authenticate`. **OAuth 2.1 + PKCE = durcissement à venir** | ✅ v1 | |
| Tools MCP v1 : `search_emails`, `read_email`, `list_domains`, `check_domain`, `get_delivery_status` (`readOnlyHint`) + `send_email` (`destructiveHint` → le client confirme) ; chaque appel → `audit_log` sous RLS | ✅ | `lib/mcp/server.ts` |

## Actif en prod

- `https://gala-guema.xyz/app/settings/api-keys` — création de clés
- `https://gala-guema.xyz/api/mcp` — endpoint MCP (401 sans bearer, correct)

⚠️ **Pré-requis pour activer l'auth clé API + MCP** : relancer le bring-up Neon —
il ajoute les **4 fonctions SECURITY DEFINER** (`app_user_workspaces`,
`mailbox_by_address`, `outbound_job_by_provider_msg`, `api_key_by_hash`) + les
migrations `0001`–`0003`. Sans ça, `resolveApiKey` renvoie 500.

```bash
node --experimental-strip-types packages/db/src/neon-bringup.ts   # env : NEON_API_KEY, NEON_PROJECT_ID, APP_DB_PASSWORD
```

`apps/api` doit aussi être déployé (conteneur — Dockerfile prêt) pour que `/v1/*`
et `/docs` soient joignables ; le MCP, lui, est déjà live sur Vercel.

## Reste Phase 2

- SDK `@souramail/sdk` (TS) + `souramail` (Python) générés depuis l'OpenAPI.
- AI Gateway (LiteLLM) + Copilot (`summarize` / `draft` / `translate` / `extract` / `classify`).
- AI Rules : compilateur NL → graphe `WHEN/IF/THEN` validé zod + niveaux Safe/Sensitive/Dangerous.
- Automations : builder + moteur d'exécution (`automation_run`).
- Webhooks sortants : signature HMAC, retries + DLQ, page « deliveries » + rejeu (queue `webhook-deliver`).
- MCP : OAuth 2.1 + PKCE, découverte `/.well-known/oauth-protected-resource`, `Email/get` streaming.
- Délivrabilité+ : ARC, List-Unsubscribe One-Click, DMARC → `quarantine`.
