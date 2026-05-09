# ADR 0005 — Stack et architecture du design system front

- **Statut :** accepted
- **Date :** 2026-05-09 (validation sous-décision par sous-décision)
- **Décideur :** référent technique senior
- **Contexte amont :** ADR 0003 (stack technique), `docs/maquettes/NOTES.md` (inventaire DS), démarrage de l'étape 3 OC (US03 + US04, écrans Login + Register).

## Contexte

La maquette Figma (`docs/maquettes/Components.png`) définit un design system de **6 composants** : Input, Button, Header, Callout, Switch, Select. Aucun n'a encore été codé — `front/src/` est au boilerplate Vite/React initial.

L'étape 3 OC (« Implémentez vos premières US ») demande un système d'authentification fonctionnel via US03 + US04. Les écrans Login et Register consomment 4 des 6 composants (Input, Button, Header, Callout). Switch et Select ne sont consommés qu'à partir des étapes suivantes (Mon espace, Téléversement).

Plusieurs choix structurants doivent être figés avant le premier composant pour éviter des dérives de cohérence : stratégie de styling, gestion de l'accessibilité, périmètre de livraison, organisation des fichiers, documentation, tests.

## Critères d'arbitrage

Pondération reprise de l'**ADR 0003**, par ordre de priorité décroissante :

1. **(a) Productivité immédiate** — livrer en 4 semaines.
2. **(e) Fit ADR** — cohérence avec ADR 0003 (Vite + Vitest + RTL).
3. **(d) Pédagogie SOLID** — démontrer SRP, OCP, séparation token/composant.
4. **(c) Défendabilité à l'oral** — arguments simples et tenables.
5. **(f) Réutilisable pro** — patterns transférables.
6. **(b) Apprentissage** — bonus.

---

## D1 — Stratégie de styling

### Contexte

Choisir une approche pour styliser les composants React de manière maintenable, performante et défendable.

### Options envisagées

| Option | Avantages | Inconvénients |
|---|---|---|
| **CSS Modules natifs** | Supportés par Vite sans config, scoping local par hash, syntaxe CSS standard, zéro dépendance, compatible avec les CSS custom properties | Pas de système de tokens intégré (à construire) |
| **Tailwind CSS** | Très productif, écosystème mature, classes utilitaires expressives | Dépendance lourde, JSX verbeux, apprentissage de la convention de classes |
| **CSS-in-JS** (Stitches, Vanilla Extract) | Typé, theming poussé, dead-code elimination | Complexité injustifiée pour 6 composants, écosystème instable (Stitches non maintenu) |
| **CSS global + BEM** | Syntaxe CSS standard | Pas de scoping, anti-pattern à l'échelle |

### Décision

**CSS Modules natifs** + **CSS custom properties** centralisées dans `front/src/styles/theme.css`.

### Justification

- **Productivité immédiate** : zéro setup, syntaxe CSS standard maîtrisée.
- **Pédagogie SOLID** : la séparation **token (variable globale) ↔ composant (consommateur)** illustre concrètement SRP au front.
- **Défendabilité orale** : pas de dépendance à justifier au-delà de Vite. « CSS standard, scoping garanti, theming via custom properties, zéro magie. »
- **Réutilisabilité** : transfert direct vers tout projet React/Vue/Vanilla.

### Conséquences

- `theme.css` devient la **source unique** des couleurs, espacements, rayons et typographie. Toute valeur magique dans un composant est interdite (à vérifier en revue de code).
- Chaque composant a son fichier `.module.css` voisin du `.tsx`.
- L'a11y (focus visible, contrastes) repose sur des règles définies au niveau du theme et complétées localement.

---

## D2 — Composants headless

### Contexte

Parmi les 6 composants, deux ont une mécanique a11y non triviale :

- **Switch** : touche Espace, focus clavier, `role="switch"` + `aria-checked`, focus visible.
- **Select** : flèches haut/bas, Home/End, Échap, type-ahead, `role="combobox"` + `aria-expanded` + `aria-activedescendant`, focus management ouverture/fermeture, click-outside.

Les 4 autres reposent sur des éléments natifs (`<input>`, `<button>`) ou de la structure simple — l'a11y est triviale.

L'engagement projet est **WCAG 2.1 AA** (ambiguïté #5 résolue dans `CLAUDE.md`).

### Options envisagées

| Option | Avantages | Inconvénients |
|---|---|---|
| **DIY full** | Zéro dépendance, maîtrise des primitives ARIA | Coût élevé, risque d'erreurs a11y silencieuses |
| **Radix UI** (sur Switch + Select) | A11y industrielle gratuite, focus management éprouvé, API claire (data-attributes) | Une dépendance npm, vocabulaire Radix à apprendre |
| **shadcn/ui** | Très productif, code chez nous | Hérite d'une opinion stylistique Tailwind, risque oral « qu'as-tu écrit ? » |
| **Headless UI** | Similaire à Radix | Couverture plus restreinte |

### Décision

**Radix UI uniquement sur `Switch` et `Select`**. Les 4 autres composants restent en HTML natif + CSS Modules. Le styling Radix se fait via les `data-attributes` exposés (`data-state="checked"`, etc.).

### Justification

- **Conformité WCAG 2.1 AA par construction** sur les composants à risque.
- **Concentration sur l'archi du DS** : temps économisé réinvesti dans les tokens, la structure, les tests.
- **Périmètre limité** : 2 dépendances Radix, pas une « lib massive ».
- **Convention DataShare** (mémoire `feedback_standards_vs_custom.md`) : pattern mainstream sur stack non-maîtrisée.

### Conséquences

- Deux dépendances ajoutées : `@radix-ui/react-switch`, `@radix-ui/react-select`.
- Styling via data-attributes Radix à apprendre — documenté dans le composant à la première utilisation.
- Trade-off accepté : dépendance externe sur ces deux composants. Mitigation : Radix est largement utilisé (Vercel, Linear), faible risque d'abandon.

---

## D3 — Périmètre du DS

### Contexte

Pour US03 + US04, seuls 4 composants sont strictement nécessaires (Input, Button, Header, Callout). Switch et Select ne servent qu'à partir de US05 / US01. Choix entre livraison **incrémentale** vs **groupée**.

### Options envisagées

| Option | Avantages | Inconvénients |
|---|---|---|
| **A — YAGNI strict** : 4 composants à l'étape 3, Switch + Select plus tard | Aligné « on construit ce qu'on consomme » | Allers-retours, risque d'incohérence stylistique entre passes |
| **B — DS complet** : 6 composants à l'étape 3 | DS bouclé une fois, cohérence garantie, dette nulle pour les étapes suivantes | Switch et Select construits avant consommation (mineur : usage déjà visible dans la maquette) |
| **C — DS étendu** : composants spéculatifs (Tooltip, Dialog…) | DS « professionnel » | Hors maquette, sur-ingénierie |

### Décision

**Option B — les 6 composants livrés à l'étape 3**, ordre : Tokens → Button → Input → Header → Callout → Switch → Select.

### Justification

- **Charge réelle faible** : 6 composants, dont 2 délégués à Radix.
- **Cohérence stylistique** : tokens, conventions, structure décidés et appliqués une fois.
- **Pédagogie SOLID** : DS complet illustre OCP (extensions par variantes) et SRP (un composant = une responsabilité d'affichage).
- **Mitigation YAGNI** : la maquette définit déjà les usages de Switch et Select. Pas de spéculation.

### Conséquences

- Switch et Select construits avant consommation MVP. Tests Vitest valident leur comportement isolé en attendant.
- Select reste construit comme primitive réutilisable même si l'usage métier (US10 expiration) est hors MVP — extensibilité V2.
- DS s'arrête à 6 : pas de promesse implicite sur Tooltip, Dialog, etc.

---

## D4 — Structure de fichiers et conventions

### Contexte

Décider où vivent les composants, comment les fichiers sont organisés, comment ils sont importés. Conditionne aussi la place des **pages** et de la **logique métier** (services, hooks, store).

### Options envisagées

| Option | Structure DS | Structure app |
|---|---|---|
| **A — Flat** : un fichier par composant | `components/ui/Button.tsx` + `Button.module.css` côte à côte | `pages/LoginPage.tsx`, services à plat |
| **B — Folder per component** | `components/ui/Button/Button.tsx + Button.module.css + Button.test.tsx + index.ts` | `pages/LoginPage.tsx`, `features/auth/` pour la logique métier |
| **C — Atomic Design** | `components/atoms/`, `molecules/`, `organisms/` | idem |

### Décision

**Option B — folder per component**, avec la structure suivante :

```
front/src/
  styles/
    theme.css                    # CSS custom properties
  components/
    ui/                          # Design system (réutilisable, sans logique métier)
      README.md                  # Catalogue du DS
      Button/
        Button.tsx
        Button.module.css
        Button.test.tsx
        index.ts                 # export { Button } from './Button'
      Input/
      Header/
      Callout/
      Switch/
      Select/
  features/                      # Logique métier par domaine
    auth/                        # Hooks, services, store auth (US03+US04)
  pages/                         # Composants de route
    LoginPage.tsx
    RegisterPage.tsx
  App.tsx
  main.tsx
```

**Conventions complémentaires :**

- **Imports nommés** (`import { Button } from '@/components/ui/Button'`), pas de default export.
- **Variants** : prop typée par union (`variant: 'primary' | 'secondary' | 'ghost'`).
- **Tests** : `*.test.tsx` co-localisé.
- **Alias `@/`** : mappé sur `src/` dans `tsconfig.json` + `vite.config.ts`.

### Justification

- **Co-localisation** : composant + styles + test dans un seul dossier — facilite lecture, refactor, déplacement.
- **Pas d'atomic design** : 6 composants ne justifient pas une taxonomie. La distinction `ui/` vs `features/` suffit et illustre SRP au niveau de l'arborescence.
- **Imports nommés** : robustes au renommage et aux outils.
- **Alias `@/`** : convention idiomatique Vite/CRA.

### Conséquences

- Création des dossiers `styles/`, `components/ui/`, `features/`, `pages/` au début de la séance.
- Configuration de l'alias `@/` à faire avant le premier composant.
- **Règle de revue** : un `import` qui sort de `components/ui/` dans le DS lui-même est interdit (pas de couplage métier dans le DS).

---

## D5 — Documentation des composants

### Contexte

Documenter le DS sans surinvestir : la doc DS n'est pas un livrable évalué OC en soi. Le livrable principal reste le PDF (section 2 et 6).

### Options envisagées

| Option | Avantages | Inconvénients |
|---|---|---|
| **A — Storybook** | Catalogue interactif, démo visuelle valorisante | Setup ~1 h, écriture de stories ~3 h, maintenance parallèle |
| **B — README par composant** | Lo-fi, versionnable, lisible sur GitHub | Multiplie les fichiers à maintenir |
| **C — TSDoc inline** | Gratuit, co-localisé, exploité par l'IDE | Pas de vue d'ensemble |
| **D — Pas de doc explicite** | Aucun coût | Aucun argument à l'oral |

### Décision

**Option mixte (B-restreint + C)** :

- **Un unique `README.md`** à la racine de `front/src/components/ui/` — catalogue : description du DS, liste des 6 composants avec une ligne chacun, conventions communes (variants, props standards).
- **TSDoc inline** sur chaque composant et chaque prop : 1 phrase par prop, exploitée par l'autocomplete IDE.
- **Pas de README par composant individuel.**

### Justification

- **Calibré sur l'enjeu réel** : le DS est un moyen, pas un livrable évalué en soi. Surinvestir serait du sur-équipement.
- **TSDoc = doc gratuite et co-localisée** : vit avec le code, jamais désynchronisée.
- **README global** : suffit comme vue d'ensemble pour un mentor parcourant le repo, ~30 lignes.
- **Cohérence projet** : reste en Markdown (CLAUDE.md, ADR, NOTES.md, journal).

### Conséquences

- Un seul fichier `front/src/components/ui/README.md` à maintenir.
- Convention TSDoc : 1 phrase par prop, exemple sur la fonction si non trivial.
- Évolution V2 possible (Storybook ou README par composant) — pas un cul-de-sac.

---

## D6 — Stratégie de tests

### Contexte

L'ambiguïté #8 (`CLAUDE.md`) fixe une couverture cible de **70 % sur le périmètre métier**. Stack Vitest + RTL déjà actée par l'**ADR 0003**. Reste à arrêter une stratégie : quoi tester, à quelle granularité.

### Options envisagées

| Option | Avantages | Inconvénients |
|---|---|---|
| **A — Tests visuels (snapshots)** | Détecte les régressions de rendu | Faux positifs constants, ne teste pas le comportement |
| **B — Tests de contrat** : rendu avec props clés, comportement utilisateur, attributs a11y | Cible ce qu'un consommateur attend, robuste aux refactors | Couverture des branches à compléter au cas par cas |
| **C — Tests exhaustifs** | Couverture maximale | Sur-équipement pour 6 composants |

### Décision

**Option B — tests de contrat, 1 à 3 tests par composant**, focalisés sur :

- **Rendu correct** avec les variantes principales (`variant="primary"`, etc.).
- **Comportement utilisateur** : `userEvent.click()` → callback déclenché, `userEvent.keyboard('{Space}')` → bascule sur Switch.
- **Attributs d'accessibilité** quand pertinent (`role`, `aria-checked`, `aria-disabled`).

**Hors périmètre :**

- Rendu visuel (couleurs, marges) — responsabilité maquette + revue manuelle.
- Comportement interne de Radix sur Switch et Select — testé par Radix lui-même, on teste seulement l'**intégration**.
- Détails d'implémentation (état interne, classes CSS).

### Justification

- **Tests = contrat utilisateur** (philosophie Testing Library) : robuste au refactor.
- **Couverture cible 70 % atteignable** : 6 × 1-3 tests = 6-18 tests, suffisant.
- **Argument oral** : « tests de contrat, pas de snapshot — DS robuste au refactor, tests servent d'exemples pour les consommateurs ».
- **Pyramide front amorcée** : ces tests unitaires sont la base. Intégration (formulaire complet) à US03 front. E2E Cypress en fin de phase.

### Conséquences

- Vérification de `package.json` au démarrage : Vitest + RTL + `@testing-library/user-event` présents (sinon ajout).
- Convention : `Button.test.tsx` co-localisé dans `Button/`, auto-discovery Vitest.
- Coverage : `vitest --coverage` (provider `v8` natif Vitest, pas de driver à installer).

---

## Conséquences globales

- **Dépendances ajoutées** : `@radix-ui/react-switch`, `@radix-ui/react-select`.
- **Configuration à faire avant le premier composant** : alias `@/` dans `tsconfig.app.json` + `vite.config.ts`, création des dossiers `styles/`, `components/ui/`, `features/`, `pages/`, fichier `theme.css` avec les premières CSS custom properties extraites de la maquette.
- **Section 2 du livrable 1** (choix technologiques) : ajouter une ligne « Design system » au tableau imposé, avec techno = « CSS Modules + Radix UI (Switch, Select) », alternatives = « Tailwind, shadcn/ui, MUI », justification = synthèse de cet ADR.
- **Section 5 du livrable 1** (sécurité et accès) : référencer Radix comme moyen de garantir WCAG 2.1 AA sur les composants à risque a11y.

## Évolutions envisageables

- **V2** : ajout de Tooltip, Dialog, DropdownMenu (Radix les fournit) si DataShare grossit.
- **V2** : passage à Storybook si le DS dépasse 12-15 composants ou si une équipe design rejoint le projet.
- **V2** : variants typés via `class-variance-authority` ou pattern équivalent si la combinatoire de props devient grande.

## Préparation à l'oral

**Questions probables et réponses défendables :**

1. *« Pourquoi pas Tailwind ? »* — Productivité oui, mais dépendance lourde et JSX verbeux. CSS Modules + custom properties font le job pour 6 composants, avec un argument SOLID (séparation token / composant) plus parlant à l'oral.

2. *« Pourquoi Radix sur seulement 2 composants ? »* — Switch et Select ont une mécanique a11y piégeuse (focus management, raccourcis clavier, ARIA). Les 4 autres sont triviaux a11y native. Périmètre limité = trade-off productivité / dépendance optimal.

3. *« Pourquoi pas Storybook ? »* — Surinvestissement à 6 composants. README global + TSDoc inline + tests Vitest UI suffisent. Storybook reste possible en V2.

4. *« Comment garantis-tu la cohérence stylistique ? »* — Tokens centralisés dans `theme.css`, aucune valeur magique dans les composants (règle de revue), TSDoc qui force à nommer chaque variante.

5. *« Comment testes-tu un Switch ? »* — Test de contrat : `userEvent.keyboard('{Space}')` doit appeler le `onChange`. Pas de snapshot visuel. Radix lui-même teste sa mécanique interne.

6. *« Et l'accessibilité ? »* — Radix garantit WCAG 2.1 AA sur Switch et Select. Les autres : focus visible global dans `theme.css`, contrastes vérifiés à la pipette sur la maquette, axe-core en CI locale.
