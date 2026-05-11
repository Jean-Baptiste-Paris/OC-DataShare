# MAINTENANCE.md — DataShare MVP

> Procédures opérationnelles : mise à jour des dépendances, déploiement, rollback, monitoring, support.
> Référencé par la **section 6 du Livrable 1** (« Qualité, tests et maintenance »).

## 1. Mise à jour des dépendances

### 1.1 Cadence

| Type | Fréquence cible | Outil | Owner |
|---|---|---|---|
| **Patch sécurité** (CVE) | Sous 7 jours après publication | `npm audit fix` / `composer update <pkg>` | Référent tech |
| **Mise à jour mineure** | Trimestrielle | `npm outdated` / `composer outdated` | Référent tech |
| **Mise à jour majeure** | Annuelle (review impact) | Plan dédié, branche feature, regression complète | Référent tech + revue |

### 1.2 Procédure standard

```bash
# Front
cd front
npm outdated                           # Liste les deps obsolètes
npm audit                              # Scan vulnérabilités
npm update                             # Patch + minor (respecte semver)
npm audit fix                          # Auto-fix CVE non breaking
npx vitest run --coverage              # Vérif tests + coverage ≥ 70 %
npx cypress run                        # Vérif E2E

# Back
cd api
composer outdated --direct             # Deps directes obsolètes uniquement
composer audit                         # Scan vulnérabilités
composer update                        # Respecte les contraintes du composer.json
APP_ENV=test php bin/phpunit --coverage-text  # Vérif tests + coverage
```

Si tout passe → commit (`chore(deps): bump X to Y` ou agrégé), pousser, ouvrir PR.

### 1.3 Procédure d'urgence (CVE critique)

1. Identifier le package vulnérable (output `npm audit` ou `composer audit`).
2. Patcher ciblé (`npm update <pkg>` ou `composer update <pkg> --with-all-dependencies`).
3. Run la suite de tests complète (PHPUnit + Vitest + Cypress).
4. Documenter dans `SECURITY.md` §5.3 (date, package, CVE, décision).
5. Tag patch release + déploiement immédiat.

## 2. Déploiement

> Le déploiement effectif n'est pas couvert par le MVP (projet OC orienté archi). Les sections ci-dessous décrivent la **cible** que l'on documenterait au moment de mettre en prod.

### 2.1 Pré-requis infrastructure

| Composant | Spécification minimale |
|---|---|
| **PHP** | 8.5+ avec extensions : `pdo_pgsql`, `intl`, `mbstring`, `openssl`, `pcntl`, `curl`, `fileinfo` |
| **PHP-FPM** | 4 workers minimum (cf. PERF.md projection ~600 req/s) |
| **Composer** | 2.x |
| **Node.js** | 22+ (build front uniquement, pas runtime) |
| **PostgreSQL** | 18 |
| **Reverse proxy** | Nginx ou Caddy (TLS termination + headers de sécurité — cf. SECURITY.md §4.4) |
| **Stockage fichiers** | FS local en V1 (cf. ADR 0003 D4) ; S3/MinIO en V2 (interface `StorageInterface` déjà en place pour un swap sans changer le code métier) |

### 2.2 Procédure de déploiement (V2 cible)

```bash
# 1. Build front
cd front
npm ci                                 # Install reproductible (lock file)
npm run build                          # Génère dist/
# → upload dist/ vers le serveur statique (Nginx, S3+CloudFront, etc.)

# 2. Back
cd api
composer install --no-dev --optimize-autoloader --no-interaction
APP_ENV=prod APP_DEBUG=0 php bin/console cache:clear
APP_ENV=prod APP_DEBUG=0 php bin/console cache:warmup
APP_ENV=prod php bin/console doctrine:migrations:migrate --no-interaction
# → reload PHP-FPM (graceful) pour recharger l'opcache
sudo systemctl reload php8.5-fpm
```

### 2.3 Variables d'environnement prod

À provisionner via Symfony Vault ou secrets manager (cf. SECURITY.md §6.2) — **jamais commit** :

| Variable | Description | Exemple |
|---|---|---|
| `APP_ENV` | Environnement | `prod` |
| `APP_DEBUG` | Désactiver en prod | `0` |
| `APP_SECRET` | Secret framework Symfony | `openssl rand -hex 32` |
| `DATABASE_URL` | Connexion PostgreSQL | `postgresql://user:pass@host:5432/datashare?...` |
| `JWT_PASSPHRASE` | Passphrase keypair JWT | `openssl rand -base64 32` |
| `STORAGE_PATH` | Racine du stockage de fichiers | `/var/lib/datashare/storage` (FS local) |
| `CORS_ALLOW_ORIGIN` | Origin autorisée | `^https://app\.datashare\.fr$` |

### 2.4 Provisionning initial (one-shot)

```bash
# Génération keypair JWT (avec passphrase prod)
APP_ENV=prod php bin/console lexik:jwt:generate-keypair --no-interaction

# Permissions secrets
chmod 0600 config/jwt/private.pem
chown www-data:www-data config/jwt/*.pem

# Création BDD + premier run migrations
APP_ENV=prod php bin/console doctrine:database:create
APP_ENV=prod php bin/console doctrine:migrations:migrate --no-interaction
```

## 3. Rollback

### 3.1 Rollback applicatif (déploiement KO)

Stratégie : **blue/green** ou **canary** côté infrastructure (la version N-1 reste déployée jusqu'à validation de N).

```bash
# Symbolic link `current` pointant sur le release courant
/var/www/datashare/
  releases/
    20260511-1430-abc123/   # release N-1
    20260511-1530-def456/   # release N (déployée)
  current -> releases/20260511-1530-def456/   # symlink

# Rollback rapide
ln -sfn /var/www/datashare/releases/20260511-1430-abc123 /var/www/datashare/current
sudo systemctl reload php8.5-fpm
```

### 3.2 Rollback BDD (migration KO)

Doctrine Migrations supporte le rollback :

```bash
# Rollback de la dernière migration
APP_ENV=prod php bin/console doctrine:migrations:migrate prev --no-interaction

# Rollback à une version spécifique
APP_ENV=prod php bin/console doctrine:migrations:migrate Version20260511120000 --no-interaction
```

**⚠️ Caveat MVP** : nos migrations actuelles ne contiennent **pas de logique `down()`** explicite (générée par Doctrine, pas testée). Avant tout rollback en prod, vérifier manuellement la cohérence du schéma cible. À durcir en V2 : tests de rollback intégrés à la CI.

### 3.3 Rollback stockage de fichiers

**Pas de rollback automatique** des blobs en MVP. Les fichiers uploadés/supprimés entre N et le rollback à N-1 :
- Uploads N : présents sur disque, mais leur métadonnée BDD a disparu après rollback BDD → **orphans**, à GC manuellement.
- Suppressions N : leur métadonnée BDD est ré-introduite par le rollback (état `available`) MAIS le blob a été purgé du disque → **lien valide en BDD mais 404 au download**.

Procédure : runbook GC à exécuter post-rollback (à scripter en V2).

## 4. Sauvegarde et restauration

### 4.1 BDD PostgreSQL

```bash
# Backup quotidien (cron 03:00)
pg_dump -h $DB_HOST -U $DB_USER -F c -f /backups/datashare-$(date +%Y%m%d).dump datashare

# Rétention : 30 jours, archivage offsite hebdo
find /backups -name 'datashare-*.dump' -mtime +30 -delete

# Restore
pg_restore -h $DB_HOST -U $DB_USER -d datashare_restored -c /backups/datashare-20260511.dump
```

### 4.2 Storage de fichiers

```bash
# Backup incrémental rsync (snapshot quotidien sur stockage froid)
rsync -av --delete /var/lib/datashare/storage/ /backup-cold/datashare-storage/

# En V2 (S3) : versioning + lifecycle policy (Glacier après 30 jours)
```

### 4.3 Test de restauration

**Mensuel** : restore le dernier dump sur une base `datashare_restore_test` + spot-check 10 fichiers via leur token. Documenter l'opération + temps de restauration (RTO).

## 5. Monitoring (V2 cible)

Le MVP ne livre pas de stack monitoring complète, mais les hooks sont prêts :
- Logs JSON sur `php://stderr` (cf. PERF.md §6) → captés par l'orchestrateur (Docker/K8s) → forward agrégateur (Loki, ELK, Datadog).
- Endpoint à introduire : `/healthz` (200 si BDD + storage joignables) et `/readyz` (200 si app prête à recevoir du trafic).

### 5.1 Métriques applicatives (cibles SLI/SLO)

| Métrique | SLO cible | Source |
|---|---|---|
| Latence p95 download | < 500 ms | k6 (validation continue), logs `duration_ms` |
| Latence p95 upload | < 5 s pour 100 Mo | Logs `duration_ms` sur `POST /files` |
| Taux d'erreur global | < 0,1 % (5xx) | Logs `status` ≥ 500 |
| Disponibilité | 99,5 % (≈ 3,6 h downtime/mois) | Synthetic monitoring (Pingdom, UptimeRobot) |
| Espace disque storage | < 80 % | `df` cron + alerte |

### 5.2 Alertes critiques

| Alerte | Seuil | Action |
|---|---|---|
| 5xx rate > 1 % sur 5 min | Page on-call | Diagnostic logs ⇒ rollback si régression |
| Disque storage > 90 % | Email + SMS | Provisionner volume / archiver vieux fichiers |
| BDD connexions > 80 % du max | Email | Tuner pool connexions / scale BDD |
| 401 sur `/auth/login` > 100/min depuis une IP | Email + bloquer IP | Brute-force probable (cf. SECURITY.md §7) |

## 6. Procédures de support

### 6.1 Diagnostic rapide

```bash
# Logs applicatifs récents (en prod, lus via l'orchestrateur)
tail -f var/log/prod.log

# Statut PHP-FPM
sudo systemctl status php8.5-fpm

# Statut PostgreSQL
sudo systemctl status postgresql

# Connectivité BDD depuis le back
APP_ENV=prod php bin/console doctrine:query:sql 'SELECT 1'

# Espace disque storage
df -h /var/lib/datashare/storage

# Top des plus gros fichiers (suspect)
du -sh /var/lib/datashare/storage/* | sort -h | tail -20
```

### 6.2 Réinitialisation user (ex. mot de passe oublié — V2)

Pas d'endpoint « mot de passe oublié » en MVP. En attendant V2 :

```bash
# 1. Hash le nouveau mot de passe
php -r "echo password_hash('nouveauMotDePasse', PASSWORD_ARGON2ID), PHP_EOL;"

# 2. Update BDD
APP_ENV=prod php bin/console dbal:run-sql \
  "UPDATE users SET password_hash = '<hash-collé>' WHERE email = 'user@example.fr'"
```

### 6.3 Suppression d'un fichier en urgence (signalement, abus)

```bash
# 1. Identifier le fichier par son token (= UUID)
APP_ENV=prod php bin/console dbal:run-sql \
  "SELECT id, name, user_id, deleted_at FROM files WHERE id = '<token>'"

# 2. Soft-delete via SQL direct (cohérent avec US06 — blob supprimé manuellement)
APP_ENV=prod php bin/console dbal:run-sql \
  "UPDATE files SET deleted_at = NOW() WHERE id = '<token>'"

# 3. Purger le blob du storage
rm /var/lib/datashare/storage/<storage_key>
```

## 7. Plan de continuité

### 7.1 RTO (Recovery Time Objective)

- **Restart applicatif** : < 1 minute (reload PHP-FPM).
- **Restore BDD** depuis backup le plus récent : < 30 minutes (taille MVP).
- **Reconstitution complète** depuis zéro : < 4 heures (provisioning + restore + warmup).

### 7.2 RPO (Recovery Point Objective)

- **BDD** : 24 h (backup quotidien). À durcir avec WAL archiving en V2 → RPO < 1 h.
- **Storage** : 24 h (backup incrémental quotidien).

## 8. Évolutions V2

- **CI/CD GitHub Actions** : pipeline automatisé (tests → build → deploy staging → tests E2E → deploy prod canary).
- **Health checks** `/healthz`, `/readyz` — prérequis K8s.
- **Migration WAL archiving** PostgreSQL pour RPO < 1 h.
- **Bascule storage S3/MinIO** (interface `StorageInterface` déjà en place).
- **CDN** (CloudFront, Bunny) devant le download.
- **Refresh token JWT** (cf. ADR 0002 évolutions).
- **Endpoint de réinitialisation mot de passe** (link-by-mail).
- **GDPR** : endpoint d'export de données utilisateur, endpoint de suppression compte cascadant sur les fichiers.

## 9. Références

- **TESTING.md** — pyramide de tests, coverage, exécution.
- **SECURITY.md** — auth, JWT, anti-énumération, scans.
- **PERF.md** — endpoint critique k6, budget perf front, logs structurés.
- **ADR 0001** — Streaming upload (`docs/ai-collab/decisions/0001-streaming-upload.md`).
- **ADR 0002** — JWT Authentication (`docs/ai-collab/decisions/0002-jwt-authentication.md`).
- **ADR 0003** — Stack technique (`docs/ai-collab/decisions/0003-stack-technique.md`).
