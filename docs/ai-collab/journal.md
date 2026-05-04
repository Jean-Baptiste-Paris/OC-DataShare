# Journal de collaboration avec l'IA (copilote Claude)

> Source de vérité pour la **section 8 du Livrable 1** (« Utilisation de l'IA dans le développement »).
> Une entrée par séance. 4 axes imposés par le gabarit OC :
> 1. **Posture adoptée** — junior / binômage (vibe coding) / combinaison.
> 2. **Tâches confiées** — implémentation, tests, documentation, ADR…
> 3. **Supervision et corrections** — revues, ajustements, refus, reformulations.
> 4. **Apports et limites constatés** — gain, inspiration / erreurs, incohérences.
>
> Discipline : en fin de séance, le copilote propose une entrée, le user la valide/corrige.

---

## Séance 1 — 2026-04-19

**Contexte :** brief initial du projet DataShare. Mise en place du cadre de collaboration et première pièce jointe étudiée (spécifications fonctionnelles).

### Posture adoptée
Binômage structurant dès le départ : le user pilote (rôle « référent tech senior »), le copilote propose et ne démarre rien sans feu vert. Règle opérationnelle inscrite dans `CLAUDE.md` : explication amont (quoi / à quoi ça sert / pourquoi) pour tout concept nouveau, puis attente de validation.

### Tâches confiées
- Lecture et synthèse de la spécification fonctionnelle (`P3+EDO+P4+AL+-+Spécifications…pdf`).
- Rédaction de `CLAUDE.md` (contexte projet, cadre pédagogique, livrables, soutenance, posture, arbitrages).
- Identification des 8 ambiguïtés de la spé, résolution des 3 premières en binôme.
- Rédaction de `docs/ai-collab/README.md` (méthode de collaboration).
- Rédaction de **ADR 0001 — Streaming upload** au format Nygard détaillé.

### Supervision et corrections
- Le user a imposé une **règle stricte d'arbitrage MVP** (optionnel = hors scope même si mentionné dans une US MVP) — captée en mémoire et dans `CLAUDE.md`.
- Le user a demandé un **ADR détaillé plutôt qu'une note** quand il signale moins de maîtrise du sujet, pour pouvoir défendre seul à l'oral.

### Apports et limites constatés
- **Apport :** structuration rapide d'un cadre de travail défendable (rôles, livrables, règles d'arbitrage) à partir de documents bruts.
- **Limite :** le copilote a tendance à vouloir enchaîner sur l'implémentation — la règle « feu vert explicite » a dû être rappelée dans `CLAUDE.md`.

---

## Séance 2 — 2026-04-20

**Contexte :** étude de la deuxième pièce jointe (modèle de documentation technique OC, format ODT), mise en place du journal de collaboration.

### Posture adoptée
Identique à la séance 1 : binômage piloté par le user. Validations explicites à chaque étape (« go pour les 2 premiers », « ça me va »).

### Tâches confiées
- Extraction et synthèse du gabarit ODT (`docs/P3+EDO+P4+AL+-+Modèle+de+Documentation+technique.odt`).
- Mise à jour de `CLAUDE.md` avec les précisions du gabarit (tableau 4 colonnes de la section 2, UML/Merise pour la section 3, contraintes des autres sections).
- Création de `docs/livrables/L1-doc-technique.md` (squelette des 8 sections, tableau de la section 2 pré-câblé).
- Création de ce journal (`docs/ai-collab/journal.md`).

### Supervision et corrections
- **Correction importante :** le copilote avait interprété la section 8 du gabarit comme une **contrainte de vocabulaire** (« reprendre les termes junior/binômage/vibe coding »). Le user a recadré : ces 4 bullets sont en fait un **cahier des charges de tracking** — les choses à consigner au fil des séances pour alimenter la section 8 finale. Conséquence : reformulation dans `CLAUDE.md` et création de ce journal comme mécanisme concret.

### Apports et limites constatés
- **Apport :** extraction propre du contenu d'un format non-trivial (ODT = zip XML), synthèse rapide des points structurants vs. décoratifs du gabarit.
- **Limite :** biais d'interprétation du copilote qui a transformé une consigne de **tracking** en consigne de **vocabulaire**. Corrigé par le user — illustre pourquoi la supervision humaine reste nécessaire même sur des tâches de lecture/synthèse qui paraissent bénignes.

---

## Séance 3 — 2026-04-20 (suite, même jour)

**Contexte :** étude de la troisième pièce jointe (maquettes Figma), incluant la résolution d'un blocage d'accès et un arbitrage structurant maquette ↔ MVP.

### Posture adoptée
Binômage. Investigation commune sur un blocage d'outillage (MCP Figma), puis posture classique d'analyse dirigée par le user.

### Tâches confiées
- Tentative d'accès au fichier Figma via MCP (échec).
- Lecture des resources MCP Figma pour diagnostic.
- Extraction d'un zip d'exports Figma contenant des noms de fichiers à encodage abîmé (`Téléversement.png` → extraction par Python `zipfile` avec gestion explicite de l'encodage, contournant l'échec de `unzip`).
- Analyse des 5 PNG (Components, Login, Téléversement, Téléchargement, Mon espace), inventaire des écrans et des états, identification des composants du design system.
- Rédaction de `docs/maquettes/NOTES.md` — inventaire + table des écarts maquette/MVP par zone.
- Mise à jour de `CLAUDE.md` : PJ 3 ✅, règle « maquette = source de vérité UI, MVP = scope fonctionnel », résolution de l'ambiguïté accueil non-auth.

### Supervision et corrections
- **Direction stratégique imposée par le user :** initialement le copilote proposait de *retirer* les zones UI liées aux US optionnelles (champ mdp, select expiration, filtre Expiré, etc.). Le user a recadré : **« on suit la maquette mais certaines fonctionnalités métier n'existeront pas »** — d'où la règle « maquette = référence UI / MVP = scope métier », avec arbitrage par zone au moment de coder. Reformulation dans `CLAUDE.md` et transposition dans `NOTES.md`.
- **Contrainte d'outillage remontée par le user :** MCP Figma inutilisable sur ce poste (compte Claude pro Revolucy ≠ compte Figma perso du user). Conséquence : workflow maquettes = **exports statiques PNG** pour tout le projet. Acté dans `CLAUDE.md`.

### Apports et limites constatés
- **Apport :** diagnostic rapide d'un problème d'encodage de zip (où `unzip` échouait silencieusement), contourné par `zipfile` Python.
- **Apport :** synthèse structurée des 5 écrans avec distinction nette entre ce qui relève du scope MVP et ce qui relève des US optionnelles — base directement réutilisable pour l'implémentation.
- **Limite :** le copilote avait par défaut une lecture « puriste MVP » (retirer toute UI liée à du hors-scope). Cette lecture aurait dégradé l'alignement avec la maquette — et donc la cohérence du livrable. Recadrage user nécessaire.

---

## Séance 5 — 2026-05-03

**Contexte :** reprise après point de suivi mentor. Révision du modèle de domaine (soft delete US06), construction pas à pas du schéma d'architecture Lucidchart (dernier livrable étape 1), mise à jour de la section 2 du L1 (choix technologiques), arbitrage Zustand.

### Posture adoptée
Binômage piloté par le user. Sur le schéma d'architecture, posture de **copilote guidant la construction** : le user dessine dans Lucidchart, le copilote dicte les blocs, les positions et les flèches un à un, en attendant le feu vert à chaque étape. Validations fréquentes par screenshots.

### Tâches confiées
- Révision du modèle de domaine (`modele-domaine.md`) : ajout de `deleted_at` sur l'entité `File`, suppression de la ligne « champ écarté », mise à jour de la règle métier US06 (soft delete).
- Mise à jour de `docs/conception/openapi.yaml` : révision de la description `DELETE /files/{id}` et `GET /files`.
- Lecture et analyse de la fiche d'autoévaluation OC (`Fiche+d'autoévaluation.pdf`) — identification des indicateurs de réussite couverts par le schéma d'architecture.
- Construction guidée pas à pas du schéma d'architecture Lucidchart : 3 zones (Client React, Serveur Symfony, Données), couches internes, flèches inter-zones, légende.
- Arbitrage **Zustand** comme solution de gestion d'état (vs Redux, React Context).
- Mise à jour `CLAUDE.md` : Zustand ajouté à la stack front.
- Mise à jour `docs/livrables/L1-doc-technique.md` section 2 : correction Auth JWT (localStorage + Bearer), suppression ligne CSRF, correction justification Axios, ajout ligne Zustand.

### Supervision et corrections
- **OpenAPI — descriptions orientées consommateur :** le copilote avait rédigé des descriptions d'endpoints avec des détails d'implémentation interne (mention de `deleted_at`, `StorageInterface`, "Option B"). Le user a recadré à deux reprises : les descriptions s'adressent à un développeur externe, pas à un évaluateur. Règle persistée en mémoire.
- **Aucune référence au mentor dans les artefacts :** le copilote avait mentionné "recommandation mentor" et "Option B" dans `modele-domaine.md`. Recadrage immédiat du user — les artefacts restent dans le registre de la décision technique, pas de la méta-décision.
- **Position du store Zustand — erreur et correction en deux temps :** le copilote a d'abord proposé correctement Store → Services HTTP (idiomatic Zustand). Quand le user a exprimé un doute, le copilote a eu tort d'acquiescer et de retirer la flèche. Après vérification du pattern Zustand (actions async dans le store), le copilote a reconnu l'erreur et rétabli la connexion Store → Services HTTP. Illustration : la supervision du user est nécessaire, mais le copilote ne doit pas céder sans vérification.
- **Flèches du schéma :** plusieurs corrections de direction (flèche Client → Serveur partant des Vues plutôt que des Services HTTP, flèche PostgreSQL ↔ Stockage supprimée car inexistante architecturalement, flèche Accès aux données → Stockage manquante).
- **Bloc Authentification manquant côté Symfony :** le copilote ne l'avait pas inclus dans la première version. Identifié par le user — ajouté en amont des Contrôleurs.

### Apports et limites constatés
- **Apport :** la construction guidée du schéma pas à pas a permis au user de prendre des décisions à chaque étape (couleurs, niveau de détail, noms des blocs stack-agnostiques vs nommés). Le livrable final est pleinement approprié par le user.
- **Apport :** la lecture de la fiche d'autoévaluation a révélé que le schéma devait montrer l'architecture **interne** des deux couches (front + back), pas seulement les 3 boîtes de haut niveau — évitant un livrable insuffisant.
- **Limite :** le copilote a acquiescé trop vite au doute du user sur la position du store Zustand, sans vérifier le pattern idiomatic avant de répondre. Cela a introduit une erreur temporaire dans le schéma.

---

## Séance 6 — 2026-05-04

**Contexte :** finalisation du socle technique (Étape 2). Configuration Symfony côté env, génération des clés JWT, création de la BDD, configuration vitest côté front, push du repo sur GitHub.

### Posture adoptée
Binômage piloté par le user. Validations implicites (« done », « yes ») à chaque étape.

### Tâches confiées
- Création de `api/.env.local` (DATABASE_URL PostgreSQL 18, JWT_SECRET_KEY/PUBLIC_KEY, STORAGE_PATH, CORS_ALLOW_ORIGIN).
- Génération des clés JWT via `lexik:jwt:generate-keypair`.
- Création de la base `datashare` via `doctrine:database:create`, validation du schéma.
- Démarrage et smoke test du serveur Symfony (http://127.0.0.1:8000, PHP 8.5.4).
- Configuration de `vite.config.ts` : section `test` (jsdom, setupFiles), proxy `/api` via `VITE_API_URL`.
- Création de `front/src/test/setup.ts` (import jest-dom).
- Ajout des types `vitest/globals` dans `tsconfig.app.json`.

### Supervision et corrections
- **Ports et proxy hardcodés :** le copilote avait mis `port: 5173` et `'http://127.0.0.1:8000'` en dur dans `vite.config.ts`. Le user a signalé le problème. Correction : suppression du port (valeur par défaut Vite), proxy via `process.env.VITE_API_URL` avec fallback, valeur dans `front/.env.local` (non versionné).

### Apports et limites constatés
- **Apport :** mise en place complète du socle en une séance courte (env, BDD, JWT, test runner, proxy).
- **Limite :** réflexe de hardcoder les valeurs de configuration au lieu de les externaliser — corrigé après remarque du user.

---

## Séance 4 — 2026-04-25

**Contexte :** reprise après plusieurs jours d'interruption. Passe d'arbitrage des 5 ambiguïtés restantes, rédaction d'un ADR détaillé sur la stratégie d'authentification JWT, et arbitrage de la stack technique complète. Séance longue et dense, structurante pour tout le reste du projet.

### Posture adoptée
Binômage exigeant. Le user a explicitement demandé une discussion sous-décision par sous-décision, après recadrage en cours de séance. Posture du copilote : analyse des options par critères pondérés (priorisés en début de séance par le user), proposition argumentée, attente de validation point par point.

### Tâches confiées
- **Vérification factuelle** dans la spé fonctionnelle (page 8 PERF) suite à une imprécision du copilote (« au moins un endpoint » → en réalité « un endpoint » au singulier).
- Résolution des 5 ambiguïtés ouvertes (#4 endpoint critique PERF, #5 niveau WCAG, #6 extensions interdites, #7 stratégie JWT, #8 seuil de couverture).
- **Rédaction de ADR 0002 — Stratégie d'authentification JWT** (format Nygard, ~400 lignes), avec préambule pédagogique (analogie du bracelet), 6 sous-décisions D1-D6 (durée, refresh, storage, CSRF, algo, logout), section « préparation à l'oral » avec questions probables et réponses défendables.
- **Rédaction de ADR 0003 — Stack technique** (~250 lignes) : Back Symfony, BDD PostgreSQL, Front React, Stockage FS local + abstraction `StorageInterface`. Justifications par critères pondérés (a > e > d > c > f > b).
- Mise à jour de `CLAUDE.md` : 5 ambiguïtés résolues, stack consolidée, ADR référencés.
- Mise à jour de `docs/livrables/L1-doc-technique.md` : tableau section 2 entièrement rempli avec les choix actés.

### Supervision et corrections
- **Recadrage majeur sur la posture de validation :** après que le copilote a proposé en mode A/B (« A — discussion courte / B — ADR détaillé décision par décision »), le user a choisi B. Le copilote a alors écrit un ADR avec **les 6 décisions toutes pré-tranchées d'un coup**, alors que la consigne disait *« décision par décision avec toi »*. Le user a recadré : *« je pensais qu'on décidait quand même ensemble »*. Conséquence : ADR rebasculé en `proposed (BROUILLON)`, ambiguïté #7 repassée en ⏳, **règle persistée en mémoire** (`feedback_validation_par_sous_decision.md`) : sur les livrables multi-décisions, un OK top-level ne vaut pas validation des sous-décisions.
- **Vérification factuelle imposée par le user** : sur la phrase « la consigne dit au moins un endpoint », le user a demandé la source. Vérification dans la spé (page 8) : c'est « un endpoint » au singulier — embellissement abusif. Reco révisée en conséquence.
- **Recadrage léger sur la pédagogie** : le copilote a déployé une explication complète de ce qu'est un ORM quand le user voulait juste savoir comment s'appelait celui de Symfony. Rappel implicite de la règle CLAUDE.md « skip si le user connaît ».
- **Décision UX explicite du user** sur D1 (durée JWT) : 8 h plutôt que la reco initiale de 1 h, en assumant l'arbitrage UX/sécurité (ergonomie de service B2B vs fenêtre d'exploitation). Reformulation de l'ADR pour défendre proprement ce choix.

### Apports et limites constatés
- **Apport :** l'analyse multi-critères pondérée par le user (a > e > d > c > f > b) a permis un arbitrage rigoureux et défendable, et chaque ADR contient une section « préparation à l'oral » avec questions probables. Le user dispose maintenant de documents qu'il peut relire à froid avant la soutenance.
- **Apport :** mise en évidence pédagogique de DIP (Dependency Inversion) sur le choix stockage — argument fort pour défendre FS local plutôt que S3 hardcodé.
- **Limite récurrente :** **biais du copilote à figer prématurément**, à deux occasions dans la même séance (sur l'ADR 0002 entier, puis dans la déduction « au moins un » non sourcée). Ces deux corrections illustrent le rôle critique de la supervision humaine sur des livrables denses, où la fluidité du copilote peut masquer des libertés prises avec la rigueur.
- **Limite mineure :** sur-pédagogie (explication ORM non demandée). Coût d'attention pour le user.
