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

## Séance 7 — 2026-05-05

**Contexte :** démarrage de l'Étape 3 (implémentation US03 — création de compte). Construction full-stack côté back de toute la pyramide (Entity → Repository → DTO → Service → Controller → Tests). Mise en place de l'infrastructure de test PHPUnit. Tentatives infructueuses d'installer un driver de coverage (PCOV/Xdebug) sur PHP 8.5 + macOS Homebrew. Séance dense, en majorité du code applicatif, avec un fil pédagogique granulaire suite à un signal explicite du user.

### Posture adoptée
Démarrage en posture **junior à briefer** (le copilote propose, le user valide point par point). Recalibration explicite vers une **pédagogie ultra-granulaire** après que le user a signalé « C'est trop compliqué pour moi. On découpe davantage, j'apprends » : passage à ≤ 1 concept par tour, validation question par question, carte mentale conceptuelle posée avant tout code. Plus rapide sur les concepts déjà maîtrisés (Repository pattern, mocks/stubs basiques, RFC concepts) ; ralentissement sur Symfony/Doctrine.

### Tâches confiées
- **Révision du contrat API** suite à décision du user de retirer l'auto-login sur `/auth/register` (ADR 0004 à rédiger). Impact 7 endroits dans `openapi.yaml` + `contrat-interface.md`.
- **Implémentation back complète US03** :
  - `User` Entity (UUIDv7 généré côté PHP, email VARCHAR(254) RFC 5321 normalisé lowercase+trim dans le setter, `password` avec `#[Ignore]` anti-fuite serializer, `createdAt` immuable, `UniqueEntity` + contrainte SQL unique en double-couche, implémente `UserInterface` + `PasswordAuthenticatedUserInterface`).
  - Migration Doctrine + application sur `datashare`.
  - `UserRepository` héritant de `ServiceEntityRepository` : `findOneByEmail` (pattern « intention métier »), `save($user, $flush)` (pragmatique Symfony).
  - DTO d'entrée `RegisterRequest` (`final readonly`, constructor promotion, contraintes `Assert\Email/NotBlank/Length`).
  - DTO de sortie `UserResponse` avec named constructor `fromUser()` (séparation Entity/contrat HTTP).
  - Exception métier `EmailAlreadyExistsException` (héritage `RuntimeException`, message contextuel pour logs).
  - `UserRegistrationService` (orchestration : normalisation → lookup → hash → save), avec injection au constructeur de `UserRepository` + `UserPasswordHasherInterface`.
  - `AuthController::register` avec `#[MapRequestPayload]` (désérialisation + validation auto), réponse 201 envelope `{ data }`, erreur 409 RFC 7807 `application/problem+json`.
- **Pyramide de tests (25 tests verts, 50 assertions, 0.4 s)** :
  - `UserRegistrationServiceTest` (4 tests, mocks/stubs PHPUnit) : succès, conflit email, normalisation, hash en clair vers hasher.
  - `UserTest` (12 tests dont 6 via DataProvider) : UUIDv7, `createdAt`, normalisation email (3 cas), `getRoles`, `getUserIdentifier`, `eraseCredentials`.
  - `AuthControllerRegisterTest` (5 tests, `WebTestCase`) : 201 nominal, 409 sur conflit, 422 sur email invalide / mdp court, 4xx sur champs manquants.
  - `UserRepositoryTest` (4 tests, `KernelTestCase`) : lecture présente/absente, save sans/avec flush.
- **Infrastructure de test** : install `symfony/test-pack`, BDD `datashare_test` créée + migrée via `dbname_suffix '_test'` Doctrine, `.env.test.local` non versionné.
- **Configuration coverage** : exclusions dans `phpunit.dist.xml` (DTOs, Exception, Kernel) alignées sur l'ambiguïté #8 résolue.

### Supervision et corrections
- **Carte mentale conceptuelle exigée par le user** avant tout code Symfony. Un premier plan dense en « 6 lots parallèles + 4 questions » a été rejeté ; recalibrage vers une décomposition ≤ 1 concept par tour. Règle persistée en mémoire (`feedback_pedagogie_granulaire.md`).
- **Convention `use` vs FQN inline** : le copilote a écrit `\DateTimeInterface::ATOM` inline dans `UserResponse` alors que la convention DataShare est l'import via `use` en haut de fichier (déjà appliquée dans `User.php`). Le user a corrigé. Règle persistée en mémoire (`feedback_use_imports.md`), à appliquer aussi à `extends \RuntimeException` etc.
- **Descriptions OpenAPI orientées consommateur (règle élargie)** : le copilote a écrit « le front redirige vers /login » dans le contrat API. Le user a recadré : « le back ne décide pas du fonctionnement du front ». Règle existante en mémoire élargie : interdit symétrique (ni implémentation interne back, ni prescription du consommateur).
- **Cartographie incomplète des couches** : la liste initiale des pièces Symfony pour US03 omettait Repository et Service comme couches distinctes (Repository glissé en passant au mouvement 3, Service absent). Le user a pointé l'omission. Cartographie corrigée en 4 couches Controller / Service / Repository / Entity, avec argument oral SRP/testabilité/réutilisabilité.
- **Décision register sans auto-login (initiée par le user, raisonnement SOLID)** : le user a challengé l'auto-login proposé en conception au motif de SRP back. Discussion menée à un argument oral solide (extensibilité future = vérification email). ADR 0004 à rédiger.
- **Trade-off anti-énumération sur `/register` (initiée par le user)** : le user a soulevé l'asymétrie avec `/login`. Décision documentée : 409 explicite assumé en MVP (pas d'infra mail), mitigation V2 (option email transactionnel + rate limiter), trace à porter dans `SECURITY.md`.
- **Code dupliqué détecté par le user** : `409` apparaissait deux fois dans la construction de réponse (body RFC 7807 + statut HTTP). Refactor avec `$status` en variable locale ; double présence body+statut conservée car requise par la spec RFC 7807.
- **Tests unitaires manquants** : le copilote a initialement proposé un test curl bout-en-bout pour valider US03. Le user a recadré : pyramide complète obligatoire (consigne OC + critère 70 %).
- **Distinction mock vs stub** : PHPUnit 13 a signalé des deprecations sur `with()` sans `expects()`. Occasion d'expliciter la taxonomie Meszaros (stub = retourne ; mock = vérifie) et de refactor les tests Service en `createStub` quand il n'y avait pas d'expectation.
- **Diagnostic d'erreur runtime** : la première version de `UserTest` appelait `$uuid->getVersion()` qui n'existe pas sur `UuidV7` ; correction par `assertInstanceOf(UuidV7::class, ...)`.
- **Fonctionnalités critiques** rappelées par le user en cours de séance (« il faut une pyramide de test ») — preuve que la consigne « identifier vos fonctionnalités critiques » est mieux respectée par couvercle haut que par couvercle bas (le user a guidé la stratégie).

### Apports et limites constatés
- **Apport — Pyramide de tests posée tôt et complète** : 25 tests verts couvrant les 4 niveaux (unit service, unit entity, integration repo, functional HTTP) en moins de 0.5 s. Stratégie d'exclusion coverage explicite alignée sur l'ambiguïté #8 résolue.
- **Apport — Concepts SOLID raccrochés à des décisions concrètes** : DIP (autowiring + interfaces), ISP (`UserInterface` + `PasswordAuthenticatedUserInterface` séparés), SRP (Service/Controller, register/login séparés), OCP (Service ouvert à l'ajout futur d'événements). Plusieurs questions probables à l'oral pré-armées.
- **Apport — Itération vivante conception ↔ code** : raffinement du contrat API (suppression auto-login + descriptions consommateur) en cours d'implémentation, pas après-coup. Preuve qu'on ne « fige » pas la conception et qu'on ajuste honnêtement quand un meilleur design émerge.
- **Apport — Adaptation pédagogique** : reconnaissance et recalibrage explicite après signal du user (« on découpe davantage »). Comparaison Doctrine/Django, PHP/Python, Symfony Security/DRF utilisée en permanence pour ancrer.
- **Limite — Coverage non mesuré ce palier** : 4 tentatives d'install drivers (PCOV via pecl, PCOV via brew tap, Xdebug via brew tap, PCOV avec `CFLAGS`) ont toutes échoué sur le combo PHP 8.5 + macOS Homebrew (pas de package précompilé en mai 2026, compilation en succès puis install final bloqué). **Dette explicite tracée**, à reprendre en début de prochaine séance ou via Herd.
- **Limite — Biais initial de cartographie** : oubli des couches Service/Repository dans le mapping mouvements↔Symfony. Pointé par le user. Risque structurel à surveiller : « le copilote pose trop vite des plans incomplets ».
- **Limite — Sur-densification récurrente** : tendance répétée à proposer des plans denses (« 6 lots + 4 questions ») même après que le user a signalé qu'il découvre la stack. Coût d'attention pour le user, signal qui s'est répété 3 fois sur la séance avant recalibrage durable.
- **Limite — Conventions de code non tenues automatiquement** : `use` vs FQN inline oublié à 2 fichiers. Symptôme d'un défaut d'auto-vérification en haut de fichier. Mémoire mise à jour.

### Dettes ouvertes en fin de séance
- **ADR 0004** à rédiger : « Pas d'auto-login sur /auth/register » (format Nygard, SRP + extensibilité vérif email).
- **`SECURITY.md`** ébauche : politique mdp, JWT, anti-énumération `/login`, trade-off `/register` assumé.
- **`TESTING.md`** ébauche : pyramide actuelle, dette coverage tracée.
- **Firewall `security.yaml`** à durcir : autoriser explicitement `/api/auth/*` en public (préparation US04).
- **US04 (login)** : majoritairement de la config Symfony Security + Lexik, peu de code applicatif.
- **Coverage local** : à reprendre à tête reposée (Herd ou autre).

---

## Séance 8 — 2026-05-09

**Contexte :** séance dense de mise en place du design system front, démarrage effectif de l'étape 3 OC côté UI. Résolution préalable de la dette « coverage back PCOV », rédaction d'un ADR de stack DS, pipettage de la palette à partir des PNG maquette, et construction des 6 composants UI dans la même session.

### Posture adoptée
Binômage piloté avec pédagogie granulaire renforcée. Posture sous-décision par sous-décision exigée explicitement sur l'ADR 0005 (rappel de la règle `feedback_validation_par_sous_decision.md`). Plusieurs recadrages en cours de séance vers une explication moins jargonneuse (« j'ai rien compris à Radix », « API ? »).

### Tâches confiées
- **Déblocage dette PCOV** (séance 7) : pipeline `brew install pcre2` + `CPPFLAGS=-I/opt/homebrew/include pecl install pcov` + création manuelle du dossier `/opt/homebrew/lib/php/pecl/20250925`. Coverage 100 % du périmètre US03 (4 classes, 17 méthodes, 45 lignes).
- **Rédaction de l'ADR 0005 — Stack et architecture DS** (~330 lignes, 6 sous-décisions D1-D6 : styling CSS Modules, Radix sur Switch+Select, périmètre 6 composants, structure folder-per-component avec alias `@/`, doc minimale README global + TSDoc, tests de contrat 1-3/composant, section « préparation à l'oral »).
- **Pipettage de la palette maquette par le user** (~14 valeurs hex : primary, gradient, noirs sémantiques, callouts × 3 triplets, inputs, boutons × 4 variants), consolidation et rationalisation des tokens dans `front/src/styles/theme.css`.
- **Setup front** : alias `@/` (Vite + tsconfig), création des dossiers `styles/`, `components/ui/`, `features/`, `pages/`, install `@radix-ui/react-toggle-group`, `@radix-ui/react-select`, `@fontsource/dm-sans`, `lucide-react`. Réécriture `index.css`, `App.tsx` (router shell), `main.tsx` (BrowserRouter + ordre d'imports critique).
- **Construction des 6 composants UI** : Button (4 variants), Input (label/helper/error + a11y `aria-describedby`), Header (responsive `@media` + `@container`), Callout (3 variants + Lucide icons), Switch (Radix toggle-group, pill segmenté), Select (Radix select complet, portal). 18 tests Vitest verts, TSDoc sur les props, gabarit folder-per-component appliqué.
- **Page `/design-system`** : route dédiée avec rendu vivant de chaque composant, exemples par variant et état. Container queries pour la preview mobile du Header sans redimensionnement.

### Supervision et corrections
- **Recadrage jargon copilote** (3 occurrences) : « API » utilisé pour interface composant (recadré → « contrat / props »), « Radix headless » pas explicité (recadré → exemple concret du Switch a11y), confusion Zustand/Radix anticipée par le user (recadré sur la distinction état applicatif vs comportement composant local).
- **Recadrage rythme** : sur le setup alias `@/` (« explications ? »). Le copilote allait trop vite sur la plomberie. Reprise pédagogique avec décomposition.
- **Bug d'inattention** : icône erreur du Callout en `width="16"` alors que les autres étaient à `width="12"` (faute de frappe dans une édition antérieure). Le user a noté la différence visuelle persistante après plusieurs ajustements de SVG. Solution : passage à Lucide React (icônes uniformes par construction), élimination de la classe d'erreur.
- **Arbitrage palette par le user** : promotion de `#E27F29` au rang de `--color-primary` était discutable (argument « occurrences boutons » plutôt que « brand color »). Le user a re-pipetté `#E77A6E` sur le Switch sélectionné, révélant l'erreur de hiérarchie sémantique. Compromis acté : `--color-primary: #E27F29` (interactif global), `--color-corail: #E77A6E` (Switch sélectionné uniquement).
- **Itérations visuelles cadrées** : letter-spacing DM Sans (3 itérations -0.01 / -0.015 / -0.02), taille logo Header (×2), Switch (warning border / has() corail / 3-pills / retour pill unifié warning), tokens border (alias / unset / warning).
- **Conformité WCAG assumée** : `#FFF` sur `#E77A6E` du Switch sélectionné (ratio 2,92 < 4,5:1 AA). Le user a choisi de garder la maquette et documenter l'écart dans `TESTING.md` plutôt que dévier visuellement.

### Apports et limites constatés
- **Apport — DS complet en une séance** : 6 composants, 18 tests verts, TSDoc, page DS vivante. Le gabarit folder-per-component (Button) a permis de répliquer rapidement sur les 5 suivants.
- **Apport — Pipettage rigoureux par le user** : palette extraite valeur par valeur, identification des inconsistances de la maquette (3 noirs distincts, 5 corails), rationalisation explicite avec arbitrages tracés. Argument oral solide : « le DS est plus cohérent que la maquette source, par décisions explicites ».
- **Apport — CSS moderne défendable à l'oral** : `@container` queries pour la preview mobile, `:has()` pour l'état actif, CSS Modules + custom properties. Tous standards supportés en 2026, pas d'expérimental.
- **Apport — Radix utilisé chirurgicalement** : uniquement Switch et Select (composants à fort enjeu a11y), pas de surface inutile. Argument oral : « j'ai délégué le bas niveau a11y à une lib éprouvée pour me concentrer sur l'archi du DS ».
- **Apport — Lucide React vs SVG bespoke** : démontre l'application de SOLID au choix d'outillage (les icônes héritent de la même `size` par construction, élimine la classe de bugs de copier-coller).
- **Limite — Sur-jargon récurrent** : « API », « headless », « stratégie », « token » utilisés sans définir, recadré par le user. Symptôme persistant : poser le vocabulaire avant de l'utiliser.
- **Limite — Biais d'aller trop vite sur la plomberie** : setup alias passé en mode automatique sans expliquer. Le user a refusé l'edit, rappel utile sur la posture pédagogique granulaire.
- **Limite — Inertie sur la promotion de tokens** : `--color-primary` promu sur l'argument « occurrences » sans considérer la hiérarchie sémantique brand-vs-action. Erreur révélée seulement quand le user a re-pipetté la couleur d'origine sur un autre composant.
- **Limite — Bug copier-coller SVG** : trois passes successives sur la taille du X de l'icône erreur sans détecter qu'un attribut `width="16"` traînait. Le passage à Lucide a éliminé le bug structurellement.

### Dettes ouvertes en fin de séance
- **ADR 0004** (pas d'auto-login sur `/auth/register`) toujours non rédigé.
- **`TESTING.md` ébauche** : pyramide back actuelle (25 tests, 100 % coverage US03), pyramide front (18 tests Vitest), procédure d'install PCOV documentée, **non-conformité WCAG AA assumée sur le Switch sélectionné** à tracer.
- **`SECURITY.md` ébauche** : politique mdp, JWT, anti-énumération `/login`, trade-off `/register` assumé.
- **README global du DS** (D5 ADR 0005) : un seul fichier `front/src/components/ui/README.md` à écrire (catalogue 6 composants, conventions communes).
- **Firewall `security.yaml`** : autoriser explicitement `/api/auth/*` en public (préparation US04).
- **US04 back** : config Symfony Security + Lexik JWT, peu de code applicatif.
- **US03 + US04 front** : pages Login et Register consommant les composants du DS.

---

## Séance 9 — 2026-05-09 (suite, même jour)

**Contexte :** finalisation de l'US03 côté front, dans la foulée de la séance 8 (DS livré). Construction full-stack front de la pyramide auth : plomberie réseau → service mappant les erreurs HTTP → store Zustand → validation client → page Register + placeholder Login → routing → tests Vitest → smoke browser. Ajout d'un composant `Footer` au DS (7e composant, hors périmètre initial). Mise en place du pipeline E2E Cypress avec un endpoint test-only Symfony pour piloter la BDD test, et écriture de 5 scénarios KO. Rédaction de l'ADR 0004 (pas d'auto-login sur /register), dette héritée de la séance 7.

### Posture adoptée
Binômage piloté avec posture sous-décision par sous-décision sur les structuralités (organisation des fichiers, validation client, store, flow succès, infrastructure E2E). Pédagogie granulaire renforcée sur les concepts nouveaux (intercepteur axios vs YAGNI, union discriminée, mapping HTTP → erreurs typées, idiomatic Zustand action async, endpoint test-only). Validation systématique des sous-décisions avant code : 4 questionnaires structurés en début de plan, 1 en cours sur `baseURL` axios + intercepteur, 1 sur infrastructure E2E (B endpoint test-only + datashare_test).

### Tâches confiées
- **Rédaction ADR 0004** « Pas d'auto-login sur POST /auth/register » (~110 lignes) — formalise la décision prise séance 7 (SRP + extensibilité OCP), documente le trade-off anti-énumération assumé MVP, prépare 5 questions probables pour l'oral.
- **Lot 1 — apiClient axios** : instance partagée, baseURL via env var, pas d'intercepteur (YAGNI strict, parsing par service).
- **Lot 2 — Types et service auth** : `RegisterPayload`, `User`, `RegisterError` union discriminée à 3 variantes (`email-already-taken` / `validation` / `network`), garde `isRegisterError`, service `register()` qui mappe HTTP en throw d'erreurs typées.
- **Lot 3 — Validation client** : règles miroir back (email format/254 chars, password ≥ 8) + confirm password client-only.
- **Lot 4 — Store Zustand** : `authStore` avec `status` / `error` / `register()` / `reset()`, normalisation des erreurs non typées en `network`.
- **Lot 5 — Pages** : `RegisterPage` (composition DS, branchement store, validation client, redirect /login + flash success via `location.state` RR7) et `LoginPage` placeholder (consomme le flash).
- **Lot 6 — Routing** : ajout des routes `/register` et `/login` à `App.tsx`.
- **Lot 7 — Tests Vitest** : 27 nouveaux tests (validation 11, service 5 incl. mapping 201/409/422/5xx, store 5 transitions, page 6 incl. flash success + 409 callout + 422 fieldErrors). Test du flash success via composant `LoginCapture` mock dans MemoryRouter (corrigé pour respecter purity rule via `useEffect`).
- **Composant `Footer`** ajouté au DS (folder-per-component, test, TSDoc), masqué en mobile conformément à la maquette. Token `--container-max-width` (1280px) introduit dans `theme.css` et appliqué à Header + Footer.
- **Itérations visuelles RegisterPage** (~10 micro-ajustements) : titre en gras, ordre actions, placeholders, regroupement des 2 boutons dans une `div` pour échapper au gap du form, padding card, taille card, taille logo Header, padding bloc, taille titre.
- **Pipeline E2E Cypress** : install Cypress 15 + `@testing-library/cypress`, configuration (`cypress.config.ts`, `support/`, `tsconfig` isolé), exclusion `cypress/` du lint, scripts `e2e:open` / `e2e:run`.
- **Endpoint test-only Symfony** `POST /test/users/reset` : `TestUsersController` qui throw `NotFoundHttpException` hors `APP_ENV=test`. Consommé par `cy.resetUsers()` (commande custom).
- **Spec `register.cy.ts`** : 5 scénarios KO (4 validation client avec assertion `cy.intercept().as().all length 0`, 1 conflit 409 avec seed via `cy.request POST /api/auth/register`).
- **Documentation** : `front/cypress/README.md` (pré-requis, périmètre, architecture).
- **9 commits** propres sur main, organisés par cohérence sémantique (ADR / Footer+container / auth domain / pages+routing / endpoint back / Cypress setup).

### Supervision et corrections
- **Décision « plat sans regroupement métier » imposée par le user** : sur la question d'organisation des fichiers, le copilote proposait `features/` (convention React/TS répandue). Le user a tranché plat (`lib/`, `services/`, `stores/`, `validation/`, `types/`) sur l'argument « 3 domaines, pas la peine ». Acté avec posture defensive à l'oral préparée.
- **Recadrage architectural sur Zustand** : le copilote recommandait `useState` local pour le formulaire register. Le user a corrigé en s'appuyant sur la décision actée séance 5 (schéma d'archi Store → Services HTTP). Reconnaissance explicite par le copilote que le user était architecturalement cohérent et que la reco initiale était paresseuse.
- **Décision `VITE_API_URL` direct** : le copilote recommandait `'/api'` via proxy Vite (déjà configuré séance 6). Le user a choisi l'URL directe, ce qui rend le proxy inutilisé. Trade-off CORS noté, dette ouverte (clarifier ou retirer le proxy).
- **Décision « pas d'intercepteur axios »** : le copilote recommandait un intercepteur RFC 7807 dans `apiClient` (DRY pour US suivantes). Le user a tranché YAGNI strict, parsing dans `authService`. Acté.
- **Itérations visuelles guidées par le user** sur la `RegisterPage` (titre en gras, ordre des actions, placeholders, taille de carte, padding, taille de titre, taille de logo, footer en mobile) : le copilote a appliqué ligne par ligne, parfois en remontant la maquette pour confirmer un détail (lien → bouton borderless, position au-dessus du primary). Une itération a abouti à un revert (ajout puis retrait d'un `--font-size-4xl`, conservation YAGNI).
- **Erreur de fonction de test** : le copilote a écrit dans `RegisterPage.test.tsx` une assignation à une variable externe pendant le render du composant `LoginCapture` — violation du principe de pureté React, détectée par ESLint `react-hooks/globals`. Corrigé via `useEffect`.
- **Bug d'inattention résolu par le user** : message d'erreur Cypress « 404 Not Found » sur `/test/users/reset`, le copilote a diagnostiqué « Symfony pas lancé », le user a précisé qu'un container Docker tournait. Corrigé en stoppant le container, lancement du serveur Symfony en `APP_ENV=test`. Curl de validation `POST /test/users/reset` → 204.
- **Choix du mécanisme de reset BDD E2E** : le copilote a présenté 3 options (cy.exec Doctrine, endpoint test-only, cy.task pg) avec recommandation B (endpoint test-only). Le user a validé et précisé `datashare_test` (vs `datashare` dev) — décision défendable à l'oral.
- **Convention de tests Cypress / Vitest cohérente** : le copilote a installé `@testing-library/cypress` plutôt que d'utiliser des sélecteurs natifs Cypress. Argument oral : même API que les tests unitaires, cohérence pédagogique.

### Apports et limites constatés
- **Apport — Mapping HTTP en union discriminée** : le pattern `RegisterError = { kind: ... }` rend les branches d'erreur exhaustives au compilo. Argument oral solide pour démontrer du typage défensif au front. Le `switch (error.kind)` côté `RegisterPage` refuse de compiler si on oublie une branche.
- **Apport — Pyramide de tests front complète** : 11 validation + 5 service + 5 store + 6 page + 5 E2E KO. Couvre les 4 niveaux (unit pur, unit avec mock axios, unit avec mock service, intégration page+store+service mocké, E2E full-stack). Argument oral prêt sur la stratégie de tests.
- **Apport — Endpoint test-only avec garde explicite** : pattern lisible et défendable. Le `KernelInterface::getEnvironment()` check est plus direct qu'une condition de routing Symfony, plus accessible à l'oral pour un mentor non-Symfony.
- **Apport — Cypress + RTL alignés** : `findByLabelText` et `findByRole` partagés entre Vitest et Cypress. Réduit la charge cognitive et démontre une architecture de tests cohérente.
- **Apport — ADR 0004 rédigé en amont du code** : la dette de séance 7 a été écrasée juste avant d'écrire le flow de redirect, garantissant que le code reflète la décision actée et pas l'inverse.
- **Limite — Reco architecturale paresseuse sur Zustand** : le copilote a oublié la décision archi de séance 5 (schéma Store → Services HTTP) en proposant useState local. C'est le user qui a remis le copilote dans le rail. Symptôme : le copilote ne consulte pas systématiquement les décisions archi déjà actées avant de proposer.
- **Limite — Validation des décisions de structure non systématique** : sur le choix « features vs plat », le copilote a recommandé features sans présenter la palette complète d'options (modules, domains, plat) — c'est le user qui a contesté la formulation, déclenchant une question à choix multiples a posteriori. Symptôme : présenter d'emblée 3-4 options sur les questions structurantes plutôt qu'une reco unique.
- **Limite — Itérations visuelles sans rationalisation** : les ~10 micro-ajustements visuels ont été acceptés un par un sans proposition de batch. Coût d'aller-retour pour le user. Mécanisme à creuser : proposer dès la 2e ou 3e itération une vue d'ensemble (« on revoit l'échelle complète ? ») plutôt que continuer l'itération unitaire.
- **Limite — Diagnostic incomplet sur le 404 Cypress** : le copilote a diagnostiqué « Symfony pas lancé » mais n'a pas anticipé qu'un autre service pouvait occuper le port (Docker dans ce cas). C'est le user qui a apporté l'info manquante. Mécanisme à généraliser : sur un 404 réseau, proposer de checker `lsof -i :8000` ou de regarder le `Server:` header de la 404 (qui aurait montré WSGIServer immédiatement).

### Dettes ouvertes en fin de séance
- **US04 (login)** back + front : prochaine étape immédiate.
- **ADR 0005 D3** à mettre à jour : le DS passe de 6 à 7 composants (`Footer` ajouté).
- **`docs/maquettes/NOTES.md`** : mentionner le `Footer` comme composant DS livré.
- **README global du DS** (D5 ADR 0005) : reste à écrire (catalogue 7 composants).
- **Proxy `/api`** dans `vite.config.ts` : inutilisé depuis qu'on appelle directement `VITE_API_URL`. Soit retirer, soit clarifier en commentaire.
- **`SECURITY.md`** ébauche : mots de passe, JWT, anti-énumération `/login`, trade-off `/register`, XSS (D3 ADR 0002).
- **`TESTING.md`** ébauche : pyramide actuelle (back 25 + front 47 + E2E 5), procédure d'install PCOV, dette de couverture, écart WCAG AA Switch.
- **Firewall `security.yaml`** à durcir : autoriser explicitement `/api/auth/*` en public (préparation US04).
- **Scénarios E2E OK** (création + connexion + arrivée espace) : à ajouter post-US04.

---

## Séance 10 — 2026-05-09 (suite, même jour)

**Contexte :** finalisation de l'étape 3 OC avec l'US04 (connexion) en full-stack. Côté back : la majorité du travail est de la configuration Symfony Security + Lexik, peu de code applicatif (point déjà anticipé par le user en séance 7). Côté front : enrichissement du domaine auth (login + me + persist), rebascule de la `LoginPage` placeholder en formulaire complet, création d'un `UploadPage` placeholder (cible de redirection post-login choisie par le user, en attendant US01), bootstrap d'authentification au mount d'`App`. Spec E2E Cypress côté login avec un parcours bout-en-bout complet (création → flash → connexion → /upload). Diagnostic et correction d'un bug JWT (passphrase non chargée en `APP_ENV=test`).

### Posture adoptée
Binômage piloté avec posture sous-décision par sous-décision sur les choix structurants (4 questionnaires en début de plan US04 : récupération identité, persistance, logout back, RequireAuth ; 2 sur formats Lexik). Pédagogie granulaire sur les concepts back nouveaux (json_login, providers Doctrine, custom AuthenticationSuccessHandler, access_control PUBLIC_ACCESS, KernelInterface check pour gating env=test) et sur le pattern persist Zustand.

### Tâches confiées
- **Audit de l'existant** : composer.json (Lexik bundle déjà installé séance 6), security.yaml (config par défaut Symfony), routes/security.yaml (logout par défaut), keypair JWT (générée séance 6 mais avec passphrase default).
- **US04-back-1 + 2 — Configuration Symfony Security** :
  - `security.yaml` : provider Doctrine sur `User.email`, firewall `dev` (inchangé), firewall `login` (`pattern: ^/api/auth/login$`, stateless, `json_login` Lexik avec `username_path: email`), firewall `api` (`pattern: ^/api`, stateless, `jwt: ~`), access_control PUBLIC_ACCESS sur `/api/auth/(login|register)` et `/test/`, ROLE_USER catch-all sur `/api`.
  - `routes/security.yaml` : route `api_login_check` (`POST /api/auth/login`).
  - `lexik_jwt_authentication.yaml` : `token_ttl: 28800` (8h, ADR 0002 D1).
  - `App\Security\JsonAuthenticationSuccessHandler` (~30 lignes) qui implémente `AuthenticationSuccessHandlerInterface` et wrap la réponse Lexik dans l'enveloppe `{ data: { token } }` pour cohérence avec `/register`.
  - Failure handler Lexik conservé (`{ code, message }`) — délibérément pas en RFC 7807, pour conserver le format opaque "Invalid credentials." identique pour mauvais mdp et user inconnu (anti-énumération).
- **US04-back-3 — Endpoint `/api/auth/me`** : ajout d'une route `GET /api/auth/me` à `AuthController` qui retourne `{ data: UserResponse }` du user authentifié via `getUser()`. Permet au front de rehydrater l'identité au reload sans décoder le JWT.
- **US04-back-4 — Tests fonctionnels** : `AuthControllerLoginTest` (3 tests : 200 + token, 401 mauvais mdp, 401 user inconnu avec assertion message identique → anti-énumération validée test), `AuthControllerMeTest` (3 tests : 200 avec token créé via `JWTTokenManagerInterface`, 401 sans token, 401 token invalide). 31 tests PHPUnit verts.
- **US04-front-1 — Intercepteur axios `request`** : `apiClient.interceptors.request.use` qui injecte `Authorization: Bearer <token>` (token lu via `useAuthStore.getState().token` dans la closure, pas au top-level → pas de cycle d'import problématique).
- **US04-front-2 — Domaine auth enrichi (refactoring + extensions)** :
  - `types/auth.ts` : `LoginPayload`, `LoginError` union (`invalid-credentials` | `network`), garde `isLoginError`.
  - `services/authService.ts` : ajout `login()` et `me()`, factorisation `EnvelopedResponse<T>`, `mapLoginError` isolé.
  - `validation/authValidation.ts` : ajout `validateLoginForm` (règles minimales : email présent + format, password présent ; pas de `minLength` côté client — autorité serveur, "le client n'a pas à connaître la politique mdp").
  - `stores/authStore.ts` : refonte avec `zustand/middleware persist` (`partialize: { token, user }`, `name: 'datashare-auth'`), nouveaux états (`token`, `user`, `loginStatus`, `loginError`), nouvelles actions (`login`, `bootstrap`, `logout`, `resetLogin`), renames pour distinguer (`status` → `registerStatus`, `error` → `registerError`, `reset` → `resetRegister`).
  - Adaptation `RegisterPage` et son test aux renames du store.
- **US04-front-3 — Pages** :
  - `LoginPage` : remplace le placeholder, formulaire complet, redirige vers `/upload` après login OK ; conserve l'affichage du flash success quand on arrive depuis `/register` ; redirection immédiate vers `/upload` si déjà authentifié au mount (évite d'afficher le form pour rien).
  - `UploadPage` placeholder : Header avec bouton "Se déconnecter", affiche `Connecté en tant que <email>` (vérification visuelle du parcours complet bootstrap → /me → store).
  - `App.tsx` : route `/upload` + `useEffect` qui appelle `bootstrap()` au mount.
- **US04-front-4 — Header dynamique** : finalement réalisé par contexte de page (chaque page met le bon CTA dans le slot du Header), pas via un composant centralisé. Argument oral : "le Header ne sait pas où il est, c'est la page qui décide".
- **US04-front-5 — Tests** :
  - 17 nouveaux tests Vitest : authStore (8 nouveaux : login, bootstrap, logout), authService (5 nouveaux : login + me), validation (7 nouveaux : validateLoginForm + isLoginFormValid), LoginPage (5).
  - Spec Cypress `login.cy.ts` : 3 scénarios OK (login user existant + redirect /upload, persist après reload + logout vide localStorage, parcours bout-en-bout register→flash→login→/upload), 2 scénarios KO 401 (mauvais mdp, user inconnu avec assertion message identique).
- **Itérations visuelles wording** : harmonisation des CTA inter-pages ("Se connecter" → "Connexion" sur Header Register, "J'ai déjà un compte" → "Connexion" sur form Register, "Pas encore de compte ?" → "Créer un compte" sur form Login). Doublon volontaire Header/form (cohérence UX). Tests adaptés via `getAllByRole + toHaveLength(2)`.
- **5 commits** structurés : back JWT + /me, journal séance 9, auth domain extension, pages, Cypress login spec.

### Supervision et corrections
- **Diagnostic JWT passphrase incorrect** : au premier smoke test, `POST /api/auth/login` renvoyait 500 "An error occurred while trying to encode the JWT token". Investigation en deux temps : (1) check de la chaîne de chargement `.env` Symfony (en `APP_ENV=test`, `.env.local` n'est pas lu) ; (2) check OpenSSL pour voir avec quelle passphrase la clé privée déchiffre. Trouvé : la clé privée est chiffrée avec la passphrase default `changeme_generate_strong_passphrase` (pas `bf39c8b3085e...` qui était dans `.env`). Le user a probablement généré la keypair séance 6 avec la default. Correction immédiate : ajout de `JWT_PASSPHRASE=changeme_generate_strong_passphrase` dans `.env.test.local`. Dette explicite tracée : régénérer la keypair avec une vraie passphrase et aligner les `.env.*.local`.
- **Décision "RequireAuth repoussé à US05"** : le copilote recommandait inclure RequireAuth dans US04 (~15 lignes pour préparer US05+). Le user a tranché report à US05. Acté, plus minimal pour le scope US04.
- **Décision "/me dédié vs JWT décodé front vs login renvoie user"** : le copilote a présenté les 3 options avec recommandation /me. Le user a validé. Argument oral : SRP (login auth, /me identifie), source unique de vérité, robuste si payload JWT évolue.
- **Décision "redirect par défaut page de téléversement" par le user** (réponse hors options) : le copilote proposait `/` (HomePage actuelle) ou `from` location.state. Le user a explicitement choisi `/upload`. Conséquence : création d'un placeholder `UploadPage` (cohérent avec le pattern LoginPage placeholder de l'US03 front).
- **Décision "format Lexik default { code, message } pour 401"** : le copilote proposait soit Lexik default soit RFC 7807 custom. Le user a choisi Lexik default — argument zéro code custom + format opaque conserve l'anti-énumération naturellement.
- **Recadrage diagnostic du 404 réseau (issue de la séance 9)** : le copilote a au début diagnostiqué "Symfony pas lancé" sur le 404 Cypress, mais c'était un container Docker qui répondait sur le port 8000. Corrigé par le user. Apprentissage à généraliser : sur un 404 réseau, regarder le `Server:` header de la réponse (qui aurait montré WSGIServer immédiatement) avant d'hypothèser.
- **Renames `status` → `registerStatus` / `error` → `registerError` / `reset` → `resetRegister`** : le copilote a hésité entre garder les noms courts pour limiter le churn ou renommer pour cohérence quand login s'ajoute. Choix renaming → plus défendable à l'oral (deux statuts génériques `status` seraient ambigus quand login arrivera dans une autre page). Refactoring touchant RegisterPage + tests + store.
- **Décision passphrase test** : pragmatique, on accepte la default dans `.env.test.local` pour réparer le test E2E maintenant ; régénération propre tracée comme dette à clore avant production.
- **Wording CTA harmonisé** : itération en deux temps (le user a d'abord demandé "boutons deviennent 'Créer un compte' et 'Connexion'" pour les liens borderless, puis a précisé "le Header reste 'Se connecter'" → correction). Le copilote a appliqué ligne par ligne, mais aurait pu proposer d'emblée d'unifier Header + form.

### Apports et limites constatés
- **Apport — Configuration Symfony Security en une passe** : avec un audit propre des fichiers existants (composer.json, lexik config, security.yaml par défaut, route _security_logout déjà présente), la configuration Lexik + JWT s'est faite en un seul refactor de `security.yaml` + 1 fichier custom + 2 lignes de routes. Argument oral solide : "infrastructure auth = config + 30 lignes de code custom, le reste est délégué à la lib".
- **Apport — Anti-énumération validée bout-en-bout** : l'assertion `message identique pour mauvais mdp et user inconnu` est testée à 3 niveaux (PHPUnit functional, Vitest service mapping, Cypress E2E). Point oral fort : "trade-off MVP assumé sur /register (409 explicite, mitigations V2 documentées) MAIS sécurité préservée sur /login".
- **Apport — Parcours E2E bout-en-bout en un seul `it`** : `register → flash success → login → /upload` enchaîné, sans seed cy.request, juste de l'UI. Démonstration que tous les morceaux (validation, services, store, persist, navigation) sont câblés et fonctionnent ensemble.
- **Apport — Persist Zustand + bootstrap = robustesse au reload** : la combinaison `persist` (sauve token + user) + `bootstrap` (re-vérifie /me au mount, logout silencieux si 401) couvre proprement les 3 cas (boot sans session, boot avec session valide, boot avec token expiré). Pattern défendable à l'oral comme "robuste par design, l'utilisateur ne reste jamais dans un état fantôme".
- **Apport — Custom handler Lexik documenté en code** : le `JsonAuthenticationSuccessHandler` montre concrètement comment décorer la lib pour respecter le contrat applicatif sans la combattre. ~15 lignes, très défendable.
- **Limite — Diagnostic JWT 500 trop linéaire** : le copilote a d'abord proposé de mettre la "vraie" passphrase de `.env` dans `.env.test.local`, alors que c'était l'inverse (la "vraie" passphrase ne déchiffrait pas la clé). N'a re-vérifié avec OpenSSL qu'après que le smoke test ait échoué une seconde fois. Mécanisme à généraliser : sur un échec crypto/auth, vérifier directement avec un outil bas niveau (openssl, php -r) avant de modifier la config.
- **Limite — Wording CTA non anticipé** : le copilote a écrit des labels descriptifs longs au premier jet ("J'ai déjà un compte", "Pas encore de compte ?") sans vérifier la maquette pour des CTA plus courts. Le user a corrigé en deux temps. À l'avenir : sur des labels visibles, demander d'emblée "courts/longs" en sous-décision.
- **Limite — Renaming non détecté en amont** : le copilote a écrit le store enrichi avec les renames sans signaler que les tests RegisterPage allaient casser sur `useAuthStore.getState().reset()`. Vitest a révélé la régression. Bénin (1 fichier, 5 lignes), mais aurait pu être anticipé par un grep `\.reset\(\)` avant d'écrire la nouvelle version.

### Dettes ouvertes en fin de séance
- **JWT passphrase à régénérer** : keypair Lexik avec une vraie passphrase, synchronisée `.env.local` + `.env.test.local`. À tracer dans `SECURITY.md`.
- **ADR 0005 D3** : DS = 7 composants (Footer ajouté), pas 6.
- **`docs/maquettes/NOTES.md`** : mentionner Footer.
- **README global du DS** (D5 ADR 0005).
- **`SECURITY.md`** ébauche.
- **`TESTING.md`** ébauche.
- **`PERF.md`** + **`MAINTENANCE.md`** ébauches.
- **Proxy `/api`** dans `vite.config.ts` : inutilisé.
- **RequireAuth** : à introduire en US05 (routing privé pour l'espace personnel).
- **Étape 3 OC officiellement achevée** : prêt pour étape suivante (US01/US02/US05/US06).

---

## Séance 11 — 2026-05-09 / 2026-05-10 / 2026-05-11 (étape 4 OC, US01 vitrine IA)

**Contexte :** entrée en étape 4 OC (« téléversement, gestion et partage des fichiers »). La consigne OC impose que **l'IA ne soit utilisée que sur une seule US**, le reste devant être codé par le référent tech seul. Interprétation opérationnelle convenue avec le user (cf. mémoire `feedback_us_vitrine_ia.md`) : on continue à collaborer comme avant sur les 4 US restantes, et **US01 (upload) est désignée comme « US vitrine »** sur laquelle on applique la méthodologie OC à la lettre — branche dédiée, sous-tâches isolées en commits `feat(ai):`, supervision tracée. C'est cette US qui alimentera la section 8 du livrable 1 et qui sert de cas d'école à l'oral. Séance étalée sur 3 jours réels (rythme non-linéaire, avec une coupure « cuit » à la fin du jour 1).

### Posture adoptée
Binômage exigeant + discipline méthodologique stricte sur la vitrine. Workflow contractualisé en début de séance et tenu jusqu'au bout : pour chaque sous-tâche, **(1) je grep les ADR + docs de conception** (règle persistée mémoire `feedback_check_archi_avant_code.md` après deux divergences en début de séance), **(2) je propose une carte mentale** explicitant le « quoi / pourquoi / comment / alternatives », **(3) j'attends validation orale du user**, **(4) je code**, **(5) je montre le diff**, **(6) je commit `feat(ai): US01 - <sous-tâche>`** avec message structuré. Chaque commit isolé, branche `feat/us01-upload` créée à partir de `main`. La PR reste ouverte sur GitHub comme artefact de soutenance (« voici le bloc IA, voici les commits que j'ai validés »).

**Recalibration mid-séance :** après la sous-tâche 2, le user signale une fatigue (« je suis cuit, on décompose plus »). Recalibration explicite du style de communication : profil professionnel du user précisé (bac+2 dev web, 1.5y WordPress + 1.5y CdP Django, 1/3 OC Architecte ; acronymes archi maîtrisés ; conventions Symfony/React modernes à flagger). Deux mémoires ajoutées (`user_role.md`, `feedback_communication_style.md`) pour que les sessions futures partent calibrées : 1 question à la fois, flag des conventions stack mainstream, pas de glose des acronymes.

### Tâches confiées
**Cartographie initiale** validée par sous-décision (branche dédiée + PR fictive / validation orale avant chaque commit / carte mentale systématique avant chaque sous-tâche).

- **US01.1 — Entité `File` + migration** (commit `dff4340`).
  Entity `File` (Uuid v7, ManyToOne User nullable + ON DELETE SET NULL, soft delete via `deletedAt` TIMESTAMPTZ, audit `createdAt`/`updatedAt` avec PreUpdate, `sizeBytes` BIGINT). `FileRepository` avec helper `save(flush)`. Migration Doctrine éditée pour : description renseignée, index composite `(user_id, created_at DESC)` aligné sur la requête US05, `CHECK (size_bytes > 0 AND size_bytes <= 1073741824)`, suppression de l'index simple redondant sur `user_id`. `doctrine:schema:validate` et migration appliquée OK sur dev DB.

- **US01.2 — `StorageInterface` + `LocalStorageAdapter`** (commit `a29c162`).
  Interface réduite à `store(stream, key): void` (YAGNI : `read` et `delete` ajoutés à US02/US06 quand un caller les nécessitera). Adapter local : `mkdir` recursif idempotent + `stream_copy_to_stream` (RAM constante, ADR 0001). Param `STORAGE_PATH` (env var) injecté dans services.yaml via `%env(resolve:...)%`. ADR 0003 D4 mis à jour avec une note d'implémentation incrémentale documentant la discipline YAGNI sur les 3 méthodes prévues. 3 tests unitaires (round-trip 256 KB, dirs intermédiaires créés, hash sha256 préservé sur 4 MB streamé).

- **US01.3 — `FileValidator`** (commit `096f57d`).
  Algorithme à 2 couches en cascade : (a) extension blacklist sur le nom client, (b) magic bytes via `finfo` + cross-check via `Symfony\Component\Mime\MimeTypesInterface` (si le MIME détecté implique une extension blacklistée → reject). Une seule liste maintenue. Exception unique `FileTypeRejectedException` avec deux constantes de raison (`blacklisted_extension`, `suspicious_magic_bytes`). Param `app.upload.blacklisted_extensions` (12 extensions) en services.yaml. Dépendance `symfony/mime` ajoutée (n'était pas installée). 7 tests : .txt OK / .exe rejeté / .EXE case-insensitive / MZ-renommé .txt rejeté / sans extension OK / .sh OK (zone grise) / fichier vide OK.

- **US01.4 — `FileService` (orchestration)** (commit `20d6a82`).
  Service métier `App\Service\Upload\FileService` : `upload(UploadedFile, User): File` orchestre 5 étapes (validate → générer storageKey `Y/m/{uuid-v7}.bin` inline → ouvrir stream du temp file → `store` → persist via `save(flush: true)`). 3 deps autowired (`FileValidator`, `StorageInterface`, `FileRepository`). Pas de cleanup compensatoire en cas de failure DB après storage write (orphan blob toléré, à logger). 3 tests unitaires avec mocks (happy path / rejet validator → no storage / failure storage → no persist).

- **US01.5 — `FileController` + DTO `FileSummary`** (commit `7f48b8e`).
  Controller `POST /api/files`, route `files_upload`, multipart field `file` extrait via `$request->files->get('file')`. Mapping erreurs : 400 (file manquant) / 415 (sur `FileTypeRejectedException`) avec types d'erreur OpenAPI alignés (`https://datashare.fr/errors/file-missing` et `file-type-rejected`). Réponse 201 avec envelope `{ data: FileSummary }`. DTO `FileSummary` (`final readonly class`) aligné OpenAPI (id UUID string, name, sizeBytes int64, mimeType, createdAt ISO 8601 ATOM). 4 tests fonctionnels (201 happy path / 400 file manquant / 415 .exe / 401 sans token). `.env.test` enrichi avec `STORAGE_PATH` pointant vers `var/storage_test` pour isolation des blobs entre runs. Migration appliquée sur la BDD `datashare_test` au passage.

- **US01.6 — Limite 1 Go + handler 413** (commit `36f77f2`).
  Listener Symfony `UploadSizeLimitListener` enregistré sur `kernel.request` avec priorité 256 (avant routeur/firewall) qui inspecte `Content-Length` sur POST/PUT/PATCH du main request, court-circuite avec 413 `application/problem+json` (type `file-too-large`) si dépassement de `app.upload.max_size_bytes` (1 073 741 824 bytes). `public/.user.ini` (`post_max_size = upload_max_filesize = 1100M`) pour relever les défauts PHP-FPM. Le `#[AsEventListener]` ne se propage pas avec une définition de service explicite → tag YAML explicite à la place (comportement Symfony connu, à documenter). 1 test fonctionnel (Content-Length 2 Go → 413 + type aligné OpenAPI).

- **US01.7 — `fileService` front + types** (commit `765ad21`).
  `types/file.ts` : `FileSummary` aligné OpenAPI + `UploadError` union discriminée à 5 kinds (file-missing / file-too-large / file-type-rejected / unauthorized / network) + type guard `isUploadError`. `services/fileService.ts` : `upload(file): Promise<FileSummary>` via FormData multipart, mapping HTTP → erreurs typées (400/401/413/415, fallback network sur 5xx ou non-AxiosError). 7 tests Vitest.

- **US01.8 — `UploadPage`** (commit `9dd44ff`).
  Refonte complète du placeholder. 5 états (`cta` / `composing` / `uploading` / `success` / `error`).
  - **CTA initial** : « Tu veux partager un fichier ? » + bouton circulaire avec icône `CloudUpload` (lucide-react) ; halo en frère (`<span>`) du bouton, animé par `@keyframes ctaHaloPulse` (transform: scale 1→1.15→1 + opacity 1→0.7→1, hardware-accelerated), pause au hover du wrap, désactivé si `prefers-reduced-motion: reduce`.
  - **Composing** : `<input type="file">` caché, sélecteur visible, file row avec icône `FileImage` + nom (truncate ellipsis) + taille (locale `fr-FR`, virgule décimale) + bouton « Changer » secondary, champs Mot de passe + Expiration en `disabled` + tooltip « Disponible dans une version ultérieure » (hors MVP, cf. NOTES.md tracé).
  - **Success** : file row + message + lien sur fond `--color-bg-muted` + bouton « Copier le lien » full-width avec icône `Copy` (cohérence DS).
  - Validation client (`validation/uploadValidation.ts`) : blacklist 12 extensions + MAX 1 Go + `formatFileSize` (locale fr-FR). Sur 401 du serveur → redirige `/login`.
  - 8 tests Vitest (CTA / clic ouvre form / sélection / blacklist sans API / >1 Go sans API / upload OK + lien / 415 / clipboard.writeText).

- **US01.9 — E2E Cypress + endpoint test files** (commit `8f2ca99`).
  `TestFilesController` : `POST /test/files/reset` (DELETE files + `Filesystem::remove` du dossier de stockage, 404 hors `APP_ENV=test`). `cy.resetFiles()` ajouté en miroir de `cy.resetUsers()`. Spec `upload.cy.ts` : 2 scénarios (login + upload `sample.txt` → assertion 201 + lien partagé visible / login + sélection `.exe` → erreur client visible, zéro appel API). `login.cy.ts` mis à jour pour matcher la nouvelle UploadPage (« Tu veux partager un fichier ? » + bouton « Se déconnecter ») — assertions `Téléversement` et `Connecté en tant que…` retirées.

- **Cleanup** (commit `bf193ed`, `chore:` hors vitrine) : un fichier de cache vitest `node_modules/.vite/...` à la racine du repo s'était créé suite à un `npx vitest` lancé depuis le mauvais cwd plus tôt. `/node_modules/` ajouté au `.gitignore` racine, fichier untracké. Pas tagué `feat(ai):` car maintenance hors scope vitrine.

**Total branche `feat/us01-upload`** : 9 commits `feat(ai):` + 1 `chore:` cleanup. **150 tests verts** : 49 PHPUnit (31 → 49 dont 4 fonctionnels controller + 1 fonctionnel listener + 7 unit FileValidator + 3 unit FileService + 3 unit storage) + 87 Vitest (72 → 87 dont 7 service + 8 page) + 7 Cypress E2E (5 prev + 2 upload).

### Supervision et corrections
- **Divergence entité `File` vs `modele-domaine.md` (sous-tâche 1)** : première version codée sans grep des docs en amont a divergé sur 5 points (`state` enum vs `deletedAt` timestamp, `owner_id` NOT NULL + RESTRICT vs NULLABLE + SET NULL, `INT` vs `BIGINT` + CHECK applicatif manquant, `updated_at` absent, timestamps `WITHOUT TIME ZONE` vs `TIMESTAMPTZ`, index simple sur `owner_id` vs index composite `(user_id, created_at DESC)`, FK `owner_id` vs `user_id`). Le user a posé la question « on est bien conforme au schéma de bdd prévu dans la doc » qui a déclenché la vérification ligne par ligne et la réécriture complète de l'entité + migration. Conséquence : enum `FileState` supprimé, lifecycle callbacks ajoutés, ADR 0003 D4 cohérent avec le code.
- **Divergence `StorageInterface` vs ADR 0003 D4 (sous-tâche 2)** : seconde version a divergé sur 3 points (`store($source): string` qui génère et retourne la clé, vs ADR `store(stream, key): void` où le caller fournit la clé ; env var `APP_SHARE_DIR=var/share` vs ADR `STORAGE_PATH=var/storage` ; nommage `LocalStorageAdapter` au lieu de `LocalFilesystemStorage` — ce dernier conservé). Le user a re-posé la question « on suit bien l'archi établie ». Re-réalignement sur ADR : refactor `store(stream, key): void`, env var renommée, ADR 0003 D4 mis à jour avec note d'implémentation incrémentale (les 3 méthodes restent prévues, ajoutées à mesure des callers). **Conséquence méta** : mémoire `feedback_check_archi_avant_code.md` ajoutée — désormais grep des ADR/docs de conception avant chaque sous-tâche, plus à le user de poser la question.
- **Recadrage YAGNI sur la sous-tâche 2 (« pourquoi on parle d'US06 ? »)** : la carte mentale initiale spécifiait la sémantique de `read` ET de `delete` (avec une discussion détaillée sur l'idempotence du `delete` pour US06) alors qu'on construisait l'upload (US01). Le user a coupé : « on est sur US01, le seul caller sera FileService → seul `store` est nécessaire ». Réduction immédiate de l'interface à une méthode. Discipline YAGNI redressée.
- **Recalibration cognitive (« je suis cuit, on décompose plus »)** : à la fin du jour 1 (sous-tâche 2), saturation cognitive du user après un mur de 5 décisions empilées. Pause prise. Au redémarrage le lendemain, le user pose un point sur son profil pro (1.5y WP + 1.5y Django, 1/3 OC, conventions mainstream Symfony/React peu fréquentées). Mémoires `user_role.md` + `feedback_communication_style.md` créées : 1 question à la fois, flag des conventions stack mainstream que le user n'a pas forcément croisées, pas de glose des acronymes archi (qu'il maîtrise).
- **Itérations visuelles UploadPage (sous-tâche 8)** : ~10-12 micro-ajustements en feedback interactif sur la maquette. Quelques corrections structurelles (le user a pointé que le premier état devait être un texte fin + icône cloud-upload sans card, pas la card directement → refactor du flow à 5 états ; le user a demandé que le halo soit un élément séparé du bouton pour permettre une animation `transform: scale` indépendante → restructure HTML/CSS du `cta` block ; passage du halo en `<span>` frère du bouton avec `position: absolute` + `inset: 0` + `pointer-events: none`, pulse hardware-accelerated avec pause au hover du wrap et `prefers-reduced-motion`). D'autres tweaks plus cosmétiques (taille 88→90 px du bouton, halo 150→120 px, opacity 50→15 %, icône 32→45 px, couleur icône `--color-bg` → `--color-text-on-dark`, padding card `--space-lg` → `--space-xl`, suppression du bouton « Téléverser un autre fichier » non présent dans la maquette).
- **Choix box-shadow vs deuxième div pour le halo** : le user a demandé une explication CSS pédagogique (« je ne comprends pas ton CSS de double cercle »). Décomposition de `box-shadow: 0 0 0 16px rgba(0,0,0,0.15)` (offset×2 + blur=0 + spread=16 = anneau extérieur) puis discussion des trade-offs box-shadow vs pseudo-élément vs vraie div pour des animations futures. Le user a tranché « full deuxième div » pour permettre des animations independent du bouton sans contrainte. Refactor en conséquence.
- **API PHPUnit 13 (`isType()` retiré)** : le test `FileServiceTest` utilisait `self::isType('resource')` et `self::matchesRegularExpression(...)`. PHPUnit 13 a retiré `isType()` (déprécié 12). Bascule sur `$this->callback(static fn ($r) => is_resource($r))` et un callback regex pour les contraintes. PHPUnit notices sur `createMock` quand seul `method()` était utilisé sans `expects()` → bascule sur `createStub` quand pas d'expectation explicite.
- **Bug `AsEventListener` non pris** : sur la sous-tâche 6, l'attribut `#[AsEventListener]` n'était pas pris en compte par autoconfigure quand le service avait une définition explicite dans services.yaml (le bloc explicite supprime le tag). Symptôme : `debug:event-dispatcher kernel.request` ne listait pas le listener. Fix : tag YAML explicite (`{ name: kernel.event_listener, event: kernel.request, method: __invoke, priority: 256 }`) à la place de l'attribut. Comportement Symfony connu mais peu documenté.
- **Diagnostic login KO en fin de séance** : le user a tenté un parcours register puis login bout-en-bout, register a redirigé vers /login (= 201 supposé) mais login retourne 401 « Email ou mot de passe incorrect ». Logs back analysés : `JsonLoginAuthenticator` failed après `UserProviderListener::checkPassport`, donc l'utilisateur n'avait pas été trouvé en BDD. Vérification via `dbal:run-sql` (le user n'avait pas `psql` dans son PATH local) : table `users` vide. Diagnostic : le register n'avait jamais touché le back (rien dans les logs `POST /api/auth/register`). Cause finale identifiée par le user : front pas configuré pour viser le bon back (résolu côté user).

### Apports et limites constatés
- **Apport — Méthodologie OC vitrine appliquée à la lettre** : 9 sous-tâches, 9 commits `feat(ai):` isolés, branche dédiée, validation orale avant chaque commit (zéro commit `fix:` après revue, parce que les corrections étaient incorporées AVANT l'écriture du commit final). C'est exactement ce que la consigne demande : « assigner des tâches claires à l'IA, traçer dans l'historique Git, documenter ». Matière directe pour la section 8 du livrable 1 et pour l'oral. Argument fort : « voici la branche, voici la PR, voici le journal — on peut dérouler la collaboration sous-tâche par sous-tâche, avec les corrections que j'ai imposées et les choix que j'ai validés ».
- **Apport — Refactoring d'alignement archi tracé deux fois (entité + storage)** : les deux divergences détectées+corrigées par le user sont en elles-mêmes un argument oral fort : « le copilote a dérivé, je l'ai recadré sur la doc, on a réécrit. La preuve qu'une revue active vaut le coût ». Ces moments sont ce qui distingue de la « génération aveugle ».
- **Apport — Mémoire IA enrichie en cours de séance** : trois mémoires créées (`feedback_check_archi_avant_code`, `user_role`, `feedback_communication_style`) qui s'appliqueront aux prochaines séances. La calibration n'est pas perdue à la fin du tour.
- **Apport — Couverture de test multi-niveaux pour US01** : 49 PHPUnit (entité, validator, service, controller fonctionnel, listener fonctionnel) + 87 Vitest (validation, service, page) + 7 Cypress (E2E). Démontre la pyramide complète sur une feature unique. Argument soutenance : « j'ai testé à tous les niveaux, voici comment ça se déroule ».
- **Apport — Discipline YAGNI sur l'interface** : `StorageInterface` n'a qu'une méthode aujourd'hui. Les deux autres seront ajoutées à US02 et US06 avec un caller réel. Pattern à expliquer à l'oral comme « TDD top-down » : on conçoit la surface, on n'implémente que ce qui est réellement consommé.
- **Limite — Deux divergences archi en début de vitrine** : sur les deux premières sous-tâches, j'ai produit du code sans grep des docs en amont. Ce qui est exactement ce qu'on cherche à éviter, et ce qui aurait été embarrassant si le user n'avait pas posé la question. Le pattern (et la mémoire ajoutée) corrigent pour les sous-tâches 3+, mais le démarrage est révélateur d'une tendance du copilote à « foncer sur le pattern le plus naturel » sans vérifier la décision déjà actée. À l'oral, ces moments-là sont **à raconter, pas à cacher** : ils démontrent la valeur de la supervision.
- **Limite — Surcharge cognitive en fin de jour 1** : empilement de 5 décisions à valider en parallèle sur la sous-tâche 2 a généré le « cuit ». Recalibration immédiate, mais le mécanisme initial n'a pas été détecté à temps par le copilote. À l'avenir : signal explicite « ça commence à faire beaucoup, on coupe là ? » plutôt qu'attendre que le user le dise.
- **Limite — Itérations UI visuelles non rationalisées** : ~12 allers-retours sur l'écran upload (taille bouton, taille halo, taille icône, opacité, couleur, position, animation, structure HTML, padding card, etc.) acceptés un par un sans proposition de batch. Coût d'aller-retour pour le user. Mécanisme à creuser : sur des itérations purement visuelles, proposer dès la 3e ou 4e modification une vue d'ensemble (« on revoit toutes les tailles d'un coup ? ») plutôt que de continuer en unitaire.
- **Limite — Wording « conservé pendant une semaine » dans la vue success** : copié de la maquette mais correspond à US10 (expiration auto) qui est hors MVP. À l'oral, ce détail peut être pointé ; soit on défend « fidélité maquette + V2 documentée », soit on adapte le wording. Tracé pour que le user tranche.
- **Limite — Bug `AsEventListener` non anticipé** : la non-propagation de l'attribut avec une définition de service explicite est un gotcha Symfony récurrent. Le copilote n'a pas signalé le risque a priori, le bug s'est révélé au runtime via un test qui retournait 400 au lieu de 413. Fix rapide mais aurait pu être anticipé en proposant directement le tag YAML.

### Dettes ouvertes en fin de séance
- **PR sur GitHub** : à ouvrir et garder en lecture (artefact de soutenance). Merge sur `main` ensuite.
- **Cypress upload à exécuter en local** (back en `APP_ENV=test`, front dev, `npx cypress run`) pour valider que les 2 specs E2E passent. Tests typés et logique alignée mais non exécutés en conditions réelles dans cette session.
- **Wording success « une semaine »** : décision à prendre (fidélité maquette + V2 documentée, ou adaptation MVP).
- **Dettes héritées séance 10 toujours ouvertes** : JWT passphrase à régénérer + `SECURITY.md`, ADR 0005 D3 (DS = 7 composants), `NOTES.md` Footer, README global du DS, ébauches `TESTING/SECURITY/PERF/MAINTENANCE.md`, proxy `/api` dans `vite.config.ts`.
- **US suivantes (US02, US05, US06)** : à coder en collaboration normale (hors méthodologie vitrine), JB en référent tech.
- **Section 8 du livrable 1** : à rédiger en synthèse de cette séance + les précédentes (la vitrine US01 = matière centrale, les autres séances = contexte de la posture évoluée).

---

## Séance 12 — 2026-05-10 (étape 4 OC, US02 download — collaboration normale, hors vitrine)

**Contexte :** seconde US de l'étape 4. Conformément à la mémoire `feedback_us_vitrine_ia.md`, **seule US01 est vitrine IA** ; pour US02/US05/US06, on revient à une collaboration normale dans laquelle JB tient le rôle de référent tech « auteur » du code. Le user a explicitement cadré au démarrage : autonomie large côté back avec ping uniquement sur points bloquants, vérification UI ensemble côté front, commits en style standard (pas de `feat(ai):` isolé par sous-tâche).

### Posture adoptée
**Binômage à autonomie variable selon la couche :**
- Back : autonomie large (« je te fais confiance pour la plupart du back »). Pas de carte mentale ni de validation orale par sous-tâche comme en séance 11. Je pose les blocs en série, j'exécute les tests, je m'arrête uniquement sur point bloquant.
- Front : autonomie jusqu'à la première version visible, puis **passe UI ensemble obligatoire** sur maquettes envoyées par le user (screenshots Figma).
- Scope : flag systématique avant toute extension hors MVP (hérité des mémoires `feedback_arbitrage_mvp` + `feedback_pragmatique_vs_puriste`).

Différence nette vs séance 11 : vitesse de production très supérieure (US02 bouclée en une session continue), au prix de la traçabilité granulaire ; mais cohérent avec la consigne OC qui n'attend qu'**une seule** US instrumentée vitrine.

### Tâches confiées
**Back (autonome, validé par les tests) :**
- Extension de `StorageInterface` avec `openReadStream(string $key)` + `StorageObjectNotFoundException`. Symétrie stricte avec `store()` (signature ADR 0003 D4 alignée). `LocalStorageAdapter::openReadStream` : `is_file` check → `StorageObjectNotFoundException`, sinon `fopen('rb')`. **Discipline YAGNI** maintenue : `delete()` pas encore introduit (sera ajouté à US06 par son caller réel).
- `ShareService::findAvailable(string $token): File` qui résout l'UUID → `File` ou lève `ShareNotFoundException`. Le 404 unifie 3 cas (token mal formé, UUID inconnu, fichier soft-deleted) — anti-énumération côté destinataire.
- DTO `SharedFile` (4 champs OpenAPI, **pas d'`id`, pas d'owner**, conformément contrat-interface §4.7).
- `ShareController` (`/api/share/{token}` métadonnées + `/download` stream). `StreamedResponse` avec callback `fread/echo` (RAM constante, ADR 0001). `Content-Disposition` via `HeaderUtils::makeDisposition` avec **fallback ASCII translittéré** (`iconv` UTF-8→ASCII//TRANSLIT//IGNORE) — Symfony exige un fallback ASCII dès qu'un caractère non-ASCII est dans le filename.
- `security.yaml` : `^/api/share/` PUBLIC_ACCESS inséré **avant** la règle catch-all `^/api → ROLE_USER` (ordre des access_control = first-match).
- **+12 tests PHPUnit → 61 verts** (49 → 61) : 4 unit `ShareService` (happy / token mal formé / UUID inconnu / soft-deleted), 2 unit `LocalStorageAdapter::openReadStream` (round-trip + missing key), 6 functional `ShareController` (metadata 200 / 404 unknown / 404 malformed / 404 soft-deleted / download 200 + headers / download 404).

**Front (autonome jusqu'à la passe UI) :**
- `types/share.ts` : `SharedFile` aligné OpenAPI + `ShareError` union à 2 kinds (`not-found` / `network`) + type guard `isShareError`. Surface plus mince que `UploadError` (pas de 401/413/415 sur la lecture publique).
- `services/shareService.ts` : `getMetadata(token)` (mapping HTTP → erreurs typées) + `buildDownloadUrl(token)` qui construit l'URL absolue à partir de `VITE_API_URL`. **Choix défendable à l'oral** : pas de fetch-blob côté browser pour le download — on fait un `<a href={url} download>` direct, le navigateur stream + `Content-Disposition` serveur déclenche le download sans charger le binaire en RAM côté client. Symétrique au choix back (RAM constante des deux côtés, ADR 0001).
- `pages/DownloadPage.tsx` route `/d/:token`, **4 états** (`loading` skeleton animé / `ready` file row + bouton / `not-found` callout error / `error` callout réseau). Header avec **CTA conditionnel selon l'état d'auth** : « Mon espace » si token JWT en localStorage (auto-import via `useAuthStore`), « Se connecter » sinon. Skeleton respecte `prefers-reduced-motion`.
- `App.tsx` : route `/d/:token` ajoutée.
- **+11 tests Vitest → 98 verts** (87 → 98) : 5 `shareService` (succès / 404 / 5xx / non-AxiosError / `buildDownloadUrl`), 6 `DownloadPage` (loading / ready + lien correct / 404 / réseau / CTA non-auth / CTA auth).
- **+1 spec Cypress** `download.cy.ts` (parcours upload→share authentifié puis visite anonyme du lien après `clearLocalStorage` + token inconnu).

### Supervision et corrections
- **Itération UI sur le bouton « Télécharger »** : première version posée avec `Button` lucide + style primary plein orange (fond `--color-primary` + texte blanc). Le user a partagé la maquette cible : bouton **outlined** style primary du DS (fond pâle `--color-button-primary-bg` `#FBEEE3` + bord/texte `--color-primary`) avec icône `CloudDownload` (symétrie `CloudUpload`). Aligné sur les tokens `Button.module.css` `.primary` à l'identique. Limite révélée : **j'aurais dû lire `Button.module.css` avant de styler manuellement** — le DS était déjà la source de vérité, j'ai re-créé un style à la main au lieu de répliquer un style existant.
- **Recadrage scope US10 (callout d'expiration + état « expiré »)** : sur la passe UI, le user a demandé d'ajouter le callout systématique « Ce fichier expirera dans X jours » avec bascule warning < 3 jours, et un état rouge « Ce fichier n'est plus disponible car il a expiré ». **Flag immédiat avant toute ligne de code** : ces 2 zones décrivent US10 (expiration auto), explicitement hors MVP par 4 sources (`CLAUDE.md` ambiguïté #1, `modele-domaine.md` livré en étape 1 sans `expires_at`, OpenAPI `SharedFile` sans `expiresAt`, `NOTES.md` lignes Téléchargement). 4 options proposées via `AskUserQuestion` (impl réelle US10 / masquer + tracer / callout générique sans compteur / faker côté front). Le user a tranché **masquer + tracer NOTES.md** (cohérent avec mémoires `feedback_arbitrage_mvp` + `feedback_pragmatique_vs_puriste`). Conséquence : 3 lignes ajoutées au tableau « Téléchargement » de `NOTES.md` (mdp masqué / callout expiration masqué / état expiré remappé sur 404 générique), avec date 2026-05-10 et justification (faker un compteur mentirait au destinataire — le fichier reste téléchargeable serveur après expiration affichée). Le rationale traçable est défendable à l'oral comme « décision MVP consciente, US10 listée en V2 ».
- **Bizarrerie test sur le body streamé** : la première version du functional test `testDownloadReturnsStreamWithExpectedHeaders` essayait de capturer le body via `ob_start; $response->sendContent(); ob_get_clean()`. Tests verts en standalone (script PHP direct) mais body vide en `KernelBrowser`. Diagnostic via reflection : `streamed = true` au moment où le test reçoit la réponse — donc `sendContent` a déjà été consommé en amont (suspicion sur le profiler en env test, qui collecte des stats sur le response body avant qu'on ait la main). Plusieurs workarounds tentés (ob_start avant `request()`, `expectOutputString`, capture via callback chunk) — tous KO pour le même cause racine. **Workaround retenu** : assertion fonctionnelle bornée à status + headers + classe `StreamedResponse`, **couverture du stream réel déléguée au unit test `LocalStorageAdapter::openReadStream` et au unit test `ShareService::findAvailable`**. La pyramide reste honnête (le code de production est intégralement testé), avec une légère asymétrie tracée ici pour mémoire à l'oral.
- **Cleanup script de debug** : un fichier `tests/debug_share.php` créé pour reproduire le bug body en CLI hors PHPUnit a été supprimé après diagnostic.

### Apports et limites constatés
- **Apport — Vitesse en mode collaboration normale** : US02 bouclée en une seule session continue (back + front + tests + 1 itération UI). À comparer avec les 3 jours étalés de la vitrine US01 où chaque sous-tâche imposait carte mentale + validation + commit isolé. C'est **exactement le contraste à raconter à l'oral** : « voici comment on collabore quand l'OC ne demande pas la traçabilité fine — vitesse 2-3× supérieure, qualité préservée par les tests, mais zéro matière brute pour la section 8 ». Démontre la maîtrise du curseur posture par le référent tech.
- **Apport — Discipline « flag scope avant code »** : le recadrage US10 a été remonté avant toute modification de code, modèle de domaine ou OpenAPI. Mémoires effectives (les 3 mentionnées plus haut), pas de scope creep silencieux. Argument oral : « j'ai un copilote qui se bloque automatiquement aux frontières du périmètre et propose des arbitrages plutôt que de prendre des libertés ».
- **Apport — Cohérence ADR 0001 sur le download** : choix `<a href download>` côté front justifié explicitement par la symétrie de l'archi streaming (RAM constante back ET front). Détail technique défendable à l'oral comme une décision consciente, pas un raccourci d'implémentation.
- **Apport — Tests pyramide complète sur US02** : 12 PHPUnit + 11 Vitest + 1 Cypress, sur une feature plus mince que US01 mais avec le même rigueur de couverture (unit service + unit storage + functional controller back ; service + page + E2E front).
- **Limite — Style bouton sans lecture du DS** : j'ai stylé le bouton download avec mes propres tokens (fond plein orange) au lieu de répliquer `Button.module.css .primary` (fond pâle + bord). Corrigé d'un coup au feedback du user, mais le pattern est récurrent : sur des composants visuels « presque pareil » qu'un composant DS existant, j'ai tendance à re-créer plutôt qu'à aligner. Mécanisme à creuser : **avant tout style customisé sur un élément visuellement proche d'un composant DS, lire le CSS du composant et répliquer les tokens** — vrai même quand le HTML doit rester `<a>` plutôt que `<button>`.
- **Limite — Asymétrie de test sur le body streamé** : le test fonctionnel ne valide pas que les bytes traversent réellement le ShareController jusqu'au browser. Couverture intégrée dans deux unit tests amont, mais la traversée bout-en-bout du contrôleur n'est pas vérifiée par PHPUnit (Cypress E2E couvre le côté browser). Honnête à mentionner à l'oral si le mentor pinaille.
- **Limite — Workaround test sans diagnostic complet** : la cause exacte du `streamed = true` prématuré n'a pas été creusée jusqu'au bout (suspicion profiler test env, non confirmée). Coût/valeur du diagnostic complet jugé insuffisant pour le MVP — tracé ici pour qu'on y revienne si on heurte le même pattern sur US06 (suppression) ou ailleurs.

### Dettes ouvertes en fin de séance
- **Cypress `download.cy.ts` à exécuter** (back `APP_ENV=test`, front dev, `npx cypress run --spec cypress/e2e/download.cy.ts`) pour validation E2E réelle.
- **Cause racine du `streamed = true` prématuré** : à creuser si on rencontre le même pattern sur d'autres endpoints stream (probablement US06 hard delete pas concernée ; potentiellement un sujet en V2 si on monitore les downloads).
- **US05 (historique) et US06 (suppression)** : restantes pour clore l'étape 4. Toujours en collaboration normale.
- **Dettes héritées séance 11 toujours ouvertes** : JWT passphrase à régénérer + `SECURITY.md`, ADR 0005 D3 (DS = 7 composants Footer inclus), `NOTES.md` Footer, README global du DS, ébauches `TESTING/SECURITY/PERF/MAINTENANCE.md`, proxy `/api` dans `vite.config.ts`, RequireAuth (routing privé) à introduire en US05, wording success « une semaine » sur UploadPage.

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
