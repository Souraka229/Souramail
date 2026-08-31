# SouraMAIL — Design System (Partie 4)

> Système de design consolidé à partir de l'export Stitch **« Kinetic Infrastructure »**
> (`design/tokens/kinetic-infrastructure.md`) et des principes visuels des parties 1 à 3.
> Maquettes de référence : `design/mockups/` — captures : `design/screenshots/`.

---

## 1. Direction artistique

**Mouvement : « Technical Precision ».** Clarté utilitaire des outils de développement +
élégance des logiciels de productivité premium. Objectif émotionnel : sensation de
**contrôle absolu et de stabilité** pour des développeurs qui construisent une
infrastructure email critique.

- Layouts à haute densité d'information + whitespace structurel généreux.
- Alignement net, micro-interactions, clarté « paper-white ».
- **À bannir :** gradients partout, glow, néon, 3D, cerveau/robot IA, chatbot géant,
  dashboards à 20 cartes.
- **À privilégier :** whitespace, typographie, hiérarchie, vraie UI, interactions rapides,
  animation subtile, actions claires.

---

## 2. Couleurs

### 2.1 Palette produit (cahier des charges, parties 1 & 3)

| Rôle           | Hex        |
| -------------- | ---------- |
| Primary        | `#00A48A`  |
| Primary hover  | `#008F78`  |
| Background     | `#F0F2F5`  |
| Surface        | `#FFFFFF`  |
| Foreground     | `#111827`  |
| Muted          | `#6B7280`  |
| Border         | `#E5E7EB`  |
| Error          | `#EF4444`  |
| Warning        | `#F59E0B`  |

Le teal `#00A48A` est **réservé** aux CTA, au logo, aux liens importants, aux états actifs
et aux indicateurs de succès. Ne pas l'utiliser partout.

### 2.2 Tokens Stitch « Kinetic Infrastructure » (source : `design/tokens/`)

L'export Stitch pousse une variante **teinte verte** (Material-style), utilisée dans les
maquettes HTML :

| Token                        | Hex        |
| ---------------------------- | ---------- |
| `primary`                    | `#006b59`  |
| `primary-container`          | `#00a48a`  |
| `on-primary`                 | `#ffffff`  |
| `surface` / `background`     | `#f5fbf7`  |
| `surface-container-lowest`   | `#ffffff`  |
| `surface-container`          | `#e9efeb`  |
| `on-surface`                 | `#171d1b`  |
| `on-surface-variant`         | `#3d4945`  |
| `outline`                    | `#6d7a75`  |
| `outline-variant`            | `#bccac4`  |
| `error`                      | `#ba1a1a`  |
| `secondary-container`        | `#bbe9db`  |
| `tertiary` (accent chaud)    | `#9b4330`  |

**Réconciliation à trancher avant le build :** garder la palette produit §2.1
(`#00A48A` + fond neutre `#F0F2F5`) comme référence, et ne récupérer de Stitch que les
échelles `surface-container-*` pour le tonal layering. Les maquettes HTML actuelles
utilisent la variante Stitch — à réaligner sur `#00A48A` lors de l'intégration.

---

## 3. Typographie

- **Geist** : titres, éléments structurels, labels, code (`Geist Mono`) — feel technique.
- **Inter** : corps de texte long — lisibilité maximale.
- Titres compacts, **pas** de tracking excessif. Interlignes serrés (densité « dashboard »).

| Style              | Police     | Taille / Ligne        | Poids | Tracking   |
| ------------------ | ---------- | --------------------- | ----- | ---------- |
| headline-xl        | Geist      | 48 / 56 px            | 600   | -0.02em    |
| headline-lg        | Geist      | 32 / 40 px            | 600   | -0.02em    |
| headline-lg mobile | Geist      | 28 / 36 px            | 600   | —          |
| headline-md        | Geist      | 24 / 32 px            | 600   | -0.01em    |
| body-lg            | Inter      | 18 / 28 px            | 400   | —          |
| body-md            | Inter      | 16 / 24 px            | 400   | —          |
| body-sm            | Inter      | 14 / 20 px            | 400   | —          |
| label-md           | Geist      | 14 / 16 px            | 500   | 0.02em     |
| label-sm           | Geist      | 12 / 14 px            | 500   | 0.03em     |
| mono               | Geist Mono | 14 / 20 px            | 400   | —          |

Hiérarchie landing (parties 1 & 3) : Hero 64–72 px · H1 48–56 px · H2 36–44 px ·
Body 16–18 px · UI 14–15 px.

---

## 4. Layout & espacement

- Grille stricte **8 px**.
- Échelle : `xs 8` · `sm 12` · `md 16` · `lg 24` · `xl 32` · `2xl 48` · `3xl 64` ·
  `4xl 96` · gutter 24 · margin 32.
- **Dashboard SaaS :** sidebar fixe **240 px** (240–260), zone de contenu fluide.
- **Landing :** grille 12 colonnes, `max-width` **1280 px**. Padding vertical de section
  en `2xl` / `3xl` pour la respiration « premium ».
- Espacement intra-composant (cartes, listes) : `xs` → `md` pour garder la densité.

---

## 5. Élévation & profondeur

Profondeur par **tonal layering** + **contours faibles**, pas d'ombres lourdes.

1. **Niveau 0 — Background :** `#F0F2F5`, canvas de base.
2. **Niveau 1 — Surface :** `#FFFFFF` (cartes, contenu, nav) + bordure 1 px `#E5E7EB`.
3. **Niveau 2 — Popovers / modals :** `#FFFFFF` + ombre diffuse `0 4px 12px rgba(0,0,0,0.05)`.

Pas d'inner shadow, pas de blur lourd. UI « à plat mais physiquement stratifiée ».

---

## 6. Formes

- Langage « Soft ». Rayon standard **4 px** (`0.25rem`) : inputs, boutons, cartes.
- Grands conteneurs / sections landing : **8 px** (`0.5rem`) max.
- **Pill** réservé aux status indicators et chips.
- Note : parties 1–3 évoquent aussi `rounded-xl` / `2xl` (12–16 px) pour les éléments
  vedettes — à arbitrer ; l'export Stitch tranche à 4–8 px.
- Ombres : `shadow-sm` par défaut, `shadow` ponctuellement. Jamais de glow/néon.

---

## 7. Composants

- **Boutons primaires :** `#00A48A`, texte blanc, pas de gradient. Transition 150 ms ease-out.
- **Boutons secondaires :** fond blanc + bordure `#E5E7EB`.
- **Inputs :** bordure 1 px ; focus → bordure `#00A48A` + halo externe 2 px à 10 % d'opacité.
- **Chips / labels :** pastels ; texte 2–3 tons plus foncés que le fond (WCAG).
- **Cartes :** fond blanc, bordure 1 px `#E5E7EB`, pas d'ombre ; hover interactif → ombre niveau 2.
- **Tables :** contenu en `body-sm` ; en-têtes en `label-sm` majuscules, couleur `#6B7280`.
- **Blocs de code :** dark par défaut (même en thème clair) pour les distinguer du reste de l'UI.

---

## 8. Iconographie

- **Lucide Icons**, style outline fin et cohérent. (Les maquettes Stitch utilisent
  *Material Symbols Outlined* — à remplacer par Lucide à l'intégration.)
- Ne pas mélanger plusieurs bibliothèques d'icônes.

---

## 9. Logo

- Symbole **« S » abstrait** construit à partir de deux formes de flux email — pas d'enveloppe littérale.
- Doit fonctionner seul (`[S]`) de **16×16 px** à **512×512 px** : favicon, app icon, MCP,
  GitHub, docs.
- Lockup principal : `[S] SouraMAIL`.
- Références : `design/screenshots/logo-system.png`, `design/screenshots/favicon.png`.

---

## 10. Motion

Animations **rares** et fonctionnelles : ouverture sidebar, apparition d'une confirmation,
progression d'onboarding, connexion de domaine, email envoyé, réponse IA.
Pas de gradients animés, particules, animations permanentes, effets 3D.

---

## 11. Mobile

Desktop-first, mais : landing responsive, onboarding responsive, webmail utilisable sur
mobile, composer mobile, notifications adaptées. Sur petit écran, la sidebar devient
bottom-nav / drawer ; priorité Inbox → Compose → AI.
