# L3 — Slides de soutenance (Reveal.js)

## Structure

`index.html` — slides standalone (Reveal.js via CDN, palette DataShare custom). 18 sections :

1. Cover
2. Contexte (mission, commanditaire, contrainte, délai)
3. Périmètre MVP (6 US obligatoires + 4 hors MVP)
4. Architecture (schéma 3 couches)
5. Choix technologiques (synthèse 7 lignes)
6. Modèle de domaine UML
7. API REST (8 endpoints)
8. Sécurité (auth + anti-énumération + validation + scan deps)
9. Tests + coverage (KPI 224 / 93,7 / 93,5)
10. Performance back (k6 KPI 172 req/s / p95 453 / 0 erreur)
11. Performance front (Lighthouse 98/100 + bundle 133 KB)
12. Démonstration (script live)
13. IA — posture (binômage asymétrique + évolution)
14. IA — vitrine US01
15. Difficultés rencontrées
16. Solutions apportées
17. Évolutions V2
18. Closing

## Visualisation locale

```bash
# Option 1 : ouvrir directement dans le browser
open index.html

# Option 2 : servir via un mini-serveur HTTP (recommandé pour les chemins relatifs)
python3 -m http.server 8080 --directory .
# → http://localhost:8080
```

## Navigation Reveal.js

- **Flèches** ← → ↑ ↓ pour naviguer
- **F** pour le mode plein écran
- **S** pour le mode présentateur (notes + minuteur)
- **ESC** pour la vue d'ensemble
- **B** pour fond noir (pause)

## Export PDF (pour dépôt OC)

Reveal.js a un mode print intégré :

```bash
# 1. Ouvrir avec ?print-pdf dans l'URL
open "index.html?print-pdf"

# 2. Dans Chrome : Cmd+P → Save as PDF (paysage A4)
```

Ou via Decktape (CLI, plus propre) :

```bash
npm install -g decktape
decktape reveal index.html ../Nom_Prenom_3_support_de_presentation_042026.pdf
```

## Cibles de durée

- **Présentation** : 15 min (toléré 10-20 min, sinon refus possible)
- **Q&A / discussion** : 10 min
- **Débrief** : 5 min
- **Total** : 30 min

→ Rythme moyen ~50 s par slide sur 18 slides = 15 min pile.

## Structure imposée par la consigne OC

| Phase | Contenu | Slides |
|---|---|---|
| Présentation (15 min) | Contexte → Choix techno → Archi → **Démo** → Doc | 1-12 |
| Discussion (10 min) | Comprendre le métier, méthodo, doc, qualité, IA | (questions) |
| Débrief (5 min) | Évaluateur sort de son rôle Lisa | — |
