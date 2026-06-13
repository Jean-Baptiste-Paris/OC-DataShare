# TESTING.md — DataShare MVP

> Plan de tests, outils, exécution locale et rapport de couverture.
> Cible OC : seuil de couverture **≥ 70 %** sur le périmètre métier (cf. ambiguïté #8 résolue, `CLAUDE.md`).

## 1. Plan de tests

Périmètre : les 6 US MVP obligatoires (US01-US06). Pour chacune, une fonctionnalité critique est identifiée, le type de test associé est précisé, ainsi que le critère d'acceptation observable.

| US | Fonctionnalité critique | Type de test | Critère d'acceptation |
|---|---|---|---|
| **US01** | Upload streamé (RAM constante, blacklist extensions, magic bytes serveur) | Unit + Functional + E2E | `POST /api/files` renvoie 201 + `FileSummary` ; rejette 415 sur extension blacklistée OU MIME magic-bytes incohérent ; rejette 413 si Content-Length > 1 Go (sans charger le body) |
| **US02** | Download via lien public + métadonnées | Functional + E2E | `GET /api/share/{token}` renvoie métadonnées (sans `id`/owner, privacy) ; `GET /api/share/{token}/download` stream le blob avec `Content-Disposition: attachment` (RFC 5987) ; 404 unifié sur token mal formé / inconnu / soft-deleted |
| **US03** | Création de compte (email unique lowercased + mdp Argon2id ≥ 8 char) | Unit + Functional + E2E | `POST /api/auth/register` renvoie 201 + `User` ; rejette 409 sur email déjà pris ; rejette 400 sur validation (email format, mdp < 8) |
| **US04** | Connexion JWT + récupération identité | Functional + E2E | `POST /api/auth/login` renvoie 200 + `{token, user}` ; **anti-énumération** : 401 générique sur email inconnu ET mdp faux (même message) ; `GET /api/me` renvoie 200 avec user authentifié, 401 sinon |
| **US05** | Historique « Mes fichiers » (filtre owner, tri DESC, status badge) | Integration + Functional + E2E | `GET /api/files` renvoie la liste de l'authentifié seul (isolation) ; tri `createdAt DESC` vérifié ; champ `status` exposé pour le filtrage clientside |
| **US06** | Suppression (storage purge + soft delete BDD) | Unit + Functional + E2E | `DELETE /api/files/{id}` renvoie 204 + blob purgé du storage + `deletedAt` set ; **anti-énumération** : 404 unifié sur UUID malformé / inexistant / déjà supprimé / appartenant à un autre user |

### 1.1 Critères transverses

| Critère | Vérification |
|---|---|
| **Routes privées** | `RequireAuth` redirige vers `/login` si pas de JWT en localStorage (E2E `my-files.cy.ts`) |
| **Persist auth au reload** | Token + user restaurés via Zustand persist, bootstrap `/me` au mount d'`App` (E2E `login.cy.ts`) |
| **Mapping HTTP → erreurs typées front** | `UploadError` (5 kinds), `ShareError` (2 kinds), `FileListError` (2 kinds), `FileDeleteError` (3 kinds) — tous testés en unit Vitest |
| **Streaming back-end** | RAM constante via `stream_copy_to_stream` (upload) et `fpassthru`/`fread` (download). Vérifié bout-en-bout avec un fichier 4 Mo en unit `LocalStorageAdapterTest::testStorePreservesBytesAcrossLargerStream` (sha256 hash compare) |
| **Validation client + serveur** | Client = UX (extension blacklist), serveur = autorité (extension + magic bytes). Duplication assumée MVP, factorisable V2 |

## 2. Pyramide actuelle (séance 13, 2026-05-11)

| Niveau | Nombre | Outil | Périmètre |
|---|---:|---|---|
| **Unit back** (services, validators, DTO logic) | 23 | PHPUnit 13 | `FileValidator`, `FileService`, `FileDeletionService`, `LocalStorageAdapter`, `ShareService`, `UserRegistrationService`, `User` entity |
| **Integration back** (repositories Doctrine) | 6 | PHPUnit 13 + Doctrine | `FileRepository`, `UserRepository` |
| **Functional back** (controllers, listeners) | 28 | PHPUnit 13 + KernelBrowser | `FileController` (upload + list + delete), `ShareController` (metadata + download), `AuthController` (register + login + me), `UploadSizeLimitListener` |
| **Unit front** (services, validation, components) | 122 | Vitest + React Testing Library + jsdom | Tous les services (auth, file, share), pages (Register/Login/Upload/Download/MyFiles), composants DS, RequireAuth |
| **E2E front** (parcours utilisateur) | 19 | Cypress + Electron headless | `register.cy.ts` (5), `login.cy.ts` (5), `upload.cy.ts` (2), `download.cy.ts` (2), `my-files.cy.ts` (5) |
| **Total** | **224** | | |

> Les 6 PHPUnit notices sont des warnings inhérents au framework (deprecations Symfony à venir, sans impact sur les assertions).

## 3. Outils

| Outil | Version | Usage |
|---|---|---|
| **PHPUnit** | 13.x | Tests back (unit + integration + functional) |
| **PCOV** | 1.0+ | Driver coverage PHP (~10× plus rapide qu'Xdebug, pas de profiling/debug) |
| **Vitest** | 4.x | Tests front + coverage front |
| **@vitest/coverage-v8** | 4.x | Driver coverage Vitest (V8 natif, pas d'instrumentation Babel) |
| **React Testing Library** | 16.x | DOM testing utilities |
| **jsdom** | 26.x | DOM env pour Vitest |
| **Cypress** | 15.x | E2E (Electron headless en CI local) |

## 4. Exécution locale

### Prérequis

- PHP 8.5 + extension PCOV active (`php -m | grep -i pcov` doit afficher `pcov`)
- Node 22+
- PostgreSQL 18 avec BDD `datashare_test` créée et migrations appliquées (auto-suffixe `_test` via `doctrine.yaml` quand `APP_ENV=test`)

### Back

```bash
# Tous les tests
cd api && APP_ENV=test php bin/phpunit

# Avec coverage
cd api && APP_ENV=test php bin/phpunit --coverage-html var/coverage --coverage-text
```

### Front

```bash
# Tous les tests Vitest
cd front && npx vitest run

# Avec coverage
cd front && npx vitest run --coverage
```

### E2E Cypress

```bash
# Prérequis : back en APP_ENV=test sur :8000 et front Vite sur :5173
cd front && npx cypress run

# Spec spécifique
cd front && npx cypress run --spec cypress/e2e/upload.cy.ts

# Mode interactif (debug)
cd front && npx cypress open
```

> ⚠️ Cypress wipe `datashare_test` (users + files) entre chaque run via les endpoints `/test/*/reset` (chargés uniquement quand `APP_ENV=test`). Pour restaurer un user de démo + 7 fichiers post-Cypress :
> ```bash
> cd api && APP_ENV=test php tests/fixtures/seed_files_demo.php
> # → user demo@datashare.fr / plainPassword + 5 fichiers actifs + 2 expirés
> ```

## 5. Couverture de code

Mesurée le **2026-05-11** (séance 14). Cible OC : **≥ 70 % sur le périmètre métier** (ambiguïté #8). Atteinte largement sur les 2 stacks.

### 5.1 Back (PHPUnit + PCOV)

```
Code Coverage Report:
  Summary:
    Classes: 53.33% (8/15)
    Methods: 83.61% (51/61)
    Lines:   93.71% (268/286)
```

| Composant | Méthodes | Lignes |
|---|---:|---:|
| `Controller/AuthController` | 100 % | 100 % |
| `Controller/FileController` | 80 % | 96,30 % |
| `Controller/ShareController` | 80 % | 95,24 % |
| `Entity/File` | 84,62 % | 90,48 % |
| `Entity/User` | 100 % | 100 % |
| `EventListener/UploadSizeLimitListener` | 50 % | 95,24 % |
| `Repository/FileRepository` | 100 % | 100 % |
| `Repository/UserRepository` | 100 % | 100 % |
| `Security/JsonAuthenticationSuccessHandler` | 100 % | 100 % |
| `Service/Deletion/FileDeletionService` | 100 % | 100 % |
| `Service/Share/ShareService` | 100 % | 100 % |
| `Service/Storage/LocalStorageAdapter` | 25 % | 78,26 % |
| `Service/Upload/FileService` | 50 % | 91,67 % |
| `Service/Upload/FileValidator` | 66,67 % | 84,62 % |
| `Service/UserRegistrationService` | 100 % | 100 % |

> **Note méthode** : la métrique « Méthodes » compte uniquement les méthodes 100 % couvertes. Une méthode partiellement testée (ex. branche `else` non exercée) compte 0. La métrique « Lignes » est le bon proxy pour la cible 70 %.

**Rapport HTML** : `api/var/coverage/index.html` (régénéré à chaque run, gitignored).

**Commande** : `cd api && APP_ENV=test php bin/phpunit --coverage-text --coverage-html var/coverage`

### 5.2 Front (Vitest + V8)

```
Statements   : 91.59% (403/440)
Branches     : 87.07% (256/294)
Functions    : 86.66% (104/120)
Lines        : 94.41% (372/394)
```

| Périmètre | Lignes | Notes |
|---|---:|---|
| `services/` (auth, file, share) | 100 % | Mapping HTTP → erreurs typées intégralement testé |
| `validation/` | 96,07 % | Lignes non couvertes : `formatFileSize` cas Go (non rencontré en test) |
| `pages/Login` | 93,93 % | |
| `pages/Register` | 94,28 % | |
| `pages/Upload` | 90,19 % | |
| `pages/Download` | 89,47 % | |
| `pages/MyFiles` | 90,38 % | |
| `components/RequireAuth` | 100 % | |
| `components/ui/Sidebar` | 100 % | |
| `components/ui/DropdownMenu` | 100 % | |
| `lib/apiClient.ts` | 33,33 % | Intercepteur Axios non testé en isolation (mocké via `vi.mock` dans les services tests, comportement vérifié indirectement) |

> Pages utilitaires `HomePage` et `DesignSystemPage` (placeholders, non couverts par la mesure dans la threshold) — restent visibles dans le rapport.

**Threshold configurée** dans `vite.config.ts` : `lines/functions/branches/statements ≥ 70` — fail le test run si une métrique passe sous.

**Rapport HTML** : `front/coverage/index.html` (régénéré à chaque run, gitignored).

**Commande** : `cd front && npx vitest run --coverage`

### 5.3 Périmètres

**Inclus dans la mesure (périmètre métier) :**
- Back : `Controller/`, `Service/`, `Repository/`, `Entity/`, `EventListener/`, `Security/`
- Front : `services/`, `validation/`, `pages/`, `components/`, `stores/`, `lib/`

**Exclus** (cf. `phpunit.dist.xml` `<exclude>` et `vite.config.ts` `coverage.exclude`) :
- `Dto/` : data classes pures, pas de logique testable
- `Exception/` : exceptions sans état (constructeur uniquement)
- `Kernel.php` : bootstrap framework
- `Controller/Test/` : endpoints test-only (consommés par Cypress via HTTP, pas testables en isolation PHPUnit)
- `**/*.test.{ts,tsx}`, `**/index.ts` : fichiers de test et barrels

### 5.4 Captures d'écran

Captures du rapport HTML à intégrer pour le livrable 1 (section 6 du PDF) :

- `docs/livrables/coverage-back.png` — capture de `api/var/coverage/index.html` (vue d'ensemble + détail par classe).
- `docs/livrables/coverage-front.png` — capture de `front/coverage/index.html`.

> Les captures sont générées à la demande (rapport HTML régénéré à chaque run, on capture la dernière version stable).

## 6. Accessibilité (WCAG 2.1 AA — cible engagée, ambiguïté #5)

| Outil | Vérification | Statut |
|---|---|---|
| **Lighthouse** | Audit accessibility par page (Home, Login, Register, Upload, Download, MyFiles) | À exécuter au lot 5 |
| **axe-core** | Détection auto des violations ARIA / contrastes / labels | À ajouter (manuel ou dev tool) |
| **Navigation clavier** | Focus order, focus visible (`outline 3px var(--color-focus) offset 2px`), pièges au focus | Validé au cas par cas pendant l'implémentation |
| **prefers-reduced-motion** | Animations CTA halo, sidebar drawer, skeletons | Implémenté (cf. `UploadPage.module.css`, `Sidebar.module.css`, `MyFilesPage.module.css`) |
| **Contraste connu sous AA** | Switch (segment sélectionné blanc sur fond corail, ratio ~2.92 < 4.5) | Écart conscient pour fidélité maquette, tracé ici et dans `Switch.tsx` |

## 7. CI/CD

**Pas de CI en MVP** — pilotage CI/CD est une compétence couverte par un autre projet du parcours OC. Conséquence : les tests sont exécutés en local par le référent tech avant chaque commit/PR. Mesure de coverage et captures faites à la main et versionnées dans ce document.

## 8. Évolutions V2

- **CI GitHub Actions** : workflow `tests.yml` qui run PHPUnit + Vitest + Cypress sur PR.
- **Coverage publié** sur Codecov (badge README).
- **Tests de régression visuelle** (Chromatic ou Percy) si on ajoute beaucoup de surface UI.
- **Tests de charge récurrents** (k6 cloud ou GitHub Actions cron) sur l'endpoint download.
- **Mutation testing** (Infection pour PHP) pour mesurer la qualité des tests au-delà de la couverture brute.
