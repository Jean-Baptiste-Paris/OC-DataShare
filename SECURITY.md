# SECURITY.md — DataShare MVP

> Mesures de sécurité, scans, vulnérabilités, et procédures de rotation des secrets.
> Référencé par la **section 5 du Livrable 1** (« Sécurité et gestion des accès »).

## 1. Authentification

### 1.1 Hashage des mots de passe

- **Algorithme** : `auto` (Symfony PasswordHasher) → résolu en **Argon2id** (recommandation OWASP A02 et NIST SP 800-63B).
- **Paramètres** : par défaut Symfony — `memory_cost = 65536`, `time_cost = 4`, `threads = 1`. En env `test` uniquement, paramètres assouplis (`time_cost = 3`, `memory_cost = 10`) pour ne pas ralentir la suite.
- **Salt** : intégré au hash Argon2id (auto-généré, unique par mot de passe).
- **Politique de complexité** : minimum **8 caractères** côté client (`authValidation.ts`) et serveur (Symfony Validator). Délibérément simple en MVP : on optimise pour ne pas frustrer l'utilisateur ; le hash Argon2id rend la brute-force d'un mot de passe > 8 chars économiquement non viable. À durcir en V2 avec un check anti-leaked-passwords (`have-i-been-pwned` API).
- **Hash conservé** : `User.passwordHash` (VARCHAR 255).

### 1.2 JWT

Cf. **ADR 0002** (`docs/ai-collab/decisions/0002-jwt-authentication.md`, révisé 2026-04-28). Décisions clés :

| Aspect | Choix | Justification |
|---|---|---|
| Algo | **HS256** | Symétrique, suffisant pour 1 issuer + 1 verifier (mono-service MVP) |
| Durée | **8 h** | UX assumée (frontière journée de travail) |
| Refresh token | **Non** en MVP | Simplicité ; ajout additif non breaking en V2 |
| Storage front | **localStorage** + `Authorization: Bearer` | Pattern dominant Symfony, intégration `LexikJWTAuthenticationBundle` standard |
| CSRF | **N/A** | Pattern Bearer non vulnérable (headers custom non auto-propagés cross-origin) |
| Logout | **Côté front** uniquement (`localStorage.removeItem('token')`) | JWT stateless, pas d'endpoint logout serveur en MVP |
| Payload | `sub` + `iat` + `exp` | Minimal, ne contient aucune donnée sensible |
| Algorithme `none` | **Interdit** (config Lexik défaut) | OWASP A07 — vulnérabilité historique de bibliothèques JWT mal configurées |

**Trade-off accepté** : XSS (cf. D3 ADR 0002). Mitigations : CSP stricte (à durcir en V2), audit deps automatisé (cf. §5), sanitization React (par défaut, JSX échappe les valeurs interpolées).

### 1.3 Rotation de la JWT passphrase

La keypair RSA (signe les JWT) est protégée par une passphrase stockée dans `.env.local` (et `.env.test.local`) — ces fichiers sont **gitignored** (cf. `.gitignore` ligne 31).

**Procédure de rotation** (à exécuter régulièrement en prod, au moins après tout incident suspect) :

```bash
# 1. Générer une nouvelle passphrase forte (≥ 256 bits)
openssl rand -base64 32

# 2. Mettre à jour JWT_PASSPHRASE dans .env.local et .env.<env>.local
# (les fichiers locaux ne sont pas versionnés)

# 3. Régénérer la keypair avec la nouvelle passphrase
APP_ENV=dev php bin/console lexik:jwt:generate-keypair --overwrite --no-interaction

# 4. Restart le back. Les sessions existantes deviennent 401, les users
#    devront se re-logger. Conséquence acceptée — pas de scénario keypair
#    rotation gracieuse en MVP (à introduire avec refresh token V2).
```

**Historique des rotations** :
- 2026-05-04 (séance 6) : génération initiale avec passphrase placeholder `changeme_generate_strong_passphrase` — dette tracée immédiatement.
- 2026-05-11 (séance 14) : **rotation effective** vers une passphrase 256 bits cryptographiquement forte. Dette purgée.

## 2. Anti-énumération (OWASP A01 / A07)

Trois endpoints unifient leurs codes d'erreur pour empêcher l'énumération de comptes ou d'identifiants.

| Endpoint | Cas confondus | Code | Pourquoi |
|---|---|---|---|
| `POST /api/auth/login` | Email inconnu OU mot de passe incorrect | **401 générique** (« Identifiants invalides. ») | Empêche un attaquant de découvrir quels emails sont enregistrés (OWASP A07) |
| `DELETE /api/files/{id}` | UUID malformé OU inexistant OU déjà supprimé OU appartenant à un autre user | **404 générique** (« Le fichier demandé est introuvable. ») | Empêche l'énumération d'IDs de fichiers d'autres users (OWASP A01) |
| `GET /api/share/{token}` et `/download` | Token UUID malformé OU inexistant OU pointant un fichier soft-deleted | **404 générique** (« Le lien est invalide ou le fichier n'est plus disponible. ») | Empêche un destinataire de distinguer un token jamais émis d'un token expiré, et limite la surface de brute-force sur l'espace UUID v7 |

Validation E2E : `login.cy.ts` (« même message générique pour mdp faux et user inconnu »), `my-files.cy.ts` (suppression d'un fichier d'un autre user → 404), `download.cy.ts` (token inconnu → 404).

## 3. Validation des fichiers uploadés

Cf. **ambiguïté #6** (`CLAUDE.md`).

### 3.1 Blacklist d'extensions (12 entrées)

Bloquées : `.exe .bat .cmd .com .scr .msi .ps1 .vbs .vbe .wsf .wsh .jar`

**Justification du choix « blacklist » (vs whitelist)** : DataShare est un service de partage générique — l'utilisateur s'attend à pouvoir envoyer ses CSV, ZIP, vidéos, etc. Une whitelist serait trop restrictive. La blacklist cible les exécutables Windows et le bytecode Java, qui représentent le risque résiduel de propagation de malware par le destinataire.

**Zone grise non bloquée** (légitimes assumés, le destinataire est responsable) : `.sh .py .js .zip .rar .7z .dmg .pkg .deb .rpm`.

### 3.2 Validation à 2 couches

| Couche | Mécanisme | Rôle |
|---|---|---|
| **Client** | `validation/uploadValidation.ts` — extension du nom de fichier | UX : feedback immédiat avant l'upload (économise un round-trip). **Pas une autorité sécurité.** |
| **Serveur** | `FileValidator` — extension client + magic bytes via `finfo` + cross-check `Symfony\Component\Mime\MimeTypesInterface` | Autorité. Anti-renommage : un `.exe` renommé en `.txt` est détecté par `finfo` (qui lit les magic bytes), puis cross-checké : si le MIME détecté implique une extension blacklistée, on rejette 415. |

**Posture serveur** : on **stocke et on sert** sans parser/preview/exécuter. Risque serveur ≈ nul ; le sujet est la **liabilité** + la **propagation visible** de malware.

### 3.3 Limite de taille (1 Go)

- **Côté client** : check `file.size` avant l'upload, message UX immédiat.
- **Côté serveur** : `UploadSizeLimitListener` inspecte `Content-Length` sur `kernel.request` (priorité 256, avant routeur/firewall) et rejette **413** RFC 7807 sans charger le body. Évite tout DoS par body trop gros.
- **Niveau infrastructure** : `public/.user.ini` règle `post_max_size = upload_max_filesize = 1100M` (10% de marge sur la limite applicative pour gérer l'overhead multipart).

### 3.4 Évolution V2 — antivirus

À horizon V2, intégration d'un scan antivirus (ex. **ClamAV**) après upload, avant exposition du lien public. À tracer dans `MAINTENANCE.md` comme procédure d'exploitation.

## 4. Sécurité réseau / browser

### 4.1 CORS

Configuration `nelmio/cors-bundle` :

- **Origin allowed** : `^https?://localhost(:[0-9]+)?$` en local (cf. `.env.local`). En prod : à restreindre à `https://app.datashare.fr` (origin unique).
- **Credentials** : `Authorization` header autorisé (Bearer JWT).
- **Pas de `Access-Control-Allow-Origin: *`** — rejet implicite des origins non listées.

### 4.2 HTTPS / TLS

- **Local dev** : HTTP plain (`http://127.0.0.1:8000` + `http://localhost:5173`).
- **Production cible** : HTTPS obligatoire (HSTS via reverse proxy ou load balancer). À documenter dans le runbook de déploiement (`MAINTENANCE.md`).

### 4.3 XSS

| Vecteur | Mitigation |
|---|---|
| Injection HTML via `name` de fichier | React JSX échappe par défaut toute interpolation (`{file.name}`). Aucun `dangerouslySetInnerHTML` dans le code. |
| Injection HTML via fichier servi | Endpoint download envoie `Content-Disposition: attachment` (force le download au lieu d'inline). Mitige les vecteurs HTML/SVG/PDF servis sur le même domaine. |
| Token JWT volé via XSS | Trade-off accepté (cf. ADR 0002 D3 et § 1.2). Mitigations à durcir en V2 : CSP stricte (`script-src 'self'`), Subresource Integrity, audit deps automatisé. |

### 4.4 Headers de sécurité

À configurer au niveau du reverse proxy en prod (non couvert par le code applicatif MVP) :

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; ...`
- `Referrer-Policy: strict-origin-when-cross-origin`

À tracer dans `MAINTENANCE.md` section déploiement.

## 5. Scan de dépendances

### 5.1 Méthodologie

Exécutés en local le **2026-05-11** via :

```bash
# Front : npm audit (CVE base GitHub Advisories)
cd front && npm audit              # full deps incl. devDeps
cd front && npm audit --omit=dev   # prod-only

# Back : composer audit (CVE base packagist + GitHub Advisories)
cd api && composer audit
cd api && composer audit --no-dev
```

### 5.2 Résultats

| Périmètre | Outil | Résultat |
|---|---|---|
| Front (full) | `npm audit` | **0 vulnerability** |
| Front (prod) | `npm audit --omit=dev` | **0 vulnerability** |
| Back (full) | `composer audit` | **No security vulnerability advisories found** |
| Back (prod) | `composer audit --no-dev` | **No security vulnerability advisories found** |

### 5.3 Vulnérabilités acceptées / ignorées

**Aucune** à ce jour. Si une CVE est détectée à l'avenir, le tableau ci-dessous documente la décision (corrigé / accepté / ignoré + raison) :

| Date | Package | Sévérité | CVE | Décision | Raison |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

### 5.4 Procédure de rotation

À chaque mise à jour majeure des deps (`npm install`, `composer update`), re-run les scans. À terme, **CI** (V2) : workflow GitHub Actions qui exécute `npm audit` et `composer audit` sur chaque PR avec `--audit-level=moderate` qui fail le job sur vuln moderate+.

## 6. Secrets et configuration

### 6.1 Fichiers gitignored (cf. `.gitignore`)

| Fichier | Contient | Risque si fuite |
|---|---|---|
| `api/.env.local` | `APP_SECRET`, `DATABASE_URL`, `JWT_PASSPHRASE`, `STORAGE_PATH`, `CORS_ALLOW_ORIGIN` | Compromission JWT signing → forgery de tokens |
| `api/.env.test.local` | Idem (env test) | Compromission BDD test |
| `api/config/jwt/private.pem` | Clé privée RSA (chiffrée par `JWT_PASSPHRASE`) | Forgery de tokens si la passphrase est aussi connue |
| `api/config/jwt/public.pem` | Clé publique RSA | Aucun risque (publique par définition) |
| `front/.env.local` | `VITE_API_URL` | Aucun risque applicatif (URL d'API publique) |

### 6.2 Procédure de provisioning prod

1. Générer `APP_SECRET` via `openssl rand -hex 32`.
2. Générer `JWT_PASSPHRASE` via `openssl rand -base64 32`.
3. Provisionner les secrets via Symfony Vault (`bin/console secrets:set`) ou via le système de secrets de l'orchestrateur (Kubernetes secrets, AWS Secrets Manager…).
4. Régénérer la keypair JWT avec la passphrase prod (`lexik:jwt:generate-keypair`).
5. Restreindre les permissions des fichiers `private.pem` à `0600 root:root`.

## 7. Audit & monitoring (V2)

Hors MVP — à introduire au déploiement effectif :

- **Logs structurés JSON** (cf. `PERF.md` §4) avec corrélation par `request_id` + `user_id` (claim JWT `sub`).
- **Logs d'audit dédiés** : login success/failure, file uploaded, file downloaded, file deleted — séparés des logs applicatifs, rétention longue (≥ 1 an).
- **Alerting** : pic de 401 sur `/auth/login` (brute-force probable), pic de 415 sur `/files` (tentatives d'upload de malware).
- **Rate limiting** : Symfony `RateLimiter` sur `/auth/login` (ex. 5 essais/min/IP) et sur `/files` (upload).

## 8. Références

- **OWASP Top 10 2021** — A01 (Broken Access Control), A02 (Cryptographic Failures), A07 (Identification and Authentication Failures).
- **NIST SP 800-63B** — Digital Identity Guidelines (politique mots de passe).
- **RFC 6749** (OAuth 2.0), **RFC 7519** (JWT), **RFC 7807** (Problem Details for HTTP APIs).
- **ADR 0001** — Streaming upload (`docs/ai-collab/decisions/0001-streaming-upload.md`).
- **ADR 0002** — JWT Authentication (`docs/ai-collab/decisions/0002-jwt-authentication.md`, révisé 2026-04-28).
