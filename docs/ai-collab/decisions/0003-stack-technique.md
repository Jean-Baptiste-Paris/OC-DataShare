# ADR 0003 — Stack technique du MVP DataShare

- **Statut :** accepted
- **Date :** 2026-04-25 (validation finale après discussion sous-décision par sous-décision)
- **Décideur :** référent technique senior
- **Contexte amont :** spécification fonctionnelle page 7 (4 options back / 3 options front / 2 options BDD / 2 options stockage) ; critères d'arbitrage exprimés par le user ; auto-évaluation de la maîtrise.

## Contexte

La spécification fonctionnelle (page 7) impose un choix dans une matrice contrainte :

| Couche | Options imposées par OC |
|---|---|
| Back-end | Spring Boot (Java) / .NET Core (C#) / NestJS (TypeScript) / PHP (Symfony, Laravel) |
| Front-end | Angular / React / VueJS |
| Base de données | PostgreSQL / MongoDB |
| Stockage de fichiers | FS local / AWS S3 |

Aucun couplage n'est imposé entre les couches. La décision est libre dans cette matrice mais doit être **justifiée à l'oral** et **alimenter la section 2 du Livrable 1** (« Choix technologiques justifiés », 1-2 pages, tableau 4 colonnes imposé par le gabarit).

## Critères d'arbitrage retenus

Avant de comparer les options, les critères ont été pondérés explicitement par le user (par ordre décroissant de priorité) :

1. **(a) Productivité immédiate** — stack qui maximise la livraison en 4 semaines.
2. **(e) Fit avec ADR déjà actés** — ADR 0001 streaming back, ADR 0002 JWT cookie httpOnly + CSRF.
3. **(d) Pédagogie OC** — stack qui met en valeur les patterns SOLID, la séparation des responsabilités, l'architecture défendable.
4. **(c) Défendabilité à l'oral** — stack avec arguments solides à articuler (maturité, écosystème, fit contraintes).
5. **(f) Réutilisable pro** — utilité dans le contexte pro probable (Django).
6. **(b) Apprentissage** — bonus si on apprend, mais non prioritaire.

### Auto-évaluation de la maîtrise (0 = jamais touché, 5 = quotidien)

| Tech | Note | Tech | Note |
|---|---|---|---|
| Spring Boot | 1 | Angular | 1 |
| .NET Core | 0 | React | 3 |
| NestJS | 0 | Vue | 2 (intérêt exprimé) |
| Symfony | 1 | PostgreSQL | 1 (intérêt pro Django) |
| Laravel | 1 | MongoDB | 2 |
| | | AWS S3 | 0 |

## Décisions

### D1 — Back-end : **Symfony (PHP)**

> ✅ **Validé avec le user (2026-04-25)**

#### Filtrage par critères

- **(a)** Aucune option n'est confortable (max = 1). .NET (0) et NestJS (0) éliminés au profit de Spring Boot, Symfony, Laravel (toutes à 1).
- **(d)** Spring Boot et Symfony sont les **deux champions** de la pédagogie SOLID. Laravel est plus « magique », moins lisible sur les patterns archi. Laravel sort.
- **(f)** Symfony est **conceptuellement le plus proche de Django** : MVC, ORM Doctrine ↔ Django ORM, services, DI explicite, console commands, migrations. Pont pro réel.
- **(c)** Symfony et Spring Boot tous deux défendables, profils différents : Spring « entreprise classique mature », Symfony « PHP moderne, framework de référence européen ».

#### Décision

**Symfony 8.x** (PHP 8.5+).

#### Justification

- Lecture pédagogique forte sur SOLID (services, DI, container). À l'oral, le framework lui-même *enseigne* les concepts qu'on défend.
- Pont conceptuel avec Django pour l'usage pro probable.
- Setup initial plus rapide qu'un projet Spring Boot (Java verbeux + JPA + Spring Security à configurer).
- Streaming back natif via `Symfony\HttpFoundation\StreamedResponse` (cohérent ADR 0001).
- CSRF natif géré par Symfony (cohérent ADR 0002).
- Tests unitaires/intégration : PHPUnit + `KernelTestCase` (isolation BDD propre).

#### Risque assumé

Doctrine (ORM) à apprendre — courbe modérée, mais investissement transférable à Django.

### D2 — Base de données : **PostgreSQL**

> ✅ **Validé avec le user (2026-04-25)**

#### Filtrage par critères

- **(d)** Le modèle DataShare est **100 % relationnel** : `User` 1-N `File`, état enum (`disponible` / `supprimé`). Aucun cas d'usage document/imbriqué/schéma flexible. MongoDB serait artificiel.
- **(c)** *« Pourquoi MongoDB pour des données relationnelles ? »* = pas de réponse défendable. PostgreSQL = choix par défaut argumentable.
- **(f)** PostgreSQL = standard de l'écosystème Django. Investissement transférable.
- **(a)** Ta note 1 vs 2 sur Mongo : écart négligeable sur l'usage MVP (2-3 tables, requêtes simples via ORM).

#### Décision

**PostgreSQL 15+**.

#### Justification

- Fit naturel avec le modèle DataShare.
- Trio standard PHP moderne : **Symfony + Doctrine + PostgreSQL**.
- Migrations gérées via `bin/console doctrine:migrations:*` (équivalent `manage.py migrate` Django).
- Réutilisable pro avec Django.

### D3 — Front-end : **React**

> ✅ **Validé avec le user (2026-04-25)**

#### Filtrage par critères

- **(a)** React 3 vs Vue 2 vs Angular 1. Sur 4 semaines, l'écart de productivité est tangible.
- **(c)** « Standard du marché 2026 » = argument facile, écosystème mature, ressources abondantes.
- **(d)** Hooks et composition fonctionnelle. SOLID applicable via custom hooks (logique extraite hors des composants), mais moins explicite qu'Angular sur la DI/services.
- **(b)** Bonus d'apprentissage faible (déjà connu) — mais (b) est en dernier, donc non bloquant.

#### Décision

**React 18+** (avec TypeScript).

#### Justification

- Maximise la productivité en 4 semaines (note 3, la plus haute du panel).
- Argument oral solide : choix de productivité aligné sur l'objectif MVP, en libérant du temps pour les sujets archi/back.
- Cohérent ADR 0002 : `fetch` avec `credentials: 'include'` pour le cookie JWT, lecture du cookie `XSRF-TOKEN` côté JS pour CSRF, ajout du header `X-XSRF-TOKEN` automatisable via interceptor (ex. lib `axios` avec `xsrfCookieName` / `xsrfHeaderName` natif).

#### Trade-off conscient

L'envie de Vue exprimée par le user (« pour changer ») a été pesée contre les critères auto-imposés (a en premier). Décision : **respecter les critères pondérés**. Vue reste une option pertinente à explorer en projet personnel séparé.

### D4 — Stockage : **FS local + abstraction `StorageInterface`**

> ✅ **Validé avec le user (2026-04-25)**

#### Filtrage par critères

- **(a)** AWS S3 = compte AWS + IAM + bucket + SDK = **1-2 jours de plomberie** sur un sujet périphérique. Le user est à 0 sur AWS = ROI faible vu le scope.
- **(d)** **FS local + abstraction est plus pédagogique que S3 hardcodé.** C'est l'occasion de démontrer **DIP (Dependency Inversion Principle)**.
- **(c)** Risque réel d'une mauvaise conf IAM = faille sécurité indéfendable à l'oral.
- **(b)** AWS comme apprentissage = critère le plus bas, donc non bloquant.

#### Décision

Stockage **FS local** dans un répertoire dédié hors du repo (ex. `var/storage/`), accédé via une **interface d'abstraction `StorageInterface`** consommée par le service métier `FileService`.

#### Architecture

```
┌─────────────────────────┐
│  FileService (métier)   │
└────────────┬────────────┘
             │ dépend de
             ▼
┌─────────────────────────┐
│ StorageInterface        │   ← abstraction
│  store(stream, key)     │
│  retrieve(key): stream  │
│  delete(key)            │
└────────────┬────────────┘
             │ implémente
   ┌─────────┴─────────┐
   ▼                   ▼
┌──────────┐    ┌──────────────┐
│ LocalFS  │    │ S3 (V2)      │
│ Storage  │    │ Storage      │
└──────────┘    └──────────────┘
```

#### Justification

- Démonstration archi forte de DIP : `FileService` ne connaît pas l'implémentation de stockage.
- Migration vers S3 en V2 = ajouter une implémentation + changer la conf du conteneur Symfony, sans toucher au code métier.
- Cohérent avec ADR 0001 qui spécifie l'agnosticité au stockage.
- Setup MVP : `mkdir var/storage/`, variable d'env `STORAGE_PATH`, surveillance disque dans `MAINTENANCE.md` (point déjà noté).

## Stack consolidée

| Couche | Choix | Version | Rôle |
|---|---|---|---|
| **Langage back** | PHP | 8.5+ | Cohérence avec Symfony |
| **Framework back** | Symfony | 8.x | API REST, services, DI |
| **ORM back** | Doctrine | (livré avec Symfony) | Mapping objet-relationnel |
| **Auth** | JWT | (cf ADR 0002) | Authentification stateless |
| **Langage front** | TypeScript | 5.x | Typage strict, maintenabilité |
| **Framework front** | React | 18+ | SPA, composants, hooks |
| **Build front** | Vite | latest | Bundling rapide, dev server |
| **Client HTTP front** | Axios | latest | Support natif `xsrfCookieName` / `xsrfHeaderName` |
| **BDD** | PostgreSQL | 18 | Stockage relationnel des métadonnées |
| **Stockage fichiers** | FS local | — | Via abstraction `StorageInterface` |
| **Tests back** | PHPUnit | (Symfony bundle) | Unitaires + intégration |
| **Tests front** | Vitest + React Testing Library | latest | Unitaires + intégration |
| **Tests E2E** | Cypress (ou Playwright) | latest | 2-3 scénarios critiques (cf TESTING.md) |
| **Mesure couverture** | PHPUnit `--coverage-html` (back) + Vitest coverage (front) | — | Cible 70 % périmètre métier (cf ambiguïté #8) |
| **Versioning** | Git | — | Conventional commits = bonus OC |

## Conséquences

### Positives

- Stack 100 % open source, gratuite, exécutable en local.
- Setup local rapide : `composer install` + `npm install` + `docker compose up postgres`.
- Pédagogie SOLID forte sur back (Symfony) et stockage (abstraction).
- Pont pro Django via Symfony + PostgreSQL.

### Négatives / risques

- **Doctrine à apprendre** : courbe modérée, mais transférable.
- **Symfony 7 + PHP 8.3** : doit être bien expliqué à l'oral comme choix moderne (PHP a beaucoup évolué).
- **Pas de S3 en MVP** : à défendre comme choix pédagogique (DIP) et de scope (productivité MVP).

### Implications opérationnelles à documenter

- `README` : prérequis (PHP 8.3+, Composer, Node 20+, npm, PostgreSQL 15+, optionnel Docker), commandes install/lancement, variables d'environnement (`DATABASE_URL`, `JWT_SECRET`, `STORAGE_PATH`, `APP_SECRET`).
- `MAINTENANCE.md` : surveillance espace disque (`var/storage/`), backup snapshot, procédure rotation `JWT_SECRET`.
- `SECURITY.md` : justification blacklist extensions (cf ambiguïté #6), `JWT_SECRET` en env, pas de log de cookie/header `Cookie`, CORS strict.
- `TESTING.md` : commande couverture, capture du rapport, plan tests E2E Cypress.
- `PERF.md` : test k6 sur `GET /files/:link/download` (cf ambiguïté #4), budget perf front (Lighthouse, Web Vitals).

## Évolutions envisageables (hors MVP)

- **AWS S3** : ajout d'une implémentation `S3Storage` de `StorageInterface` (changement de conf, pas de touche au code métier).
- **CI/CD** : pipeline GitHub Actions / GitLab CI (objet d'un autre projet du parcours OC).
- **Refresh JWT** : si la fenêtre 8 h devient gênante (cf ADR 0002 D2).
- **Antivirus** ClamAV : analyse des fichiers uploadés (cf ambiguïté #6).
- **Migration Mongo** : aucune raison fonctionnelle, donc non envisagée.
- **Migration NestJS** : aucune raison fonctionnelle, donc non envisagée.

## Préparation à l'oral — questions probables

| Question évaluateur | Réponse défendable |
|---|---|
| « Pourquoi Symfony et pas Spring Boot ? » | « Trois raisons : (1) lecture pédagogique SOLID au moins équivalente, (2) pont conceptuel fort avec Django pour usage pro, (3) setup initial plus rapide en PHP/Composer pour un MVP de 4 semaines. » |
| « Pourquoi PHP en 2026 ? » | « PHP 8.3 a évolué : types stricts, attributs, readonly, enums, performance. Symfony 7 incarne le PHP moderne. C'est aligné sur la pratique pro européenne (PHP reste majoritaire en Europe). » |
| « Pourquoi PostgreSQL et pas MongoDB ? » | « Modèle DataShare 100 % relationnel : User 1-N File, états enum. Mongo serait artificiel sans cas d'usage document/imbriqué. » |
| « Pourquoi React et pas Vue ou Angular ? » | « Productivité immédiate (note 3 sur 5 vs 1-2 pour les autres). Sur 4 semaines, l'écart compte. Et écosystème mature pour l'intégration cookie + CSRF. » |
| « Pourquoi pas AWS S3 ? » | « Choix pédagogique : j'ai défini une `StorageInterface` consommée par `FileService`. L'impl MVP est `LocalFilesystemStorage`. Migration S3 en V2 = ajouter une impl, sans toucher au code métier. C'est DIP en action, et ça respecte ADR 0001 qui spécifie l'agnosticité au stockage. » |
| « Pourquoi pas de CI ? » | « Pilotage CI/CD = compétence à part, traitée dans un autre projet du parcours. Ici, focus sur l'architecture et les livrables documentaires. Couverture mesurée localement, capture dans TESTING.md comme exigé. » |

## Références

- Spécification fonctionnelle, page 7 (matrice de choix imposée).
- ADR 0001 — Streaming back (cohérence stockage).
- ADR 0002 — JWT cookie httpOnly + CSRF.
- Ambiguïté #4 (endpoint critique download), #6 (extensions blacklist), #8 (couverture 70 %).
- À synthétiser dans **section 2 du Livrable 1** (`docs/livrables/L1-doc-technique.md`).
