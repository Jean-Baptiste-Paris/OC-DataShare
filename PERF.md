# PERF.md — DataShare MVP

> Test de performance sur l'endpoint critique, budget perf front, logs structurés et métriques clés.
> Référencé par la **section 6 du Livrable 1** (« Qualité, tests et maintenance »).

## 1. Endpoint critique retenu : `GET /api/share/{token}/download`

**Décision (cf. ambiguïté #4 dans `CLAUDE.md`)** : la consigne OC demande « un test de performance rapide sur **un** endpoint critique ». Définition retenue de « critique » :

> *Endpoint dont la dégradation impacte le plus l'utilisateur final ET qui valide notre archi de référence.*

Justification du choix `GET /share/{token}/download` (vs upload, vs autre) :

1. **Asymétrie d'usage métier** — pattern WeTransfer : 1 upload → N downloads (1 expéditeur, plusieurs destinataires). La charge se concentre sur le download.
2. **Coût/req élevé** — bande passante + I/O disque + connexions ouvertes en parallèle.
3. **Valide l'archi streaming** (ADR 0001) — RAM constante côté serveur via `fpassthru` / `fread`. C'est le test qui prouve que la décision archi tient sous charge.
4. **Reproductible proprement avec k6** — un fichier seedé, N VUs en lecture parallèle, métriques claires (latence, throughput, taux d'erreur).

L'upload n'est pas testé en perf MVP — il est par nature low-throughput (1 upload/user/min en moyenne d'usage), et k6 multipart upload est non trivial. À tracer comme évolution V2.

## 2. Outillage : k6

**Version** : 1.7.1 (installée via Homebrew, `brew install k6`).

**Pourquoi k6** :
- DSL JavaScript familier au front, lisible.
- Native support des thresholds qui fail le run si dépassés (intégrable CI plus tard).
- Métriques riches out-of-the-box (latence percentiles, throughput, erreurs).
- Léger (binaire Go), aucun overhead JVM/Node.

## 3. Scénario de test

`api/tests/perf/download.k6.js` — 50 VUs concurrents lisant un fichier de 1 Mo sur l'endpoint cible.

### 3.1 Profile de charge

| Phase | Durée | VUs cibles |
|---|---|---|
| Ramp up | 10 s | 0 → 50 |
| Plateau | 40 s | 50 |
| Ramp down | 10 s | 50 → 0 |
| **Total** | **60 s** | |

### 3.2 Thresholds (fail le run si dépassés)

| Métrique | Seuil | Justification |
|---|---|---|
| `p(95) < 500ms` sur les requêtes download | 95 % des téléchargements 1 Mo finis en < 500 ms | UX raisonnable : un destinataire perçoit < 500 ms comme « instantané » sur un lien |
| `error_rate < 1%` | < 1 % de 5xx ou échecs réseau | Stabilité minimale sous 50 VUs concurrents |

### 3.3 Pré-requis et exécution

```bash
# 1. Back en APP_ENV=test sur :8000
# 2. Seeder un blob random + récupérer son token
TOKEN=$(APP_ENV=test php tests/perf/seed_perf_blob.php 1)
# (default size = 1 Mo. Argument facultatif pour ajuster en Mo.)

# 3. Lancer k6 avec le token en env var
k6 run -e TOKEN="$TOKEN" tests/perf/download.k6.js

# Variante : tester depuis une autre URL (staging, etc.)
k6 run -e TOKEN="$TOKEN" -e BASE_URL=https://staging.datashare.fr tests/perf/download.k6.js
```

## 4. Résultats — run de référence (2026-05-11, séance 14)

Environnement : MacBook Pro M-series, PHP 8.5 (Symfony built-in server), PostgreSQL 18 local. **Mono-process (pas de FPM, pas de prefork)** — pessimiste vs prod.

```
█ THRESHOLDS
  download_failure_rate
    ✓ 'rate<0.01' rate=0.00%
  http_req_duration{name:download}
    ✓ 'p(95)<500' p(95)=453.27ms

█ TOTAL RESULTS
  checks_succeeded.....: 100.00% (31 032 / 31 032)
  http_reqs............: 10 344  (172 req/s)
  http_req_duration....: avg=221.82ms  med=207.9ms  p(90)=336.32ms  p(95)=453.27ms  max=1.13s
  http_req_failed......: 0.00% (0 / 10 344)
  data_received........: 11 GB (181 MB/s)
  vus..................: peak 50
```

### 4.1 Synthèse

| KPI | Valeur | Verdict |
|---|---|---|
| **Throughput** | 172 req/s, 181 MB/s | OK pour un mono-process ; production avec FPM + 4 workers → projeter ~600-700 req/s |
| **Latence p95** | 453 ms | Sous le threshold 500 ms ✓ |
| **Latence médiane** | 208 ms | Très bonne ; majoritairement contrainte par le streaming I/O disque local |
| **Latence max** | 1,13 s | Acceptable (queue côté serveur sous pic) |
| **Taux d'erreur** | 0 % (10 344 / 10 344 OK) | Stabilité parfaite, archi streaming tient sans memory leak |
| **Volumes** | 11 GB téléchargés en 1 min | Confirme RAM constante (1 Mo blob × 10 344 = 10,1 Go data ≠ memory consumption serveur) |

### 4.2 Analyse

- **L'archi streaming (ADR 0001) tient** : aucune corrélation entre le volume cumulé téléchargé (11 Go) et la RAM consommée côté process PHP (suivi via Activity Monitor sur la durée — RAM stable autour de 80-100 Mo). C'est le résultat clé qui valide la décision architecturale.
- **La latence est dominée par l'I/O disque**, pas par PHP. Le `fpassthru` lit les chunks 8 Ko et les écrit immédiatement vers `php://output` — overhead applicatif négligeable.
- **Thresholds verts** : pas de régression à craindre tant que les conditions matérielles restent ≥ celles du test.

### 4.3 Limites du test

- **Mono-process** : un FPM avec 4 workers donnerait 4× le throughput. Test pessimiste.
- **Disque local SSD** : un stockage S3/MinIO en prod aurait une latence réseau additionnelle (~10-50 ms par chunk). À refaire après l'introduction de S3 en V2.
- **Pas de CDN** : en prod, un CDN devant l'endpoint download éliminerait la majorité des hits sur le serveur d'origine.
- **VUs depuis localhost** : pas de latence réseau client→serveur réelle. Pour un test plus représentatif, lancer k6 depuis un autre datacenter (k6 cloud ou EC2 remote).

## 5. Budget performance front

**Outil** : Lighthouse (Chrome DevTools, mode incognito, throttling « Slow 4G + 4× CPU »).

**Cibles MVP** (sur la page critique = `/files`, post-login, après chargement de 7 fichiers) :

| Métrique | Cible | Observé (à mesurer post lot 5) |
|---|---|---|
| First Contentful Paint (FCP) | < 1,8 s | À renseigner |
| Largest Contentful Paint (LCP) | < 2,5 s | À renseigner |
| Total Blocking Time (TBT) | < 200 ms | À renseigner |
| Cumulative Layout Shift (CLS) | < 0,1 | À renseigner |
| Performance score Lighthouse | ≥ 90 | À renseigner |
| Bundle JS (production build) | < 250 KB gzipped | À renseigner via `vite build && vite preview` puis inspecter `dist/assets/` |

**Optimisations en place** :
- React 18 + Vite → bundle splitting auto par route (lazy loading possible mais pas encore appliqué).
- CSS Modules → tree-shaking auto, pas de dead CSS embarqué.
- Pas de blob côté browser pour le download (cf. ADR 0001 symétrie front : `<a href download>` direct → 0 RAM browser, pas de chunk applicatif).
- Skeletons + `prefers-reduced-motion` → CLS minimisé pendant le chargement.

**Optimisations V2** :
- Lazy loading des routes (`React.lazy`).
- Pré-fetch DNS sur le domaine API.
- Service Worker pour cache des assets statiques.
- HTTP/2 push sur les CSS critiques.

## 6. Logs structurés et métriques clés

### 6.1 Configuration Monolog

`symfony/monolog-bundle` installé en séance 14. Config par défaut Symfony exploitée :

| Env | Handler | Path | Format |
|---|---|---|---|
| `dev` | `stream` | `var/log/dev.log` | Lisible humain (defaut) |
| `test` | `fingers_crossed` (action_level=error) → `stream` | `var/log/test.log` | Lisible humain |
| `prod` | `fingers_crossed` (action_level=error, buffer=50) → `stream` | `php://stderr` | **JSON** (`monolog.formatter.json`) |

**Pourquoi `php://stderr` + JSON en prod** : pattern 12-factor app — les logs sont émis sur stderr du process, le runtime (Docker, systemd, K8s, Heroku…) les capture et les forward vers l'agrégateur (Loki, ELK, Datadog…). Format JSON = parseable sans regex.

### 6.2 Métriques clés à logger en prod (V2)

À implémenter via processors Monolog ou listener Symfony :

| Métrique | Source | Usage |
|---|---|---|
| `request_id` | Header `X-Request-ID` ou UUID auto-généré par middleware | Corrélation des logs d'une même requête à travers les composants |
| `user_id` | Claim JWT `sub` (si authentifié) | Tracer les actions par utilisateur |
| `endpoint`, `method`, `status` | Auto via `WebProcessor` | Volumes par route, taux d'erreur |
| `duration_ms` | `kernel.terminate` listener | SLI latence (alimente p50/p95/p99) |
| `file_id`, `file_size` | Sur `POST /files`, `GET /share/{token}/download`, `DELETE /files/{id}` | Audit + métriques métier |

### 6.3 Logs d'audit dédiés (V2)

Un canal Monolog séparé pour les événements de sécurité, à rétention longue (≥ 1 an) :

- `auth.login.success` / `auth.login.failure` (compteur clé pour détecter brute-force).
- `file.uploaded` (qui, quoi, taille).
- `file.downloaded` (qui — ou anonyme — quoi, IP).
- `file.deleted` (qui, quoi).

## 7. Commandes synthèse

```bash
# Test de perf complet
cd api
TOKEN=$(APP_ENV=test php tests/perf/seed_perf_blob.php 1)
k6 run -e TOKEN="$TOKEN" tests/perf/download.k6.js

# Variantes utiles
k6 run -e TOKEN="$TOKEN" --vus 100 --duration 2m tests/perf/download.k6.js   # plus de charge
k6 run -e TOKEN="$TOKEN" --out json=perf-result.json tests/perf/download.k6.js  # export JSON pour analyse
```

## 8. Évolutions V2

- **k6 cloud / GitHub Actions cron** : run automatique quotidien sur staging, alerte si threshold dépasse.
- **Test d'upload** k6 : scénario multipart, mesure du temps end-to-end pour 1 Go.
- **Test de soak** : 10 VUs sur 1h pour détecter les memory leaks ou file descriptor leaks (limite ulimit).
- **Tracing distribué** : OpenTelemetry intégré côté Symfony + collector Jaeger / Tempo.
- **Métriques Prometheus** : exporter `/metrics` pour scraping (latence, throughput, erreurs, FPM workers actifs).
