# Contrat d'interface — DataShare MVP

> **Livrable étape 1 OC** — section 4 du Livrable 1 (« Documentation d'API »).
> **Spec formelle** : `docs/conception/openapi.yaml` (OpenAPI 3.0.3).
> **Périmètre** : 8 endpoints REST couvrant les 6 US MVP. Conventions, rationale, mapping US → endpoints.

## 1. Contexte

DataShare expose une API REST consommée par :

- Le **front React (SPA)** authentifié, pour les opérations privées (auth, gestion de fichiers).
- Les **destinataires de liens publics** (anonymes), pour consulter les métadonnées et télécharger un fichier partagé.

Le contrat est défini en **OpenAPI 3.0.3** dans `docs/conception/openapi.yaml`. Ce document Markdown sert de **synthèse narrative** : il explique les conventions transverses, le rationale, et fait le mapping avec les User Stories. Pour le détail formel des schémas et des codes de réponse, se référer à la spec.

## 2. Conventions transverses

### 2.1 Authentification

- **Pattern** : JWT Bearer (cf. ADR 0002, révisé 2026-04-28).
- **Header** : `Authorization: Bearer <token>` sur les endpoints privés.
- **Storage front** : `localStorage`.
- **Durée** : 8 h, pas de refresh token (cf. ADR 0002 D1, D2).
- **Endpoints publics** : `/auth/register`, `/auth/login`, `/share/{token}`, `/share/{token}/download` (pas de header d'auth).

### 2.2 Préfixe & versioning

- Toutes les routes sont sous `/api`.
- **Pas de préfixe `/v1/`** en MVP — à introduire en V2 si breaking change.

### 2.3 Format des réponses

#### Succès — envelope `data`

```json
{
  "data": { ... }
}
```

Pour les collections, `data` contient directement un array :

```json
{
  "data": [ ... ]
}
```

L'envelope prépare l'ajout de `meta` (pagination, total) en V2 sans breaking change.

**Exception** : les réponses `204 No Content` (DELETE) n'ont pas de body et donc pas d'envelope.

#### Erreurs — RFC 7807 Problem Details

`Content-Type: application/problem+json`

```json
{
  "type": "https://datashare.fr/errors/email-already-exists",
  "title": "Email already exists",
  "status": 409,
  "detail": "Un compte avec cet email existe déjà."
}
```

Pour les erreurs de validation 400, le champ `errors` (extension RFC 7807) liste les violations par champ :

```json
{
  "type": "https://datashare.fr/errors/validation-failed",
  "title": "Validation failed",
  "status": 400,
  "detail": "Plusieurs champs sont invalides.",
  "errors": {
    "email": ["Format invalide"],
    "password": ["Au moins 8 caractères requis"]
  }
}
```

### 2.4 Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Clés JSON | camelCase | `passwordHash`, `createdAt` |
| Dates | ISO 8601 UTC | `2026-04-28T14:32:11Z` |
| IDs | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` |
| Tailles fichier | bytes (`int64`) | `1048576` |
| MIME types | RFC 6838 | `application/pdf` |

### 2.5 Sécurité — points transverses

| Mesure | Endpoints | Justification |
|---|---|---|
| **Anti-énumération** | `POST /auth/login` | Message 401 générique sans distinguer email inconnu vs mot de passe faux (OWASP A07) |
| **Anti-énumération** | `DELETE /files/{id}` | 404 unifié pour fichier inexistant ET fichier d'autrui (anti-leak d'IDs, OWASP A01) |
| **Magic bytes server-side** | `POST /files` | Anti-renommage : extension client validée pour UX, type réel détecté serveur (cf. CLAUDE.md ambiguïté #6) |
| **`Content-Disposition: attachment`** | `GET /share/{token}/download` | Force le download au lieu de l'inline → mitigation XSS via fichiers HTML/SVG |
| **RFC 5987** sur `Content-Disposition` | `GET /share/{token}/download` | Encodage UTF-8 pour les noms de fichiers accentués (`filename*=`) |
| **Pas de CSRF** | Tous | Pattern Bearer, headers custom non auto-propagés cross-origin (cf. ADR 0002 D4 révisé) |

## 3. Mapping US → endpoints

| US | Endpoint | Note |
|---|---|---|
| US01 — Upload | `POST /api/files` | multipart/form-data, streaming back, ≤ 1 Go |
| US02 — Téléchargement | `GET /api/share/{token}` (métadonnées) + `GET /api/share/{token}/download` (stream) | URL email = route SPA `/d/{token}` qui appelle ces deux endpoints |
| US03 — Création de compte | `POST /api/auth/register` | Pas de JWT en réponse ; le token s'obtient via `/auth/login` (cf. ADR 0004) |
| US04 — Connexion | `POST /api/auth/login` | Pas d'endpoint logout (cf. ADR 0002 D6 révisé) |
| US05 — Historique | `GET /api/files` | Tri `createdAt DESC`, pas de pagination MVP |
| US06 — Suppression | `DELETE /api/files/{id}` | Hard delete (storage + BDD) |

**Endpoint support** (pas tiré d'une US, nécessaire au front) :

- `GET /api/me` — récupérer l'user connecté pour afficher l'email dans « Mon espace » et vérifier la session au refresh page.

## 4. Détail des endpoints

> Pour le contrat formel (schémas, codes, exemples machine-readable), voir `docs/conception/openapi.yaml`. Les sous-sections ci-dessous résument les points clés en français.

### 4.1 `POST /api/auth/register`

- **Auth** : non
- **Body** : `{ email, password }` — `password ≥ 8` chars
- **Succès 201** : `{ data: { user: { id, email, createdAt } } }` — pas de token (cf. ADR 0004 ; le token s'obtient via `/auth/login`)
- **Erreurs** : `400` (validation) | `409` (email déjà pris)

### 4.2 `POST /api/auth/login`

- **Auth** : non
- **Body** : `{ email, password }`
- **Succès 200** : `{ data: { token, user } }`
- **Erreurs** : `400` (validation) | `401` (identifiants invalides — message générique, anti-énumération)

### 4.3 `GET /api/me`

- **Auth** : oui
- **Succès 200** : `{ data: { id, email, createdAt } }`
- **Erreurs** : `401`

### 4.4 `POST /api/files`

- **Auth** : oui
- **Content-Type** : `multipart/form-data`, champ `file`
- **Succès 201** : `{ data: { id, name, sizeBytes, mimeType, createdAt } }`. Le front construit le lien à partager : `${origin}/d/${id}`.
- **Erreurs** : `400` (file manquant) | `401` | `413` (> 1 Go) | `415` (extension blacklistée OU magic bytes incohérents)

### 4.5 `GET /api/files`

- **Auth** : oui
- **Succès 200** : `{ data: [ FileSummary, ... ] }` — tri `createdAt DESC`
- **Erreurs** : `401`
- **Pas de pagination MVP** — `meta.{total,page}` ajouté en V2 sans breaking change.

### 4.6 `DELETE /api/files/{id}`

- **Auth** : oui
- **Succès 204** : pas de body, pas d'envelope
- **Erreurs** : `401` | `404` (inexistant, déjà supprimé OU pas à toi — unifié, anti-énumération)
- **Sémantique** : **storage purgé (hard delete du blob)** + **BDD soft delete (`deletedAt` set)**. La métadonnée reste en base pour l'historique « Mes fichiers » (badge « Expiré »). **Révisé 2026-05-11** : la version initiale prévoyait un hard delete BDD ; alignement sur le modèle de domaine qui prévoit `deletedAt` depuis l'étape 1, et sur l'UX `MyFilesPage` qui affiche l'historique des fichiers expirés.

### 4.7 `GET /api/share/{token}`

- **Auth** : non
- **Succès 200** : `{ data: { name, sizeBytes, mimeType, createdAt } }` — pas d'`id`, pas d'owner (privacy)
- **Erreurs** : `404`

### 4.8 `GET /api/share/{token}/download`

- **Auth** : non
- **Succès 200** : stream binaire
- **Headers de réponse** :
  - `Content-Type: <mimeType>`
  - `Content-Length: <sizeBytes>`
  - `Content-Disposition: attachment; filename="..."; filename*=UTF-8''...`
- **Erreurs** : `404`

## 5. Décisions structurantes

| # | Décision | Source |
|---|---|---|
| 1 | OpenAPI 3.0.3 (pas 3.1) | Validée — outillage Symfony plus rodé |
| 2 | Tout sous `/api`, pas de versioning | Validée |
| 3 | Ressource `share` cohérente pour métadonnées + download | Validée — un seul controller Symfony |
| 4 | **Pas d'auto-login** sur register (le token s'obtient uniquement via `/auth/login`) | Révisée 2026-05-04 — SRP entre `register` et `login` + extensibilité pour une future vérification d'email. ADR 0004 à rédiger. |
| 5 | RFC 7807 pour les erreurs | Validée — standard IETF |
| 6 | Envelope `data` côté succès | Validée — préparation V2 sans breaking change |
| 7 | Pas d'endpoint logout serveur | ADR 0002 D6 révisé — JWT Bearer = stateless |
| 8 | Pas de CSRF | ADR 0002 D4 révisé — pattern Bearer non vulnérable |
| 9 | Anti-énumération sur `/login` et `DELETE /files/{id}` | OWASP A01, A07 |
| 10 | Pas de pagination MVP | Validée — à ajouter en V2 sans breaking change grâce à l'envelope |

## 6. Évolutions V2 (préparées par la conception)

- **Pagination** sur `GET /api/files` : ajouter `?page=&limit=` et `meta: { total, page }` dans la réponse.
- **Refresh token** : nouvel endpoint `POST /api/auth/refresh` (cf. ADR 0002 évolutions).
- **Endpoint `POST /api/auth/logout`** + blacklist Redis si vrai logout serveur immédiat requis.
- **Health checks** : `/healthz`, `/readyz` (à mentionner dans `MAINTENANCE.md`).
- **US optionnelles** (07-10) : tags, mdp fichier, expiration, upload anonyme — schéma BDD déjà extensible (cf. `modele-domaine.md`).

## 7. Documentation interactive

Le YAML est conçu pour être chargé dans **Swagger UI** :

- **En local pendant la conception** : copier le contenu de `openapi.yaml` dans [editor.swagger.io](https://editor.swagger.io) pour visualisation.
- **En projet, après l'implémentation** : intégration via `NelmioApiDocBundle` (Symfony) qui exposera Swagger UI sur `/api/doc` en environnement dev. À configurer pendant l'implémentation. Le bundle peut soit consommer le YAML existant comme source de vérité, soit le générer depuis les annotations sur les controllers — choix d'outillage à acter au moment du code.

## 8. Références

- **`docs/conception/openapi.yaml`** — spec formelle OpenAPI 3.0.3
- **`docs/conception/modele-domaine.md`** — modèle de données
- **ADR 0001** — streaming upload (`docs/ai-collab/decisions/0001-streaming-upload.md`)
- **ADR 0002** — auth JWT (révisé 2026-04-28, `docs/ai-collab/decisions/0002-jwt-authentication.md`)
- **ADR 0003** — stack technique (`docs/ai-collab/decisions/0003-stack-technique.md`)
- **`CLAUDE.md`** — ambiguïtés #6 (extensions), #1 (hors MVP)
