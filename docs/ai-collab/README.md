# Collaboration IA — méthodologie projet DataShare

Ce document décrit la méthodologie de pilotage du copilote IA (Claude Code, Anthropic) employée tout au long du projet DataShare. Il alimente la **section 8** de la documentation technique (« Utilisation de l'IA dans le développement ») et la discussion de soutenance sur l'axe « supervision et usage efficace de l'IA ».

## 1. Rôles et responsabilités

| Acteur | Responsabilités |
|---|---|
| **Référent technique senior** (humain) | Conception d'architecture, arbitrages, revue de code, validation finale, définition du périmètre |
| **Copilote IA** (Claude) | Propositions techniques argumentées, production de code et de documentation **sous supervision**, synthèse et maintien du contexte projet |

**Règle de non-autonomie :** le copilote IA ne prend aucune décision d'architecture seul. Pour tout concept ou pattern nouveau, il expose en amont :

1. **Qu'est-ce que c'est**
2. **À quoi ça sert dans ce contexte**
3. **Pourquoi ce choix plutôt qu'un autre**

…puis attend validation explicite avant d'écrire du code.

## 2. Traçabilité de la collaboration

Deux artefacts structurent la collaboration, à deux niveaux de visibilité différents :

### 2.1 Journal des sessions — privé, non versionné

- **Emplacement** : `.ai-collab/sessions/YYYY-MM-DD.md` (racine du projet, ignoré par Git).
- **Cadence** : un fichier par journée de travail, créé automatiquement par le hook `SessionStart` (voir §4).
- **Destinataire** : le référent technique uniquement (travail interne).

**Structure d'une entrée :**

- Objectif de la session
- Contexte / état à l'ouverture
- Propositions / productions du copilote IA
- Arbitrages et corrections apportés par le référent tech (**preuve de revue**)
- Décisions actées (renvois vers les ADR)
- Artefacts produits ou modifiés
- Reste à faire / parking lot

**Pourquoi non versionné :** le journal contient des brouillons, hésitations, alternatives écartées — utiles pour traçer l'exploration mais bruité pour un lecteur externe (mentor, investisseur). La valeur synthétisée est remontée dans les ADR et la section 8 du PDF.

### 2.2 ADR — Architecture Decision Records, versionnés

#### Définition

Un **Architecture Decision Record** (ADR) est un document court et daté qui capture une décision d'architecture significative : le **contexte** qui l'a rendue nécessaire, les **options envisagées** avec leurs compromis, la **décision retenue**, et les **conséquences** attendues.

Le format employé ici dérive de celui proposé par Michael Nygard dans *Documenting Architecture Decisions* (Cognitect, 2011), devenu de fait le format ADR standard dans la communauté logicielle. Sa force tient à trois propriétés :

1. **Chronologique et immuable** — un ADR n'est pas réécrit quand la décision évolue. Il est marqué `superseded-by-NNNN` et un nouvel ADR le remplace. On voit ainsi l'historique du raisonnement, pas seulement son état final.
2. **Ciblé sur une seule décision** — un ADR = une décision. Plus facile à lire, à citer, à discuter.
3. **Auto-suffisant** — contient assez de contexte pour être compris sans avoir lu le reste du projet. Un mainteneur qui rejoint dans 6 mois doit pouvoir lire l'ADR seul et comprendre *pourquoi* la décision a été prise.

#### Quand écrire un ADR

Un ADR est indiqué quand la décision :

- A des **alternatives crédibles** qui ont été écartées (sinon, ce n'est pas une décision, c'est un fait).
- A un **impact durable** sur le code ou l'architecture (stack, patterns, protocoles, conventions transverses).
- Sera **questionnée** plus tard — soit par un mainteneur, soit par un évaluateur.

Ne pas écrire d'ADR pour : une convention de nommage mineure, un détail d'implémentation local, une correction de bug.

#### Emplacement et format

- **Emplacement** : `docs/ai-collab/decisions/NNNN-titre.md` (numérotation séquentielle par ordre chronologique de création, pas logique).
- **Destinataire** : mentor, évaluateur, futurs mainteneurs.

**Structure canonique :**

- **Titre** explicite (`ADR NNNN — Intitulé court de la décision`)
- **Statut** : `proposed` | `accepted` | `superseded-by-NNNN` | `deprecated`
- **Date** + décideur
- **Contexte** : problème à résoudre, contraintes, points de vigilance
- **Options envisagées** : au moins 2, chacune avec avantages et inconvénients
- **Décision** : quelle option retenue
- **Justification** : pourquoi celle-ci plutôt qu'une autre
- **Conséquences** : positives, négatives, contre-mesures prévues
- **Évolutions envisageables** (optionnel) : pistes pour une v2 ou une supersession future

#### Pourquoi versionné

Chaque ADR alimente directement la **section 2 du livrable PDF** (« choix technologiques justifiés ») et constitue la matière défendable à l'oral de soutenance. Un ADR *superseded* conserve sa valeur historique — on voit comment la décision a évolué, ce qui est aussi un signal de maturité de la démarche.

## 3. Automatisation — hook `SessionStart`

Un hook Claude Code est installé dans `.claude/settings.local.json` pour automatiser la préparation du journal.

- **Événement** : `SessionStart` (déclenché au début de chaque session Claude Code).
- **Script** : `.claude/hooks/session-start.sh` (rendu exécutable).
- **Effet** : crée `.ai-collab/sessions/YYYY-MM-DD.md` si absent, à partir du template `_template.md` (substitution de `{{DATE}}`).

**Pourquoi `SessionStart` plutôt que `SessionEnd` :** un hook de fin ne peut pas capturer de la rédaction — le modèle n'a plus la main à ce moment-là. `SessionStart` prépare le fichier en amont, que le modèle alimente *au fil de l'eau*.

**Caveat du watcher :** la configuration des hooks est lue à l'ouverture d'une session. Si `.claude/` est créé pendant une session, le watcher ne le voit pas — ouvrir `/hooks` dans le CLI ou redémarrer pour recharger la configuration.

## 4. Synthèse finale — section 8 du PDF

À la livraison du projet, une synthèse est extraite du journal des sessions + ADR pour alimenter la section 8 du PDF. Elle couvre :

- Nature des tâches déléguées à l'IA (code, doc, recherche d'alternatives, rédaction, tests)
- Exemples concrets d'arbitrages et corrections apportés par le référent tech
- Méthodes de revue du code produit
- Limites identifiées et précautions prises (hallucinations, code non testé, décisions silencieuses évitées)

## Références

- Nygard, M. (2011). *Documenting Architecture Decisions*. [Lien](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).
- Documentation Claude Code — hooks : <https://docs.claude.com/en/docs/claude-code/hooks>.
