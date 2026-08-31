# SouraMAIL

**Infrastructure email professionnelle — sans le casse-tête de l'infrastructure.**
Positionnement : *AI-native email infrastructure* pour développeurs et startups.
Domaine : `souramail.com` · Couleur : Soura Teal `#00A48A`.

> Promesse : **Domain → SouraMAIL → Email → Done.**
> Un développeur arrive avec `myapp.com`, repart avec `hello@myapp.com` en moins de
> 3 minutes, puis découvre progressivement Inbox → AI → API → Rules → Automations → MCP.

---

## Contenu du dépôt

Ce dépôt regroupe **la spécification produit** (cahier des charges, parties 1–5), **le système
de design** (export Stitch + maquettes + captures) et, depuis la **Phase 0**, le **squelette du
monorepo applicatif** (`apps/`, `packages/`, `infra/`). État : voir
[`docs/PHASE-0.md`](docs/PHASE-0.md).

```
apps/       web (Next.js 15) · api (Fastify) · worker (BullMQ) · mcp · admin
packages/   db (Drizzle + RLS multi-tenant) · auth (Better Auth) · core · contracts · providers · ui
infra/      docker-compose (postgres · redis · minio · profil mail) · init SQL
```

Local : `pnpm install && pnpm infra:up && pnpm db:generate && pnpm db:migrate && pnpm test`.
Le test d'isolation tenant (RLS) passe contre la DB. `apps/api` boote sur `:4000`.

```
souramail/
├── README.md                          ← ce fichier (index + synthèse)
├── apps/                              ← [Phase 0] web · api · worker · mcp · admin
├── packages/                          ← [Phase 0] db (Drizzle+RLS) · core · contracts · providers · ui
├── infra/                             ← [Phase 0] docker-compose + init SQL (Terraform : TODO)
├── docs/
│   ├── 01-vision-et-strategie.md       ← Partie 1 : vision, positionnement, marque, landing, freemium
│   ├── 02-produit-saas-ecrans.md       ← Partie 2 : SaaS écran par écran, IA, Rules, MCP, automations
│   ├── 03-growth-business-roadmap.md   ← Partie 3 : growth loops, monétisation, anti-abus, roadmap
│   ├── 04-design-system.md             ← Partie 4 : design system consolidé
│   ├── 05-roadmap-developpement.md     ← Partie 5 : spec technique + plan de build A→Z (5 phases)
│   ├── PHASE-0.md                      ← suivi de la Phase 0 (fondations)
│   └── PROVISIONING.md                 ← comptes/services à créer + secrets à fournir
├── design/
│   ├── mockups/                        ← 6 maquettes HTML (Tailwind CDN, autonomes)
│   │   ├── landing-page-v1.html
│   │   ├── landing-page-v2.html        ← version la plus aboutie
│   │   ├── app-inbox.html
│   │   ├── app-domains-health.html
│   │   ├── app-ai-rules.html
│   │   └── app-api-reference.html
│   ├── screenshots/                    ← rendus PNG des maquettes + logo + favicon
│   └── tokens/
│       └── kinetic-infrastructure.md   ← export Stitch original (tokens couleurs/typo/spacing)
├── references/
│   └── README.md                       ← briques open source à assembler (Stalwart, Rspamd, ClamAV…)
└── _archive/
    └── stitch_souramail_landing_page_system (4).zip   ← archive source d'origine
```

---

## Synthèse — les 10 priorités absolues

1. **Le gratuit est le moteur d'acquisition** (pas juste une offre).
2. **Onboarding < 3 minutes** = cœur du produit (idéal < 60 s si DNS prêt).
3. **Le premier email reçu** est l'événement d'activation, pas la création de compte.
4. **Le webmail doit être réellement agréable** (rapide, keyboard-first, style Superhuman/Linear).
5. **L'AI Copilot doit être utile, pas décoratif** — intégré aux workflows, jamais un chatbot dans un coin.
6. **AI Rules + MCP** sont les gros différenciateurs développeurs.
7. **SouraMAIL for Startups** doit créer un canal d'acquisition massif.
8. **Les limites Free poussent vers Pro par la valeur**, sans dark patterns.
9. **L'anti-abus se construit avant** de chercher des millions d'utilisateurs.
10. **La complexité de l'infrastructure reste invisible** pour l'utilisateur.

### Modèle mental produit — 3 couches

| Niveau | Contenu | Public |
| ------ | ------- | ------ |
| 1 — Simple | Inbox, Compose, Domains, Settings | étudiant / fondateur early-stage |
| 2 — Intelligent | AI Copilot, AI Rules, Automations | utilisateur actif |
| 3 — Developer | API, Webhooks, MCP, Logs, Advanced DNS | développeur avancé |

### Flywheel de croissance

`Landing → Free email → Domain connect → First email → Webmail quotidien →`
`(AI Copilot | API) → (Automations | Transactional) → More usage → Pro → Startup Program → Team / Scale`

### Modèle économique

- **Free — 0 € :** 1 domaine, 3 adresses, 1 Go/boîte, 100 emails sortants/jour, webmail, API,
  AI Copilot limité, MCP limité, automations limitées, assistant DNS.
- **Pro — ≈ 7,90 €/mois (ou 79 €/an) :** domaines multiples, plus de boîtes/stockage,
  limites d'envoi supérieures, IA avancée, analytics, logs API, support prioritaire,
  suppression du branding.
- **Business — 29–49 €/mois (plus tard) :** multi-utilisateurs, permissions, audit logs,
  quotas d'équipe, SSO, analytics avancés.
- **North Star Metric :** *Weekly Active Mailboxes* (boîtes qui envoient/reçoivent réellement).

> ✅ Pricing aligné sur le cahier des charges : `landing-page-v2.html` affiche désormais
> **Free 0 € / Pro 7,90 € (79 €/an) / Business — Coming soon**, avec les contenus de plans
> des parties 1 & 3.

### Stack technique retenue (détail : partie 5)

On **n'écrit pas un serveur mail** : on assemble des briques open source et on construit
la couche intelligence/expérience au-dessus (voir `references/README.md`).

| Couche | Choix |
| ------ | ----- |
| Serveur mail (SMTP/IMAP/JMAP/stockage) | **Stalwart** |
| Anti-spam entrant + sortant | **Rspamd** (2 instances) |
| Antivirus | **ClamAV** |
| Envoi phases 1–4 / phase 5 | relais SMTP managé (SES + IP dédiée) derrière `EmailProvider` → **KumoMTA** + pools IP |
| DNS / WAF / edge / R2 | **Cloudflare** |
| DB / cache-queues / stockage objet | **PostgreSQL** (RLS multi-tenant) · **Redis** + **BullMQ** · **R2/S3** |
| App | **Next.js 15** + **Fastify** + workers |
| IA | **AI Gateway (LiteLLM)** + modèles open-weight ; l'IA est une couche, **pas** la sécurité |
| Agents | serveur **MCP** distant, OAuth 2.1 + PKCE |

**Roadmap :** Phase 0 fondations → 1 email core MVP → 2 IA & Developer → 3 growth & billing
→ 4 durcissement prod → 5 infra email propriétaire. ~9 mois jusqu'à la prod (équipe de 3).

---

## Écrans spécifiés (partie 2) et maquettes disponibles

| Écran / zone | Spécifié | Maquette HTML | Capture |
| ------------ | :------: | :-----------: | :-----: |
| Landing page | ✅ | `landing-page-v1.html`, `landing-page-v2.html` | ✅ |
| Dashboard | ✅ (Email Health, Inbox, Deliverability, AI reco, API status, Quick actions) | — | — |
| Inbox / thread / composer | ✅ | `app-inbox.html` | ✅ |
| Domains & Email Health | ✅ | `app-domains-health.html` | ✅ |
| AI Rules / Automations | ✅ | `app-ai-rules.html` | ✅ |
| API / API keys | ✅ | `app-api-reference.html` | ✅ |
| Webhooks | ✅ | — | — |
| MCP (connexion, permissions, tools, confirmations, agent activity) | ✅ | — | — |
| Usage / Pricing in-app | ✅ | — | — |
| SouraMAIL for Startups | ✅ | — | — |
| Settings (profil, sécurité, IA & privacy, audit log) | ✅ | — | — |
| Command Palette (⌘K) | ✅ | — | — |
| Onboarding adaptatif | ✅ | — | — |
| Empty / loading / error states | ✅ | — | — |
| Admin back-office / Abuse Center | ✅ (partie 3) | — | — |

**MCP tools (v1) :** `search_emails`, `read_email`, `get_thread`, `draft_email`,
`reply_to_email`, `send_email`, `forward_email`, `create_rule`, `list_rules`,
`check_domain`, `get_email_health`, `get_delivery_status`.
Permissions : READ autorisé · WRITE autorisé · SENSITIVE (`send`, `delete`) → confirmation.

---

## Design system — l'essentiel

- **Direction :** « Technical Precision » — Linear (précision) + Superhuman (vitesse email)
  + Vercel (developer-first) + Stripe (confiance), avec identité propre.
- **Couleur :** primary `#00A48A` (usage parcimonieux : CTA, logo, actif, succès),
  fond `#F0F2F5`, surface `#FFFFFF`, texte `#111827`, bordure `#E5E7EB`.
  *L'export Stitch pousse une variante teintée verte (`primary #006b59`, `surface #f5fbf7`)
  utilisée dans les maquettes — à réaligner sur la palette produit.*
- **Typo :** Geist (titres, UI, mono) + Inter (corps).
- **Layout :** grille 8 px ; sidebar dashboard 240 px ; landing 12 colonnes, max 1280 px.
- **Formes :** rayon 4 px (8 px pour grands conteneurs) ; pill réservé aux status/chips.
- **Profondeur :** tonal layering + contours 1 px, pas d'ombres lourdes.
- **Icônes :** Lucide (outline fin). *Maquettes en Material Symbols — à remplacer.*
- **Motion :** rare et fonctionnel.

Détail complet : [`docs/04-design-system.md`](docs/04-design-system.md).

---

## Points ouverts à trancher avant le build

1. ~~Pricing & devise~~ — ✅ corrigé dans `landing-page-v2.html` (Free 0 € / Pro 7,90 € / Business Coming soon).
2. **Palette** — `#00A48A` + fond neutre (cahier) vs variante verte Stitch (maquettes).
3. **Rayon des formes** — 4–8 px (Stitch) vs 12–16 px `rounded-xl/2xl` (cahier).
4. **Bibliothèque d'icônes** — Lucide (cahier) vs Material Symbols (maquettes).
5. ~~Infrastructure email / spec technique~~ — ✅ rédigée dans
   [`docs/05-roadmap-developpement.md`](docs/05-roadmap-developpement.md) : stack verrouillée
   (Stalwart + Rspamd + KumoMTA, Next.js/Fastify/Postgres-RLS/Redis/BullMQ, LiteLLM, MCP OAuth 2.1),
   pipelines inbound/outbound, délivrabilité, anti-abus, interface `EmailProvider`, et roadmap
   phasée A→Z en 5 phases (~9 mois jusqu'à la prod). **Décisions à trancher par l'équipe** listées
   au §1 de ce document (région, provider de relais, hébergeur des nœuds mail, auth, etc.).

---

## Prochaines étapes suggérées

- [x] Rédiger la spécification technique / infrastructure → `docs/05-roadmap-developpement.md`.
- [ ] Trancher les décisions du §1 de la partie 5 (région, relais SMTP, hébergeur nœuds mail, auth…).
- [ ] Trancher les points ouverts restants ci-dessus (palette, rayons, icônes).
- [ ] **Phase 0** : initialiser le monorepo (`apps/` + `packages/`), CI/CD, schéma DB + RLS, auth.
- [ ] Réaligner les maquettes HTML sur la palette et les tokens produit.
- [ ] Produire les maquettes manquantes (Dashboard, MCP, Usage, Startups, Settings, Onboarding).
