# Livrables OpenClassrooms — DataShare

## 3 livrables à déposer dans la plateforme OC

D'après le gabarit OC, les livrables sont à zipper sous le nom `Titre_du_projet_nom_prenom.zip`, chacun nommé `Nom_Prenom_<N>_<livrable>_mmaaaa` avec la date du **démarrage du projet** = `042026` (avril 2026).

| # | Livrable | Source dans le repo | Cible (PDF/TXT) | Nommage final |
|---|---|---|---|---|
| **L1** | Documentation technique (8 sections) | `docs/livrables/L1-doc-technique.md` | PDF | `Paris_Jean-Baptiste_1_documentation_042026.pdf` |
| **L2** | Lien du repository | `docs/livrables/L2-lien-repository.txt` | TXT | `Paris_Jean-Baptiste_2_lien_repository_042026.txt` |
| **L3** | Support de présentation | `docs/livrables/L3-slides/index.html` | PDF | `Paris_Jean-Baptiste_3_support_de_presentation_042026.pdf` |

> Zip final : `DataShare_Paris_Jean-Baptiste.zip`

## Procédure de génération des PDFs

### L1 — Documentation technique

Le fichier source `L1-doc-technique.md` est en Markdown. JB l'ouvre dans Google Docs ou Word :

1. Coller le contenu du `.md` dans un nouveau Google Docs / Word.
2. Reformater avec les styles natifs (titres, tableaux, code blocks).
3. **Insérer les images** :
   - §1 Architecture : `docs/conception/architecture.png` (export Lucidchart).
   - §3 Modèle de données : export du diagramme Mermaid de `docs/conception/modele-domaine.md` (via [mermaid.live](https://mermaid.live) → Actions → SVG).
   - §6 Qualité (optionnel) : captures des rapports de coverage HTML — `api/var/coverage/index.html` et `front/coverage/index.html`.
4. Exporter en PDF, renommer en `Paris_Jean-Baptiste_1_documentation_042026.pdf`.

### L2 — Lien repository

Le fichier `L2-lien-repository.txt` est déjà au format demandé. Renommer en `Paris_Jean-Baptiste_2_lien_repository_042026.txt`.

> ⚠️ **Avant de figer** : pousser le code sur GitHub et vérifier que l'URL du repo est exacte.

### L3 — Slides

Deux options pour exporter les slides Reveal.js en PDF :

**Option A — Mode print Chrome (rapide)**

```bash
cd docs/livrables/L3-slides
python3 -m http.server 8080 &
open "http://localhost:8080/index.html?print-pdf"
# Cmd+P → Save as PDF → A4 paysage → Renommer le PDF
```

**Option B — Decktape CLI (rendu plus propre)**

```bash
npm install -g decktape
cd docs/livrables/L3-slides
python3 -m http.server 8080 &
decktape reveal http://localhost:8080/index.html ../Paris_Jean-Baptiste_3_support_de_presentation_042026.pdf
```

## Procédure de zippage final

```bash
cd /tmp
mkdir -p DataShare_Paris_Jean-Baptiste

# Copier les 3 livrables (chemins à ajuster selon où sont les PDFs exportés)
cp ~/Downloads/Paris_Jean-Baptiste_1_documentation_042026.pdf DataShare_Paris_Jean-Baptiste/
cp /Users/jean-baptiste/OCProjects/DataShare/docs/livrables/L2-lien-repository.txt \
   DataShare_Paris_Jean-Baptiste/Paris_Jean-Baptiste_2_lien_repository_042026.txt
cp ~/Downloads/Paris_Jean-Baptiste_3_support_de_presentation_042026.pdf DataShare_Paris_Jean-Baptiste/

# Zipper
zip -r DataShare_Paris_Jean-Baptiste.zip DataShare_Paris_Jean-Baptiste/

# Vérifier
unzip -l DataShare_Paris_Jean-Baptiste.zip
```

## Audit de cohérence (repo ↔ L1 ↔ L3)

Vérifier que les chiffres clés sont identiques entre :

| Indicateur | repo (`*.md`) | L1 PDF | L3 slides |
|---|---|---|---|
| Nombre de tests | 224 (TESTING.md §2) | §6.1 | KPI slide 9 |
| Coverage back | 93,71 % lignes | §6.2 | KPI slide 9 |
| Coverage front | 93,5 % lignes | §6.2 | KPI slide 9 |
| Lighthouse Perf | 98 / 100 | §6.3 | KPI slide 11 |
| Bundle JS gzipped | 133 KB | §6.3 | KPI slide 11 |
| k6 throughput | 172 req/s | §6.3 | KPI slide 10 |
| k6 p95 download | 453 ms | §6.3 | KPI slide 10 |
| k6 erreurs | 0 / 10 344 | §6.3 | KPI slide 10 |
| Composants DS | 9 (Sidebar, DropdownMenu, etc.) | §1.5 | implicite slide 5 |
| Endpoints API | 8 | §4.2 | tableau slide 7 |
| US MVP | 6 implémentées | §4.2 | slide 3 |
| US optionnelles hors MVP | 4 (US07-10) | §3.5 | slide 3 |

Toutes ces valeurs sont **cohérentes** dans la version actuelle du repo (audit du 2026-05-11). Si une valeur évolue (re-run k6, ajout de tests…), maj dans les 3 artefacts.
