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

**Outil** : Lighthouse 12.x (mode CLI headless, throttling par défaut « Slow 4G + 4× CPU »).

**Méthode de mesure** :

```bash
cd front
npm run build                       # Build prod (output dans dist/)
npm run preview                     # Sert dist/ sur :4173

# Dans un autre terminal
npx lighthouse http://localhost:4173/login \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=html --output=json \
  --output-path=docs/livrables/lighthouse/login \
  --chrome-flags="--headless --no-sandbox"
```

### 5.1 Bundle production (vite build)

```
dist/index.html                           0,29 KB gzipped
dist/assets/index-*.css                   4,44 KB gzipped (sur 23,92 KB raw)
dist/assets/index-*.js                  133,38 KB gzipped (sur 411,36 KB raw)
dist/assets/dm-sans-*.woff/woff2        ~135 KB total (3 weights × 2 subsets latin/latin-ext × 2 formats)
```

| Asset | Cible | Observé | Verdict |
|---|---|---|---|
| JS gzipped | < 250 KB | **133 KB** | ✅ ~50 % sous la cible |
| CSS gzipped | < 50 KB | **4,4 KB** | ✅ |
| Bundle initial total (HTML+JS+CSS) | < 300 KB | ~138 KB | ✅ |

### 5.2 Mesures Lighthouse (2026-05-11, séance 15)

Mesures sur les pages publiques `/login` et `/register` (pages critiques d'entrée). Les pages privées (`/files`, `/upload`) partagent le même bundle, leurs mesures sont structurellement identiques au coût de chargement initial près.

| Catégorie | `/login` | `/register` | Cible OC |
|---|---:|---:|---|
| **Performance** | **98 / 100** | **98 / 100** | ≥ 90 |
| **Accessibility** | 92 / 100 | 92 / 100 | ≥ 90 |
| **Best practices** | 100 / 100 | 100 / 100 | ≥ 90 |
| SEO | 82 / 100 | 82 / 100 | non applicable (app authentifiée) |

| Métrique | Cible | Observé `/login` | Verdict |
|---|---|---:|---|
| First Contentful Paint (FCP) | < 1,8 s | 2,0 s | ⚠️ Légèrement au-dessus, score 84/100 « Good » |
| Largest Contentful Paint (LCP) | < 2,5 s | 2,0 s | ✅ |
| Total Blocking Time (TBT) | < 200 ms | **0 ms** | ✅ |
| Cumulative Layout Shift (CLS) | < 0,1 | **0** | ✅ |
| Speed Index | < 3,4 s | 2,3 s | ✅ |
| Time to Interactive (TTI) | < 3,8 s | 2,0 s | ✅ |

**Rapports HTML complets** : `docs/livrables/lighthouse/login.report.html` et `register.report.html`.

### 5.3 Analyse et optimisations possibles

**Score 98/100 atteint** grâce à plusieurs facteurs structurels :

- **Vite + React 18** : bundle splitting auto, tree-shaking, minification ESBuild.
- **CSS Modules** : pas de dead CSS embarqué, scoping local évite les sélecteurs en cascade coûteux.
- **Pas de blob côté browser pour le download** (cf. ADR 0001 symétrie front : `<a href download>` natif → 0 RAM browser, pas de chunk applicatif).
- **Skeletons + `prefers-reduced-motion`** sur les vues à chargement async (Login, Download, MyFiles) → CLS = 0.
- **Pas de polyfill legacy** : cibles browser modernes (ES2022).
- **Composants Radix UI** (Switch, Select, DropdownMenu) : tree-shakés, n'embarquent que les primitives utilisées.
- **TBT = 0 ms** : aucun script bloquant, pas de tâche longue au boot.

**Marge d'amélioration FCP (-200 ms pour atteindre la cible 1,8 s)** :

1. **Préload des polices critiques** (`<link rel="preload" as="font">`) pour DM Sans 400 — actuellement chargée au runtime via `@fontsource/dm-sans` lazy.
2. **Inline du CSS critique** (above-the-fold) pour éviter le round-trip CSS au premier paint.
3. **Lazy loading des routes** (`React.lazy(() => import('@/pages/...'))`) — économise ~20-30 KB sur le bundle initial des pages non-Auth.
4. **`<link rel="preconnect">`** sur le domaine API (`http://127.0.0.1:8000` ou `https://api.datashare.fr`) pour anticiper les fetch JWT/files.
5. **Service Worker** + cache HTTP des assets pour la 2ème visite (FCP < 500 ms).
6. **Brotli compression** côté reverse proxy (Nginx/Caddy) — gain ~15-20 % vs gzip sur du JS.

Toutes ces optimisations sont **V2** : non bloquantes vu que le score 98/100 est déjà bien au-dessus du seuil OC ≥ 90.

### 5.4 Accessibilité — détail score 92

Les 8 points perdus correspondent essentiellement au **contraste insuffisant** sur le segment actif du Switch (texte blanc sur fond corail `#E77A6E`, ratio 2,92 < seuil AA 4,5). Écart conscient pour fidélité maquette, tracé dans `Switch.tsx` et dans `TESTING.md` §6. Toutes les autres règles (labels, focus visible, ARIA) passent à 100 %.

### 5.5 Évolutions V2

- **Lazy loading routes** + **preload fonts** → cible FCP < 1,5 s.
- **Lighthouse CI** (workflow GitHub Actions) → bloque les PR qui font régresser le score.
- **`web-vitals` library** côté runtime → push des mesures FCP/LCP/CLS réelles vers un endpoint analytics.
- **Switch contraste** : revoir le rose-corail du segment actif pour atteindre AA 4,5 sans casser la palette (si arbitré avec design).

## 6. Métriques clés journalisées

### 6.1 Métriques observées (run de référence 2026-05-11)

Synthèse exploitable des deux niveaux de mesure (back k6 + front Lighthouse + bundle) :

| Niveau | Métrique | Valeur | Interprétation |
|---|---|---:|---|
| **Back (k6)** | Throughput download | 172 req/s | Mono-process ; projection prod 4 workers ≈ 600-700 req/s |
| Back | Latence p50 download | 208 ms | Médiane confortable pour un fichier 1 Mo |
| Back | Latence p95 download | **453 ms** | Sous le SLO 500 ms ✓ |
| Back | Latence max download | 1,13 s | Acceptable (queue sous pic) |
| Back | Taux d'erreur download | **0 %** (0 / 10 344) | Stabilité parfaite, archi streaming sans memory leak |
| Back | Volume cumulé download | 11 GB en 1 min | RAM PHP stable 80-100 Mo malgré le volume → valide ADR 0001 |
| **Front** | Bundle JS gzipped | **133 KB** | ~50 % sous la cible 250 KB |
| Front | Bundle CSS gzipped | 4,4 KB | Excellent (CSS Modules tree-shakés) |
| Front | Lighthouse Performance | **98 / 100** | ≥ 90 ✓ |
| Front | First Contentful Paint | 2,0 s | Score 84/100, légèrement au-dessus cible 1,8 s |
| Front | Total Blocking Time | **0 ms** | Aucun script bloquant |
| Front | Cumulative Layout Shift | **0** | Skeletons + reservation d'espace bien posés |
| **Fichiers** | Taille max upload | 1 Go | Limite enforced via `UploadSizeLimitListener` (413) + `public/.user.ini` |
| Fichiers | Taille blob test perf | 1 Mo | Représentatif de la médiane WeTransfer/équivalents |
| Fichiers | Limite blob attendue prod | 10-100 Mo médiane | À mesurer en prod (`logs file_size` à analyser) |

### 6.2 Analyse et actions d'optimisation

**Forces** :

- L'archi streaming (ADR 0001) est validée empiriquement par k6. Le serveur tient sans saturer la RAM même sous 50 VUs concurrents avec 11 Go de volume cumulé.
- Le bundle front est très contenu — 133 KB gzipped pour une SPA React + Radix + Zustand + Axios + lucide-react est en dessous de la médiane industrielle (200-300 KB pour ce stack).
- Lighthouse Performance à 98/100 sans aucune optimisation lazy avancée — le résultat des choix structurels (Vite, CSS Modules, pas de blob front, skeletons).

**Pistes d'optimisation classées par effort/gain** :

| # | Action | Effort | Gain attendu | V1 / V2 |
|---|---|---|---|---|
| 1 | Préload font DM Sans 400 (`<link rel="preload">`) | 5 min | FCP -100/-200 ms | V1 si temps |
| 2 | Lazy loading routes (`React.lazy`) | 30 min | Bundle initial -20-30 KB sur les routes non-Auth | V2 |
| 3 | Brotli côté reverse proxy | 0 (config infra) | -15-20 % sur le transfert JS | Au déploiement |
| 4 | CDN devant le download | infra | Latence p95 -50 % sur les destinataires distants | V2 |
| 5 | PHP-FPM 4 workers en prod | infra | Throughput ×4 (640-680 req/s sur l'endpoint critique) | Au déploiement |
| 6 | Service Worker cache assets | 1 h | FCP < 500 ms en 2ème visite | V2 |
| 7 | k6 cloud / GitHub Actions cron | 2 h | Détection régression perf en continu | V2 |
| 8 | Lighthouse CI sur les PR | 1 h | Bloque PR qui fait baisser le score < 90 | V2 |

**Métriques à journaliser en prod** (cf. §6.3 ci-dessous) pour alimenter SLI/SLO et détecter les régressions :

- `request_id` (corrélation), `user_id` (claim JWT), `endpoint`, `method`, `status`, `duration_ms`.
- Sur `POST /files` : `file_size_bytes`, `mime_type`, `validation_outcome` (ok/blacklisted/magic-bytes).
- Sur `GET /share/{token}/download` : `file_size_bytes`, `bytes_sent`, `client_ip` (si conformité RGPD OK).
- Sur `DELETE /files/{id}` : `storage_purge_duration_ms`, `db_flush_duration_ms`.

## 7. Logs structurés (Monolog)

### 7.1 Configuration Monolog

`symfony/monolog-bundle` installé en séance 14. Config par défaut Symfony exploitée :

| Env | Handler | Path | Format |
|---|---|---|---|
| `dev` | `stream` | `var/log/dev.log` | Lisible humain (defaut) |
| `test` | `fingers_crossed` (action_level=error) → `stream` | `var/log/test.log` | Lisible humain |
| `prod` | `fingers_crossed` (action_level=error, buffer=50) → `stream` | `php://stderr` | **JSON** (`monolog.formatter.json`) |

**Pourquoi `php://stderr` + JSON en prod** : pattern 12-factor app — les logs sont émis sur stderr du process, le runtime (Docker, systemd, K8s, Heroku…) les capture et les forward vers l'agrégateur (Loki, ELK, Datadog…). Format JSON = parseable sans regex.

### 7.2 Logs d'audit dédiés (V2)

Un canal Monolog séparé pour les événements de sécurité, à rétention longue (≥ 1 an) :

- `auth.login.success` / `auth.login.failure` (compteur clé pour détecter brute-force).
- `file.uploaded` (qui, quoi, taille).
- `file.downloaded` (qui — ou anonyme — quoi, IP).
- `file.deleted` (qui, quoi).

## 8. Commandes synthèse

```bash
# Test de perf complet
cd api
TOKEN=$(APP_ENV=test php tests/perf/seed_perf_blob.php 1)
k6 run -e TOKEN="$TOKEN" tests/perf/download.k6.js

# Variantes utiles
k6 run -e TOKEN="$TOKEN" --vus 100 --duration 2m tests/perf/download.k6.js   # plus de charge
k6 run -e TOKEN="$TOKEN" --out json=perf-result.json tests/perf/download.k6.js  # export JSON pour analyse
```

## 9. Évolutions V2

- **k6 cloud / GitHub Actions cron** : run automatique quotidien sur staging, alerte si threshold dépasse.
- **Test d'upload** k6 : scénario multipart, mesure du temps end-to-end pour 1 Go.
- **Test de soak** : 10 VUs sur 1h pour détecter les memory leaks ou file descriptor leaks (limite ulimit).
- **Tracing distribué** : OpenTelemetry intégré côté Symfony + collector Jaeger / Tempo.
- **Métriques Prometheus** : exporter `/metrics` pour scraping (latence, throughput, erreurs, FPM workers actifs).
- **Lighthouse CI** : bloque les PR qui font régresser le score Performance < 90.
- **`web-vitals`** runtime : push FCP/LCP/CLS réels (utilisateurs, pas labo) vers un endpoint analytics.
