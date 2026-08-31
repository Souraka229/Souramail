# REFERENCES — briques & architectures à étudier

Dépôts open source de référence pour construire SouraMAIL. **On ne repart pas de zéro** : on
assemble ces briques et on développe la couche « magique » SouraMAIL au-dessus (détection &
auto-configuration du domaine, Copilot, AI Rules, Automations, MCP).

> Pour ajouter le code source en local sans polluer le dépôt :
> `git submodule add <url> references/<nom>` (ou clone superficiel `git clone --depth 1`).
> Ne pas committer les sources telles quelles.

---

## Cœur retenu

| # | Dépôt | Rôle dans SouraMAIL | À étudier en priorité |
| - | ----- | ------------------- | --------------------- |
| 1 | **Stalwart** — https://github.com/stalwartlabs/stalwart | **Cœur mail** : SMTP + IMAP + **JMAP** + POP3 + ManageSieve + stockage, all-in-one Rust | modèle de config, API d'admin, JMAP + push, clustering, hooks Sieve, intégration Rspamd |
| 2 | **Rspamd** — https://github.com/rspamd/rspamd | **Anti-spam** entrant **et** sortant : règles, stats (bayes/neural), réputation, RBL, ratelimit, **DKIM signing** | split inbound (verify) / outbound (sign+scan+ratelimit), `settings`, modules `ratelimit` / `reputation` / `dkim_signing`, Redis, résolveur local |
| 3 | **ClamAV** — https://github.com/Cisco-Talos/clamav | **Antivirus** pièces jointes / malware, appelé depuis le pipeline entrant (via Rspamd `antivirus` ou clamd direct) | intégration `clamd`, mises à jour de signatures (`freshclam`), perfs sur PJ volumineuses |

## Architectures de référence (à lire, pas forcément à adopter)

| # | Dépôt | Ce qu'on en tire |
| - | ----- | ---------------- |
| 4 | **mailcow-dockerized** — https://github.com/mailcow/mailcow-dockerized | Assemblage complet Postfix + Dovecot + Rspamd + ClamAV + Redis + SOGo : **comment câbler une infra email de bout en bout** (docker-compose, réseau, volumes, DNS, TLS, backups) |
| 5 | **Postal** — https://github.com/postalserver/postal | **Archi ESP** : MTA + UI web + API + webhooks + queues + **pools IP** + multi-tenant. Modèle de données envoi, gestion bounces/plaintes, webhooks — proche de ce que SouraMAIL expose |

## Alternatives serveur mail (comparatif, non retenues comme cœur)

| # | Dépôt | Verdict pour SouraMAIL |
| - | ----- | ---------------------- |
| 6 | **Maddy** — https://github.com/foxcpp/maddy | All-in-one Go (SMTP in/out, stockage IMAP, DKIM/SPF/DMARC). Bon plan B ; **Stalwart > Maddy** pour bâtir du moderne autour de JMAP/API |
| 7 | **Haraka** — https://github.com/haraka/Haraka | SMTP Node.js ultra-extensible (plugins par événement). Utile **si** on veut une couche SMTP très personnalisée. ⚠️ **Pas de mail store ni d'IMAP** → jamais comme cœur |

## Envoi à l'échelle (phase 5 — internalisation)

| # | Dépôt | Rôle |
| - | ----- | ---- |
| 8 | **KumoMTA** — https://github.com/KumoCorp/kumomta | MTA **sortant** Rust + Lua, remplaçant open-source de PowerMTA : traffic shaping, pools IP illimités, millions de msg/h. Cible du `KumoMtaProvider` |

## Couche IA

| # | Dépôt | Rôle |
| - | ----- | ---- |
| 9 | **LiteLLM** — https://github.com/BerriAI/litellm | **AI Gateway** self-hosted : endpoint unique compatible OpenAI, routing, fallback multi-provider, budgets par tenant, cost tracking, logs conformité |
| 10 | **MCP** — https://github.com/modelcontextprotocol | SDK officiel + spec : serveur MCP distant (Streamable HTTP), auth OAuth 2.1 + PKCE, définitions de tools |

---

## Principe : l'IA est une couche, pas le système de sécurité

Le LLM **ne décide jamais seul** qu'un email est du spam. Pipeline entrant :

```text
EMAIL
  ↓
SPF / DKIM / DMARC / ARC        ← authentification
  ↓
Rspamd  (+ ClamAV)              ← filtrage anti-spam / antivirus
  ↓
Réputation (domaine / IP / expéditeur)
  ↓
AI Rules utilisateur            ← règles explicites
  ↓
Classification IA               ← couche additionnelle (intent, priorité, labels)
  ↓
Inbox / Spam / Quarantine
```

Rspamd + authentification + réputation constituent la **sécurité principale** ;
la classification IA n'ajoute que de l'intelligence produit par-dessus.
