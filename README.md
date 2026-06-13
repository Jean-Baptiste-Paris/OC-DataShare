# DataShare

> Partage de fichiers sécurisé via lien unique pour freelances et petites entreprises.
> Projet OpenClassrooms **Architecte Logiciel** — MVP full-stack en 4 semaines.

Upload (jusqu'à 1 Go, streaming RAM-constant), lien public unique pour téléchargement anonyme, historique et suppression. Architecture front/back découplée avec abstraction du stockage S3-ready.

## Stack

| Couche | Techno | Version |
|---|---|---|
| Back | Symfony + PHP + Doctrine | 8.x / 8.5+ / 3.x |
| Auth | Lexik JWT Bundle (HS256, 8 h, Bearer) | 3.x |
| Front | React + TypeScript + Vite + Zustand + Axios | 18+ / 5.x / 8.x / 5.x / 1.x |
| BDD | PostgreSQL | 18 |
| Stockage | FS local via `StorageInterface` (S3-ready en V2) | — |
| Tests | PHPUnit · Vitest + RTL · Cypress | 13.x / 4.x / 15.x |

## Installation

Prérequis : PHP 8.5+, Node.js 22+, PostgreSQL 18, Composer 2.x.

```bash
git clone https://github.com/Jean-Baptiste-Paris/OC-DataShare.git
cd OC-DataShare
make install
```

`make install` installe les dépendances, crée les BDDs, applique les migrations et génère la keypair JWT.

## Lancement

```bash
make back        # API Symfony — port 8000
make front       # Front Vite  — port 5173
make seed-demo   # (optionnel) user démo + 7 fichiers fixtures
```

Ouvrir http://localhost:5173.

## Tests

```bash
make test-back           # PHPUnit  — 77 tests, coverage 93,7 %
make test-front          # Vitest   — 128 tests, coverage 93,5 %
make test-e2e            # Cypress  — 19 scénarios (back + front doivent tourner)
make test-back-coverage  # Rapport HTML → api/var/coverage/
make test-front-coverage # Rapport HTML → front/coverage/
```

> Les specs Cypress réinitialisent `datashare_test`. Pour restaurer les données de démo après un run E2E : `make seed-demo`.

## Performance

```bash
make perf-download  # k6 — 50 VUs / 1 min sur GET /api/share/{token}/download
```

Résultats de référence : 172 req/s, p95 = 453 ms, 0 erreur sur 10 344 downloads. Cf. [PERF.md](PERF.md).

## Documentation

| | |
|---|---|
| [TESTING.md](TESTING.md) | Plan de tests, pyramide, coverage, accessibilité |
| [SECURITY.md](SECURITY.md) | Auth, JWT, anti-énumération, scans deps (0 vuln) |
| [PERF.md](PERF.md) | k6 endpoint critique, budget Lighthouse 98/100, métriques |
| [MAINTENANCE.md](MAINTENANCE.md) | Procédures MAJ, déploiement, rollback, sauvegarde |
| [docs/conception/](docs/conception/) | Modèle de domaine UML, OpenAPI 3.0.3, contrat d'interface |
| [docs/ai-collab/decisions/](docs/ai-collab/decisions/) | 5 ADRs (streaming, JWT, stack, auto-login, design system) |

---

Projet réalisé dans le cadre du parcours **OpenClassrooms Architecte Logiciel** par **Jean-Baptiste Paris**. Usage pédagogique uniquement.
