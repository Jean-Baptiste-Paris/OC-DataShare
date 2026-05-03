# Livrable 1 — Documentation technique (DataShare)

> Squelette rédactionnel à remplir au fil de l'eau.
> Source du gabarit : `docs/P3+EDO+P4+AL+-+Modèle+de+Documentation+technique.odt`.
> Destinataire : évaluateur OC (jouant Lisa, responsable produit) + investisseurs fictifs.
> Export final attendu : PDF unique, fichier nommé `Nom_Prenom_1_documentation_042026.pdf`.

---

## 1. Architecture de l'application

> Schéma unique (« diagramme simple »), pas un C4 multi-niveaux.
> Doit montrer : frontend, backend, BDD, stockage, API externes + **interactions** (protocoles, flux, sécurisation).
> Outil : Draw.io / Lucidchart / Figma. Légende obligatoire.

*(à rédiger)*

---

## 2. Choix technologiques justifiés (1-2 pages)

> **Seule section bornée explicitement.** Tableau à 4 colonnes imposé.

| Élément | Technologie choisie | Alternatives | Justification |
|---|---|---|---|
| Langage back | PHP 8.5+ | Java, C#, TypeScript | Cohérence avec Symfony, écosystème PHP moderne (types stricts, attributs, readonly, enums) |
| Framework back | Symfony 8.x | Spring Boot, .NET Core, NestJS, Laravel | Lecture pédagogique SOLID forte (services, DI explicite), pont conceptuel avec Django (usage pro probable), setup rapide pour MVP 4 semaines. Cf. ADR 0003. |
| ORM | Doctrine | Eloquent (Laravel), Prisma | Livré avec Symfony, mature, mapping objet-relationnel propre, migrations natives |
| Authentification | JWT (HS256, `localStorage` + header `Authorization: Bearer`, durée 8 h, sans refresh) | Session cookies, OAuth2 | JWT imposé par la spé OC. Stockage front en `localStorage`, transmission via header `Authorization: Bearer`. Stratégie complète dans ADR 0002. |
| Langage front | TypeScript 5.x | JavaScript pur | Typage strict, maintenabilité, équivalent industriel en 2026 |
| Framework front | React 18+ | Vue, Angular | Productivité immédiate maximale (auto-évaluation 3/5 vs 1-2 pour Vue/Angular). Sur 4 semaines, l'écart compte. Cf. ADR 0003. |
| Gestion d'état | Zustand | Redux, Jotai, React Context | Léger (~1 ko), API minimaliste, actions async intégrées dans le store. Évite la verbosité Redux pour un MVP à 2 entités. |
| Build front | Vite | Webpack, Parcel | Bundling rapide, dev server natif, intégration React + TS sans config |
| Client HTTP | Axios | Fetch API, TanStack Query | Interceptors natifs : injection du header `Authorization: Bearer` et gestion centralisée des 401 sans wrapper maison. Évite le boilerplate répété sur chaque appel API. |
| Base de données | PostgreSQL 15+ | MongoDB | Modèle DataShare 100 % relationnel (User 1-N File, état enum). Mongo serait artificiel. Standard de l'écosystème Django (transférable pro). |
| Stockage fichiers | FS local + abstraction `StorageInterface` | AWS S3 | Choix pédagogique : démontre DIP (`FileService` dépend de l'abstraction). Migration S3 en V2 sans toucher au code métier. Cohérent ADR 0001. |
| Tests back | PHPUnit + Symfony `KernelTestCase` | — | Standard Symfony, isolation BDD propre |
| Tests front | Vitest + React Testing Library | Jest, Cypress Component | Standard 2026 pour React + Vite |
| Tests E2E | Cypress (ou Playwright) | — | 2-3 scénarios critiques (cf. spé page 8) |
| Mesure de couverture | PHPUnit `--coverage-html` + Vitest coverage | — | Cible 70 % périmètre métier (cf. ambiguïté #8 résolue), capture dans `TESTING.md` |
| Versioning | Git + GitHub (ou GitLab) | — | Imposé par la spé. Conventional commits = bonus OC. |
| Outils dev | Composer (PHP), npm (front), PHP-CS-Fixer + PHPStan (back), ESLint + Prettier (front) | — | Standard de chaque écosystème |

*(toutes les lignes sont défendables à l'oral — détails et formulations pré-rédigées dans les ADR 0001, 0002, 0003)*

---

## 3. Modèle de données

> Le gabarit autorise UML **ou** Merise. **Choix arbitré : UML** (diagramme de classes du domaine).
> Rationale et version travail : `docs/conception/modele-domaine.md`. Image à intégrer ici : export Mermaid SVG ou Lucidchart UML.
> Aide à construire la logique applicative.

*(à rédiger : insérer l'image du modèle de domaine + tableaux d'attributs synthétisés depuis `docs/conception/modele-domaine.md`)*

---

## 4. Documentation d'API

> OpenAPI ou équivalent. Si la spec est hors PDF, **préciser où elle se situe**.

**Format adopté** : OpenAPI 3.0.3.

**Localisation des artefacts (hors PDF)** :
- **Spec formelle** : `docs/conception/openapi.yaml` (~ 8 endpoints couvrant les 6 US MVP)
- **Synthèse narrative** : `docs/conception/contrat-interface.md` (conventions, rationale, mapping US → endpoints)
- **Visualisation** : Swagger UI via [editor.swagger.io](https://editor.swagger.io) en local ; `NelmioApiDocBundle` exposera `/api/doc` en environnement dev une fois l'implémentation lancée.

*(à rédiger pour le PDF : insérer ici un récap synthétique des 8 endpoints — méthodes, paths, codes — et un pointeur explicite vers `openapi.yaml` dans le repo)*

---

## 5. Sécurité et gestion des accès

À couvrir :
- Système d'authentification (JWT — cf. ADR à venir sur durées et renouvellement)
- Gestion des rôles / permissions (le cas échéant)
- Mesures : chiffrement des mots de passe, HTTPS, validation des entrées (client + serveur)
- Limites et protections : taille max upload (1 Go — ADR 0001), restrictions d'accès, extensions interdites

*(à rédiger)*

---

## 6. Qualité, tests et maintenance

> **Synthèse** (pour lecteur externe) des 4 fichiers du repo. Deux artefacts distincts, recouvrement assumé.

- Renvoi vers `TESTING.md` — plan de tests, couverture ≥ 70 %
- Renvoi vers `SECURITY.md` — scan de dépendances + décisions
- Renvoi vers `PERF.md` — test perf endpoint critique + budget front
- Renvoi vers `MAINTENANCE.md` — procédures MAJ, fréquence, risques

*(à rédiger une fois les 4 fichiers opérationnels)*

---

## 7. Processus d'installation et d'exécution

> Même si `README` est un livrable séparé, **résumer ici** :
> - Prérequis (versions Node, Python, Docker, etc.)
> - Commandes principales (install + lancement)
> - Variables d'environnement à configurer

*(à rédiger — miroir condensé du README)*

---

## 8. Utilisation de l'IA dans le développement

> À rédiger en fin de projet par **synthèse de `docs/ai-collab/journal.md`**.
> 4 axes imposés par le gabarit :

### 8.1 Posture adoptée
*(junior / binômage-vibe coding / combinaison — avec évolution au fil des phases)*

### 8.2 Tâches confiées à l'IA
*(implémentation, tests, documentation, ADR, etc. — factuel)*

### 8.3 Supervision et corrections apportées
*(revues de code, ajustements sécurité, perf, lisibilité — exemples concrets)*

### 8.4 Apports et limites constatés
*(gain de temps, inspiration / erreurs, incohérences — honnête)*
