# Vitrine IA — US01 Upload

> **Destinataire :** mentor évaluateur OC, futurs lecteurs externes du projet.
> **Source qui alimente la section 8 du livrable 1 (« Utilisation de l'IA dans le développement »).**
> **Trace interne brute (chronologique, toutes séances) :** [`journal.md`](./journal.md).
> **Branche Git de référence :** `feat/us01-upload` (9 commits `feat(ai):` + 1 commit `chore:` cleanup).

---

## 1. Contexte et cadre

L'étape 4 de la mission OC impose une contrainte structurante sur l'usage de l'IA générative :

> *« Vous devrez vous servir de l'IA générative uniquement pour développer une seule User Story (US) du projet uniquement. Le reste devra être codé par vous-même. »*

Sur DataShare, **US01 (téléversement de fichiers)** a été désignée comme **US vitrine**. Trois raisons :

1. **Richesse architecturale** — l'US01 mobilise streaming back-end (cf. ADR 0001), abstraction de stockage `StorageInterface` (cf. ADR 0003 D4), validation à deux couches (extension + magic bytes), middleware applicatif pour la limite 1 Go, et un cycle UI complet côté front (sélecteur, validation client, états upload, lien partagé). Beaucoup de matière à raconter en supervision.
2. **Centralité métier** — l'upload est la fonctionnalité cœur du MVP. Le démontrer comme cas d'école IA renforce la crédibilité du contrôle exercé sur le travail du copilote.
3. **Pédagogie SOLID** — l'US permet de matérialiser DIP (le `FileService` dépend de `StorageInterface`, pas de `LocalStorageAdapter`), SRP (un service par concept : validator, storage, uploader, controller), YAGNI (interface réduite à ce qui a un caller).

Les séances 1 à 10 du projet (auth, conception, design system, US03/04) ont utilisé l'IA en collaboration libre. À partir de la séance 11, **la posture bascule** sur cette US et seulement elle, pour produire la trace exemplaire que la consigne demande. Les US suivantes (US02 download, US05 historique, US06 suppression) repassent en collaboration normale, hors méthodologie vitrine.

## 2. Méthodologie appliquée

Un workflow contractualisé en début de séance vitrine et tenu strictement jusqu'au merge :

1. **Branche dédiée** — `feat/us01-upload` créée à partir de `main`. Aucun autre travail ne touche cette branche, l'IA n'écrit que là.
2. **Cartographie en sous-tâches** — l'US a été découpée a priori en **9 sous-tâches** numérotées avec un périmètre précis, chacune correspondant à un commit isolé. La cartographie a été validée explicitement par le référent tech avant tout code.
3. **Pour chaque sous-tâche** :
   1. **Grep des ADR et docs de conception** sur les concepts du sujet (entité, storage, validator…). Cette étape a été ajoutée *en cours de vitrine* après deux divergences silencieuses, et persistée comme règle (cf. § 5 « Recadrages »).
   2. **Carte mentale** rédigée par le copilote : ce qu'on construit, pourquoi, alternatives, points à valider.
   3. **Validation orale** par le référent tech, sous-décision par sous-décision sur les choix structurants.
   4. **Implémentation** par le copilote.
   5. **Diff complet** présenté avant commit.
   6. **Validation orale finale** puis **commit** préfixé `feat(ai): US01 - <sous-tâche>` avec message structuré.
4. **Aucun commit `fix:` n'a été produit après revue** — parce que les corrections demandées ont été incorporées AVANT l'écriture du commit final. C'est ce que la consigne demande : *« relisez le code qu'il aura écrit ET/OU revoyez les tâches qu'il aura effectuées »*. La revue précède le commit, pas l'inverse.

**Objet à montrer à l'oral** : la branche elle-même, où chaque commit IA est lisible séparément avec son scope, et la PR sur GitHub qui sert de manifeste de la vitrine.

## 3. Tâches confiées à l'IA

| # | Sous-tâche | Périmètre | Commit |
|---|---|---|---|
| 1 | Entité `File` + migration | UUID v7, FK User nullable + ON DELETE SET NULL, soft delete `deletedAt` TIMESTAMPTZ, audit `created/updatedAt` (PreUpdate), `sizeBytes` BIGINT + CHECK ≤ 1 Go, index composite `(user_id, created_at DESC)` aligné sur la requête US05 | `dff4340` |
| 2 | `StorageInterface` + `LocalStorageAdapter` | Contrat aligné ADR 0003 D4 : `store(stream, key): void`. Sharding `Y/m/{uuid}.bin`. `mkdir` recursif idempotent + `stream_copy_to_stream` (RAM constante). Param `STORAGE_PATH` injecté via env | `a29c162` |
| 3 | `FileValidator` | Algo 2 couches en cascade : extension blacklist (12 ext) puis magic bytes via `finfo` + cross-check via `Symfony\Component\Mime\MimeTypesInterface`. Une seule liste maintenue. Exception unique `FileTypeRejectedException` avec 2 raisons typées | `096f57d` |
| 4 | `FileService` (orchestration) | `upload(UploadedFile, User): File` orchestre : valider → générer storageKey → ouvrir stream → `store` → persist. 3 deps autowired. Pas de cleanup compensatoire (orphan blob toléré, à logger en V2) | `20d6a82` |
| 5 | `FileController` + DTO `FileSummary` | `POST /api/files`, multipart `file`, mapping erreurs 400/415 en `application/problem+json` (RFC 7807) avec types alignés OpenAPI. 201 + `{ data: FileSummary }`. DTO `final readonly`, factory `fromFile()` | `7f48b8e` |
| 6 | Limite 1 Go + handler 413 | `UploadSizeLimitListener` sur `kernel.request` priorité 256, inspecte `Content-Length`, court-circuite avec 413 RFC 7807. Param `app.upload.max_size_bytes`. `public/.user.ini` pour relever PHP-FPM (`post_max_size = upload_max_filesize = 1100M`) | `36f77f2` |
| 7 | `fileService` front + types | `types/file.ts` : `FileSummary` aligné OpenAPI + `UploadError` union discriminée (5 kinds, type guard). `services/fileService.ts` : `upload()` via FormData multipart, mapping HTTP → erreurs typées | `765ad21` |
| 8 | `UploadPage` (UI complet) | 5 états (cta / composing / uploading / success / error). CTA initial fidèle maquette (texte fin + icône `CloudUpload` lucide + halo en élément séparé, pulse hardware-accelerated avec `prefers-reduced-motion`). File row avec icône, ellipsis, taille `fr-FR`. Champs MdP/Expiration disabled + tooltip V2 (US09/10 hors MVP). Vue success avec lien partagé + bouton « Copier le lien » full-width | `9dd44ff` |
| 9 | E2E Cypress + endpoint test files | `TestFilesController` (`POST /test/files/reset`, 404 hors `APP_ENV=test`, miroir de l'endpoint users). 2 specs Cypress (login + upload sample → assertion 201 + lien visible / login + sélection .exe → erreur client, zéro appel API). Spec login.cy.ts mise à jour pour la nouvelle UploadPage | `8f2ca99` |

**Cleanup hors vitrine** (`bf193ed`, préfixe `chore:` car maintenance hors scope) : un cache `node_modules/.vite/` à la racine du repo (vestige d'une commande lancée depuis le mauvais cwd) a été untrack et le `.gitignore` racine renforcé.

**Couverture de tests cumulée sur la branche** : 49 tests PHPUnit (+18 vs séance 10) + 87 tests Vitest (+15) + 7 tests Cypress E2E (+2). La pyramide de tests est entière sur la feature : entité, services unitaires, controller fonctionnel, listener fonctionnel, validation/service/page front, E2E full-stack.

## 4. Supervision active du référent tech

Quatre angles d'attention soutenue, alignés sur les points de vigilance OC.

### 4.1 Sécurité

- **Anti-renommage par magic bytes** : la blacklist d'extensions seule est insuffisante (le naïf renomme `cv.exe` en `cv.txt`). L'algorithme du `FileValidator` lit les premiers bytes via `finfo`, détecte le vrai MIME, demande à `MimeTypesInterface` les extensions typiques, et rejette si l'une d'elles est blacklistée. Validé bout-en-bout par un test unit qui upload un buffer commençant par `MZ\x90\x00...` (signature PE/Windows EXE) avec un nom `.txt` → rejet.
- **Limite applicative 1 Go** : décrochée du PHP-FPM via `.user.ini` mais NON déléguée à PHP. Un listener Symfony inspecte `Content-Length` AVANT toute lecture du body, court-circuite avec 413 (le caller ne perd pas de temps à uploader 2 Go avant le rejet).
- **Format d'erreur RFC 7807** : tous les codes erreur (400/413/415) renvoient `application/problem+json` avec un `type` URI déférençable (`https://datashare.fr/errors/file-too-large`, `file-type-rejected`, `file-missing`). Le front décode en union discriminée typée.
- **Endpoint `/test/files/reset`** gardé par `KernelInterface::getEnvironment() !== 'test'` → 404 si la requête arrive en dev/prod. Pattern hérité de `TestUsersController` (séance 9).

### 4.2 Maintenabilité

- **Discipline YAGNI sur l'interface storage** : le copilote a initialement proposé une interface à 3 méthodes (`store`, `read`, `delete`) telle que l'ADR 0003 D4 la décrit. Le référent tech a recadré : *« on est sur US01, le seul caller est `FileService::upload`, donc seul `store` est nécessaire »*. L'interface a été réduite à 1 méthode, l'ADR 0003 D4 enrichi d'une note d'implémentation incrémentale (`read` pour US02, `delete` pour US06 quand leur caller existera). Pattern défendable à l'oral comme « TDD top-down ».
- **SOLID matérialisé** : `FileService` (Service Responsibility orchestre upload), `FileValidator` (Single Responsibility = vérifier le type), `LocalStorageAdapter` (Liskov Substitution prévue pour V2 S3), `StorageInterface` (Dependency Inversion : aucune dépendance directe à un FS concret depuis le domaine).
- **Lecture des décisions actées avant code** : règle persistée en mémoire après deux divergences captées (cf. § 5). Désormais grep des ADR + `modele-domaine.md` + `contrat-interface.md` + `openapi.yaml` avant chaque sous-tâche.

### 4.3 Conformité aux standards de la stack

Plusieurs conventions Symfony/Doctrine/React respectées de bout en bout :

- **Symfony** : `final readonly class` pour les DTO, factory statique `fromX()` ; `AbstractController::json()` pour les réponses ; firewall stateless JWT existant (US04) couvre `/api/files` automatiquement ; lifecycle Doctrine (`#[ORM\HasLifecycleCallbacks]` + `#[ORM\PreUpdate]`) pour `updatedAt` ; tag YAML explicite `kernel.event_listener` (l'attribut `#[AsEventListener]` ne se propage pas avec une définition de service explicite, gotcha Symfony bien identifié).
- **Doctrine** : `Uuid::v7()` (timestamp embarqué = tri naturel, meilleure localité d'index Postgres) ; `BIGINT` + `CHECK` SQL pour `size_bytes` (validation au niveau BDD en plus du niveau applicatif) ; `ON DELETE SET NULL` sur la FK pour anticiper US07 (V2 upload anonyme) sans migration ; index composite `(user_id, created_at DESC)` qui sert directement la requête US05.
- **React/TS moderne** : `final readonly` côté DTO TypeScript (équivalent `as const` ici), union discriminée pour les erreurs (`UploadError`), type guard `isUploadError`, custom hook patterns côté Zustand store, `aria-hidden` + `aria-label` sur les éléments décoratifs/interactifs, `prefers-reduced-motion` sur les animations.

### 4.4 Couverture qualité

| Niveau | Outil | Compte sur US01 | Couvre |
|---|---|---|---|
| Unitaire back | PHPUnit | 13 nouveaux | Entité, validator (7 cas), service (3 mocks), storage adapter (3 round-trip) |
| Fonctionnel back | PHPUnit | 5 nouveaux | Controller (4 cas : 201/400/415/401) + listener 413 |
| Unitaire front | Vitest | 15 nouveaux | Service (7 cas), page (8 cas dont clipboard) |
| E2E full-stack | Cypress | 2 nouveaux | Login + upload OK avec lien partagé / login + .exe rejeté côté client |

**Pyramide complète** sur une feature unique. Argument oral : « j'ai testé à tous les niveaux ; la pyramide n'est pas qu'un schéma théorique sur DataShare, elle est concrète et reproductible feature par feature ».

## 5. Recadrages explicites

Les moments clés où le référent tech a corrigé le copilote, rangés du plus structurant au plus tactique. Ces moments **se racontent à l'oral, ils ne se cachent pas** : ils démontrent la valeur de la supervision.

- **R1 — Divergence entité `File` vs `modele-domaine.md` (sous-tâche 1)** : la première version du copilote a divergé sur 5 points (enum `state` vs `deletedAt` timestamp, `owner_id` NOT NULL + RESTRICT vs NULLABLE + SET NULL, `INT` vs `BIGINT` + CHECK, `updated_at` absent, timestamps `WITHOUT TIME ZONE` vs `TIMESTAMPTZ`, FK nommée `owner_id` vs `user_id`). Le référent tech a posé la question *« on est bien conforme au schéma de bdd prévu dans la doc »*, déclenchant la vérification ligne par ligne et la réécriture complète. Conséquence : enum `FileState` supprimé, soft delete reposé sur `deletedAt`, schéma BDD aligné à 100 % sur la doc actée.
- **R2 — Divergence `StorageInterface` vs ADR 0003 D4 (sous-tâche 2)** : signature `store($source): string` (le storage génère et retourne la clé) au lieu de `store(stream, key): void` (le caller fournit la clé). Plus env var `APP_SHARE_DIR=var/share` au lieu de `STORAGE_PATH=var/storage`. Le référent tech a re-posé la question *« on suit bien l'archi établie »*. Réalignement sur l'ADR : refactor de la signature, env var renommée, ADR enrichi d'une note d'implémentation incrémentale. **Conséquence méta** : règle persistée en mémoire — *« grep ADR + docs de conception AVANT d'écrire un contrat »*. À partir de la sous-tâche 3, plus aucune divergence détectée.
- **R3 — Recadrage YAGNI (sous-tâche 2, suite)** : la carte mentale initiale décrivait la sémantique de `read` ET `delete` (avec discussion détaillée sur l'idempotence du delete pour US06) alors qu'on construisait l'upload. Le référent tech a coupé : *« on est sur US01, on n'a qu'un caller, on ne définit que `store` »*. Réduction immédiate.
- **R4 — Recalibration cognitive (jour 1, fin de séance)** : empilement de 5 décisions à valider en parallèle a généré une saturation du référent tech (signal explicite *« je suis cuit, on décompose plus »*). Pause prise. Au redémarrage, le référent tech a précisé son profil pro (1.5 an WordPress + 1.5 an Django, 1/3 OC Architecte, conventions Symfony/React modernes peu fréquentées). Mémoires `user_role.md` + `feedback_communication_style.md` créées : 1 question à la fois, flag des conventions stack mainstream, pas de glose des acronymes archi (qu'il maîtrise).
- **R5 — Itérations visuelles UploadPage (sous-tâche 8)** : la maquette a été suivie pas à pas avec ~12 micro-ajustements. Quelques recadrages structurels (le premier état doit être un texte fin + icône cloud-upload sans card, pas la card directement → refactor du flow ; le halo doit être un élément séparé du bouton pour permettre une animation `transform: scale` indépendante → restructure HTML/CSS) suivis de cosmétiques (taille bouton, taille halo, opacité, couleur icône, padding card, suppression du bouton « Téléverser un autre fichier » non présent dans la maquette). **Limite reconnue** : le copilote a accepté chaque tweak un par un sans proposer de batch ; coût d'aller-retour pour le référent tech.
- **R6 — Bug `AsEventListener` non anticipé (sous-tâche 6)** : l'attribut PHP n'était pas pris en compte par autoconfigure parce que le service avait une définition explicite dans `services.yaml` (gotcha Symfony peu documenté). Le bug s'est révélé au runtime via un test qui retournait 400 au lieu de 413. Fix par tag YAML explicite. À l'oral : « j'ai débuggé via `bin/console debug:event-dispatcher`, c'est l'outil exact pour ce cas ».
- **R7 — API PHPUnit 13 non anticipée (sous-tâche 4)** : `self::isType('resource')` (PHPUnit ≤ 12) retiré en PHPUnit 13. Bascule sur `$this->callback(static fn ($r) => is_resource($r))`. Plus PHPUnit notices sur `createMock` sans expectation → bascule sur `createStub`. Tests verts au final.
- **R8 — Diagnostic login KO en fin de séance** : après finalisation côté code, smoke test du parcours register puis login. Register redirige vers /login (= 201 supposé) mais login retourne 401. Logs back analysés : `JsonLoginAuthenticator` failed après `UserProviderListener::checkPassport`, donc l'utilisateur n'a pas été trouvé. Vérification via `dbal:run-sql` (le référent tech n'avait pas `psql` dans son PATH local) : table `users` vide. Le register n'avait jamais touché le back (rien dans les logs `POST /api/auth/register`). Cause finale identifiée par le référent tech : front pas configuré pour viser le bon back.

## 6. Bilan honnête

### Ce qui a marché

- **Discipline méthodologique tenue à 100 %** sur les 9 sous-tâches. Chaque commit est explicable seul. La branche est lisible comme une narration, la PR comme un manifeste.
- **Refactoring d'alignement archi tracé deux fois** (R1 + R2) — c'est précisément ce qu'il fallait : le copilote dérive, le référent tech recadre, le code est réécrit, l'ADR est enrichi quand pertinent. Ce sont les meilleurs arguments pour démontrer la valeur de la revue active.
- **Mémoire IA enrichie en cours de séance** — trois mémoires créées (`feedback_check_archi_avant_code`, `user_role`, `feedback_communication_style`) qui s'appliqueront aux prochaines séances. La calibration n'est pas perdue à la fin du tour, elle se sédimente.
- **Sécurité défensive en couches** : front (validation client UX) + back (extension blacklist + magic bytes + listener taille) + RFC 7807 partout. Le malware évident (`cv.exe`) est rejeté en 3 endroits différents.

### Ce qui a moins bien marché

- **Démarrage de vitrine fragile** : les deux divergences archi (R1 + R2) sont survenues parce que le copilote a foncé sur le pattern le plus naturel sans grep des décisions déjà actées. La règle a été ajoutée *en cours de vitrine*, pas en début. À refaire, je l'aurais imposée dès le contrat de travail initial.
- **Saturation cognitive pas détectée à temps** : le mur de 5 questions empilées (R4) aurait dû être désamorcé par le copilote (« ça commence à faire beaucoup, on coupe ? ») plutôt qu'attendre le signal *« cuit »* du référent tech.
- **Itérations UI non rationalisées** (R5) : ~12 tweaks acceptés un par un sans proposer de batch d'abord. Mécanisme à creuser pour les futures features visuelles.
- **Wording « conservé pendant une semaine »** sur la vue success : copié de la maquette mais correspond à US10 (expiration auto) qui est hors MVP. À l'oral, ce détail peut être pointé. Décision laissée au référent tech : fidélité maquette + V2 documentée, ou adaptation MVP.

## 7. Pointeurs

- **Branche Git** : `feat/us01-upload` (à pousser et conserver via PR fictive sur GitHub comme artefact de soutenance).
- **Journal interne exhaustif** : [`docs/ai-collab/journal.md`](./journal.md), entrée séance 11.
- **Mémoires IA persistées** :
  - `~/.claude/projects/-Users-jean-baptiste-OCProjects-DataShare/memory/feedback_check_archi_avant_code.md`
  - `~/.claude/projects/-Users-jean-baptiste-OCProjects-DataShare/memory/feedback_us_vitrine_ia.md`
  - `~/.claude/projects/-Users-jean-baptiste-OCProjects-DataShare/memory/user_role.md`
  - `~/.claude/projects/-Users-jean-baptiste-OCProjects-DataShare/memory/feedback_communication_style.md`
- **ADR concernés** : `docs/ai-collab/decisions/0001-streaming-upload.md`, `docs/ai-collab/decisions/0003-stack-technique.md` (D4 enrichi de la note d'implémentation incrémentale).
- **Doc de conception alignée** : `docs/conception/modele-domaine.md` (entité `File` finale conforme), `docs/conception/openapi.yaml` (endpoint POST `/files` aligné), `docs/conception/contrat-interface.md` § 4.4.
- **Notes de maquette** : `docs/maquettes/NOTES.md` (décision « disabled + tooltip V2 » pour MdP/Expiration tracée).
