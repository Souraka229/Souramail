> **Cahier des charges SouraMAIL — Partie 1/3.** Document de référence produit + UX/UI, assez détaillé pour qu'un Lead Engineer, un designer ou une IA de coding travaille dessus sans deviner les intentions.
> Voir aussi : [`02-produit-saas-ecrans.md`](02-produit-saas-ecrans.md), [`03-growth-business-roadmap.md`](03-growth-business-roadmap.md), [`04-design-system.md`](04-design-system.md).

Le cahier des charges est découpé en **3 parties successives** :

1. **Partie 1 — Vision, stratégie produit, architecture UX, identité, landing page et système de design**
2. **Partie 2 — SaaS complet : onboarding, inbox, IA, domaines, API, MCP, automatisations, comptes, billing**
3. **Partie 3 — Architecture technique, infrastructure email, sécurité, anti-abus, IA, base de données, déploiement, tests, roadmap et critères de production**

Voici la **PARTIE 1**, volontairement très détaillée.

---

# CAHIER DES CHARGES COMPLET — SOURAMAIL

## PARTIE 1/3 — Vision, stratégie produit, UX/UI, marque et Landing Page

**Produit :** SouraMAIL
**Domaine :** `souramail.com`
**Catégorie :** Email Infrastructure / Developer Tool / AI SaaS
**Positionnement :** Email professionnel + infrastructure email + IA pour développeurs
**Version :** Product Specification v1.0 — Part 1
**Date :** Août 2026

---

# 1. VISION DU PRODUIT

## 1.1 Vision

SouraMAIL doit devenir une infrastructure email extrêmement simple destinée aux personnes qui construisent des produits numériques.

Aujourd'hui, lorsqu'un développeur lance une application, il doit souvent assembler plusieurs services :

```text
Domaine
   ↓
DNS
   ↓
MX
   ↓
SPF
   ↓
DKIM
   ↓
DMARC
   ↓
Serveur email
   ↓
Boîte mail
   ↓
SMTP
   ↓
API
   ↓
Webhooks
   ↓
Anti-spam
   ↓
Automatisations
```

SouraMAIL doit cacher cette complexité.

L'utilisateur doit avoir l'impression de faire seulement :

```text
1. Connecter mon domaine
2. Choisir mon adresse
3. C'est prêt
```

### Vision à long terme

SouraMAIL ne doit pas être simplement un fournisseur de boîtes mail.

Il doit devenir :

> **The communication infrastructure for AI-native applications.**

Avec :

```text
EMAIL
+
API
+
AI
+
AUTOMATIONS
+
MCP
+
SECURITY
+
DELIVERABILITY
```

---

# 2. POSITIONNEMENT

## 2.1 Positionnement principal

Le produit doit être présenté comme :

> **The easiest way for developers to get professional email infrastructure.**

Et non simplement :

> "A Gmail alternative."

Cette distinction est importante.

SouraMAIL doit être perçu comme une **infrastructure**, avec une interface extrêmement simple.

---

# 3. PROBLÈME À RÉSOUDRE

## 3.1 Problème utilisateur

Un développeur possède :

```text
myapp.com
```

Il veut :

```text
hello@myapp.com
```

Mais il doit généralement comprendre :

* DNS
* MX
* SPF
* DKIM
* DMARC
* SMTP
* IMAP
* délivrabilité
* réputation IP
* bounce
* spam
* API
* webhooks

Pour un développeur expérimenté, c'est faisable.

Pour un étudiant, freelance ou fondateur early-stage, cela représente une friction inutile.

---

# 4. SOLUTION SOURAMAIL

SouraMAIL doit transformer :

```text
Complexité technique
```

en :

```text
Expérience simple
```

Exemple :

### Avant

```text
Configure MX
Configure SPF
Generate DKIM
Add TXT record
Configure DMARC
Verify DNS
Create mailbox
Configure SMTP
Configure application
```

### Avec SouraMAIL

```text
Connect myapp.com

        ↓

SouraMAIL checks everything

        ↓

Fix what is missing

        ↓

Create hello@myapp.com

        ↓

Done.
```

---

# 5. USP — UNIQUE SELLING PROPOSITION

Les trois piliers marketing doivent être :

### 1. Simple

**Professional email in minutes.**

### 2. Free

**Start free. No credit card required.**

### 3. AI-native

**Your email infrastructure can work with AI.**

La combinaison est plus importante que chacun des éléments individuellement.

---

# 6. CIBLE

## 6.1 Persona primaire

### Developer

Profil :

* 16–35 ans
* développeur web
* étudiant
* freelance
* indie hacker
* développeur SaaS
* créateur de startup

Il utilise potentiellement :

* GitHub
* Vercel
* Netlify
* Cloudflare
* Supabase
* Firebase
* Next.js

Son besoin :

> "Je veux une vraie adresse email pour mon projet sans perdre une journée à configurer l'infrastructure."

---

# 7. PERSONA SECONDAIRE

## Startup early-stage

Exemple :

```text
Founder
   ↓
Landing page
   ↓
Domain
   ↓
Email
   ↓
Support
   ↓
Transactional email
   ↓
API
```

SouraMAIL doit accompagner la startup de :

```text
0 utilisateurs
```

jusqu'à :

```text
premiers clients
```

puis progressivement vers :

```text
équipe
```

---

# 8. SouraMAIL FOR STARTUPS

Créer une sous-offre :

# SouraMAIL for Startups

Objectif :

**transformer les utilisateurs gratuits à fort potentiel en futurs clients Pro/Business.**

Exemple :

```text
SouraMAIL Free
       ↓
Startup detected
       ↓
SouraMAIL for Startups
       ↓
Higher limits
       ↓
More AI
       ↓
More API usage
       ↓
Startup grows
       ↓
Paid plan
```

---

# 9. MODÈLE ÉCONOMIQUE DE BASE

Le modèle doit être **Freemium**.

## FREE

```text
$0
```

Objectif :

Acquisition.

L'utilisateur doit pouvoir réellement utiliser SouraMAIL.

Exemple :

* 1 domaine
* 3 adresses
* 1 Go par boîte
* webmail
* API
* réception
* envoi limité
* AI Copilot limité
* SPF
* DKIM
* DMARC

---

# 10. POURQUOI LE GRATUIT EST STRATÉGIQUE

Le gratuit n'est pas uniquement une offre.

C'est le **canal d'acquisition principal**.

Un développeur crée :

```text
hello@startup.com
```

Il utilise SouraMAIL.

Puis il montre cette adresse :

```text
Contact:
hello@startup.com
```

SouraMAIL bénéficie ainsi indirectement de visibilité.

---

# 11. GROWTH LOOP

Le produit doit intégrer une boucle :

```text
Developer
    ↓
Creates free email
    ↓
Uses SouraMAIL
    ↓
Shares project
    ↓
Other developers see it
    ↓
New signup
    ↓
New free email
    ↓
Loop
```

---

# 12. VIRAL LOOP

Créer un mécanisme optionnel :

```text
Powered by SouraMAIL
```

Il peut apparaître dans certaines fonctions gratuites :

* pages de formulaire
* pages de contact
* emails automatisés
* signatures

Mais **jamais de manière agressive** dans les emails professionnels classiques.

L'utilisateur doit pouvoir le supprimer en Pro.

---

# 13. REFERRAL PROGRAM

Ajouter plus tard :

### Invite a developer

Exemple :

```text
Invite friends

Your referral link

souramail.com/r/souraka

You get:

+500 emails
+50 AI actions

Your friend gets:

+500 emails
```

Ne pas récompenser en cash au début.

Les récompenses doivent être des **ressources du produit**.

---

# 14. EXPÉRIENCE PRODUIT

La règle absolue :

> **La complexité doit être dans l'infrastructure, jamais dans l'interface.**

L'utilisateur ne doit presque jamais voir :

* Postfix
* Dovecot
* Rspamd
* DKIM
* MX
* SMTP
* DNS records

sauf dans une section avancée.

---

# 15. ONBOARDING

L'onboarding est la fonctionnalité la plus importante du produit.

Objectif :

### Time To First Email < 3 minutes

Idéal :

### < 60 secondes pour un domaine correctement configuré.

---

# 16. PREMIER ÉCRAN

Après inscription :

```text
Welcome to SouraMAIL

Let's get your email running.

What's your domain?

[ myapp.com ]

or

Paste your Vercel / Netlify URL

[ Continue → ]
```

---

# 17. DÉTECTION AUTOMATIQUE

L'utilisateur peut fournir :

```text
myapp.com
```

ou :

```text
https://myapp.vercel.app
```

ou :

```text
https://myapp.netlify.app
```

SouraMAIL doit détecter automatiquement :

```text
Domain
Hosting provider
DNS provider
Existing email provider
```

---

# 18. CAS VERCEL / NETLIFY

Important :

`myapp.vercel.app`

n'est généralement **pas un domaine que l'utilisateur possède**.

SouraMAIL doit l'expliquer clairement.

Interface :

```text
We found a Vercel project.

myapp.vercel.app

This is your hosting address.

To create:

hello@myapp.com

you need a domain you control.

[ Connect a domain ]
```

---

# 19. IDENTITÉ GRATUITE SOURAMAIL

Option possible à terme :

Si l'utilisateur n'a pas de domaine :

```text
Choose your free SouraMAIL address

souraka@something.souramail.com
```

ou une structure de domaine contrôlée par SouraMAIL.

Mais cette fonctionnalité doit être séparée du principe :

> **Bring Your Own Domain.**

Elle doit servir d'acquisition, pas remplacer le produit principal.

---

# 20. EMAIL HEALTH

Après connexion :

```text
Checking your domain...

✓ Domain detected
✓ DNS detected
✓ MX
✓ SPF
✓ DKIM
✓ DMARC
```

Score :

```text
Email Health

94 / 100
```

---

# 21. LANGAGE HUMAIN

Ne jamais afficher uniquement :

```text
TXT record missing
```

Afficher :

```text
Your domain isn't fully protected yet.

We need to add one security record.

[ Show me how ]
```

Puis :

```text
Copy this value

[ Copy ]

Then click Verify.
```

---

# 22. CRÉATION D'ADRESSE

Après vérification :

```text
Create your first email

[ hello ] @ myapp.com
```

Suggestions :

```text
hello@
contact@
support@
admin@
billing@
```

IA :

> Based on your website, `hello@myapp.com` is the best starting address.

---

# 23. MOMENT "WOW"

Après création :

```text
You're ready.

hello@myapp.com

✓ Receiving
✓ Sending
✓ Protected
✓ AI enabled

[ Open inbox → ]
```

Animation très subtile.

Puis arrivée immédiate dans l'inbox.

---

# 24. DESIGN PHILOSOPHY

SouraMAIL doit avoir une identité :

### Premium

mais pas luxueuse.

### Technique

mais pas intimidante.

### AI-native

mais pas "AI cliché".

### Simple

mais pas vide.

---

# 25. RÉFÉRENCES DESIGN

Le système doit combiner les meilleures caractéristiques de :

### Linear

* précision
* navigation
* raccourcis
* densité contrôlée

### Superhuman

* vitesse
* email UX
* keyboard shortcuts

### Vercel

* simplicité
* developer-first
* documentation

### Stripe

* confiance
* clarté
* présentation produit

Mais SouraMAIL doit avoir sa propre identité.

---

# 26. LOGO

## Concept

Créer un symbole abstrait basé sur :

```text
S
+
Email flow
+
Data flow
```

Le logo ne doit pas être une enveloppe.

Il doit fonctionner :

```text
S
```

seul.

À :

```text
16 × 16 px
```

comme à :

```text
512 × 512 px
```

---

# 27. COULEUR PRINCIPALE

### Soura Teal

```text
#00A48A
```

Utilisation :

* CTA
* logo
* liens importants
* états actifs
* indicateurs de succès

Ne pas utiliser le teal partout.

---

# 28. PALETTE

```text
Primary
#00A48A

Primary Hover
#008F78

Background
#F0F2F5

Surface
#FFFFFF

Foreground
#111827

Muted
#6B7280

Border
#E5E7EB

Error
#EF4444

Warning
#F59E0B
```

---

# 29. TYPOGRAPHIE

Police :

**Inter Variable**

Alternative :

**Geist Sans**

Hiérarchie :

```text
H1
48–64px

H2
36–48px

H3
24–32px

Body
16–18px

Small
13–14px
```

La typographie doit rester compacte et professionnelle.

---

# 30. SHAPE LANGUAGE

Rayons :

```text
rounded-xl
rounded-2xl
```

Mais attention :

**Tout ne doit pas être arrondi.**

Les éléments importants peuvent avoir :

```text
12px
16px
```

Les inputs :

```text
10–12px
```

---

# 31. OMBRES

Très faibles.

Utiliser principalement :

```text
shadow-sm
```

et parfois :

```text
shadow
```

Jamais :

* grosses ombres
* glow
* néon

---

# 32. ICÔNES

Utiliser :

**Lucide Icons**

Style :

* outline
* fin
* cohérent

Ne pas mélanger plusieurs bibliothèques d'icônes.

---

# 33. LANDING PAGE

La landing page doit vendre **une chose** :

> **Obtenir son email professionnel sans complexité.**

Les fonctionnalités avancées viennent ensuite.

---

# 34. NAVBAR

Logo :

**SouraMAIL**

Navigation :

```text
Product
Developers
AI
Pricing
Startups
```

À droite :

```text
Log in
Get started free
```

CTA :

```text
#00A48A
```

---

# 35. HERO

Headline :

# Professional email infrastructure. Without the infrastructure headache.

Sous-titre :

> Connect your domain, create your professional email and start sending in minutes. SouraMAIL handles the technical complexity.

CTA :

```text
Start free
```

Secondaire :

```text
See how it works
```

---

# 36. HERO PRODUCT DEMO

Le hero doit contenir un vrai aperçu du produit.

Exemple :

```text
┌─────────────────────────────────────┐
│ Connect your domain                 │
│                                     │
│ myapp.com                            │
│                                     │
│             Continue →              │
└─────────────────────────────────────┘
```

Puis animation :

```text
✓ Domain detected
✓ DNS configured
✓ Email ready
```

Puis :

```text
hello@myapp.com
```

---

# 37. TRUST MESSAGE

Sous le hero :

```text
Free forever to get started.
No credit card required.
Built for developers.
```

---

# 38. PROBLEM SECTION

Titre :

# Email infrastructure shouldn't take an afternoon.

Visualisation :

### Traditional

```text
DNS
MX
SPF
DKIM
DMARC
SMTP
Security
Mailbox
API
```

### SouraMAIL

```text
Your domain
     ↓
SouraMAIL
     ↓
Ready
```

---

# 39. FEATURE SECTION

Titre :

# Everything your product needs to communicate.

6 blocs :

### Professional Email

`hello@yourdomain.com`

### Email API

Send emails directly from your application.

### AI Copilot

Write, summarize and reply.

### AI Rules

Automate email using natural language.

### MCP

Connect your mailbox to AI agents.

### Email Health

Monitor security and deliverability.

---

# 40. AI SECTION

Titre :

# Your inbox just became intelligent.

Montrer une véritable interface :

```text
Payment issue

AI Copilot

Intent:
Payment

Summary:
Customer says payment is still pending.

Suggested action:
Reply

[ Draft response ]
```

---

# 41. API SECTION

Titre :

# Email infrastructure developers actually enjoy using.

Afficher du code.

Exemple :

```typescript
await souramail.emails.send({
  from: "hello@myapp.com",
  to: "user@example.com",
  subject: "Welcome",
  html: "<h1>Welcome</h1>"
});
```

CTA :

```text
Read the docs →
```

---

# 42. MCP SECTION

Titre :

# Give your AI agent access to email.

Architecture :

```text
AI Agent
    ↓
SouraMAIL MCP
    ↓
Permissions
    ↓
Mailbox
```

Afficher :

```text
Read emails       ✓
Search emails     ✓
Draft emails      ✓
Send emails       ○
Delete emails     ○
```

---

# 43. STARTUP SECTION

Titre :

# Building a startup?

Sous-titre :

> Get more infrastructure while you're early.

Afficher :

```text
SouraMAIL for Startups

✓ Higher limits
✓ More AI
✓ API access
✓ MCP
✓ Automations
✓ Startup benefits
```

CTA :

**Apply for Startups**

---

# 44. FREE PLAN

Le gratuit doit être présenté comme une vraie offre.

```text
FREE

$0

1 domain
3 email addresses
1 GB mailbox
Webmail
API
AI Copilot
Anti-spam
SPF
DKIM
DMARC

[ Start free ]
```

---

# 45. PRICING

Prévoir :

### Free

$0

### Pro

≈ $9/mois au lancement

### Startup

Benefits personnalisés.

Le pricing final devra être ajusté selon :

* coût d'infrastructure
* coût IA
* volume email
* stockage
* délivrabilité

---

# 46. CTA FINAL

Titre :

# Your next project deserves a professional email.

Sous-titre :

> Connect your domain and get started for free.

CTA :

**Start free**

---

# 47. FOOTER

```text
SouraMAIL

Product
Inbox
API
AI
MCP
Automations

Developers
Docs
API Reference
SDK
Webhooks
Changelog

Company
About
Startups
Blog
Contact

Legal
Privacy
Terms
Security
```

---

# 48. PRINCIPES MARKETING

La communication SouraMAIL doit suivre l'ordre :

### 1.

**Simple**

> Get professional email in minutes.

### 2.

**Free**

> Start for free.

### 3.

**Powerful**

> API + AI + automation + MCP.

Ne pas commencer par MCP.

Un nouveau visiteur ne sait même pas forcément ce qu'est MCP.

---

# 49. ACQUISITION

Canaux prioritaires :

### Developer communities

* GitHub
* Reddit
* Discord
* X
* LinkedIn
* Product Hunt
* Hacker News

### Contenu

Créer des articles :

```text
How to get a professional email for your startup

How to configure email DNS

SPF vs DKIM vs DMARC

How to send email from Next.js

How to add email to a Vercel project

Email infrastructure for indie hackers
```

---

# 50. CONTENT LOOP

Chaque fonctionnalité doit produire du contenu.

Exemple :

```text
Feature
 ↓
Tutorial
 ↓
SEO
 ↓
Developer discovers SouraMAIL
 ↓
Free signup
 ↓
Uses product
```

---

# 51. IN-APP GROWTH

Le produit peut proposer discrètement :

```text
Enjoying SouraMAIL?

Share it with another developer.

[ Share ]
```

Après un événement positif :

* première adresse créée
* premier email envoyé
* première automatisation
* premier domaine vérifié

Jamais pendant une erreur.

---

# 52. UPGRADE STRATEGY

Ne jamais interrompre brutalement l'utilisateur.

Mauvais :

```text
PAY NOW
```

Bon :

```text
You're getting close to your free limit.

You've sent 82 / 100 emails today.

Upgrade when you need more.
```

CTA :

**View plans**

---

# 53. CONVERSION FREE → PRO

Le paywall doit apparaître lorsque l'utilisateur rencontre une vraie limite.

Exemples :

```text
Need more emails?
```

```text
Need more AI actions?
```

```text
Need another domain?
```

```text
Need advanced automations?
```

Le message doit toujours expliquer :

**quelle limite il rencontre + quelle valeur il obtient en passant Pro.**

---

# 54. MÉTRIQUES PRODUIT

Les KPI fondamentaux :

### Acquisition

* Visitors
* Signups
* Signup conversion

### Activation

* Domain connected
* Domain verified
* First email created
* First email received
* First email sent

### Engagement

* DAU
* WAU
* Emails received
* Emails sent
* AI actions
* API calls

### Revenue

* Free → Pro
* MRR
* ARR
* ARPU
* Churn

### Infrastructure

* Bounce rate
* Spam rate
* Delivery rate
* Abuse rate

---

# 55. NORTH STAR METRIC

La métrique principale devrait être :

> **Nombre d'utilisateurs ayant créé et utilisé activement au moins une adresse SouraMAIL.**

Pas simplement :

```text
registered users
```

Un compte sans email configuré ne vaut presque rien.

---

# 56. ACTIVATION

Définir un utilisateur activé comme :

```text
Account created
+
Domain verified
+
Email address created
+
First email received OR sent
```

Objectif :

**activation maximale dans les premières minutes.**

---

# 57. DESIGN DU PRODUIT AUTHENTIFIÉ

Le SaaS utilisera une navigation permanente :

```text
MAIL

Inbox
Starred
Drafts
Sent
Archive
Spam
Trash

AI

Copilot
AI Rules
Automations

DEVELOPER

API
Webhooks
MCP

INFRASTRUCTURE

Domains
Email Health

ACCOUNT

Usage
Startups
Settings
```

La partie détaillée de tous ces écrans sera développée dans la **PARTIE 2**.

---

# 58. PRINCIPES ABSOLUS POUR LE DESIGN

### Ne jamais faire :

```text
Gradient partout
```

```text
Glow
```

```text
3D
```

```text
AI brain
```

```text
Robot
```

```text
Chatbot géant
```

```text
20 cards dans un dashboard
```

### Faire :

```text
Whitespace
Typography
Hierarchy
Real UI
Fast interactions
Subtle animation
Clear actions
```

---

# 59. PRINCIPES ABSOLUS POUR LE PRODUIT

### Rule #1

**One obvious action per screen.**

### Rule #2

**Hide complexity.**

### Rule #3

**AI assists. It doesn't control the user.**

### Rule #4

**Security must be invisible but strong.**

### Rule #5

**Free must be genuinely useful.**

### Rule #6

**Upgrade because of value, not frustration.**

### Rule #7

**Every technical concept must have a human explanation.**

---

# 60. PHILOSOPHIE FINALE

SouraMAIL doit donner cette sensation :

L'utilisateur arrive avec :

```text
myapp.com
```

Il repart avec :

```text
hello@myapp.com
```

et découvre progressivement :

```text
Inbox
    ↓
AI
    ↓
API
    ↓
Rules
    ↓
Automations
    ↓
MCP
```

La puissance doit être **progressive**.

Un débutant doit pouvoir utiliser SouraMAIL sans comprendre l'infrastructure email.

Un développeur avancé doit pouvoir aller beaucoup plus loin lorsqu'il le souhaite.

---

# 61. RÉSUMÉ PRODUIT

SouraMAIL n'est donc pas :

> "Une autre boîte email."

SouraMAIL est :

> **Une infrastructure email complexe rendue extrêmement simple par une interface moderne et une couche d'IA.**

Le produit doit avoir deux niveaux :

```text
SURFACE
Simple
Beautiful
Fast
Human

UNDER THE HOOD
Email infrastructure
Security
Anti-abuse
DNS
API
AI
MCP
Automation
```

**La surface doit être simple. L'infrastructure peut être extrêmement sophistiquée.**

---

## PARTIE 1 — CRITÈRE DE RÉUSSITE

À la fin de cette première phase de conception, quelqu'un qui arrive sur `souramail.com` doit comprendre en **moins de 5 secondes** :

> **SouraMAIL me permet d'avoir un email professionnel pour mon projet, gratuitement, sans configuration compliquée.**

Et après inscription, il doit comprendre en **moins de 10 secondes** quoi faire.

L'objectif ultime :

> **Domain → SouraMAIL → Email → Done.**

---

**La PARTIE 2 sera beaucoup plus opérationnelle : elle décrira écran par écran tout le SaaS**, avec le layout exact de la sidebar, dashboard, Inbox, thread, composer, AI Copilot, AI Rules, Automations, Domains, Email Health, API, Webhooks, MCP, Usage, Startups, Settings, notifications, onboarding, états vides, erreurs, loading states, mobile, raccourcis clavier et toute la logique UX.
