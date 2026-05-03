# ADR 0001 — Streaming côté serveur pour les uploads de fichiers

- **Statut :** accepted
- **Date :** 2026-04-19
- **Décideur :** référent technique senior
- **Contexte amont :** session `.ai-collab/sessions/2026-04-19.md`, résolution de l'ambiguïté #3

## Contexte

L'US01 impose une taille maximale de **1 Go par fichier**. La spécification ne précise **pas** la stratégie technique pour gérer un tel volume. Laisser la décision implicite expose à deux risques :

1. **Non-tenue de la charge :** une implémentation naïve qui charge le fichier complet en RAM avant écriture sur le stockage provoque un *Out of Memory* dès qu'on empile quelques uploads concurrents.
2. **Couplage prématuré au stockage :** décider de la stratégie d'upload après avoir choisi le stockage (FS local ou S3) peut nous enfermer dans une seule approche technique.

La décision doit donc être prise **avant** l'ADR sur le stockage, et doit rester **découplée** du choix final.

## Options envisagées

### Option A — Streaming back-end

Le back-end reçoit le flux multipart et l'écrit **en streaming** sur le stockage final (ou un disque temporaire, puis déplacement). La RAM consommée reste constante quelle que soit la taille du fichier.

**Avantages :**
- Implémentation simple, gérée nativement par les 4 frameworks back candidats (Spring Boot `StreamingMultipartResolver`, NestJS `FastifyMultipart`/`Multer` en mode stream, .NET Core `IFormFile` streaming, Symfony/Laravel streams).
- Découplage du stockage : la même stratégie fonctionne pour FS local et pour S3 (le SDK AWS propose un *multipart upload* transparent pour les gros fichiers).
- Toute la validation serveur reste possible (taille réelle, MIME type, blacklist d'extensions).

**Inconvénients :**
- Nécessite un **timeout HTTP étendu** (~10 min pour accueillir 1 Go à ~2 Mo/s).
- Pas de reprise d'upload : un échec réseau en cours de transfert = reprise à zéro.

### Option B — Chunked upload côté client

Le front-end découpe le fichier en morceaux (p. ex. 5 Mo) envoyés en N requêtes successives. Le back-end les réassemble (ou délègue à un *multipart upload* S3).

**Avantages :**
- Reprise d'upload possible en cas d'échec réseau.
- Meilleure UX sur réseau instable (mobile/3G).

**Inconvénients :**
- Logique applicative significativement plus complexe (front + back + gestion d'état multipart).
- Sur-dimensionné pour un MVP desktop avec un plafond de 1 Go.

### Option C — URL signée directement vers S3

Le back-end signe une URL temporaire ; le front uploade directement vers S3 sans passer par le back.

**Avantages :**
- Pas de trafic applicatif pour les octets du fichier.
- Scale naturellement.

**Inconvénients :**
- **Couple l'architecture à S3 dès le premier jour** — on ne peut plus choisir un stockage FS local.
- On perd l'opportunité de valider le flux côté serveur (taille réelle, MIME détecté par magic number, scan éventuel).

## Décision

**Option A — Streaming back-end.**

## Justification

- Répond à la contrainte de charge sans complexité superflue.
- Reste **agnostique au stockage** — ne ferme pas la porte à S3 ni à FS local.
- Cohérent avec le principe directeur du MVP (strict, priorité à la simplicité qui tient la charge nominale) : un *chunked upload* serait pertinent au-delà de 1 Go ou avec une cible mobile/3G, pas ici.

## Conséquences

**Positives :**
- Implémentation rapide et défendable.
- Validation serveur préservée (taille, MIME, extensions).
- Compatible avec les deux options de stockage à venir.

**Négatives / risques :**
- Échec d'upload = reprise à zéro (accepté pour un MVP desktop).
- Charge disque temporaire : les fichiers transitent par un répertoire tampon avant d'être déplacés vers le stockage final — à documenter dans `MAINTENANCE.md` (espace disque à surveiller).

**Contre-mesures prévues :**
- Limite stricte 1 Go appliquée côté back via middleware (réponse HTTP `413 Payload Too Large` au-delà).
- Validation préalable côté front (taille + extension + MIME déduit) pour éviter de démarrer un upload voué à l'échec.
- Configuration du timeout HTTP à ~10 min sur l'endpoint d'upload.
- Surveillance de l'espace disque du répertoire tampon documentée dans `MAINTENANCE.md`.

## Évolutions envisageables (hors MVP)

- Passage à un **chunked upload** si la cible devient mobile ou si la limite de taille évolue au-delà de quelques Go.
- Passage à une **URL signée** si le choix de stockage fige S3 et si l'on souhaite libérer le back du trafic de données.

## Références

- Spécification fonctionnelle, US01 — contrôle de saisie « Taille maximale : 1 Go ».
- Règle directrice d'arbitrage MVP (stricte, lecture minimaliste).
- ADR à venir sur le choix de stockage (FS local vs AWS S3).
