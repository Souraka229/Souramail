# Phase 1 — Email core MVP · suivi

> Réf. : [`05-roadmap-developpement.md`](05-roadmap-developpement.md) Phase 1.
> DoD Phase 1 : un utilisateur connecte `myapp.com`, corrige le DNS, crée `hello@myapp.com`,
> **envoie et reçoit un vrai email en < 3 min** ; SPF/DKIM/DMARC pass sur Gmail + Outlook.

## Ce qui est fait (sans serveur mail)

| Workstream | État | Où |
| ---------- | ---- | -- |
| Onboarding domaine | ✅ saisie domaine / URL → normalisation → détection provider DNS (NS lookup) | `apps/web/src/app/app/domains/*`, `apps/web/src/lib/domains.ts` |
| Génération des enregistrements attendus | ✅ MX / SPF / DKIM / DMARC générés par domaine | `packages/core/src/email-health.ts` → `expectedDnsRecords()` |
| Scanner DNS | ✅ résolution live (`node:dns`) MX/TXT, diff vs attendu, états `missing`/`pending`/`verified` | `scanDomain()` dans `lib/domains.ts` |
| Email Health score | ✅ 0–100 pondéré (auth 40 / deliverability 25 / dns 15 / security 10 / reputation 10) | `packages/core` → `emailHealthScore()` |
| Détection provider DNS | ✅ Cloudflare (auto), Vercel, Route53, Namecheap, GoDaddy, Porkbun, OVH, Google, Netlify | `packages/core/src/dns-provider.ts` |
| UI « copiez la valeur / Verify » | ✅ page détail domaine, bouton Verify (server action `scanDomainAction`) | `app/app/domains/[id]/page.tsx` |
| Dashboard `/app` | ✅ stats domaines + limites de plan, next-step contextuel | `app/app/page.tsx` |
| Webmail | ⏳ stub `/app/inbox` (JMAP + push = besoin serveur mail) | `app/app/inbox/page.tsx` |

## Bloqué sur du provisioning (à faire par toi — cf. `PROVISIONING.md` §6)

- **Serveur mail** : VPS Linux, IPv4 dédiée, PTR = `mx1.souramail.com`, port 25 entrant, Stalwart + Rspamd + Unbound.
- **Relais SMTP sortant** : Amazon SES (`send.souramail.com` vérifié, hors sandbox, identifiants SMTP) → `EmailProvider = SmtpRelayProvider`.
- **Cloudflare** : zone + token DNS scopé → `CloudflareDnsProvider` (le flux « Fix automatically »).
- **DKIM réel** : `DEFAULT_SENDING_CONFIG.dkimPublicKey` est un placeholder — remplacer par la vraie clé publique générée côté Rspamd-out.

## Ensuite (code, une fois le mail dispo)

- `CloudflareDnsProvider` derrière l'interface `DnsProvider` (auto-fix des enregistrements).
- Worker `inbound-process` (parse MIME → R2 → PG → routing alias → push).
- Queue `send` BullMQ + rate limiter + Rspamd-out + Return-Path aligné + bounces.
- Webmail JMAP + WebSocket, mailboxes + alias + quotas.
