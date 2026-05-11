// Scénario k6 — endpoint critique GET /api/share/{token}/download
// Cible OC : test de performance rapide sur 1 endpoint critique (cf. ambiguïté #4
// résolue dans CLAUDE.md → endpoint asymétrique 1 upload → N downloads + valide
// l'archi streaming ADR 0001).
//
// Prérequis :
//   - back en APP_ENV=test sur :8000
//   - blob de test seedé via tests/perf/seed_perf_blob.php
//
// Usage :
//   TOKEN=$(APP_ENV=test php tests/perf/seed_perf_blob.php 1)
//   k6 run -e TOKEN="$TOKEN" tests/perf/download.k6.js
//
// Variables d'environnement :
//   - TOKEN (requis) : UUID du fichier seedé
//   - BASE_URL (optionnel, défaut http://127.0.0.1:8000)

import http from 'k6/http';
import { check, fail } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const TOKEN = __ENV.TOKEN;
const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8000';

if (!TOKEN) {
  fail('Missing TOKEN env var. Run: TOKEN=$(... seed_perf_blob.php) k6 run ...');
}

const downloadDuration = new Trend('download_duration_ms', true);
const downloadFailures = new Rate('download_failure_rate');

// Profile : montée à 50 VUs en 10s, plateau à 50 VUs pendant 40s, descente en 10s.
// Total ~1 min, suffisant pour mesurer p95 stable sur l'endpoint critique.
export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '40s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    // 95 % des téléchargements 1 Mo doivent finir en moins de 500 ms.
    'http_req_duration{name:download}': ['p(95)<500'],
    // Taux d'erreur < 1 % (l'endpoint doit rester stable sous 50 VUs).
    download_failure_rate: ['rate<0.01'],
  },
  // Évite que k6 wait sur les iterations ; on charge le serveur en continu.
  noConnectionReuse: false,
};

export default function () {
  const res = http.get(`${BASE_URL}/api/share/${TOKEN}/download`, {
    tags: { name: 'download' },
  });

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'has Content-Disposition attachment': (r) =>
      (r.headers['Content-Disposition'] || '').toLowerCase().includes('attachment'),
    'body is non-empty': (r) => r.body && r.body.length > 0,
  });

  downloadDuration.add(res.timings.duration);
  downloadFailures.add(!ok);
}
