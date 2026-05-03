# ADR 0002 — Stratégie d'authentification JWT

- **Statut :** accepted (révisé)
- **Date initiale :** 2026-04-25
- **Date de révision :** 2026-04-28
- **Décideur :** référent technique senior
- **Contexte amont :** résolution de l'ambiguïté #7 (durées et stratégie JWT non précisées par la spé)

> ## ⚠️ Note de révision (2026-04-28)
>
> Le présent ADR a été révisé sur les sous-décisions **D3, D4 et D6**. La version initiale (2026-04-25) retenait un pattern **JWT en cookie `HttpOnly Secure SameSite=Strict` + CSRF double-submit**, défendable sur l'axe sécurité-first.
>
> **Raison de la révision** : ce pattern est **non standard côté Symfony**, où la norme de fait pour une API SPA est `LexikJWTAuthenticationBundle` + JWT en header `Authorization: Bearer` + stockage front en `localStorage`. Compte tenu du contexte projet — **premier Symfony à cette envergure** pour le référent tech, **MVP sans données sensibles**, **critère d'arbitrage prioritaire = productivité immédiate** (cf. ADR 0003) — le surcoût d'écriture d'un EventSubscriber CSRF custom et la prise de risque sur du code de sécurité maison ne sont pas justifiés.
>
> **Trade-off accepté** : le pattern Bearer est vulnérable à XSS (un script injecté peut lire `localStorage.token` et l'exfiltrer). **Mitigation** : CSP stricte, audit des dépendances, sanitization stricte des inputs (à tracer dans `SECURITY.md`).
>
> D1 (8 h), D2 (pas de refresh) et D5 (HS256) sont **inchangés**.

## Contexte

La spécification fonctionnelle impose explicitement l'utilisation de **JWT** (JSON Web Token) pour authentifier les utilisateurs :

- **US03** (page 3) : *« Création d'un token JWT à la connexion pour authentifier les requêtes »*.
- **US04** (page 4) : *« Un token JWT est généré et transmis au client »*.

Mais la spé ne précise **rien** sur :

- la **durée de vie** du token,
- son **stockage** côté client,
- l'existence d'un mécanisme de **renouvellement** (refresh token),
- la **mitigation des attaques CSRF** induites par le choix de stockage,
- l'**algorithme de signature**,
- la stratégie de **logout** (révocation).

Ces six points forment **une stratégie d'authentification cohérente** — chacun isolément n'a pas de sens. Le présent ADR fige cette stratégie pour le MVP DataShare et documente les évolutions envisageables en V2.

## Préambule pédagogique — Comprendre JWT en 3 minutes

### Analogie : le bracelet de festival

Imaginer un festival de plusieurs jours. À l'entrée :

1. Le visiteur présente son billet (= **email + mot de passe**) au guichet (= endpoint `POST /auth/login`).
2. Le guichet vérifie la validité du billet, puis lui remet un **bracelet** marqué d'un tampon secret (= **JWT signé**).
3. Pour le reste du festival, le visiteur ne montre plus son billet : seul son bracelet sert à prouver son identité aux différents stands.

### Trois propriétés clés du bracelet

| Propriété | Implication technique |
|---|---|
| **Lisible par tous, falsifiable par personne** | Le JWT est encodé en base64 (lisible) mais signé cryptographiquement avec un secret connu seulement du serveur. N'importe qui peut lire son contenu, mais personne ne peut en forger un nouveau sans le secret. |
| **Durée de vie limitée** | Un champ `exp` (expiration) dans le JWT le rend invalide passé une date. C'est le seul mécanisme de péremption *intrinsèque*. |
| **Stateless côté serveur** | Le serveur n'a rien à mémoriser : à chaque requête, il vérifie la signature et la date. Pas de session côté serveur, pas de Redis, pas de table `sessions`. |

### Conséquences pratiques

De ces 3 propriétés découlent **toutes les questions de cet ADR** :

| Question | Décision N° |
|---|---|
| Combien de temps le bracelet reste valide ? | D1 — Durée |
| Comment le re-générer sans re-saisir le mot de passe ? | D2 — Refresh ou pas |
| Où le porteur le range entre deux usages ? | D3 — Storage côté client |
| Comment empêcher un autre site de l'usurper ? | D4 — Mitigation CSRF |
| Avec quelle technique le tampon est-il appliqué et vérifié ? | D5 — Algorithme |
| Comment l'invalider avant son expiration naturelle ? | D6 — Logout |

## Décisions

### D1 — Durée du token : **8 heures**

> ✅ **Validé avec le user (2026-04-25)** — privilégier l'expérience utilisateur sur la sécurité maximale, en assumant explicitement le trade-off.

#### Question

Combien de temps un token reste valide après émission ?

#### Options envisagées

| Durée | Trade-off |
|---|---|
| 15-30 min | Très sûr, friction utilisateur élevée (re-login fréquent) |
| 1 h | Friction acceptable B2B mais perçue agaçante sur des services équivalents (Brevo, Stripe, DocuSign) |
| 4 h (demi-journée) | Couvre matin OU après-midi, frontière naturelle |
| **8 h (journée de travail)** | Une seule connexion par jour, confort maximal sans refresh |
| 24 h ou plus | Confort équivalent à 8 h mais inclut une période hors session active → risque non justifié |

#### Décision

**8 heures**, exprimée dans le claim `exp` du JWT (`iat + 28 800`).

#### Justification

- **Profil utilisateur cible** (freelance, PME) : l'app est utilisée sur une **journée de travail typique**, avec aller-retours fréquents (envoi d'un fichier, retour pour consulter l'historique, etc.). Une session limitée à 1 h ou même 4 h crée une friction comparable à celle qu'on observe — et que l'utilisateur trouve perçue comme agaçante — sur Stripe, Brevo ou DocuSign.
- **Pas d'usage hors session active** : 8 h couvre une journée de travail mais s'arrête à la fin de la journée. Un utilisateur qui revient le lendemain doit se reconnecter, ce qui est une frontière naturelle.
- **Risque résiduel borné** : si un token est volé (XSS principalement, cf. D3), l'attaquant dispose au pire de 8 h. Ce risque est mitigé par les contre-mesures XSS (CSP stricte, audit dépendances, sanitization) et par l'expiration mécanique du token.
- **Sensibilité des données DataShare** : pas de paiement, pas de PII lourde. Liabilité = exposition des fichiers et liens d'un utilisateur. Sévérité moyenne, compatible avec une fenêtre de 8 h.

#### Risque assumé

- Si un attaquant parvient malgré tout à exfiltrer un token (ex. fuite de cookie via vulnérabilité serveur, mauvaise hygiène de l'utilisateur, capture sur réseau non chiffré sans `Secure` correctement appliqué), il dispose **jusqu'à 8 h** pour l'exploiter.
- À l'oral : assumer ce choix comme un **arbitrage UX/sécurité conscient**, et présenter les contre-mesures (D3, D6) comme la défense en profondeur. En V2, basculer sur access court + refresh (cf. évolutions).

### D2 — Pas de refresh token

> ✅ **Validé avec le user (2026-04-25)** — cohérent avec le choix de simplicité MVP. Le refresh est listé comme évolution V2.

#### Question

Doit-on offrir un mécanisme pour renouveler le token sans re-saisir le mot de passe ?

#### Options envisagées (après D1 = 8 h)

| Pattern | Mécanisme | Pour | Contre |
|---|---|---|---|
| **Access 8 h seul (notre choix)** | Login → JWT 8 h. Expiration → re-login. | Simple, une seule chose à gérer. Cohérent avec D1. | Fenêtre de vol = 8 h. |
| Access court (15-30 min) + refresh long (8 h ou 7 j) | Login → 2 tokens. Le refresh ne sert qu'à renouveler l'access. | Fenêtre de vol de l'access ramenée à 30 min. Le refresh peut être révoqué côté serveur (blacklist). | Complexité forte : endpoint `/auth/refresh`, double cookie, blacklist en cas de rotation (Redis), gestion des erreurs de rafraîchissement, état partagé entre instances back. |

#### Décision

**Access token seul, pas de refresh.**

#### Justification

- L'utilité première du refresh (réduire la friction de re-login fréquent) est déjà couverte par le choix de D1 = 8 h : un seul re-login par jour.
- L'utilité résiduelle (raccourcir l'access pour réduire la fenêtre de vol) introduirait une complexité disproportionnée pour un MVP solo : nouvel endpoint, gestion d'erreurs spécifique, blacklist serveur, état partagé entre instances en cas de scale.
- Le risque résiduel (fenêtre 8 h) est borné par les attributs de cookie (D3) qui rendent le vol fortement improbable.
- En V2, l'introduction d'un refresh token est **additive** (pas de cassure d'API), donc rien n'est figé pour l'avenir.

### D3 — Storage côté client : **`localStorage` + header `Authorization: Bearer`**

> ✅ **Révisé avec le user (2026-04-28)** — alignement sur le pattern standard Symfony pour API SPA, après bascule depuis le pattern cookie HttpOnly initialement retenu.

#### Question

Où le client stocke-t-il le JWT entre deux requêtes ?

#### Options envisagées

| Storage | Vulnérable à XSS ? | Vulnérable à CSRF ? | Standard Symfony API ? |
|---|---|---|---|
| **`localStorage` + Bearer** | Oui : un script injecté lit le token | Non (header non auto-propagé cross-origin) | **Oui — pattern dominant via `LexikJWTAuthenticationBundle`** |
| `sessionStorage` + Bearer | Idem `localStorage` | Idem | Variante mineure (perte au close-tab) |
| Variable JS en mémoire | Non (pas persisté) | Non | Rare. Token perdu à chaque reload — contradictoire avec D1 = 8 h |
| Cookie `HttpOnly Secure SameSite=Strict` | Non (inaccessible JS) | À gérer (CSRF token) | Pattern minoritaire en Symfony — exige du code custom |

#### Décision

Le JWT est **renvoyé dans le body de la réponse `POST /auth/login`** (et `POST /auth/register` si auto-login). Le front **stocke le token en `localStorage`** et l'envoie sur chaque requête authentifiée dans le header :

```
Authorization: Bearer eyJhbGc...
```

Côté back : utilisation de **`LexikJWTAuthenticationBundle`** (config quelques lignes YAML) pour signer/vérifier le JWT et exposer un `User` authentifié sur les requêtes.

#### Justification

- **Pattern dominant en Symfony API** : c'est ce qu'on trouve dans 90 % des projets Symfony API (Lexik JWT a ~10 ans, bundle mature, doc abondante).
- **Productivité immédiate** (critère d'arbitrage prioritaire ADR 0003) : config en quelques lignes, pas d'EventSubscriber CSRF custom à écrire et à tester.
- **Pas de problème CSRF** : les headers custom ne sont pas auto-propagés par le navigateur cross-origin → un site malveillant ne peut pas forger une requête authentifiée. **Le problème ne se pose juste pas.**
- **Stateless** : aucun stockage côté serveur, signature cryptographique du JWT suffit (cohérent D2 et D5).

#### Trade-off assumé : XSS

`localStorage` est lisible par n'importe quel script qui s'exécute dans notre origine. Si une seule ligne de JS malveillant passe (XSS via une lib tierce compromise, une faille DOM, etc.), le token est volé.

**Mitigation** :

| Mesure | Description |
|---|---|
| **CSP stricte** | `Content-Security-Policy` qui interdit `unsafe-inline`, restreint les sources de scripts à notre domaine + dépendances explicitement listées. À configurer dans le middleware Symfony. |
| **Audit des dépendances** | Scan régulier (`npm audit`, `composer audit`). À tracer dans `SECURITY.md`. |
| **Sanitization stricte** | Tout input utilisateur affiché dans le DOM passe par les helpers React (qui échappent par défaut). Pas de `dangerouslySetInnerHTML` sauf justification explicite. |
| **HTTPS partout** | Pas de mitigation XSS direct mais empêche l'interception réseau du token. |

À l'oral : *« on a choisi le pattern Bearer mainstream Symfony, ce qui nous expose à XSS ; mitigation par CSP stricte, audit des dépendances et sanitization. Pour un MVP sans données sensibles, c'est un compromis acceptable. La variante cookie HttpOnly + CSRF double-submit serait un renforcement V2 si le profil de risque évolue. »*

#### Comment cela fonctionne concrètement (utile pour l'oral)

**Étape 1 — Le serveur renvoie le token après login :**

```
Requête  : POST /api/auth/login  { "email": "...", "password": "..." }
Réponse  : 200 OK
           Content-Type: application/json
           { "token": "eyJhbGc...", "user": { "id": "...", "email": "..." } }
```

**Étape 2 — Le front stocke le token en `localStorage` :**

```js
const { token } = await response.json();
localStorage.setItem('token', token);
```

**Étape 3 — Le front envoie le token dans le header `Authorization` à chaque requête authentifiée :**

```js
fetch('/api/files', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});
```

En pratique, on configure un **interceptor Axios** (côté front) qui ajoute automatiquement le header sur chaque requête sortante.

**Étape 4 — Côté back, Lexik JWT décode et authentifie automatiquement :**

Le bundle ajoute un firewall Symfony Security qui lit le header, vérifie la signature, charge l'utilisateur depuis Doctrine, et expose `$user = $security->getUser()` dans les controllers. Aucun code custom dans les controllers.

> **Piège CORS** : si l'API est sur un domaine différent du front (ex. `api.datashare.fr` vs `app.datashare.fr`), il faut configurer `Access-Control-Allow-Headers: Authorization` côté back. Bundle `nelmio/cors-bundle` par défaut. À documenter dans `SECURITY.md`.

### D4 — Mitigation CSRF : **N/A — pattern Bearer non vulnérable**

> ✅ **Révisé avec le user (2026-04-28)** — sous-décision rendue caduque par la révision de D3 (Bearer en lieu et place de cookie HttpOnly).

#### Question initiale

Avec un cookie envoyé automatiquement par le navigateur, comment empêcher qu'un site malveillant force une requête mutante au nom de l'utilisateur connecté ?

#### Pourquoi la question ne se pose plus

Le pattern d'attaque CSRF exploite **l'auto-propagation des cookies** par le navigateur : sur une requête vers notre domaine, même initiée depuis un autre site, le navigateur ajoute tous les cookies destinés à notre domaine.

Avec D3 révisé, le JWT n'est **plus dans un cookie** mais dans un header `Authorization: Bearer ...` posé explicitement par le code front. Or **les headers custom ne sont pas auto-propagés** : un script de `evil.com` ne peut pas faire une requête à `datashare.fr` en y ajoutant le header `Authorization`, parce que :

1. Pour une requête simple cross-origin, le navigateur ne laisse pas un script tiers ajouter de headers arbitraires.
2. Pour une requête « préflightée » (avec headers custom), le navigateur fait d'abord un `OPTIONS` que notre back peut refuser via CORS strict.
3. Surtout : `evil.com` n'a **aucun moyen de connaître la valeur du token** (il est dans `localStorage` de notre origine, inaccessible depuis une autre origine via la Same-Origin Policy).

→ **Aucun code CSRF à écrire**, aucun endpoint `/csrf`, aucun cookie `XSRF-TOKEN`, aucun EventSubscriber.

#### Le risque qui reste à mitiger : XSS (cf. D3)

Le pattern Bearer **déplace** le risque : on n'a plus CSRF mais on a XSS (un script injecté dans notre origine peut lire `localStorage.token`). Cf. section « Trade-off assumé : XSS » dans D3 pour la liste des mitigations (CSP, audit deps, sanitization).

#### Pour défendre à l'oral

> *« Le pattern Bearer n'est pas vulnérable à CSRF parce que les headers custom ne sont pas auto-propagés par le navigateur cross-origin, contrairement aux cookies. Donc pas de code CSRF à écrire. En contrepartie, on hérite du risque XSS, mitigé par CSP stricte, audit des dépendances et sanitization. C'est le trade-off classique cookie HttpOnly + CSRF vs Bearer + XSS : on a choisi le second parce qu'il aligne avec le pattern dominant Symfony et minimise le code de sécurité custom. »*

### D5 — Algorithme de signature : **HS256**

> ✅ **Validé avec le user (2026-04-25)** — choix naturel pour un monolithe MVP.

#### Question

Avec quel algorithme cryptographique le serveur signe-t-il le JWT ?

#### Options envisagées

| Algorithme | Mécanisme | Cas d'usage |
|---|---|---|
| **HS256** (HMAC + SHA-256) | Secret unique partagé entre les parties qui signent et vérifient | Monolithe, un seul service vérifie ses propres tokens |
| RS256 (RSA + SHA-256) | Paire de clés asymétriques : clé privée pour signer, clé publique pour vérifier | Multi-services, OAuth/OpenID Connect, ou si la vérification doit se faire ailleurs sans partager le secret |

#### Décision

**HS256**, avec un secret généré aléatoirement (≥ 256 bits) stocké en variable d'environnement (`JWT_SECRET`).

#### Justification

- DataShare est un **monolithe en MVP** : la signature et la vérification se font dans le même service. Le secret n'a pas à voyager.
- HS256 est l'algorithme par défaut de la plupart des bibliothèques JWT — moins de risque de configuration erronée.
- RS256 serait du sur-engineering ici. Il deviendrait pertinent si on extrayait l'auth dans un service séparé (microservices), si on exposait un SSO à des services tiers, ou si on voulait publier une clé publique pour des intégrations externes — tous **hors scope MVP**.

#### Précautions de sécurité (à expliciter dans `SECURITY.md` et défendre à l'oral)

- **Secret ≥ 256 bits d'entropie**, généré via `openssl rand -base64 32` (ou équivalent).
- **Secret en variable d'environnement** (`JWT_SECRET`), **jamais commité** dans le repo. Variable documentée dans le `README` et listée comme prérequis de déploiement.
- **Refuser explicitement l'algorithme `none`** côté serveur. C'est une faille historique : un attaquant forge un token avec `"alg": "none"` (pas de signature) et certaines libs mal configurées l'acceptent. Configuration explicite : *« n'accepte que HS256, rien d'autre »*.
- **Procédure de rotation** documentée dans `MAINTENANCE.md` : régénérer `JWT_SECRET`, redémarrer le service. Effet : tous les utilisateurs sont déconnectés (effet brutal mais nécessaire en cas de fuite suspectée).

### D6 — Logout : **suppression côté front (`localStorage`)**

> ✅ **Révisé avec le user (2026-04-28)** — adaptation du logout au pattern Bearer (D3 révisé). Pas de cookie à invalider côté serveur.

#### Question

JWT est par design stateless : le serveur ne sait pas qui est connecté. Comment alors « déconnecter » un utilisateur **avant** que son token expire naturellement (donc avant 8 h, cf. D1) ?

#### Options envisagées (pattern Bearer)

| Stratégie | Mécanisme | Pour | Contre |
|---|---|---|---|
| **Suppression front (notre choix)** | Le front exécute `localStorage.removeItem('token')` puis redirige vers `/login` | Simple, **stateless**, zéro code serveur | Le token reste techniquement valide jusqu'à `exp` (au pire 8 h) mais sans vecteur (effacé côté client) |
| Endpoint `POST /api/auth/logout` côté serveur | Sans état serveur, l'endpoint ne fait rien d'effectif (pas de cookie à clear, pas de session à détruire) — il existe pour cohérence ou pour blacklister un `jti` | Permet d'ajouter une blacklist plus tard sans casser le contrat front | Endpoint « cosmétique » en MVP — peut induire en erreur (le serveur n'a rien fait) |
| Blacklist Redis | Le serveur stocke les `jti` invalidés et les rejette à chaque vérification | Vrai logout immédiat, opposable côté serveur | Stateful (Redis à provisionner), perd le bénéfice stateless de JWT |

#### Décision

**Logout strictement côté front** : suppression du token de `localStorage`, suppression de l'header `Authorization` des futures requêtes (réinitialisation de l'interceptor Axios), redirection vers `/login`.

**Pas d'endpoint `POST /api/auth/logout` en MVP** — il n'aurait aucun effet réel côté serveur dans le pattern Bearer.

#### Justification

- La fenêtre d'exploitation résiduelle est bornée à `exp - now()`, soit au pire 8 h (D1).
- En supprimant le token de `localStorage`, le front n'a plus de vecteur pour l'envoyer. Un attaquant qui aurait obtenu le token via XSS l'a déjà — le logout ne peut pas le « rappeler ».
- La blacklist Redis est over-engineered pour un MVP : ajoute un service à provisionner et perd le bénéfice principal de JWT (statelessness).
- Pas d'endpoint cosmétique : on évite un endpoint qui « fait semblant ». Le contrat REST reste honnête.

#### Risque assumé

Si le token a déjà été exfiltré (par XSS notamment), le logout côté front ne le révoque pas. L'attaquant peut l'utiliser tant que `exp` n'est pas atteint (≤ 8 h).

**Mitigations** :
- D1 = 8 h limite mécaniquement la fenêtre.
- Mitigations XSS de D3 (CSP, audit deps, sanitization) réduisent la probabilité d'exfiltration.
- **V2 envisageable** : ajouter un endpoint `POST /api/auth/logout` qui blackliste le `jti` côté serveur (Redis ou table `revoked_tokens`). Listé dans « Évolutions envisageables ».

Pour le MVP, le risque résiduel est acceptable compte tenu du profil de données (pas de paiement, pas de PII lourde).

## Payload du JWT

Le JWT contient strictement :

| Claim | Type | Description |
|---|---|---|
| `sub` | UUID ou int | Identifiant utilisateur (subject) |
| `iat` | Unix timestamp | Date d'émission (issued at) |
| `exp` | Unix timestamp | Date d'expiration (= `iat + 3600`) |

**Ce qui n'est PAS dans le payload :**

- Mot de passe ou hash (évident).
- Email (donnée personnelle, fuiterait au moindre log de token).
- Rôles ou permissions (pas de modèle de rôles en MVP — US04 ne distingue qu'authentifié vs anonyme).

→ Rappel pédagogique : **un JWT est signé, pas chiffré**. Tout son contenu est lisible par n'importe qui (`base64 -d`). Ne jamais y mettre de donnée sensible.

## Conséquences globales

### Positives

- **Pattern dominant Symfony** : `LexikJWTAuthenticationBundle` mature, config courte, écosystème large, doc abondante.
- **Productivité immédiate** : pas d'EventSubscriber CSRF custom à écrire, pas d'endpoint `/csrf` à maintenir.
- **Stateless** : pas de Redis, pas de table `sessions`, pas de coordination d'état entre instances back en cas de scale horizontal.
- **Pas de problème CSRF** : les headers custom ne sont pas auto-propagés cross-origin.
- **Défendable à l'oral** : chaque décision a une justification ancrée dans une question concrète, choix de standard explicite.

### Négatives / risques

- **Vulnérable XSS** : `localStorage` lisible par tout script s'exécutant dans notre origine. Mitigation : CSP stricte, audit des dépendances, sanitization. Cf. D3 et `SECURITY.md`.
- **Re-login après 8 h** = friction faible (un re-login par jour au pire). Mitigation : message UX clair sur l'expiration, persistance de l'état du formulaire en cours si possible.
- **Pas de logout immédiat serveur** : fenêtre résiduelle ≤ 8 h. Si le token est exfiltré (XSS), il reste utilisable. Acceptable pour un MVP B2B compte tenu du profil de données (pas de paiement, pas de PII lourde).
- **Stratégie figée pour MVP** : si le profil de risque évolue, bascule en V2 vers cookie HttpOnly + CSRF (option initialement retenue, abandonnée pour productivité).

### Contre-mesures prévues

- **CSP stricte** : `Content-Security-Policy` interdisant `unsafe-inline`, restreignant les sources de scripts. À configurer dans le middleware Symfony.
- **Audit dépendances** : `npm audit`, `composer audit` à exécuter régulièrement. Tracé dans `SECURITY.md`.
- **Sanitization des inputs** : helpers React natifs, pas de `dangerouslySetInnerHTML` sauf cas justifié.
- Forcer **HTTPS** partout — empêche l'interception réseau du token.
- **Refuser explicitement** l'algorithme `none` côté serveur (configuration de la lib JWT).
- **Ne pas logger** le contenu du header `Authorization` ni les bodies de réponse `/login`.
- **CORS strict** (whitelist d'origines, pas `*` ; `Access-Control-Allow-Headers: Authorization`).
- **Rate limiter** sur `POST /auth/login` (mitigation force brute) — à intégrer dans `SECURITY.md`.

## Évolutions envisageables (hors MVP)

- **Refresh token** (15 min access + 7 j refresh) si la friction de re-login devient gênante.
- **Bascule cookie HttpOnly + CSRF double-submit** si le profil de risque évolue (XSS jugé inacceptable).
- **Blacklist Redis** des `jti` pour un vrai logout serveur immédiat.
- **RS256** si l'auth est extraite en service dédié (microservices, SSO).
- **Multi-factor authentication** (TOTP) sur connexion.
- **Rate limiting** plus fin par IP/compte sur les endpoints sensibles.
- **Rotation périodique** du secret avec mécanisme de double-acceptation pendant la transition.

## Préparation à l'oral — questions probables et réponses

| Question évaluateur | Réponse défendable |
|---|---|
| « `localStorage`, c'est pas vulnérable XSS ? » | « Si, c'est le trade-off assumé. Mitigation : CSP stricte qui interdit `unsafe-inline`, audit des dépendances, sanitization stricte. Pour un MVP sans données sensibles, c'est acceptable et c'est le pattern dominant Symfony via `LexikJWTAuthenticationBundle`. La variante cookie HttpOnly + CSRF double-submit aurait été plus sûre en profondeur mais aurait demandé du code de sécurité custom — overhead non justifié pour un premier projet Symfony à cette échelle. C'est documenté comme évolution V2. » |
| « Pourquoi 8 h et pas 1 h, 4 h, ou 24 h ? » | « Arbitrage UX/sécurité conscient. Le profil utilisateur cible (freelance/PME) utilise l'app sur une journée de travail typique avec aller-retours fréquents — l'expérience de Stripe, Brevo ou DocuSign à 1 h ou 4 h est perçue comme agaçante. 8 h couvre une journée mais s'arrête à la frontière naturelle d'une session de travail. Au-delà (24 h), on entrerait dans une période hors session active, ce qui ne se justifie plus. Le risque résiduel est borné par les mitigations XSS et l'expiration mécanique du token. » |
| « Pas de refresh token, c'est volontaire ? » | « Oui. L'utilité première du refresh (réduire la friction de re-login fréquent) est déjà couverte par les 8 h. L'utilité résiduelle (raccourcir l'access pour réduire la fenêtre de vol) introduirait une complexité disproportionnée pour un MVP : nouvel endpoint, gestion de la rotation, blacklist. Le refresh est un ajout **additif** en V2. » |
| « Comment vous gérez le logout, JWT est stateless ? » | « Logout strictement côté front : suppression du token de `localStorage`, redirection vers `/login`. Pas d'endpoint serveur en MVP — il n'aurait aucun effet réel dans le pattern Bearer. Le token reste valide jusqu'à `exp` (≤ 8 h) mais sans vecteur côté front. Pour un logout serveur immédiat, blacklist Redis listée en V2. » |
| « Et CSRF ? » | « Le pattern Bearer n'est pas vulnérable à CSRF parce que les headers custom ne sont pas auto-propagés cross-origin par le navigateur, contrairement aux cookies. Donc pas de code CSRF à écrire. C'est même un des arguments du choix Bearer vs cookie. » |
| « HS256 ou RS256 ? » | « HS256, secret en variable d'environnement. Suffisant pour un monolithe. RS256 deviendrait pertinent si on extrayait l'auth en service dédié. » |
| « Et si le secret JWT fuite ? » | « Tous les tokens en circulation deviennent forgeables. Procédure de rotation : régénérer `JWT_SECRET`, redémarrer le service. Tous les utilisateurs sont déconnectés (effet brutal mais nécessaire). À documenter dans `MAINTENANCE.md`. » |
| « Pourquoi le pattern Bearer plutôt que cookie HttpOnly ? » | « Trois raisons : (1) c'est le pattern dominant Symfony — `LexikJWTAuthenticationBundle` est mature et bien outillé ; (2) productivité immédiate, pas d'EventSubscriber CSRF custom à écrire ; (3) c'est mon premier Symfony à cette échelle, j'ai privilégié un standard éprouvé plutôt que du code de sécurité maison. Le trade-off est l'exposition XSS, que je mitige par CSP + audit deps + sanitization. La variante cookie HttpOnly est listée comme évolution V2. » |

## Références

- Spécification fonctionnelle, US03 et US04 — exigence JWT.
- OWASP Authentication Cheat Sheet (2024) — recommandations de stockage.
- OWASP XSS Prevention Cheat Sheet — pattern de mitigation par CSP + sanitization.
- OWASP Content Security Policy Cheat Sheet — configuration CSP stricte.
- `LexikJWTAuthenticationBundle` — bundle Symfony JWT mainstream.
- ADR 0001 — streaming upload (cohérence des choix architecturaux).
- ADR 0003 — stack technique (critère prioritaire = productivité immédiate).
- À tracer en synthèse dans **section 5 du Livrable 1** (Sécurité et gestion des accès) et dans `SECURITY.md`.
