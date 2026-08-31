> **Cahier des charges SouraMAIL — Partie 3/3.** Ce qui transforme le produit en véritable SaaS : monétisation, acquisition in-app, activation, rétention, SouraMAIL for Startups, distribution, growth loops, analytics, sécurité business et roadmap.
> Voir aussi : [`01-vision-et-strategie.md`](01-vision-et-strategie.md), [`02-produit-saas-ecrans.md`](02-produit-saas-ecrans.md), [`04-design-system.md`](04-design-system.md).

# SouraMAIL — Cahier des charges complet

## PARTIE 3/3 — Growth, Business, Acquisition, Monétisation & Scale

**Domaine :** souramail.com
**Produit :** SouraMAIL
**Positionnement :** AI-native email infrastructure pour développeurs et startups
**Promesse :** **Connect your domain. The AI handles the rest.**

---

# 1. OBJECTIF BUSINESS DE SOURAMAIL

SouraMAIL ne doit pas être pensé comme :

> « Un service qui fournit des adresses email gratuites. »

Mais comme :

> **La couche email simple et intelligente des développeurs et startups.**

Le produit commence gratuitement pour supprimer la barrière à l'entrée.

L'utilisateur découvre SouraMAIL parce qu'il veut simplement :

> `hello@monsite.com`

Mais une fois à l'intérieur, SouraMAIL lui apporte progressivement :

* email professionnel ;
* réception ;
* envoi ;
* webmail ;
* API ;
* AI Copilot ;
* automatisations ;
* MCP ;
* monitoring ;
* délivrabilité ;
* infrastructure email pour son application ;
* outils pour son équipe.

L'objectif est donc de transformer :

**adresse email gratuite → utilisateur actif → développeur intégré → startup → client payant.**

---

# 2. LE FLYWHEEL SOURAMAIL

Le modèle de croissance doit fonctionner comme ceci :

```text
                    LANDING PAGE
                         │
                         ▼
                 FREE EMAIL
                         │
                         ▼
                 DOMAIN CONNECT
                         │
                         ▼
                  FIRST EMAIL
                         │
                         ▼
                DAILY WEBMAIL USE
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
          AI COPILOT              API
              │                     │
              ▼                     ▼
       AUTOMATIONS             TRANSACTIONAL
              │                     │
              └──────────┬──────────┘
                         ▼
                    MORE USAGE
                         │
                         ▼
                    PRO PLAN
                         │
                         ▼
                 STARTUP PROGRAM
                         │
                         ▼
                   TEAM / SCALE
```

---

# 3. LE PLUS IMPORTANT : L'ACQUISITION IN-APP

SouraMAIL ne doit pas avoir une acquisition uniquement basée sur :

* publicité ;
* SEO ;
* LinkedIn ;
* Instagram ;
* bouche-à-oreille.

**Le produit lui-même doit devenir un canal d'acquisition.**

---

# 4. FREE PLAN COMME MACHINE D'ACQUISITION

L'offre gratuite doit être réellement utilisable.

### FREE

```text
1 domaine
3 adresses
1 Go / boîte
100 emails sortants / jour
Webmail
API
AI Copilot limité
DNS assistant
MCP limité
Automatisations limitées
```

Mais il faut éviter de donner tellement de ressources que l'utilisateur n'a jamais de raison d'évoluer.

---

# 5. LE « POWERED BY SOURAMAIL »

Chaque utilisateur gratuit peut avoir une petite signature optionnelle :

> Sent with SouraMAIL

Avec un lien :

> souramail.com

Mais **pas de publicité agressive dans les emails personnels**.

Le meilleur endroit est plutôt :

* footer de certaines automatisations ;
* pages publiques ;
* formulaires ;
* emails transactionnels créés avec SouraMAIL ;
* templates gratuits.

Exemple :

```text
────────────────────────

Sent with SouraMAIL
AI-native email for developers

```

L'utilisateur peut supprimer cette signature en passant Pro.

---

# 6. VIRAL LOOP

Il faut créer plusieurs boucles.

### Loop 1 — Email

```text
Utilisateur SouraMAIL
       ↓
envoie un email
       ↓
destinataire voit SouraMAIL
       ↓
découvre le produit
       ↓
créé son propre domaine
```

### Loop 2 — API

Le développeur utilise :

```typescript
sendEmail()
```

dans son application.

Puis ses utilisateurs finaux reçoivent des emails.

SouraMAIL devient visible dans l'infrastructure du développeur.

---

# 7. LOOP « MADE WITH SOURAMAIL »

Pour les startups :

```text
Startup
 ↓
Utilise SouraMAIL API
 ↓
Envoie 10 000 emails
 ↓
Des milliers d'utilisateurs voient la marque
 ↓
Développeurs découvrent SouraMAIL
 ↓
Nouveaux comptes
```

Cela peut devenir une véritable machine d'acquisition.

---

# 8. ONBOARDING

L'onboarding doit être extrêmement court.

### Étape 1

```text
Welcome to SouraMAIL

Let's get your professional email running.

[ Get started ]
```

---

### Étape 2

Demander :

```text
What are you building?

○ SaaS
○ Website
○ Startup
○ Freelance project
○ Personal project
○ Agency
○ Other
```

Cette donnée sert au marketing et à la personnalisation.

---

# 9. DÉTECTION AUTOMATIQUE DU PROJET

L'utilisateur peut entrer :

```text
https://myproject.vercel.app
```

SouraMAIL analyse :

* Vercel ;
* Netlify ;
* domaine custom ;
* Cloudflare ;
* DNS ;
* technologies visibles ;
* domaine associé si identifiable.

Puis :

```text
We found your project.

myproject.vercel.app

You're currently using Vercel.

Let's connect your real domain.
```

---

# 10. CAS VERCEL.APP / NETLIFY.APP

Point extrêmement important :

Un utilisateur **ne peut pas créer librement** :

```text
hello@myproject.vercel.app
```

simplement parce qu'il possède `myproject.vercel.app`.

Il faut distinguer :

### Domaine contrôlé

```text
myproject.com
```

→ SouraMAIL peut gérer son email.

### Sous-domaine Vercel

```text
myproject.vercel.app
```

→ l'utilisateur ne contrôle pas `vercel.app`.

Donc SouraMAIL doit expliquer cela clairement.

---

# 11. OPTION SOURAMAIL DOMAIN

Pour rendre le produit encore plus simple, SouraMAIL peut proposer :

```text
Don't have a domain?

Get a free SouraMAIL address.

hello@myproject.souramail.com
```

ou éventuellement :

```text
hello@myproject.soura.email
```

Cela devient un gros avantage d'acquisition.

Mais cette option doit être clairement positionnée comme :

**SouraMAIL hosted address**

et non comme remplacement complet d'un domaine personnalisé.

---

# 12. ACTIVATION

L'événement principal n'est pas :

> Account created.

C'est :

> **First email successfully received.**

On définit donc :

```text
Activation =
Domain verified
+
Email address created
+
First email received
```

---

# 13. ACTIVATION SCORE

Chaque compte peut avoir :

```text
Setup progress

████████░░ 80%

✓ Account
✓ Domain
✓ DNS
✓ Email address
✓ First email
○ Send your first email
○ Connect API
```

---

# 14. CHECKLIST INTELLIGENTE

La checklist disparaît progressivement.

Exemple :

```text
You're almost ready.

✓ Domain connected
✓ hello@startup.com created
✓ First email received

Recommended next step:

→ Connect your API
```

---

# 15. NE PAS ÊTRE « ANNOYING »

Tu voulais pouvoir être légèrement insistant même avec le gratuit.

La règle doit être :

> **Helpful pressure, not dark patterns.**

Exemple :

### Correct

```text
You're using 87% of your daily sending limit.

If your application grows, Pro gives you higher limits.

[See Pro]
```

### Mauvais

```text
YOUR ACCOUNT IS IN DANGER!!!

UPGRADE NOW!!!
```

---

# 16. LIMITES INTELLIGENTES

Le système doit surveiller :

```text
Storage
Sending
AI usage
API calls
Automations
Domains
Addresses
```

Quand l'utilisateur approche d'une limite :

```text
You're getting close to your free limit.

82 / 100 emails today.

[View plans]
```

---

# 17. PAYWALL CONTEXTUEL

Ne jamais afficher un paywall au hasard.

Il doit apparaître **au moment où l'utilisateur ressent le besoin**.

Exemple :

L'utilisateur veut créer une 4e adresse.

```text
You've reached your 3-address limit.

Your current addresses:

hello@
support@
billing@

Pro includes unlimited aliases and more addresses.

[Upgrade to Pro]
```

---

# 18. PAYWALL AI

L'utilisateur utilise beaucoup l'IA.

Après 20 actions :

```text
You've used all 20 AI actions included today.

Your emails aren't blocked.

You can continue using SouraMAIL normally.

Pro gives you much higher AI limits.

[Upgrade]
```

Très important :

**ne jamais bloquer l'email fondamental à cause de l'IA.**

---

# 19. PLANS

## FREE

```text
€0 / month

1 domain
3 addresses
1 GB / mailbox
100 outgoing emails/day
Webmail
API
AI Copilot
Basic automations
MCP
DNS assistant
```

---

# 20. PRO

Prix initial recommandé :

```text
€7.90 / month
```

ou :

```text
€79 / year
```

Contenu :

```text
Multiple domains
More mailboxes
More storage
Higher sending limits
Advanced AI
Advanced automations
MCP
Analytics
API logs
Priority support
No SouraMAIL branding
```

---

# 21. BUSINESS

Plus tard :

```text
€29–49 / month
```

Pour :

* agences ;
* petites équipes ;
* SaaS ;
* entreprises.

Fonctions :

* plusieurs utilisateurs ;
* permissions ;
* domaines multiples ;
* audit logs ;
* quotas d'équipe ;
* SSO ;
* analytics avancés.

---

# 22. SOURAMAIL FOR STARTUPS

C'est une fonctionnalité stratégique.

Créer une page :

```text
souramail.com/startups
```

Titre :

> **Your startup gets email infrastructure. Free.**

Sous-titre :

> Build faster. Ship faster. Don't waste time configuring email.

---

# 23. OFFRE SOURAMAIL FOR STARTUPS

L'objectif est de faire entrer les startups très tôt.

### Startup Free

```text
Everything in Free

+
Higher limits
+
More domains
+
More API usage
+
Advanced AI
+
MCP
+
Startup badge
+
Priority onboarding
```

Pendant :

```text
3–12 months
```

selon le programme.

---

# 24. CRITÈRES STARTUP

Pour éviter les abus :

```text
Startup application
        ↓
Email verification
        ↓
Website / project
        ↓
GitHub / LinkedIn optional
        ↓
AI / automated review
        ↓
Approval
```

---

# 25. SOURAMAIL FOR STARTUPS COMME CANAL D'ACQUISITION

Le programme doit être plus qu'une réduction.

Chaque startup peut recevoir :

```text
SouraMAIL Startup

Powered by SouraMAIL
```

Cela crée :

```text
SouraMAIL
 ↓
Startup
 ↓
Users
 ↓
Developers
 ↓
Other startups
```

---

# 26. PROGRAMME AMBASSADEURS

Créer :

> **SouraMAIL Builders**

Pour développeurs.

Chaque builder possède :

```text
Referral link

souramail.com/?ref=builder123
```

Récompense :

```text
1 signup → points
5 activated users → credits
10 paid users → commission
```

---

# 27. AFFILIATION

Exemple :

```text
20% recurring commission
```

pendant une période définie.

Les créateurs de contenu peuvent parler de SouraMAIL.

Cibles :

* YouTube ;
* TikTok ;
* LinkedIn ;
* X ;
* newsletters ;
* communautés développeurs.

---

# 28. ACQUISITION SEO

Créer une énorme bibliothèque de pages utiles.

Exemples :

```text
How to create email for Vercel
How to create email for Netlify
How to create hello@ email
Free professional email for developers
Email API for startups
SMTP for developers
How to setup SPF
How to setup DKIM
How to setup DMARC
Free transactional email API
Best email API for startups
```

---

# 29. PROGRAMMATIC SEO

SouraMAIL peut générer des pages autour des besoins :

```text
email-for-vercel
email-for-netlify
email-for-nextjs
email-for-supabase
email-for-startups
email-for-freelancers
email-for-agencies
```

Mais chaque page doit avoir du contenu réellement utile.

Pas des pages SEO générées sans valeur.

---

# 30. LANDING PAGE

La landing de `souramail.com` doit être très simple.

## HERO

```text
Your email infrastructure.
Without the headache.

Connect your domain.
SouraMAIL handles the rest.

[ Get started free ]

No credit card required.
Free forever plan.
```

---

# 31. HERO VISUEL

Au lieu d'un énorme dashboard compliqué :

```text
          Your domain
              ↓

        souraka.com ✓

              ↓

       hello@souraka.com

              ↓

       AI configured ✓
       DNS secured ✓
       Email ready ✓
```

L'utilisateur doit immédiatement comprendre le produit.

---

# 32. SECTION PROBLÈME

```text
Email shouldn't require
an engineering degree.

DNS
SPF
DKIM
DMARC
SMTP
Deliverability
Webhooks
...
```

Puis :

> **SouraMAIL turns all of that into one simple setup.**

---

# 33. SECTION « 3 MINUTES »

```text
1. Connect your domain

2. Create your email

3. Start sending
```

Avec animation légère.

---

# 34. SECTION AI

Titre :

> **Your email has an AI copilot.**

Exemple :

```text
Customer:
"I can't access my account..."

AI:
I've detected a support request.

Suggested reply:
"Hi John, we've reset..."
```

Boutons :

```text
Accept
Edit
Send
```

---

# 35. SECTION AUTOMATION

```text
Email received
       ↓
AI understands it
       ↓
Rule matches
       ↓
Action runs
```

Exemple :

> When I receive an invoice, extract the amount and notify me.

---

# 36. SECTION MCP

Titre :

> **Give your AI agent access to your inbox.**

Exemple :

```text
AI Agent

Search emails
Read messages
Create drafts
Check domain health
Create automation
```

Avec permissions granulaires.

---

# 37. SECTION API

Montrer du vrai code.

```typescript
await souramail.emails.send({
  from: "hello@startup.com",
  to: "user@gmail.com",
  subject: "Welcome",
  html: "<h1>Welcome!</h1>"
});
```

CTA :

> Start building for free.

---

# 38. SECTION GRATUITE

Très importante.

```text
Free means free.

1 domain
3 addresses
1 GB
100 emails/day
AI Copilot
API
Webmail
```

CTA :

> Create your free email.

---

# 39. SECTION STARTUPS

```text
Building a startup?

SouraMAIL for Startups gives
early-stage teams more infrastructure
without the early-stage bill.

[ Apply for Startup ]
```

---

# 40. PRICING

Très simple :

```text
FREE
€0

PRO
€7.90/mo

BUSINESS
Coming soon
```

Ne pas avoir 8 plans.

---

# 41. CTA FINAL

```text
Your domain is waiting.

Create your professional email
in minutes.

[ Get started free ]
```

---

# 42. DASHBOARD — GROWTH INTÉGRÉ

Le dashboard ne doit pas seulement être technique.

Il doit également aider l'utilisateur à découvrir le produit.

Exemple :

```text
Good morning, Souraka.

Your email is healthy.

Email Health
94/100

12 unread

3 automations

API
Connected
```

Puis :

```text
Recommended

→ Connect your API
→ Create an AI rule
→ Enable MCP
```

---

# 43. « NEXT BEST ACTION »

SouraMAIL doit déterminer automatiquement :

> Quelle est la meilleure action que cet utilisateur devrait faire maintenant ?

Exemple :

Nouvel utilisateur :

```text
→ Send your first email
```

Utilisateur actif :

```text
→ Create your first AI rule
```

Développeur :

```text
→ Connect your API
```

Startup :

```text
→ Apply for SouraMAIL for Startups
```

---

# 44. IN-APP DISCOVERY

Dans la sidebar :

```text
Inbox
Sent
Drafts
Contacts
Domains
AI
Automations
API
MCP
Analytics
Settings
```

Certaines fonctionnalités peuvent avoir :

```text
NEW
```

Mais avec parcimonie.

---

# 45. AI DISCOVERY

Une zone :

```text
Ask SouraMAIL
```

L'utilisateur peut écrire :

> « Que puis-je automatiser ? »

L'IA répond :

```text
Based on your inbox, you could automate:

1. Invoice detection
2. Support classification
3. Customer follow-ups

[Create rule]
```

C'est à la fois une fonctionnalité et un moteur d'upsell.

---

# 46. MARKETING PERSONNALISÉ PAR L'IA

SouraMAIL peut analyser **les signaux produit**, pas lire abusivement le contenu privé des utilisateurs.

Exemples :

```text
User sends > 80 emails/day
→ suggest Pro

User has 3 addresses
→ suggest additional capacity

User uses API heavily
→ suggest Developer features

User receives many support emails
→ suggest AI automation
```

---

# 47. ÉVÉNEMENTS ANALYTICS

Implémenter un système d'événements.

Exemples :

```text
account_created
domain_added
domain_verified
address_created
email_received
email_sent
first_email_received
first_email_sent
api_key_created
api_email_sent
ai_used
automation_created
mcp_connected
pricing_viewed
upgrade_started
subscription_created
subscription_cancelled
```

---

# 48. FUNNEL

Mesurer :

```text
Visitor
 ↓
Signup
 ↓
Domain added
 ↓
Domain verified
 ↓
Address created
 ↓
First email received
 ↓
First email sent
 ↓
7-day active
 ↓
API connected
 ↓
AI used
 ↓
Upgrade
```

---

# 49. NORTH STAR METRIC

La métrique principale ne devrait pas être simplement :

> Nombre d'utilisateurs.

Meilleure métrique :

> **Weekly Active Mailboxes**

Une boîte qui reçoit ou envoie réellement des emails.

---

# 50. MÉTRIQUES BUSINESS

Suivre :

```text
MRR
ARR
ARPU
Conversion Free → Pro
Activation rate
Retention
Churn
CAC
LTV
LTV/CAC
Payback period
Startup conversion
API usage
Emails/day
Cost/email
AI cost/user
Infrastructure cost/user
```

---

# 51. UNIT ECONOMICS

Le modèle doit être surveillé très tôt.

Pour chaque utilisateur :

```text
Revenue
-
Email infrastructure cost
-
Storage
-
AI inference
-
Database
-
Bandwidth
-
Support
=
Gross margin
```

---

# 52. LE PROBLÈME DU GRATUIT

Le risque principal de SouraMAIL n'est pas le manque d'utilisateurs.

C'est :

> **avoir énormément d'utilisateurs gratuits qui coûtent de l'argent.**

Il faut donc contrôler :

* stockage ;
* emails sortants ;
* IA ;
* pièces jointes ;
* automations ;
* API ;
* comptes abusifs.

---

# 53. ANTI-ABUS

Chaque nouveau compte obtient une réputation initiale faible.

```text
New account
     ↓
Low sending limits
     ↓
Normal behavior
     ↓
Reputation increases
     ↓
Higher limits
```

Signaux :

```text
Bounce rate
Spam complaints
Sending velocity
Recipient diversity
Account age
Domain reputation
Payment status
API behavior
```

---

# 54. NE JAMAIS VENDRE DE L'EMAIL SPAM

SouraMAIL doit avoir une politique claire :

> SouraMAIL is not a bulk spam platform.

Le produit doit favoriser :

* emails transactionnels ;
* emails professionnels ;
* communication légitime.

---

# 55. ARCHITECTURE BUSINESS

```text
                    SOURAMAIL.COM
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
         FREE USERS              PAID USERS
             │                       │
             ▼                       ▼
         WEBMAIL                    PRO
             │                       │
             ├──── API ─────────────┤
             │                       │
             ├──── AI ───────────────┤
             │                       │
             ├──── MCP ──────────────┤
             │                       │
             └──── AUTOMATIONS ──────┘
                         │
                         ▼
                  STARTUP PROGRAM
                         │
                         ▼
                     BUSINESS
```

---

# 56. ARCHITECTURE TECHNIQUE FINALE

```text
                        INTERNET
                           │
                           ▼
                     CLOUDFLARE
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
           WEB APP                   MAIL GATEWAY
              │                         │
              ▼                         ▼
          NEXT.JS                  POSTFIX / MTA
              │                         │
              ▼                         ▼
          API LAYER                 RSPAMD
              │                         │
       ┌──────┼───────┐                 │
       ▼      ▼       ▼                 ▼
      AI     MCP   AUTOMATIONS       MAIL STORAGE
       │      │       │                 │
       └──────┴───────┴─────────────────┘
                      │
                      ▼
                  POSTGRESQL
                      │
             ┌────────┴────────┐
             ▼                 ▼
           REDIS              R2/S3
```

---

# 57. IMPORTANT : NE PAS DÉPENDRE D'UN FOURNISSEUR EMAIL UNIQUE

Pour le produit final, SouraMAIL doit contrôler progressivement sa propre infrastructure.

Architecture abstraite :

```text
EmailProvider Interface

       ├── SMTP Provider
       ├── Self-hosted MTA
       └── Future Provider
```

Cela évite d'être bloqué par un seul fournisseur.

---

# 58. ARCHITECTURE EMAIL

Pour le produit sérieux :

### Réception

```text
Internet
 ↓
MX
 ↓
Mail Gateway
 ↓
Anti-spam
 ↓
Antivirus
 ↓
SPF/DKIM/DMARC validation
 ↓
Mailbox
```

### Envoi

```text
SouraMAIL
 ↓
Outbound Queue
 ↓
Rate Limiter
 ↓
Abuse Engine
 ↓
DKIM signing
 ↓
SMTP
 ↓
Internet
```

---

# 59. QUE FAIRE DU WEBMAIL ?

Le webmail doit être extrêmement rapide.

Objectif :

```text
Open Inbox
< 1 second perceived load
```

Interface :

```text
Sidebar
│
├ Inbox
├ Starred
├ Sent
├ Drafts
├ Archive
├ Spam
└ Trash

Main
│
├ Search
├ Filters
└ Email list

Right / Main
└ Email thread
```

---

# 60. DESIGN PRINCIPLE

SouraMAIL ne doit jamais donner l'impression :

> « Je suis dans une infrastructure email compliquée. »

L'utilisateur doit penser :

> **« C'est mon email. »**

La complexité reste derrière.

---

# 61. BRAND

Le logo doit être extrêmement simple.

Concept recommandé :

### Symbole

Un **S abstrait construit avec deux formes de flux email**.

Le symbole peut évoquer :

```text
S
+
enveloppe
+
flux
+
AI
```

Mais sans mettre littéralement une enveloppe générique.

---

# 62. LOGO

Version principale :

```text
[ S ] SouraMAIL
```

Le symbole doit fonctionner seul :

```text
[S]
```

pour :

* favicon ;
* app icon ;
* MCP ;
* GitHub ;
* documentation.

---

# 63. COULEURS

### Primary

```text
#00A48A
```

### Background

```text
#F0F2F5
```

### White

```text
#FFFFFF
```

### Text

```text
#111827
```

### Muted

```text
#6B7280
```

### Border

```text
#E5E7EB
```

---

# 64. TYPOGRAPHIE

Utiliser :

> **Geist Sans**

ou :

> **Inter Variable**

Hiérarchie :

```text
Hero
64–72px

H1
48–56px

H2
36–44px

Body
16–18px

UI
14–15px
```

---

# 65. MOTION DESIGN

Les animations doivent être rares.

Exemples :

* ouverture sidebar ;
* apparition d'une confirmation ;
* progression onboarding ;
* connexion domaine ;
* email envoyé ;
* AI response.

Pas de :

* gradients animés ;
* particules ;
* animations permanentes ;
* effets 3D inutiles.

---

# 66. MOBILE

Le dashboard est desktop-first.

Mais :

* landing responsive ;
* onboarding responsive ;
* webmail utilisable mobile ;
* composer mobile ;
* notifications adaptées.

---

# 67. SÉCURITÉ BUSINESS

Chaque action sensible doit avoir :

```text
Authentication
Authorization
Rate limiting
Audit log
```

Actions :

* send email ;
* delete email ;
* create API key ;
* connect MCP ;
* create automation ;
* modify DNS;
* delete domain.

---

# 68. MCP

Le MCP devient un différenciateur majeur.

Tools :

```text
search_emails
read_email
draft_email
send_email
reply_to_email
forward_email
create_rule
list_rules
create_draft
check_domain
get_email_health
get_delivery_status
```

Mais :

```text
read → autorisé
draft → autorisé
send → confirmation
delete → confirmation
```

---

# 69. AI RULES

L'utilisateur écrit :

> « Quand je reçois un email avec une facture, ajoute-le au dossier facturation et crée un résumé. »

SouraMAIL transforme cela en :

```text
TRIGGER
Email received

CLASSIFIER
Invoice

ACTION
Label → Billing

ACTION
AI summary
```

Puis :

> **Rule created.**

---

# 70. AUTOMATION BUILDER

Interface :

```text
WHEN

[ Email received ]

IF

[ AI detects invoice ]

THEN

[ Label as Billing ]

+

[ Generate summary ]
```

L'utilisateur n'a jamais besoin de comprendre :

* queues ;
* workers ;
* webhooks ;
* cron ;
* event buses.

---

# 71. STARTUP DASHBOARD

Pour SouraMAIL for Startups :

```text
Startup Program

Your benefits

✓ Pro infrastructure
✓ Higher limits
✓ AI credits
✓ API credits

Usage

Emails       12,450
API calls     8,420
AI actions    1,220

Program

87 days remaining
```

---

# 72. UPSELL STARTUP

À l'approche de la limite :

```text
Your startup is growing.

You've sent 92,000 emails this month.

Upgrade to Scale to avoid interruptions.
```

Le message doit célébrer la croissance.

Pas faire peur.

---

# 73. EMAILS MARKETING DE SOURAMAIL

Créer des emails automatisés :

### Welcome

```text
Welcome to SouraMAIL.
Let's get your email running.
```

### Domain verified

```text
Your domain is ready.
```

### First email

```text
Your first email has arrived.
```

### Day 2

```text
3 things you can automate with SouraMAIL.
```

### Day 5

```text
Your AI Copilot can do more.
```

### Day 7

```text
You're getting the most out of SouraMAIL.
```

### Usage threshold

```text
You're approaching your free limit.
```

---

# 74. EMAIL RETENTION

Ne pas spammer.

Cadence maximale raisonnable :

```text
Product emails
+
Important notifications
+
Occasional educational emails
```

L'utilisateur doit pouvoir gérer :

```text
Marketing emails
Product emails
Usage notifications
Security notifications
```

---

# 75. NOTIFICATIONS IN-APP

Centre :

```text
Notifications

✓ Domain verified
AI rule created
API key created
You received 5 emails
Your sending limit is almost reached
```

---

# 76. REFERRAL

Dans le dashboard :

```text
Invite developers.

Give them:
+30 days of Pro

Get:
+30 days of Pro
```

ou un système de crédits.

Le coût marginal est faible comparé à une acquisition publicitaire.

---

# 77. COMMUNAUTÉ

Créer progressivement :

> SouraMAIL Builders

Canaux :

* Discord ;
* GitHub Discussions ;
* X ;
* LinkedIn.

Objectifs :

* feedback ;
* support ;
* showcase ;
* templates ;
* MCP integrations ;
* automations.

---

# 78. GITHUB

Le projet doit avoir une présence open-source autour de certaines briques :

```text
souramail-ai-sdk
souramail-mcp
souramail-js
souramail-python
email-dns-checker
```

Le cœur de l'infrastructure email peut rester propriétaire.

Cela permet de capter les développeurs.

---

# 79. API-FIRST

Le développeur doit pouvoir faire :

```text
Create account
 ↓
Create domain
 ↓
Verify domain
 ↓
Create API key
 ↓
Send email
```

sans ouvrir le dashboard.

---

# 80. DOCUMENTATION

Documentation :

```text
docs.souramail.com
```

Structure :

```text
Getting Started

Email
├ Send
├ Receive
├ Templates
└ Webhooks

Domains
├ DNS
├ SPF
├ DKIM
└ DMARC

AI
├ Copilot
├ Rules
└ Agents

MCP
├ Setup
├ Tools
└ Permissions

SDK
├ JavaScript
├ Python
└ PHP
```

---

# 81. DEVELOPER EXPERIENCE

Le code doit être extrêmement simple.

```typescript
import { SouraMail } from "@souramail/sdk";

const mail = new SouraMail({
  apiKey: process.env.SOURAMAIL_API_KEY
});

await mail.emails.send({
  from: "hello@startup.com",
  to: "user@example.com",
  subject: "Welcome",
  html: "<h1>Hello</h1>"
});
```

---

# 82. OBJECTIF DEUXIÈME ANNÉE

Si le produit fonctionne :

```text
Free users
        ↓
Developers
        ↓
Startups
        ↓
API usage
        ↓
Teams
        ↓
Business
```

SouraMAIL devient progressivement une infrastructure.

---

# 83. PROJECTION FINANCIÈRE — SCÉNARIO SIMPLE

Exemple hypothétique :

### 10 000 utilisateurs actifs

Si :

```text
2% payants
```

→ 200 clients.

À :

```text
€7.90/mois
```

MRR :

```text
€1,580
```

---

### 100 000 utilisateurs

2 % payants :

```text
2 000 × €7.90
= €15,800 MRR
```

ARR :

```text
≈ €189,600
```

---

### 500 000 utilisateurs

2 % :

```text
10 000 × €7.90
= €79,000 MRR
```

ARR :

```text
≈ €948,000
```

---

# 84. MAIS LE VRAI LEVIER

Le vrai potentiel n'est pas uniquement :

> abonnement webmail.

C'est :

```text
Webmail
+
API
+
Transactional Email
+
AI
+
MCP
+
Automations
+
Startup Infrastructure
```

Un utilisateur API professionnel peut générer beaucoup plus qu'un utilisateur webmail.

---

# 85. FUTUR PRICING API

Plus tard :

```text
Free
1,000 emails

Developer
€9

Startup
€29

Growth
€99

Scale
Custom
```

Avec tarification selon :

* volume ;
* stockage ;
* API ;
* AI ;
* automations.

---

# 86. STRATÉGIE DE DISTRIBUTION

Priorité :

### 1

Produit gratuit.

### 2

SEO développeurs.

### 3

GitHub.

### 4

Content marketing.

### 5

SouraMAIL for Startups.

### 6

Referral.

### 7

Communauté.

### 8

LinkedIn/X.

### 9

Paid acquisition uniquement après validation des economics.

---

# 87. CE QU'IL NE FAUT PAS FAIRE

Ne pas commencer avec :

```text
Facebook Ads
+
Google Ads
+
TikTok Ads
```

avant de connaître :

```text
Activation
Retention
CAC
LTV
Conversion
Infrastructure cost
```

Sinon tu risques d'acheter des utilisateurs gratuits coûteux.

---

# 88. ROADMAP

## Phase 1 — Foundation

```text
Auth
Domain
DNS
Email
Inbox
Sending
Security
```

---

## Phase 2 — Differentiation

```text
AI Copilot
AI Rules
MCP
Automations
API
```

---

## Phase 3 — Growth

```text
Referral
Startup Program
SEO
Developer SDK
Analytics
```

---

## Phase 4 — Monetization

```text
Pro
Startup
Business
API billing
Usage billing
```

---

## Phase 5 — Infrastructure

```text
Own mail infrastructure
Dedicated IPs
Advanced deliverability
Global regions
```

---

# 89. OBJECTIFS DES 90 PREMIERS JOURS

### Objectif produit

```text
100% functional MVP
```

### Objectif utilisateurs

```text
500–1,000 registered
```

### Objectif activation

```text
>40%
```

### Objectif rétention

Chercher :

```text
>25–30% weekly active
```

### Objectif payant

Même très faible au début :

```text
1–3%
```

L'objectif principal est de prouver que les utilisateurs **restent**.

---

# 90. DASHBOARD ADMIN

SouraMAIL doit posséder son propre back-office.

```text
Overview

Users
Domains
Mailboxes
Emails
Abuse
AI
API
Revenue
Subscriptions
Infrastructure
Deliverability
```

---

# 91. ADMIN USER VIEW

Pouvoir voir :

```text
User
Account age
Domains
Mailboxes
Sending volume
Receiving volume
API usage
AI usage
Reputation
Plan
Abuse score
```

Mais avec accès strictement contrôlé et journalisé.

---

# 92. ABUSE CENTER

```text
Risk Score

12 / 100

Sending:
Normal

Bounce:
0.8%

Complaints:
0%

Status:
Healthy
```

Actions :

```text
Monitor
Limit
Suspend
Review
```

---

# 93. EMAIL HEALTH

Le score devient une fonctionnalité centrale.

```text
Email Health
94/100

✓ SPF
✓ DKIM
✓ DMARC
✓ MX
✓ TLS
✓ Domain reputation
```

Puis :

```text
AI recommendation:

Your DMARC policy can be strengthened.
```

---

# 94. DIFFÉRENCIATION ABSOLUE

Le marketing doit toujours revenir à quatre mots :

> **Simple. Free. AI. Developer-first.**

La phrase centrale :

> **Professional email infrastructure without the infrastructure headache.**

Et l'avantage le plus fort :

> **You can start for free in minutes.**

---

# 95. POSITIONNEMENT PAR RAPPORT AUX ALTERNATIVES

SouraMAIL ne doit pas essayer de battre chaque fournisseur sur chaque dimension.

Il doit gagner sur :

| Critère        | SouraMAIL                    |
| -------------- | ---------------------------- |
| Gratuit        | Très fort                    |
| Simplicité     | Très fort                    |
| Developers     | Très fort                    |
| AI             | Très fort                    |
| MCP            | Très fort                    |
| Automations    | Très fort                    |
| Webmail        | Fort                         |
| Infrastructure | À construire progressivement |
| Enterprise     | Plus tard                    |

---

# 96. LA PHILOSOPHIE DU PRODUIT

Tout ce qui est compliqué doit être transformé.

```text
DNS
↓
Connect domain

SPF
↓
Email security

DKIM
↓
Sender verification

DMARC
↓
Anti-spoofing

SMTP
↓
Send email

IMAP
↓
Inbox

Webhooks
↓
Automations

MCP
↓
AI access
```

---

# 97. LA RÈGLE D'OR

L'utilisateur ne doit jamais avoir besoin de demander :

> « Qu'est-ce que DKIM ? »

Il doit simplement voir :

```text
Email security

✓ Everything is configured.
```

Et s'il y a un problème :

```text
Your email security needs attention.

[Fix automatically]
```

---

# 98. VISION FINALE

SouraMAIL commence par :

> **« Je veux une adresse email professionnelle. »**

Puis devient :

> **« Je veux gérer mes emails. »**

Puis :

> **« Je veux connecter mon application. »**

Puis :

> **« Je veux automatiser mes emails. »**

Puis :

> **« Je veux donner accès à mon agent IA. »**

Et finalement :

> **« SouraMAIL est l'infrastructure email de ma startup. »**

---

# 99. FORMULE FINALE DU PRODUIT

```text
SOURAMAIL

EMAIL
+
API
+
AI
+
MCP
+
AUTOMATIONS
+
DELIVERABILITY
+
SECURITY
```

avec une expérience utilisateur :

```text
1 compte
      ↓
1 domaine
      ↓
1 adresse
      ↓
quelques secondes
      ↓
Email opérationnel
```

---

# 100. PRIORITÉ ABSOLUE

Si l'équipe doit retenir **10 choses seulement**, ce sont celles-ci :

1. **Le gratuit est le moteur d'acquisition.**
2. **L'onboarding < 3 minutes est le cœur du produit.**
3. **Le premier email reçu est l'événement d'activation.**
4. **Le webmail doit être réellement agréable à utiliser.**
5. **L'AI Copilot doit être utile, pas décoratif.**
6. **AI Rules + MCP sont les gros différenciateurs développeurs.**
7. **SouraMAIL for Startups doit créer un canal d'acquisition massif.**
8. **Les limites Free doivent pousser naturellement vers Pro sans dark patterns.**
9. **L'anti-abus doit être construit avant de chercher des millions d'utilisateurs.**
10. **La complexité de l'infrastructure doit être invisible pour l'utilisateur.**

---

## Architecture finale du produit

```text
                         SOURAMAIL.COM
                              │
               ┌──────────────┴──────────────┐
               │                             │
             FREE                          PRO
               │                             │
               └──────────────┬──────────────┘
                              │
                       SOURAMAIL CORE
                              │
       ┌──────────┬───────────┼──────────┬───────────┐
       ▼          ▼           ▼          ▼           ▼
     EMAIL       API          AI       MCP      AUTOMATION
       │          │           │          │           │
       └──────────┴───────────┼──────────┴───────────┘
                              │
                       DEVELOPER USERS
                              │
                              ▼
                     SOURAMAIL FOR STARTUPS
                              │
                              ▼
                          TEAMS
                              │
                              ▼
                         BUSINESS
                              │
                              ▼
                  EMAIL INFRASTRUCTURE
```

**La thèse business de SouraMAIL est donc très simple :** faire entrer le développeur gratuitement avec **une vraie adresse email professionnelle**, lui faire découvrir progressivement l'**AI + API + MCP + automatisation**, puis monétiser l'augmentation de ses besoins plutôt que de monétiser artificiellement les fonctions de base. C'est cette combinaison **Free → Product-led Growth → Developer Infrastructure → Startup → Pro/Business** qui peut rendre le modèle beaucoup plus puissant qu'un simple fournisseur de boîtes mail.
