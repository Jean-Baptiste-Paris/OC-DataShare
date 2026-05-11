# DataShare

> Plateforme de partage de fichiers via lien unique pour freelances et petites entreprises.
> Projet du parcours OpenClassrooms **Architecte Logiciel** — cours « Pilotez le développement d'une application full-stack complète ».

---

## Pitch

DataShare permet à un utilisateur authentifié de **téléverser un fichier** (jusqu'à 1 Go), d'obtenir un **lien public unique** à partager, et au destinataire de **télécharger le fichier sans compte**. L'expéditeur retrouve son **historique** dans une vue dédiée et peut **supprimer ses fichiers** à tout moment.

Architecture **front (React/TypeScript) + back (Symfony/PHP) + PostgreSQL + stockage abstrait** (FS local en V1, S3-ready en V2).

## Stack

| Couche | Techno | Version |
|---|---|---|
| Back | Symfony, PHP, Doctrine ORM | 8.x / 8.5+ / 3.x |
| Auth | Lexik JWT Bundle (HS256, 8 h, Bearer) | 3.x |
| Front | React, TypeScript, Vite, Zustand, Axios | 18+ / 5.x / 8.x / 5.x / 1.x |
| BDD | PostgreSQL | 18 |
| Stockage | FS local via `StorageInterface` (S3 en V2) | — |
| Tests | PHPUnit (back), Vitest + RTL (front), Cypress (E2E) | 13.x / 4.x / 15.x |
| Perf | k6 sur l'endpoint download critique | 1.7.x |

Stack arbitrée dans **ADR 0003** (`docs/ai-collab/decisions/0003-stack-technique.md`).

## Documentation

| Document | Rôle |
|---|---|
| [`TESTING.md`](./TESTING.md) | Plan de tests, pyramide (224 tests), coverage (back 93,7 % / front 93,5 % lignes), accessibilité |
| [`SECURITY.md`](./SECURITY.md) | Authentification, JWT, anti-énumération, blacklist + magic bytes, scans deps (0 vuln), procédures rotation |
| [`PERF.md`](./PERF.md) | Endpoint critique (k6 download, 172 req/s, p95 453 ms), budget perf front (Lighthouse 98/100, bundle 133 KB gzipped), métriques clés, optimisations |
| [`MAINTENANCE.md`](./MAINTENANCE.md) | Procédures MAJ deps, déploiement, rollback, sauvegarde/restauration, monitoring V2, support |
| [`docs/conception/`](./docs/conception/) | Modèle de domaine UML, contrat d'interface API, OpenAPI 3.0.3, notes techniques |
| [`docs/ai-collab/decisions/`](./docs/ai-collab/decisions/) | 5 ADRs (streaming upload, JWT auth, stack, no-auto-login, design system) |
| [`docs/ai-collab/journal.md`](./docs/ai-collab/journal.md) | Journal de collaboration avec le copilote IA (séances 1 → 14, alimente la section 8 du livrable OC) |

---

## Prérequis

| Dépendance | Version |
|---|---|
| **PHP** | 8.5+ avec extensions `pdo_pgsql`, `intl`, `mbstring`, `openssl`, `curl`, `fileinfo` |
| **PCOV** | 1.0+ (driver coverage PHPUnit) |
| **Composer** | 2.x |
| **Node.js** | 22+ |
| **npm** | 10+ |
| **PostgreSQL** | 18 (créer une BDD `datashare` accessible avec un user qui peut `CREATE`) |
| **Symfony CLI** | optionnel (recommandé pour le serveur de dev) |
| **k6** | optionnel (test de perf, `brew install k6`) |

> Sur macOS, Herd ou Laravel Valet fournissent PHP + extensions clés en un clic.

---

## Installation rapide

```bash
git clone https://github.com/Jean-Baptiste-Paris/OC-DataShare.git
cd OC-DataShare

# Setup complet en 1 commande (cf. Makefile)
make install
```

Le `make install` enchaîne :

1. `composer install` côté back
2. `npm install` côté front
3. Création des fichiers `.env.local` (back + front) à partir des templates si absents
4. Création de la BDD `datashare` (dev) et `datashare_test` (tests) si absentes
5. Application des migrations Doctrine sur les deux BDDs
6. Génération de la keypair JWT avec une passphrase aléatoire
7. Création des dossiers de stockage (`api/var/storage`, `api/var/storage_test`)

Voir le détail de chaque étape dans le [`Makefile`](./Makefile) et dans [`MAINTENANCE.md`](./MAINTENANCE.md) §2.

## Lancement

Trois processus à démarrer dans 3 terminaux séparés :

```bash
# 1. Back Symfony (port 8000)
make back        # → APP_ENV=test (pour avoir les endpoints /test/* utiles à Cypress et au seed UI)
# OU sans Make :
cd api && APP_ENV=test symfony server:start --no-tls --port=8000

# 2. Front Vite (port 5173)
make front
# OU sans Make :
cd front && npm run dev

# 3. (Optionnel) Seeder un user de démo + 7 fichiers fixtures pour la passe UI
make seed-demo
# → user demo@datashare.fr / mot de passe plainPassword
```

Ouvrir http://localhost:5173 dans le navigateur.

## Tests

```bash
# Back (unit + integration + functional)
make test-back              # → APP_ENV=test php bin/phpunit

# Back avec coverage HTML (rapport dans api/var/coverage/index.html)
make test-back-coverage

# Front (unit + components)
make test-front             # → npx vitest run

# Front avec coverage HTML (rapport dans front/coverage/index.html)
make test-front-coverage

# E2E Cypress (back + front doivent tourner)
make test-e2e               # → cd front && npx cypress run

# Tout
make test-all
```

> ⚠️ Cypress wipe `datashare_test` à chaque run via les endpoints `/test/*/reset`. Pour restaurer le user et fichiers de démo après un Cypress run : `make seed-demo`.

## Test de performance

```bash
# Lance un scenario k6 (50 VUs, 1 min) sur GET /api/share/{token}/download
make perf-download
```

Cf. [`PERF.md`](./PERF.md) §3 pour le détail du scénario et §4 pour les résultats du run de référence.

---

## Structure du repo

```
DataShare/
├── api/                          # Back Symfony
│   ├── src/
│   │   ├── Controller/           # AuthController, FileController, ShareController, Test/
│   │   ├── Dto/                  # Data classes pures (réponses JSON)
│   │   ├── Entity/               # User, File (Doctrine)
│   │   ├── EventListener/        # UploadSizeLimitListener (413 Content-Length)
│   │   ├── Exception/            # Exceptions métier
│   │   ├── Repository/           # UserRepository, FileRepository
│   │   ├── Security/             # JsonAuthenticationSuccessHandler
│   │   └── Service/              # Upload/, Share/, Deletion/, Storage/
│   ├── tests/                    # PHPUnit (Unit, Integration, Functional)
│   │   ├── fixtures/             # seed_files_demo.php (passe UI)
│   │   └── perf/                 # seed_perf_blob.php + download.k6.js
│   └── config/                   # security.yaml, doctrine.yaml, monolog.yaml, services.yaml
│
├── front/                        # Front React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── RequireAuth.tsx   # Wrapper route privée
│   │   │   └── ui/               # Design system : Button, Callout, DropdownMenu, Footer, Header, Input, Select, Sidebar, Switch
│   │   ├── lib/                  # apiClient (Axios + JWT interceptor)
│   │   ├── pages/                # HomePage, Login, Register, Upload, Download, MyFiles, DesignSystem
│   │   ├── services/             # authService, fileService, shareService
│   │   ├── stores/               # authStore (Zustand + persist)
│   │   ├── styles/               # theme.css (DS tokens)
│   │   ├── types/                # auth, file, share
│   │   └── validation/           # uploadValidation, authValidation
│   └── cypress/e2e/              # Specs E2E (register, login, upload, download, my-files)
│
├── docs/
│   ├── ai-collab/                # ADRs + journal de collaboration IA
│   ├── conception/               # Modèle de domaine, contrat d'interface, OpenAPI, schémas
│   ├── livrables/                # L1 doc technique source markdown, lighthouse reports
│   └── maquettes/                # Exports PNG Figma (gitignored)
│
├── README.md                     # Ce fichier
├── TESTING.md                    # Plan de tests + coverage + accessibilité
├── SECURITY.md                   # Sécurité, scans, secrets
├── PERF.md                       # Perf back (k6) + budget front (Lighthouse) + métriques + Monolog
├── MAINTENANCE.md                # Procédures opérationnelles
├── Makefile                      # Raccourcis install/dev/test/perf
└── .gitignore
```

## User stories couvertes (MVP)

| US | Endpoint | Couverture tests |
|---|---|---|
| US01 — Upload | `POST /api/files` | Unit + Functional + E2E |
| US02 — Download via lien | `GET /api/share/{token}` + `/download` | Functional + E2E |
| US03 — Création de compte | `POST /api/auth/register` | Unit + Functional + E2E |
| US04 — Connexion | `POST /api/auth/login` + `GET /api/me` | Functional + E2E |
| US05 — Historique | `GET /api/files` | Integration + Functional + E2E |
| US06 — Suppression | `DELETE /api/files/{id}` | Unit + Functional + E2E |

US optionnelles (US07 anonyme, US08 tags, US09 mdp fichier, US10 expiration auto) **explicitement hors MVP** — schéma BDD et UI laissés extensibles, cf. modèle de domaine et `docs/maquettes/NOTES.md`.

---

## Crédits / Licence

Projet réalisé dans le cadre du parcours **OpenClassrooms Architecte Logiciel** par **Jean-Baptiste Paris**. Code propriétaire, usage pédagogique uniquement.
