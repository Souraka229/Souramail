> **Cahier des charges SouraMAIL — Partie 2/3.** Description de l'intérieur de SouraMAIL écran par écran : logique UX, interactions, IA, règles, MCP, automatisations, Free/Pro et mécanismes de conversion.
> Voir aussi : [`01-vision-et-strategie.md`](01-vision-et-strategie.md), [`03-growth-business-roadmap.md`](03-growth-business-roadmap.md), [`04-design-system.md`](04-design-system.md).

# CAHIER DES CHARGES COMPLET — SOURAMAIL

## PARTIE 2/3 — SaaS, UX/UI, IA, Email, Automations, MCP & Growth

**Produit :** SouraMAIL
**Domaine :** `souramail.com`
**Version :** MVP 2 / Production Early Access
**Document destiné à :** Lead Engineer, Product Designer, Frontend Engineer, Backend Engineer et IA de développement

---

# 1. OBJECTIF DE CETTE PARTIE

La partie 1 définissait :

* la vision ;
* le positionnement ;
* le design system ;
* la landing page ;
* l'acquisition ;
* le modèle Freemium ;
* les principes UX.

Cette partie définit maintenant **le produit lui-même**.

L'objectif est que l'équipe puisse prendre ce document et construire les interfaces sans avoir à inventer :

* la navigation ;
* les écrans ;
* les composants ;
* les états ;
* les interactions ;
* les fonctionnalités ;
* les règles d'IA ;
* les mécanismes d'upgrade ;
* les parcours utilisateurs.

---

# 2. STRUCTURE GLOBALE DE L'APPLICATION

Après connexion, l'application possède une structure permanente.

```text
┌─────────────────────────────────────────────────────────────┐
│                     SOURAMAIL APP                           │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   SIDEBAR    │                  MAIN CONTENT                │
│              │                                              │
│  Mail        │                                              │
│  AI          │                                              │
│  Developer   │                                              │
│  Infra       │                                              │
│  Account     │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

---

# 3. SIDEBAR

La sidebar doit être fine et très lisible.

Largeur :

```text
240–260px
```

Structure :

```text
SouraMAIL
────────────────

MAIL

Inbox                 12
Starred
Drafts                 2
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

En bas :

```text
┌───────────────────────┐
│ S  Souraka             │
│   Free plan            │
└───────────────────────┘
```

Cliquer dessus ouvre :

```text
Profile
Account
Billing
Sign out
```

---

# 4. TOP BAR

Le top bar doit rester extrêmement minimal.

À gauche :

```text
☰ / breadcrumb
```

Au centre ou selon l'écran :

```text
Search
```

À droite :

```text
Help
Notifications
Avatar
```

La recherche doit être accessible avec :

```text
⌘ K
```

ou :

```text
Ctrl K
```

---

# 5. COMMAND PALETTE

Une Command Palette doit être disponible globalement.

Raccourci :

```text
⌘ K
```

Exemple :

```text
Search SouraMAIL

> Search emails
> Compose email
> Open domains
> Check email health
> Create automation
> Ask AI
> Open API
> Settings
```

Elle devient un élément majeur de l'expérience développeur.

---

# 6. DASHBOARD

Route :

```text
/dashboard
```

Le dashboard ne doit pas devenir un dashboard rempli de graphiques inutiles.

Il doit répondre à quatre questions :

1. Est-ce que mon email fonctionne ?
2. Ai-je des messages importants ?
3. Y a-t-il un problème ?
4. Que puis-je faire maintenant ?

---

# 7. DASHBOARD — HEADER

```text
Good evening, Souraka.

Here's what's happening with your email.
```

Puis :

```text
[ + Compose ]
```

---

# 8. EMAIL HEALTH CARD

Grande carte principale :

```text
Email Health

94 / 100

Excellent

✓ Domain connected
✓ Email authentication
✓ Receiving emails
✓ Sending enabled

[ View details ]
```

La couleur principale reste le teal.

---

# 9. INBOX CARD

```text
Inbox

12 unread

3 important
9 other

[ Open inbox → ]
```

Afficher les derniers emails importants.

---

# 10. DELIVERABILITY CARD

```text
Deliverability

98.4%

Excellent

Sent       1,240
Delivered  1,221
Bounced       12
Spam           2
```

Ne pas afficher trop de données.

Un bouton :

```text
View analytics
```

---

# 11. AI RECOMMENDATIONS

Carte :

```text
AI recommendations

3 things you may want to do

○ Add DMARC protection
○ Create a support rule
○ You have 4 unanswered emails

[ Review ]
```

L'IA doit être proactive mais **pas envahissante**.

---

# 12. API STATUS

```text
API

Connected

Last request
2 minutes ago

Errors
0

[ View API ]
```

---

# 13. QUICK ACTIONS

```text
Quick actions

[ Compose ]
[ Create address ]
[ Connect domain ]
[ Create AI Rule ]
```

---

# 14. INBOX

Route :

```text
/inbox
```

C'est le cœur de l'application.

L'expérience doit être extrêmement rapide.

---

# 15. STRUCTURE INBOX

```text
┌────────────┬───────────────────────────────┐
│            │ Search emails                 │
│ Folders    ├───────────────────────────────┤
│            │                               │
│ Inbox      │ Email list                    │
│ Starred    │                               │
│ Drafts     │                               │
│ Sent       │                               │
│ Spam       │                               │
│ Trash      │                               │
│            │                               │
└────────────┴───────────────────────────────┘
```

---

# 16. EMAIL LIST

Chaque ligne :

```text
●  Stripe              Payment failed
   Your payment could not be processed
   10:32
```

Éléments :

* avatar ;
* sender ;
* subject ;
* preview ;
* timestamp ;
* unread indicator ;
* star ;
* labels.

---

# 17. EMAIL UNREAD

Un email non lu doit être visuellement différent.

Exemple :

```text
● Stripe       Payment failed
```

Ligne légèrement plus contrastée.

Pas besoin de gros badges.

---

# 18. EMAIL THREAD

Cliquer ouvre :

```text
Payment failed

Stripe
Aug 30, 10:32

Hello...

────────────────────────

AI

This email appears to be about:
Payment failure

Suggested action:
Reply
```

---

# 19. AI PANEL

L'IA ne doit pas ouvrir systématiquement une énorme fenêtre.

Elle doit être **contextuelle**.

Dans un email :

```text
AI

Summarize
Draft reply
Translate
Extract information
Classify
Create rule
```

---

# 20. RÉSUMÉ IA

Cliquer :

```text
Summary

The customer reports that their payment
failed and asks whether they should retry.

Intent
Payment issue

Priority
Medium

Suggested action
Reply
```

---

# 21. RÉPONSE IA

Bouton :

```text
Draft reply
```

L'IA génère :

```text
Hi John,

Thanks for reaching out. We've checked your
payment and it appears that...

Best,
SouraMAIL
```

Actions :

```text
Insert
Regenerate
Change tone
Edit
```

**L'IA ne doit jamais envoyer automatiquement un message dans le MVP sans permission explicite.**

---

# 22. COMPOSER

Le composer doit être l'une des meilleures interfaces de SouraMAIL.

```text
New message

From:
hello@myapp.com

To:
john@example.com

Subject:

────────────────────────

Write your message...

────────────────────────

[ AI ]              [ Send ]
```

---

# 23. AI COMPOSER

Bouton :

```text
✨ AI
```

Menu :

```text
Write for me
Improve
Make shorter
Make professional
Make friendly
Translate
Summarize
```

---

# 24. NATURAL LANGUAGE COMPOSER

Possibilité d'écrire :

> "Réponds-lui que le problème est résolu et qu'il peut réessayer."

L'IA génère le contenu.

---

# 25. SMART AUTOCOMPLETE

Pendant l'écriture :

```text
Thanks for reaching out...
```

L'IA peut proposer :

```text
I'll look into this and get back to you shortly.
```

L'utilisateur accepte avec :

```text
Tab
```

Cette fonctionnalité doit être légère.

---

# 26. GESTION DES ADRESSES

Route :

```text
/settings/addresses
```

Afficher :

```text
Email addresses

hello@myapp.com       Active
support@myapp.com     Active
billing@myapp.com     Active

[ + Create address ]
```

---

# 27. CRÉER UNE ADRESSE

```text
Create email address

[ support ] @ myapp.com

Suggestions

support@
hello@
contact@
billing@
admin@

[ Create ]
```

---

# 28. ALIAS

Exemple :

```text
sales@myapp.com
      ↓
hello@myapp.com
```

L'utilisateur peut recevoir plusieurs adresses dans la même boîte.

---

# 29. DOMAIN MANAGEMENT

Route :

```text
/domains
```

Carte :

```text
myapp.com

Connected
Email Health 94/100

MX        ✓
SPF       ✓
DKIM      ✓
DMARC     ✓

[ Manage ]
```

---

# 30. AJOUT DE DOMAINE

```text
Add domain

Enter your domain

[ myapp.com ]

[ Continue ]
```

Puis analyse.

---

# 31. DOMAIN SCANNER

Afficher progressivement :

```text
Checking your domain...

DNS                    ✓
MX                     ✓
SPF                    ✓
DKIM                   ✓
DMARC                  ✓
Existing mail provider ✓
```

L'animation doit donner l'impression que SouraMAIL **travaille réellement**.

---

# 32. PROBLÈME DNS

Si quelque chose manque :

```text
Almost there.

Your domain is missing one security setting.

We'll help you fix it.

[ Fix it ]
```

Puis :

```text
Add this DNS record

Type
TXT

Name
_dmarc

Value
...

[ Copy ]

I've added it

[ Verify ]
```

---

# 33. EMAIL HEALTH

Route :

```text
/domains/myapp.com/health
```

Score :

```text
94 / 100
```

Sections :

```text
Authentication
Deliverability
Security
DNS
Reputation
```

---

# 34. EXPLICATION HUMAINE

Au lieu de :

```text
DKIM selector missing
```

afficher :

> Your emails aren't fully authenticated yet. Adding this record helps receiving servers verify that your emails really come from you.

Puis :

```text
[ Fix automatically ]
```

si le provider DNS le permet.

---

# 35. AUTOMATISATION DU DNS

SouraMAIL doit progressivement supporter :

* Cloudflare ;
* Vercel DNS ;
* Namecheap ;
* GoDaddy ;
* Porkbun ;
* OVH ;
* autres providers.

Objectif ultime :

```text
Connect Cloudflare
       ↓
SouraMAIL detects domain
       ↓
SouraMAIL creates records
       ↓
Done
```

Cela doit devenir un avantage majeur.

---

# 36. AI RULES

Route :

```text
/ai/rules
```

Titre :

# Teach your inbox what to do.

Sous-titre :

> Describe what you want in plain English.

---

# 37. CRÉER UNE AI RULE

Input :

```text
When I receive an email from a customer,
summarize it and notify me if it needs a reply.
```

Bouton :

```text
Create rule
```

L'IA transforme cela en workflow.

---

# 38. VISUALISATION DE LA RÈGLE

```text
WHEN

Email received

↓

IF

Sender is a customer

↓

THEN

Summarize email

↓

IF

Reply required

↓

THEN

Notify me
```

---

# 39. ACTIONS DISPONIBLES

Les actions peuvent inclure :

```text
Mark as read
Mark as important
Add label
Archive
Forward
Create draft
Notify
Webhook
Call API
Run AI
```

Dans les versions futures :

```text
Send email
Create CRM task
Create calendar event
Update database
```

---

# 40. SÉCURITÉ DES AI RULES

Une règle ne doit pas pouvoir faire n'importe quoi.

Niveaux :

### Safe

```text
Read
Classify
Summarize
Label
```

### Sensitive

```text
Forward
Create draft
Webhook
```

### Dangerous

```text
Send
Delete
```

Pour les actions sensibles :

```text
Requires approval
```

---

# 41. AUTOMATIONS

Route :

```text
/automations
```

Vue :

```text
Automations

Active       5
Paused       2

[ + New automation ]
```

---

# 42. AUTOMATION BUILDER

Interface visuelle :

```text
Trigger

[ Email received ]

       ↓

Condition

[ Sender contains @customer.com ]

       ↓

Action

[ Create AI summary ]

       ↓

Action

[ Create draft ]
```

---

# 43. MODE SIMPLE

L'utilisateur ne doit pas être obligé d'utiliser le builder.

Champ :

```text
Describe what you want...

"Whenever I get an invoice, save the
amount and notify me."
```

L'IA crée le workflow.

---

# 44. MODE ADVANCED

Les développeurs peuvent voir :

```text
JSON
Webhook
HTTP
Conditions
Variables
Expressions
```

Mais ces options doivent rester cachées par défaut.

---

# 45. WEBHOOKS

Route :

```text
/developer/webhooks
```

Événements :

```text
email.received
email.sent
email.delivered
email.bounced
email.spam
domain.verified
automation.completed
```

---

# 46. API

Route :

```text
/developer/api
```

Dashboard :

```text
API

Status
Operational

Requests today
1,248

Errors
3

API keys
2
```

---

# 47. API KEY

Créer :

```text
Create API key

Name:
Production

Permissions:

✓ Send email
✓ Read emails
□ Manage domains
□ Delete emails
```

Principe :

**least privilege.**

---

# 48. MCP

Route :

```text
/developer/mcp
```

Page très simple.

Titre :

# Connect SouraMAIL to your AI.

Sous-titre :

> Give your AI agent secure access to your email.

---

# 49. MCP CONNECTION

Afficher :

```text
MCP Server

SouraMAIL

Status
Ready

[ Connect ]
```

Puis les permissions :

```text
Agent permissions

Read emails             ✓
Search emails           ✓
Draft emails            ✓
Create rules            ✓

Send emails             ○
Delete emails           ○
Manage domains          ○
```

---

# 50. MCP TOOLS

Version initiale :

```text
search_emails
read_email
get_thread
draft_email
reply_to_email
send_email
forward_email
create_rule
list_rules
check_domain
get_email_health
get_delivery_status
```

---

# 51. PERMISSIONS MCP

Chaque tool doit posséder un niveau de permission.

```text
READ
```

Exemple :

```text
search_emails
read_email
get_health
```

Puis :

```text
WRITE
```

Exemple :

```text
draft_email
create_rule
```

Puis :

```text
SENSITIVE
```

Exemple :

```text
send_email
delete_email
```

---

# 52. CONFIRMATION MCP

Si un agent demande :

```text
send_email
```

SouraMAIL peut afficher :

```text
Your AI wants to send this email:

To:
john@example.com

Subject:
Payment confirmation

[ Allow once ]
[ Always allow ]
[ Deny ]
```

Cela donne énormément de confiance.

---

# 53. AI AGENT ACTIVITY

Créer une page :

```text
Agent activity
```

Exemple :

```text
10:32
Cursor searched 4 emails

10:34
AI created a draft

10:35
You approved an email

10:35
Email sent
```

Tout doit être auditable.

---

# 54. NOTIFICATIONS

Centre de notifications :

```text
Notifications

AI found 3 emails requiring attention.

Your domain health dropped to 87.

You reached 80% of your daily sending limit.

Automation completed successfully.
```

---

# 55. USAGE

Route :

```text
/usage
```

Exemple :

```text
Your usage

Emails

82 / 100

AI

14 / 20

Storage

340 MB / 1 GB

API

1,248 requests
```

---

# 56. FREE PLAN UX

L'utilisateur Free doit constamment savoir où il en est.

Mais il ne faut **jamais** lui donner l'impression que le produit est inutilisable sans paiement.

---

# 57. QUOTAS

Exemple :

```text
82 / 100 emails today
```

À 80 % :

```text
You're getting close to today's limit.

You still have 18 emails available.
```

À 100 % :

```text
You've reached today's free sending limit.

Your inbox still works normally.

Upgrade if you need more sending capacity.
```

---

# 58. PAYWALL

Le paywall doit être contextuel.

Exemple :

Utilisateur essaie d'ajouter un deuxième domaine :

```text
Your Free plan includes 1 domain.

Pro includes multiple domains,
advanced AI and higher sending limits.

[ View Pro ]
```

Pas de popup agressive.

---

# 59. PRICING IN-APP

La page doit être accessible depuis :

```text
Usage
```

et :

```text
Settings → Billing
```

Comparaison :

```text
             FREE          PRO

Domains      1             More
Addresses    3             More
Storage      1 GB          More
Emails       100/day       Higher
AI           Limited       Advanced
API          ✓             ✓
MCP          Limited       ✓
Automations  Limited       ✓
```

---

# 60. SouraMAIL FOR STARTUPS

Route :

```text
/startups
```

Titre :

# Build your startup. We'll handle the email.

Le programme doit servir d'accélérateur d'adoption.

---

# 61. STARTUP APPLICATION

Formulaire minimal :

```text
Company
Website
Founder
Email
Stage
Team size
What are you building?
```

L'IA peut analyser automatiquement le site.

---

# 62. STARTUP BENEFITS

Exemple :

```text
SouraMAIL for Startups

3 months Pro free

Higher sending limits
Advanced AI
MCP
Automations
Priority support
Startup badge
```

Le bénéfice doit être suffisamment intéressant pour créer un sentiment :

> "Ils veulent vraiment aider les startups."

---

# 63. STARTUP GROWTH LOOP

Le programme doit créer :

```text
Startup
 ↓
Uses SouraMAIL
 ↓
Adds team
 ↓
Sends more emails
 ↓
Needs more infrastructure
 ↓
Upgrades
```

---

# 64. TEAM FUTURE

Même si le Team n'est pas MVP, la base de données doit être conçue pour le permettre.

Structure :

```text
User
 ↓
Workspace
 ↓
Members
 ↓
Domains
 ↓
Mailboxes
```

Cela évitera de devoir reconstruire toute l'architecture plus tard.

---

# 65. SETTINGS

Route :

```text
/settings
```

Navigation :

```text
Profile
Account
Security
Email
Addresses
Domains
Notifications
AI
API
Billing
```

---

# 66. SECURITY SETTINGS

Afficher :

```text
Security

Password
Two-factor authentication
Sessions
Connected devices
API keys
MCP connections
```

---

# 67. AUDIT LOG

Important.

Exemple :

```text
Audit log

Today

Souraka created an API key

Souraka approved an MCP send action

Automation "Invoices" created a draft

Domain DNS configuration changed
```

---

# 68. SEARCH

La recherche doit être extrêmement puissante.

Recherche simple :

```text
payment
```

Recherche avancée :

```text
from:stripe
after:2026-08-01
has:attachment
label:billing
```

Plus tard :

```text
AI search
```

Exemple :

> "Find emails where customers complained about payment issues this month."

---

# 69. AI SEARCH

Pipeline :

```text
User query
 ↓
Intent understanding
 ↓
Search filters
 ↓
Email retrieval
 ↓
Ranking
 ↓
AI synthesis
```

L'IA ne doit pas avoir besoin de lire toute la boîte.

Elle doit récupérer uniquement les données nécessaires.

---

# 70. PRIVACY

Principe :

> **The AI should only access what it needs.**

Chaque requête IA doit avoir un scope.

Exemple :

```text
Current email
Current thread
Selected emails
Mailbox
```

L'utilisateur doit comprendre ce que l'IA analyse.

---

# 71. AI DATA CONTROL

Dans Settings :

```text
AI & Privacy

AI can access your mailbox

[ Enabled ]

Use email content for model improvement

[ Disabled ]

Store AI conversation history

[ Enabled ]
```

Par défaut, ne pas utiliser les données privées des utilisateurs pour entraîner les modèles.

---

# 72. EMAIL TEMPLATES

Même si ce n'est pas prioritaire, prévoir :

```text
Templates

Welcome
Support reply
Payment confirmation
Invoice
Password reset
```

L'IA peut générer un template :

> "Create a professional welcome email for a SaaS."

---

# 73. CONTACTS

Prévoir un carnet d'adresses.

```text
Contacts

John Doe
john@example.com

Sarah
sarah@startup.com
```

L'IA peut détecter automatiquement les contacts fréquemment utilisés.

---

# 74. ATTACHMENTS

Les pièces jointes doivent être stockées dans un stockage objet.

Exemple futur :

```text
S3 / Cloudflare R2
```

Ne jamais stocker de gros fichiers directement en PostgreSQL.

---

# 75. SPAM

La boîte Spam doit être claire.

```text
Spam

We blocked 14 suspicious messages.
```

Chaque message doit permettre :

```text
Not spam
Report spam
Delete
```

---

# 76. IMPORTANT : ANTI-ABUS

Le Free ne doit pas devenir une plateforme permettant aux spammeurs de créer :

```text
1000 accounts
+
1000 mailboxes
+
mass sending
```

Il faut donc combiner :

```text
Account reputation
+
Sending limits
+
Domain reputation
+
IP reputation
+
Behavior analysis
```

---

# 77. RISK SCORE

Chaque compte possède en interne :

```text
Risk score

0–20
Low risk

21–50
Medium

51–80
High

81–100
Critical
```

Ce score n'est pas nécessairement visible à l'utilisateur.

---

# 78. LIMITES DYNAMIQUES

Un compte nouveau :

```text
100 emails/day
```

Un compte fiable après plusieurs semaines :

```text
Higher limit
```

Un compte suspect :

```text
Reduced limit
```

Cela permet de garder le Free ouvert tout en protégeant la plateforme.

---

# 79. EMAIL DELIVERY

Chaque email sortant doit posséder un statut :

```text
Queued
Sending
Sent
Delivered
Bounced
Failed
Spam
```

Dans l'interface :

```text
Delivery

✓ Delivered
```

ou :

```text
⚠ Bounced

Recipient server rejected the message.
```

---

# 80. ERREURS

Les erreurs doivent être humaines.

Mauvais :

```text
SMTP 550 5.7.1
```

Bon :

> The recipient's email server rejected this message.

Puis :

```text
View technical details
```

Les détails techniques restent disponibles pour les développeurs.

---

# 81. EMPTY STATES

Les empty states sont importants.

### Inbox vide

```text
Your inbox is empty.

When someone emails you,
you'll see it here.

[ Copy your email address ]
```

### Automations vide

```text
No automations yet.

Tell SouraMAIL what you'd like
to automate.

[ Create with AI ]
```

### API vide

```text
Your application isn't connected yet.

Create your first API key.

[ Create API key ]
```

---

# 82. LOADING STATES

Éviter les loaders génériques.

Utiliser des skeletons.

Pour l'IA :

```text
AI is thinking...
```

avec animation discrète.

---

# 83. MOBILE

Le produit est desktop-first.

Mais il doit rester utilisable sur mobile.

Sur petit écran :

```text
Sidebar
↓
Bottom navigation / drawer
```

Priorité :

```text
Inbox
Compose
AI
```

---

# 84. KEYBOARD SHORTCUTS

SouraMAIL doit avoir une expérience rapide.

Quelques raccourcis :

```text
C       Compose
R       Reply
A       Reply all
F       Forward
E       Archive
S       Star
U       Mark unread
J       Next email
K       Previous email
/       Search
⌘ K     Command palette
Esc     Close
```

Une page :

```text
Keyboard shortcuts
```

dans Settings.

---

# 85. ONBOARDING APRÈS INSCRIPTION

Le flow complet :

```text
Sign up
   ↓
Welcome
   ↓
Enter domain
   ↓
Domain analysis
   ↓
DNS configuration
   ↓
Email verification
   ↓
Create address
   ↓
Inbox
```

Mais l'onboarding doit être **adaptatif**.

---

# 86. ONBOARDING ADAPTATIF

Si l'utilisateur saisit :

```text
https://myapp.vercel.app
```

SouraMAIL répond :

```text
Looks like you're using Vercel.

Do you already own a domain?

[ Yes, connect it ]
[ No, help me get one ]
```

---

# 87. ONBOARDING POUR UTILISATEUR EXPÉRIMENTÉ

Détecter les connaissances.

Après plusieurs étapes, proposer :

```text
Want to use advanced DNS configuration?

[ Keep it simple ]
[ Show advanced options ]
```

Par défaut :

**Keep it simple.**

---

# 88. ONBOARDING PROGRESS

Ne pas afficher :

```text
Step 1 of 12
```

Cela donne une sensation de lourdeur.

Préférer :

```text
Almost there...
```

et une progression visuelle discrète.

---

# 89. FIRST VALUE MOMENT

Le premier objectif n'est pas :

```text
Complete onboarding
```

Le premier objectif est :

> **Recevoir ou envoyer son premier email.**

Donc après configuration :

```text
Send yourself a test email

From:
hello@myapp.com

To:
your personal email

[ Send test ]
```

---

# 90. ACTIVATION

Un utilisateur est considéré activé lorsqu'il a :

```text
✓ verified domain
✓ created address
✓ sent or received email
```

Le système doit mesurer le temps entre :

```text
signup
```

et :

```text
first email
```

---

# 91. GROWTH ENGINE IN-APP

SouraMAIL doit intégrer une couche Growth discrète.

Événements :

```text
domain_connected
email_created
first_email_sent
first_email_received
api_connected
ai_used
automation_created
mcp_connected
```

Ces événements servent à comprendre où les utilisateurs bloquent.

---

# 92. MOMENTS DE RECOMMANDATION

Après :

```text
first_email_sent
```

Afficher :

> Your email is live.

Puis éventuellement :

```text
Want to connect it to your app?

[ Explore API ]
```

---

# 93. CROSS-SELL INTELLIGENT

Si l'utilisateur utilise beaucoup l'API :

```text
You're building something with SouraMAIL.

Need higher API limits?

[ Explore Pro ]
```

Si l'utilisateur utilise beaucoup l'IA :

```text
You've used 18/20 AI actions.

Pro gives you significantly more AI usage.
```

---

# 94. PAS DE DARK PATTERNS

Interdictions :

* fausses urgences ;
* bouton "Cancel" caché ;
* abonnement pré-coché ;
* popup répétée ;
* countdown artificiel ;
* limitation trompeuse ;
* publicité dans les emails.

La conversion doit venir de la **valeur réelle**.

---

# 95. FREE BRANDING

Une petite signature peut être utilisée dans certains contextes non critiques :

```text
Powered by SouraMAIL
```

Exemple :

```text
Email verification

Verify your email

[ Verify ]

Powered by SouraMAIL
```

Mais pas dans les communications personnelles/professionnelles envoyées depuis la boîte sans consentement.

---

# 96. REFERRAL

Dans le dashboard :

```text
Invite developers

Give them more free usage.

Get rewarded too.

[ Invite ]
```

Le referral doit rester secondaire.

---

# 97. SYSTÈME DE BADGES

Plus tard :

```text
Early adopter
Startup
Developer
SouraMAIL Pioneer
```

Cela peut créer une communauté autour du produit.

---

# 98. DEVELOPER EXPERIENCE

Le développeur doit pouvoir passer :

```text
Dashboard
```

à :

```text
API
```

en quelques secondes.

Les docs doivent être intégrées.

Exemple :

```text
API
│
├── Quickstart
├── Send email
├── Receive email
├── Domains
├── Webhooks
├── Authentication
└── Errors
```

---

# 99. QUICKSTART API

La documentation doit fonctionner comme :

```text
1. Install
2. Add API key
3. Send email
```

Exemple :

```bash
npm install @souramail/sdk
```

Puis :

```typescript
const email = await souramail.emails.send(...)
```

---

# 100. ARCHITECTURE UX FINALE

Le produit doit être compris en trois couches.

## Niveau 1 — Simple

```text
Inbox
Compose
Domains
Settings
```

## Niveau 2 — Intelligent

```text
AI
AI Rules
Automations
```

## Niveau 3 — Developer

```text
API
Webhooks
MCP
Logs
Advanced DNS
```

Cela permet à un étudiant de ne jamais être perdu tout en donnant énormément de puissance à un développeur avancé.

---

# 101. ARCHITECTURE PRODUIT

Vue globale :

```text
                         SOURAMAIL
                              │
              ┌───────────────┼───────────────┐
              │               │               │
            EMAIL             AI          DEVELOPER
              │               │               │
        ┌─────┼─────┐     ┌───┼────┐      ┌──┼─────┐
        │     │     │     │   │    │      │  │     │
      Inbox Send  Domain Copilot Rules   API Webhook MCP
        │     │     │     │   │    │      │  │     │
        └─────┴─────┴─────┴───┴────┴──────┴──┴─────┘
                              │
                         Automations
                              │
                         AI Gateway
```

---

# 102. RÈGLE PRODUIT LA PLUS IMPORTANTE

Tout ce qui peut être automatisé doit l'être.

Tout ce qui peut être expliqué simplement doit l'être.

Tout ce qui est dangereux doit demander une permission.

Tout ce qui est complexe doit être caché par défaut.

---

# 103. EXPÉRIENCE IDÉALE

Un développeur arrive.

Il voit :

```text
SouraMAIL

Professional email
without the headache.

[ Start free ]
```

Il crée son compte.

Il colle :

```text
myapp.com
```

SouraMAIL analyse.

Il clique :

```text
Connect
```

L'adresse apparaît :

```text
hello@myapp.com
```

Il ouvre son inbox.

Il reçoit son premier message.

Puis il découvre :

```text
"Wait... I can connect this to my application?"
```

Puis :

```text
API
```

Puis :

```text
AI
```

Puis :

```text
Rules
```

Puis :

```text
MCP
```

C'est cette **progression de découverte** qui doit constituer le cœur de l'expérience.

---

# 104. CRITÈRES DE RÉUSSITE UX

Le produit doit viser :

| Action               |             Objectif |
| -------------------- | -------------------: |
| Créer un compte      |             < 30 sec |
| Connecter un domaine | < 60 sec si DNS prêt |
| Créer une adresse    |             < 10 sec |
| Ouvrir inbox         |           instantané |
| Composer             |              < 2 sec |
| Utiliser AI          |              < 5 sec |
| Créer une règle      |             < 30 sec |
| Créer API key        |             < 20 sec |
| Comprendre usage     |             < 10 sec |

---

# 105. PRINCIPES POUR L'IA

L'IA ne doit jamais être un simple chatbot placé dans un coin de l'application.

Elle doit être **intégrée dans les workflows**.

Mauvais :

```text
[ Chat with AI ]
```

Bon :

```text
Email
 ↓
AI understands
 ↓
AI suggests
 ↓
User approves
 ↓
Action
```

---

# 106. AI-FIRST MAIS HUMAN-CONTROLLED

Le principe :

> **AI suggests. Humans decide.**

Pour les actions normales :

```text
AI → Suggestion → User
```

Pour les actions sensibles :

```text
AI → Suggestion → Approval → Action
```

---

# 107. FUTURE AGENT MODE

Plus tard :

```text
SouraMAIL Agent

Monitor my inbox.

Every morning:
- summarize important emails
- identify unanswered messages
- prepare drafts
- notify me about urgent issues
```

L'agent pourra fonctionner via :

```text
AI Rules
+
MCP
+
Automations
```

C'est potentiellement l'un des plus gros différenciateurs du produit.

---

# 108. RÉSUMÉ DE LA PARTIE 2

Le SaaS doit donc être organisé autour de quatre expériences :

```text
MAIL
→ Receive / send / manage

AI
→ Understand / write / summarize

AUTOMATION
→ Let SouraMAIL work for you

DEVELOPER
→ API / Webhooks / MCP
```

Le tout repose sur :

```text
Simplicity
+
Speed
+
Trust
+
AI
```

---

# PARTIE 3 & 5 — CE QUI SUIT

La **partie 3** ([`03-growth-business-roadmap.md`](03-growth-business-roadmap.md)) couvre
growth, monétisation, acquisition et roadmap business. La **partie 5**
([`05-roadmap-developpement.md`](05-roadmap-developpement.md)) est la partie technique :
spec d'infrastructure + plan de build A→Z.

La partie 5 couvre notamment :

* architecture globale backend ;
* architecture des serveurs email ;
* choix du serveur mail : **Stalwart** retenu (all-in-one Rust : SMTP/IMAP/JMAP), alternatives étudiées (Maddy, Postfix+Dovecot) ;
* SMTP entrant et sortant ;
* IMAP ;
* stockage des emails ;
* DNS ;
* MX ;
* SPF ;
* DKIM ;
* DMARC ;
* ARC ;
* MTA-STS ;
* TLS-RPT ;
* anti-spam avec Rspamd ;
* antivirus ;
* réputation IP ;
* bounce processing ;
* queue management ;
* rate limiting ;
* anti-abus ;
* architecture multi-tenant ;
* PostgreSQL ;
* Redis ;
* stockage S3/R2 ;
* AI Gateway ;
* modèles open-weight ;
* self-hosting ;
* MCP sécurisé ;
* API ;
* webhooks ;
* secrets ;
* chiffrement ;
* sauvegardes ;
* monitoring ;
* observabilité ;
* CI/CD ;
* Docker ;
* VPS/cloud ;
* architecture de production ;
* coûts estimatifs ;
* quotas Free/Pro ;
* stratégie de montée en charge ;
* structure exacte du monorepo ;
* schéma de base de données ;
* endpoints ;
* jobs workers ;
* queues ;
* tests ;
* sécurité ;
* roadmap de développement.

**Point d'architecture verrouillé :** SouraMAIL **ne dépend d'aucun fournisseur d'envoi
propriétaire unique**. L'envoi passe par une interface abstraite `EmailProvider` : on démarre
sur un **relais SMTP managé** (ex. Amazon SES + IP dédiée) le temps de construire, puis on
**internalise progressivement** l'infrastructure (KumoMTA + pools IP) sans réécrire
l'application. Le socle repose sur des briques open source éprouvées — **Stalwart, Rspamd,
ClamAV, PostgreSQL, Redis, stockage objet, Cloudflare** — pas sur la reconstruction d'un
serveur email à partir de zéro. Détail complet en partie 5.

> La vraie innovation de SouraMAIL n'est pas le serveur mail : c'est la **couche
> d'intelligence et d'expérience** posée au-dessus d'une infrastructure email professionnelle
> (détection & auto-configuration du domaine, Copilot, Rules, Automations, MCP).
