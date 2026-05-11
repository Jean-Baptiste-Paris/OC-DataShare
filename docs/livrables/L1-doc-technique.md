# Livrable 1 — Documentation technique (DataShare)

> Source du gabarit : `docs/P3+EDO+P4+AL+-+Modèle+de+Documentation+technique.odt`.
> Destinataire : évaluateur OC (jouant Lisa, responsable produit) + investisseurs fictifs.
> Export final attendu : PDF unique, fichier nommé `Nom_Prenom_1_documentation_042026.pdf`.

---

## 1. Architecture de l'application

### 1.1 Vue d'ensemble

DataShare suit une architecture **client/serveur découplée** en 3 couches : un **front SPA React** consomme une **API REST Symfony**, qui s'appuie sur une **base PostgreSQL** pour les métadonnées et un **stockage de fichiers abstrait** pour les blobs. Aucune dépendance externe n'est introduite en MVP.

**Schéma de référence** : `docs/conception/architecture.png` (export Lucidchart) — voir page de couverture du PDF.

### 1.2 Briques applicatives et leurs interactions

| Brique | Techno | Rôle | Interactions |
|---|---|---|---|
| **Front SPA** | React 18 + TypeScript + Vite | Pages utilisateur (auth, upload, download, historique, suppression) | Émet des appels HTTP/JSON vers l'API, stocke le JWT en `localStorage`, déclenche le download natif via `<a href download>` |
| **API REST** | Symfony 8 + PHP 8.5 + Doctrine 3 | 8 endpoints REST (cf. §4), validation, sécurité, orchestration | Lit/écrit la BDD via Doctrine, lit/écrit les blobs via `StorageInterface`, vérifie les JWT via Lexik |
| **BDD** | PostgreSQL 18 | Métadonnées : utilisateurs et fichiers (avec soft-delete) | Accédée par l'API uniquement, en pool de connexions standard |
| **Stockage fichiers** | FS local en V1, S3 en V2 (interface inchangée) | Persiste les blobs binaires des fichiers uploadés | Accédé par l'API via une **abstraction** `StorageInterface` (cf. ADR 0001 + ADR 0003 D4) |

### 1.3 Flux principaux

| Flux | Étapes |
|---|---|
| **Inscription / connexion** | Front → `POST /auth/register` ou `/auth/login` → BDD users → JWT signé HS256 retourné → stocké côté front en `localStorage`. |
| **Upload streamé** | Front → `POST /api/files` (multipart, header `Authorization: Bearer`) → middleware `Content-Length` (rejette 413 si > 1 Go) → `FileValidator` (extension blacklist + magic bytes) → `LocalStorageAdapter::store(stream, key)` (RAM constante) → `FileRepository::save` → 201 + `FileSummary`. |
| **Download par lien** | Destinataire (anonyme) → `GET /api/share/{token}` (métadonnées) → `GET /api/share/{token}/download` → `StreamedResponse` + `Content-Disposition: attachment` (RFC 5987) → stream depuis le storage vers le browser, RAM constante des deux côtés. |
| **Liste / suppression** | Front authentifié → `GET /api/files` (filtre owner, tri DESC) ou `DELETE /api/files/{id}` (storage purge + soft-delete `deletedAt`). |

### 1.4 Sécurisation des interactions

- **HTTPS partout en prod** (TLS termination au reverse proxy, cf. `MAINTENANCE.md` §2.4).
- **JWT Bearer** sur tous les endpoints privés (pas de cookie, pas de CSRF — cf. ADR 0002 D4).
- **CORS** restreint à l'origine de l'app front (`CORS_ALLOW_ORIGIN`).
- **Anti-énumération** sur `login`, `delete`, `share` (404/401 unifiés — cf. `SECURITY.md` §2).

### 1.5 Décisions architecturales structurantes (ADR)

5 ADR (Architecture Decision Records) tracent les décisions structurantes :

| # | Sujet | Synthèse |
|---|---|---|
| **0001** | Streaming upload | Lecture/écriture chunk-par-chunk côté serveur (RAM constante) ; agnostique au stockage via `StorageInterface` |
| **0002** | Authentification JWT | HS256, 8 h, `localStorage` + Bearer, sans refresh token en MVP |
| **0003** | Stack technique | Symfony + React + PostgreSQL + FS local — arbitré par 6 critères pondérés |
| **0004** | Pas d'auto-login sur register | SRP entre `/register` et `/login`, extensible à une vérification email V2 |
| **0005** | Design system front | CSS Modules + tokens `theme.css`, 9 composants (Button, Callout, DropdownMenu, Footer, Header, Input, Select, Sidebar, Switch) |

Détails dans `docs/ai-collab/decisions/`.

---

## 2. Choix technologiques justifiés (1-2 pages)

> **Seule section bornée explicitement.** Tableau à 4 colonnes imposé.

| Élément | Technologie choisie | Alternatives | Justification |
|---|---|---|---|
| Langage back | PHP 8.5+ | Java, C#, TypeScript | Cohérence avec Symfony, écosystème PHP moderne (types stricts, attributs, readonly, enums) |
| Framework back | Symfony 8.x | Spring Boot, .NET Core, NestJS, Laravel | Lecture pédagogique SOLID forte (services, DI explicite), pont conceptuel avec Django (usage pro probable), setup rapide pour MVP 4 semaines. Cf. ADR 0003. |
| ORM | Doctrine | Eloquent (Laravel), Prisma | Livré avec Symfony, mature, mapping objet-relationnel propre, migrations natives |
| Authentification | JWT (HS256, `localStorage` + header `Authorization: Bearer`, durée 8 h, sans refresh) | Session cookies, OAuth2 | JWT imposé par la spé OC. Stockage front en `localStorage`, transmission via header `Authorization: Bearer`. Stratégie complète dans ADR 0002. |
| Bundle JWT | Lexik JWT Authentication Bundle | Firebase JWT manuel | Standard Symfony, intégration sécurisée + commande de génération de keypair. |
| Langage front | TypeScript 5.x | JavaScript pur | Typage strict, maintenabilité, équivalent industriel en 2026 |
| Framework front | React 18+ | Vue, Angular | Productivité immédiate maximale (auto-évaluation 3/5 vs 1-2 pour Vue/Angular). Sur 4 semaines, l'écart compte. Cf. ADR 0003. |
| Gestion d'état | Zustand | Redux, Jotai, React Context | Léger (~1 ko), API minimaliste, actions async intégrées dans le store. Évite la verbosité Redux pour un MVP à 2 entités. |
| Build front | Vite | Webpack, Parcel | Bundling rapide, dev server natif, intégration React + TS sans config |
| Client HTTP | Axios | Fetch API, TanStack Query | Interceptors natifs : injection du header `Authorization: Bearer` et gestion centralisée des 401 sans wrapper maison. Évite le boilerplate répété sur chaque appel API. |
| Composants UI a11y | `@radix-ui/react-{toggle-group,select,switch,dropdown-menu}` | HeadlessUI, Reakit | Primitives non stylées, accessibilité WCAG par défaut sur Switch / Select / DropdownMenu (focus management, ARIA, navigation clavier) |
| Styling | CSS Modules + variables CSS dans `theme.css` | Tailwind, CSS-in-JS | Pédagogie SOLID (token ↔ composant), pas de runtime overhead, scoping local automatique |
| Base de données | PostgreSQL 18 | MongoDB | Modèle DataShare 100 % relationnel (User 1-N File, état dérivé `deletedAt`). Mongo serait artificiel. Standard de l'écosystème Django (transférable pro). |
| Stockage fichiers | FS local + abstraction `StorageInterface` | AWS S3 | Choix pédagogique : démontre DIP (`FileService` dépend de l'abstraction). Migration S3 en V2 sans toucher au code métier. Cohérent ADR 0001. |
| Tests back | PHPUnit 13 + PCOV | — | Standard Symfony, isolation BDD propre. PCOV ~10× plus rapide qu'Xdebug pour le coverage. |
| Tests front | Vitest 4 + React Testing Library + jsdom | Jest | Standard 2026 pour React + Vite |
| Coverage front | `@vitest/coverage-v8` | Istanbul | Driver V8 natif, pas d'instrumentation Babel |
| Tests E2E | Cypress 15 (Electron headless) | Playwright | 19 scénarios couvrant tout le parcours utilisateur (cf. spé page 8) |
| Test de performance | k6 1.7 (CLI) | Apache Bench, JMeter | DSL JS familier, thresholds intégrés, métriques riches out-of-the-box |
| Logs prod | Monolog 3 (formatter JSON sur `php://stderr`) | Custom logger | Pattern 12-factor app, intégration agrégateur (Loki, ELK…) sans glue code |

---

## 3. Modèle de données

### 3.1 Notation

**UML** retenu (pas Merise) — cohérent avec la stack orientée objet (Symfony/Doctrine mappe directement classes ↔ tables). L'artefact présenté est donc un **modèle de domaine UML** (équivalent fonctionnel du MCD Merise).

### 3.2 Diagramme de classes

Source : `docs/conception/modele-domaine.md` (Mermaid). Image SVG/PNG à intégrer ici dans le PDF.

```
┌─────────────────────────┐                    ┌──────────────────────────┐
│       <<entity>>        │                    │       <<entity>>         │
│         User            │                    │         File             │
├─────────────────────────┤                    ├──────────────────────────┤
│ + id : UUID             │                    │ + id : UUID              │
│ + email : String        │ 1            0..*  │ + userId : UUID          │
│ + passwordHash : String │────possède────────▶│ + name : String          │
│ + createdAt : DateTime  │                    │ + sizeBytes : Long       │
│ + updatedAt : DateTime  │                    │ + mimeType : String      │
└─────────────────────────┘                    │ + storageKey : String    │
                                               │ + createdAt : DateTime   │
                                               │ + updatedAt : DateTime   │
                                               │ + deletedAt : DateTime   │
                                               └──────────────────────────┘
```

Lecture des multiplicités UML :

- `1` côté User = pour 1 instance de `File`, il y a exactement 1 `User` propriétaire (en MVP — extensible à `0..1` pour US07 anonyme).
- `0..*` côté File = pour 1 `User`, il peut y avoir 0 à N `File` possédés.

### 3.3 Entités — détail des attributs

#### User

| Attribut | Type SQL | Contraintes | Origine |
|---|---|---|---|
| `id` | UUID v4 | PK | Identifiant non prédictible (cohérence ADR 0003) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, indexed, lowercased à l'écriture | US03 « adresse email doit être unique » + bonne pratique anti-doublon de casse |
| `password_hash` | VARCHAR(255) | NOT NULL, **Argon2id** via Symfony PasswordHasher | US03 « stocké de manière sécurisée (hashé, salé) » |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Audit |
| `updated_at` | TIMESTAMPTZ | NOT NULL, mise à jour auto via Doctrine `#[ORM\PreUpdate]` | Audit |

#### File

| Attribut | Type SQL | Contraintes | Origine |
|---|---|---|---|
| `id` | UUID v7 | PK | **Sert directement de share-token** dans l'URL `/d/{uuid}`. Cohérent US02 « identifiant unique non prédictible » |
| `user_id` | UUID | NULLABLE, FK → users(id), **ON DELETE SET NULL** | US01. NULLABLE en schéma pour anticiper US07 (upload anonyme) en V2 sans migration. En MVP : contrainte applicative (le service exige un user à la création). |
| `name` | VARCHAR(255) | NOT NULL | US05 « affiche le nom du fichier » |
| `size_bytes` | BIGINT | NOT NULL, CHECK (`> 0 AND <= 1073741824`) | US05 + ADR 0001 (limite 1 Go) |
| `mime_type` | VARCHAR(255) | NOT NULL | US02 « métadonnées : type » + `Content-Type` au download. Détecté serveur via magic bytes (cf. §5.3) |
| `storage_key` | VARCHAR(500) | NOT NULL | Clé opaque consommée par `StorageInterface` (cf. ADR 0003 D4). Séparée de l'`id` pour découpler URL publique et organisation interne du stockage (DIP). |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | US05 « date d'envoi » |
| `updated_at` | TIMESTAMPTZ | NOT NULL, mise à jour auto via Doctrine | Audit |
| `deleted_at` | TIMESTAMPTZ | NULLABLE — `NULL` = disponible, `NOT NULL` = supprimé | US06 soft delete + US05 état. Le blob est supprimé du stockage à la suppression ; la métadonnée est conservée pour l'historique. |

**Index** :

- PK sur `id` (BTree, automatique).
- **Composite `(user_id, created_at DESC)`** — sert directement la requête US05 « historique d'un user trié par date d'envoi décroissante ».

### 3.4 État dérivé

Le statut applicatif est calculé, non stocké :

```
deleted_at IS NULL     → status = "available"
deleted_at IS NOT NULL → status = "deleted"
```

Exposé dans `FileSummary` (cf. `docs/conception/openapi.yaml`).

### 3.5 Évolutions V2 préparées par la conception

| Évolution | Migration nécessaire |
|---|---|
| US07 upload anonyme | **Aucune** — `user_id` est déjà NULLABLE, juste relâcher la contrainte applicative |
| US08 tags | Création `tags` + table de jonction `file_tag` |
| US09 mdp fichier | `ALTER TABLE files ADD COLUMN password_hash VARCHAR(255) NULL` |
| US10 expiration | `ALTER TABLE files ADD COLUMN expires_at TIMESTAMPTZ NULL` + cron de purge |

---

## 4. Documentation d'API

### 4.1 Format et localisation

- **Format** : OpenAPI 3.0.3
- **Spec formelle** : `docs/conception/openapi.yaml` (8 endpoints couvrant les 6 US MVP)
- **Synthèse narrative** : `docs/conception/contrat-interface.md` (conventions, rationale, mapping US → endpoints)
- **Visualisation** : Swagger UI via [editor.swagger.io](https://editor.swagger.io) (copier-coller du YAML), ou intégration `NelmioApiDocBundle` en V2 sur `/api/doc`

### 4.2 Récap des 8 endpoints

| Méthode | Path | Auth | Code(s) succès | Code(s) erreur | US |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | non | 201 | 400, 409 | US03 |
| POST | `/api/auth/login` | non | 200 | 400, 401 (anti-énum) | US04 |
| GET | `/api/me` | oui | 200 | 401 | support |
| POST | `/api/files` | oui | 201 | 400, 401, 413, 415 | US01 |
| GET | `/api/files` | oui | 200 | 401 | US05 |
| DELETE | `/api/files/{id}` | oui | 204 | 401, 404 (anti-énum) | US06 |
| GET | `/api/share/{token}` | non | 200 | 404 | US02 |
| GET | `/api/share/{token}/download` | non | 200 + stream | 404 | US02 |

### 4.3 Conventions transverses

| Aspect | Choix |
|---|---|
| Préfixe / versioning | Tout sous `/api`, pas de `/v1/` en MVP (additif non breaking en V2) |
| Réponses succès | Envelope `{ data: ... }` (préparation pagination V2 sans breaking change) |
| Réponses erreur | **RFC 7807 Problem Details** (`Content-Type: application/problem+json`) |
| Casing JSON | camelCase (`sizeBytes`, `createdAt`) |
| Dates | ISO 8601 UTC |
| IDs | UUID v4 (User) / v7 (File — ordonnancement temporel naturel) |

---

## 5. Sécurité et gestion des accès

> Document opérationnel détaillé : `SECURITY.md`. Synthèse public-facing ci-dessous.

### 5.1 Authentification et mot de passe

- **Hashage** : Argon2id (recommandation OWASP A02 et NIST SP 800-63B), via Symfony PasswordHasher (algo `auto`).
- **Politique** : minimum 8 caractères. Délibérément simple en MVP — l'effort de calcul Argon2id rend la brute-force économiquement non viable. À durcir en V2 avec un check anti-leaked-passwords (HIBP).
- **Stockage** : `User.password_hash` (VARCHAR 255), salt intégré au hash.

### 5.2 JWT

- **Algorithme** : HS256, durée 8 h, payload minimal (`sub`, `iat`, `exp`).
- **Storage front** : `localStorage`, transmission via header `Authorization: Bearer`.
- **Logout** : suppression côté front (pas d'endpoint logout serveur — JWT stateless).
- **Rotation passphrase** : procédure documentée dans `SECURITY.md` §1.3 — passphrase 256 bits via `openssl rand -base64 32`, régénération keypair via `lexik:jwt:generate-keypair --overwrite`.
- **Pas de CSRF** : pattern Bearer non vulnérable (headers custom non auto-propagés cross-origin).
- **Trade-off accepté** : XSS (mitigations React échappement par défaut, CSP stricte en prod, audit deps continu).

### 5.3 Validation des fichiers uploadés

| Couche | Mécanisme | Rôle |
|---|---|---|
| Client | `validation/uploadValidation.ts` — extension du nom de fichier | UX : feedback immédiat. **Pas une autorité sécurité.** |
| Serveur | `FileValidator` — extension client + magic bytes via `finfo` + cross-check `MimeTypesInterface` | **Autorité.** Anti-renommage : un `.exe` renommé `.txt` est détecté par `finfo` puis rejeté 415. |

**Blacklist 12 extensions** : `.exe .bat .cmd .com .scr .msi .ps1 .vbs .vbe .wsf .wsh .jar`. Justification du « blacklist > whitelist » : DataShare est un service générique, l'utilisateur s'attend à pouvoir partager des CSV/ZIP/vidéos. La blacklist cible les exécutables Windows et le bytecode Java — risque résiduel de propagation de malware par le destinataire. Posture serveur : on stocke et on sert, sans parser/preview/exécuter.

**Limite 1 Go** : `UploadSizeLimitListener` rejette **413** sans charger le body (anti-DoS), `public/.user.ini` règle PHP-FPM à 1100 Mo.

### 5.4 Anti-énumération (OWASP A01 / A07)

| Endpoint | Cas confondus | Code | Pourquoi |
|---|---|---|---|
| `POST /auth/login` | Email inconnu OU mot de passe incorrect | 401 générique | Empêche la découverte de comptes (OWASP A07) |
| `DELETE /files/{id}` | UUID malformé / inexistant / déjà supprimé / appartenant à un autre user | 404 générique | Empêche l'énumération d'IDs (OWASP A01) |
| `GET /share/{token}` et `/download` | Token mal formé / inexistant / fichier soft-deleted | 404 générique | Empêche la distinction « jamais émis » vs « expiré » côté destinataire |

### 5.5 Scan de vulnérabilités

- `npm audit` (front, full + prod-only) : **0 vulnerability**
- `composer audit` (back, full + prod-only) : **No security vulnerability advisories found**
- Cadence : à chaque mise à jour majeure des deps + automatisation CI en V2.

---

## 6. Qualité, tests et maintenance

> Synthèse pour public externe. Détails opérationnels dans `TESTING.md`, `SECURITY.md`, `PERF.md`, `MAINTENANCE.md`.

### 6.1 Pyramide de tests

| Niveau | Outil | Volume |
|---|---|---|
| Unit back | PHPUnit + PCOV | 23 |
| Integration back | PHPUnit | 6 |
| Functional back | PHPUnit + KernelBrowser | 28 |
| Unit front | Vitest + RTL + jsdom | 122 |
| E2E | Cypress 15 (Electron headless) | 19 |
| **Total** | | **224** |

### 6.2 Couverture de code

| Stack | Lignes | Branches | Fonctions | Statements | Cible OC |
|---|---:|---:|---:|---:|---|
| Back (PCOV) | **93,71 %** | n/a | 83,61 % | n/a | ≥ 70 % ✅ |
| Front (V8) | **93,5 %** | 86,48 % | 85,95 % | 90,8 % | ≥ 70 % ✅ |

Threshold à 70 sur Vitest qui fail le run si une métrique passe en-dessous. Captures HTML : `api/var/coverage/index.html` et `front/coverage/index.html`.

### 6.3 Performance

- **Endpoint critique back** (cf. ambiguïté #4) : `GET /api/share/{token}/download`. Test k6 50 VUs/1 min : **172 req/s, p95 = 453 ms, 0 erreur sur 10 344 downloads, 11 GB transférés à 181 MB/s**. **Valide ADR 0001 streaming sous charge** (RAM PHP stable 80-100 Mo malgré le volume).
- **Front (Lighthouse)** : Performance **98/100**, Best Practices **100/100**, A11y 92/100. Bundle JS **133 KB gzipped** (cible 250 KB largement battue). FCP 2,0 s, TBT **0 ms**, CLS **0**.

### 6.4 Maintenance

- **Procédures opérationnelles complètes** dans `MAINTENANCE.md` : MAJ deps (cadence patch sécu < 7j, mineur trimestriel, majeur annuel), déploiement cible, rollback (applicatif blue/green, BDD via Doctrine `migrate prev`, storage GC manuel post-rollback), sauvegarde (pg_dump quotidien + rsync incrémental storage), monitoring V2 (SLI/SLO + alertes), support runbook (réinitialisation user, suppression d'urgence pour signalement abus).
- **RTO** restart applicatif < 1 min, restore BDD < 30 min. **RPO** 24 h en MVP (à durcir avec WAL archiving en V2).

### 6.5 Accessibilité

- **Cible engagée** : WCAG 2.1 AA (cf. ambiguïté #5).
- **Score Lighthouse** : 92/100 sur les pages publiques.
- **Patterns en place** : focus visible (`outline 3px var(--color-focus)`), `prefers-reduced-motion` sur toutes les animations (CTA halo, sidebar drawer, skeletons), navigation clavier via Radix UI (Switch, Select, DropdownMenu, Dialog), ARIA labels sur tous les inputs.
- **Écart conscient** : contraste segment actif Switch (texte blanc / fond corail #E77A6E ratio 2,92 < AA 4,5). Tracé dans `Switch.tsx` + `TESTING.md` §6, à revoir avec design en V2.

---

## 7. Processus d'installation et d'exécution

> Détail complet dans le `README.md` à la racine du repo. Synthèse ci-dessous.

### 7.1 Prérequis

| Dépendance | Version |
|---|---|
| PHP | 8.5+ avec extensions `pdo_pgsql`, `intl`, `mbstring`, `openssl`, `curl`, `fileinfo` |
| PCOV | 1.0+ (driver coverage) |
| Composer | 2.x |
| Node.js | 22+ |
| PostgreSQL | 18 |
| Symfony CLI | optionnel (recommandé) |
| k6 | optionnel (test de perf, `brew install k6`) |

### 7.2 Installation (1 commande)

```bash
git clone https://github.com/Jean-Baptiste-Paris/OC-DataShare.git
cd OC-DataShare
make install
```

`make install` enchaîne : `composer install`, `npm install`, génération des `.env.local` (avec passphrase JWT aléatoire), création des BDDs `datashare` + `datashare_test`, application des migrations Doctrine, génération de la keypair JWT, création des dossiers de stockage.

### 7.3 Lancement

```bash
make back       # back Symfony en APP_ENV=test sur :8000
make front      # front Vite sur :5173
make seed-demo  # (optionnel) user demo + 7 fichiers fixtures
```

→ ouvrir http://localhost:5173.

### 7.4 Variables d'environnement

| Variable | Description |
|---|---|
| `APP_ENV` | `dev` / `test` / `prod` |
| `DATABASE_URL` | Connexion PostgreSQL |
| `JWT_PASSPHRASE` | Passphrase keypair JWT (256 bits, `openssl rand -base64 32`) |
| `JWT_SECRET_KEY` / `JWT_PUBLIC_KEY` | Chemins vers les clés Lexik |
| `STORAGE_PATH` | Racine du stockage de fichiers |
| `CORS_ALLOW_ORIGIN` | Regex de l'origine autorisée |
| `VITE_API_URL` (front) | URL de l'API back |

Détail prod et procédure de provisioning des secrets : `MAINTENANCE.md` §2.3.

### 7.5 Tests, perf, audit

```bash
make test-back-coverage     # PHPUnit + PCOV → rapport HTML
make test-front-coverage    # Vitest + V8 → rapport HTML
make test-e2e               # Cypress (back + front doivent tourner)
make perf-download          # k6 50 VUs/1 min
make audit                  # npm audit + composer audit (full + prod-only)
```

---

## 8. Utilisation de l'IA dans le développement

> Synthèse de `docs/ai-collab/journal.md` (14 séances, 2026-04-19 → 2026-05-11).

### 8.1 Posture adoptée

**Binômage exigeant et asymétrique** tout au long du projet :

- Le **référent tech** (auteur) pilote, conçoit l'architecture, assigne les tâches de code et **revoit systématiquement** les productions. La règle absolue posée dès la séance 1 (`CLAUDE.md`) : **ne jamais démarrer une implémentation sans feu vert explicite** + **expliquer en amont quoi/à quoi ça sert/pourquoi** pour tout concept ou pattern nouveau.
- Le **copilote IA** propose, argumente, code après validation, montre les diffs, suggère les commits.

**Évolution de la posture au fil du projet** :

| Phase | Posture |
|---|---|
| Étapes 1-2 (conception, socle) | Pédagogie granulaire — le référent tech apprend Symfony en parallèle, posture « junior actif sous supervision » |
| Étape 3 (auth US03+US04) | Implémentation sous supervision rapprochée, ADR rédigés en duo |
| Étape 4 — US01 (vitrine OC) | **Méthodologie OC à la lettre** sur cette US : branche dédiée, sous-tâches isolées en commits `feat(ai):`, validation orale par sous-tâche. Doc dédiée `docs/ai-collab/vitrine-us01-upload.md`. |
| Étape 4 — US02/05/06 (collaboration normale) | Autonomie large côté back, validation UI itérative côté front. Style commit standard sans `feat(ai):`. |
| Étape 5 (qualité) | Consigne très prescriptive, exécution séquentielle en 5 lots, peu d'arbitrage — découpage initial via `AskUserQuestion`. |

### 8.2 Tâches confiées à l'IA

| Type de tâche | Exemples concrets |
|---|---|
| **Conception** | Modèle de domaine UML, contrat d'interface (8 endpoints), OpenAPI 3.0.3, schéma d'architecture, 5 ADRs (Nygard) |
| **Implémentation back** | 6 US MVP : entités Doctrine, services métier, controllers, validators, listener, security config, migrations |
| **Implémentation front** | 9 composants DS, 6 pages, 3 services, 1 store Zustand persisté, 1 wrapper RequireAuth |
| **Tests** | 224 tests (77 PHPUnit + 128 Vitest + 19 Cypress), seeds idempotents (UI passe + perf k6) |
| **Outillage qualité** | Configuration coverage PCOV + V8, scénario k6 (download endpoint critique), Monolog JSON prod |
| **Documentation** | 4 fichiers qualité (`TESTING/SECURITY/PERF/MAINTENANCE`), README, Makefile, docs de conception, journal de collaboration au fil de l'eau |

### 8.3 Supervision et corrections apportées

3 catégories de recadrages, tracées au fil du journal :

**Recadrages d'architecture** (le copilote a divergé du modèle/ADR)

- **Séance 11 — Entité File** : 1ère version codée sans relire le modèle de domaine → 5 divergences (enum `state` vs `deletedAt`, `owner_id` vs `user_id`, `INT` vs `BIGINT`+CHECK, timestamps WITHOUT TIME ZONE vs `TIMESTAMPTZ`, index simple vs composite). Le référent tech a posé la question « on est conforme au schéma prévu ? » → réécriture complète de l'entité + migration. **Conséquence méta** : règle ajoutée à la mémoire IA — grep des ADR/conception avant chaque sous-tâche.
- **Séance 11 — StorageInterface** : 1ère signature `store($source): string` (génère la clé) divergeait de l'ADR 0003 D4 `store(stream, key): void` (caller fournit la clé). Refactor + ADR mis à jour.
- **Séance 13 — Contrat-interface §4.6** : initialement « hard delete » (storage + BDD), incohérent avec le modèle de domaine qui prévoyait `deletedAt` depuis l'étape 1. Le copilote a flaggé l'incohérence en cours de passe UI → révision contrat « storage purgé + BDD soft delete », OpenAPI mis à jour avec champ `status`.

**Recadrages de scope MVP** (le user a demandé du hors-MVP, le copilote a flaggé)

- **Séance 12 — US10 expiration** : le user a demandé un callout « expire dans X jours » sur la page download. Flag immédiat (US10 hors MVP par 4 sources : `CLAUDE.md` ambiguïté #1, modèle de domaine sans `expires_at`, OpenAPI sans `expiresAt`, `NOTES.md`). 4 options proposées via `AskUserQuestion`, user a tranché « masquer + tracer NOTES.md ».
- **Séance 13 — Switch statut Mes fichiers** : revirement complet en cours de séance sur l'arbitrage initial « masquer les soft-deleted ». Modifs : repo + DTO + 4 tests + UI Switch 3 segments. Tracé.

**Recadrages de qualité de code/UX**

- **Séance 12 + 13 — Style bouton non aligné DS** : récidive identifiée. Le copilote stylait à la main des éléments visuellement proches d'un composant DS (Button.primary) au lieu de répliquer ses tokens. Mémoire ajoutée séance 13 (`feedback_align_ds_avant_style.md`).
- **Calibration cognitive séance 11** : surcharge du référent tech après 5 décisions empilées. Pause + recalibration + 2 mémoires ajoutées (profil pro, style de communication).
- **Itérations UI visuelles** : ~12-15 micro-ajustements par passe UI (taille, padding, fond, alignement). Pattern coûteux non rationalisé — limite tracée.

### 8.4 Apports et limites constatés

**Apports**

- **Vitesse de production** : 224 tests + 14 séances + 5 ADRs + 4 docs qualité + 8 endpoints + 9 composants DS livrés en ~25 jours calendaires. La consigne 60 h s'est traduite en environ ~50 h effectives — gain net du copilote sur la productivité brute.
- **Discipline méthodologique** : la posture « explication amont + validation explicite » empêche le copilote de partir en autonomie. Le référent tech reste **auteur des décisions**, le copilote reste **exécutant éclairé**.
- **Vitrine OC US01** : la méthodologie isolée sur 1 US (branche dédiée, commits `feat(ai):`, journal détaillé, doc dédiée) répond à la lettre à la consigne « IA sur 1 US uniquement ». Comparaison vitrine ↔ collaboration normale (US02/05/06) à raconter à l'oral comme illustration de la maîtrise du curseur posture.
- **Rigueur de test continue** : la pyramide a grandi à mesure des US, sans rattrapage en fin de projet. Coverage 93,7 % back / 93,5 % front, cible OC 70 % battue 1,3×.
- **Mémoire IA persistante enrichie** : 17 mémoires sur le profil user + le style de communication + les arbitrages méthodologiques + les pièges (modèle de domaine vs code, DS vs style customisé). La calibration ne se perd pas entre séances.

**Limites**

- **Divergences silencieuses** : 2 fois (séance 11), le copilote a produit du code qui divergeait des ADR sans le voir lui-même. Sans la vigilance du référent tech, c'eût été embarrassant. Mémoire ajoutée pour systématiser le grep des ADR — efficace dès la séance 12.
- **Récidive style DS** : le pattern « stylé manuellement au lieu d'aligner sur le DS » s'est répété séances 12 et 13. La leçon n'avait pas été ancrée en mémoire. Maintenant inscrite (`feedback_align_ds_avant_style.md`).
- **Itérations UI non rationalisées** : sur des passes visuelles longues (~15 micro-ajustements), pas de mécanisme efficace de batching trouvé. Coût d'allers-retours pour le référent tech.
- **Couplage US06 in-flight** (séance 13) : décider d'ajouter US06 en milieu de séance pour rendre fonctionnel un bouton initialement cosmétique a allongé la séance. Pattern à manier prudemment — accepter le scope creep est facile, le tenir est plus dur.
- **Surcharge cognitive du référent tech** : la densité de décisions à valider sur certaines séances (notamment la séance 11) a généré un « cuit ». Recalibration faite, mais le mécanisme d'alerte précoce du copilote (« on coupe là ? ») n'a pas été déclenché à temps.
- **Cause racine du `streamed = true` prématuré** (séance 12) : le test fonctionnel sur le body streamé download n'a pas pu être complété, suspicion profiler test env non confirmée. Couverture déléguée aux unit tests amont — asymétrie de pyramide tracée. Dette V2.

### 8.5 Conclusion

L'IA a été un **multiplicateur de productivité conditionné à une supervision active**. Les artefacts livrés (code, tests, documentation) sont **directement défendables à l'oral** parce que chaque décision a été argumentée et validée — le copilote n'est jamais « parti seul ». La traçabilité dans le journal et les ADRs permet de rejouer chaque arbitrage. La distinction posture vitrine/collaboration normale, voulue par la consigne OC, est devenue un atout pédagogique : elle illustre la maîtrise consciente du curseur d'autonomie.
