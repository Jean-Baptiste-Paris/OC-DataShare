# ADR 0004 — Pas d'auto-login sur POST /auth/register

- **Statut :** accepted
- **Date :** 2026-05-09 (décision initiale prise en séance 7, formalisée séance 9)
- **Décideur :** référent technique senior
- **Contexte amont :** ADR 0002 (stratégie JWT), séance 7 (implémentation US03 back), spécification fonctionnelle US03 + US04, `docs/conception/openapi.yaml`.

## Contexte

Le pattern courant pour `POST /auth/register` consiste à renvoyer un JWT directement à la création de compte — *sign up + sign in en un*. C'est ce que la première version d'`openapi.yaml` prévoyait : `/register` renvoyait `{ data: { token, user } }`, identique à `/login`.

En séance 7, lors de l'implémentation back de US03, le référent technique a challengé ce choix sur un argument SRP (Single Responsibility Principle). La question : *l'endpoint qui crée un compte doit-il aussi authentifier ?* Le contrat API a été révisé avant l'écriture du `UserRegistrationService` et du `AuthController`. Cet ADR formalise la décision pour la traçabilité et la défense orale.

## Critères d'arbitrage

Pondération reprise de l'**ADR 0003**, par ordre de priorité décroissante :

1. **(a) Productivité immédiate** — livrer en 4 semaines.
2. **(e) Fit ADR** — cohérence avec ADR 0002 (JWT côté front via `localStorage`).
3. **(d) Pédagogie SOLID** — démontrer SRP, OCP.
4. **(c) Défendabilité à l'oral** — argument simple et tenable.
5. **(f) Réutilisable pro** — pattern transférable.
6. **(b) Apprentissage** — bonus.

## Options envisagées

| Option | Description | Avantages | Inconvénients |
|---|---|---|---|
| **A — Auto-login** | `/register` renvoie `{ data: { token, user } }`. Le user est connecté immédiatement. | UX fluide (1 saisie mdp en moins), pattern courant (Auth0, Firebase Auth) | `/register` cumule deux responsabilités (créer + authentifier) ; fragile face à toute évolution insérant une étape entre création et premier accès (vérif email, consentement RGPD) |
| **B — Pas d'auto-login** | `/register` renvoie `{ data: UserResponse }` (id, email, createdAt). Le user est redirigé vers `/login` pour s'authentifier explicitement. | SRP respecté ; extensible sans casse ; symétrique pour les usages cross-device | 1 saisie de mot de passe supplémentaire pour le user |

## Décision

**Option B — pas d'auto-login**. `/register` renvoie `201 Created` + `{ data: UserResponse }`. Aucun token n'est émis à cet endpoint.

## Justification

- **SRP** : `/register` a une seule responsabilité — créer un compte. L'authentification reste la responsabilité de `/login`. La séparation se reflète dans le code back : `UserRegistrationService` (création) et `LoginAuthenticator` (authentification, US04) sont deux unités indépendantes, testables séparément, mobilisant des dépendances disjointes (`UserPasswordHasherInterface` vs `JWTTokenManagerInterface`).
- **Extensibilité (OCP)** : si on ajoute en V2 une vérification d'email obligatoire ou un écran de consentement RGPD entre la création et le premier accès, l'auto-login devrait sauter — il est fragile **par construction**. La séparation rend l'ajout additif plutôt que conditionnel.
- **Symétrie cross-device** : un user qui crée un compte sur un appareil mais se connecte ensuite sur un autre n'a pas besoin de la session sur le premier. Auto-login crée une asymétrie qui n'a pas d'usage MVP.
- **Coût UX réel faible** : 1 redirection + 1 saisie de mot de passe (pas d'email à re-saisir si l'UI le pré-remplit). À mettre en regard du gain architectural.

## Conséquences

- **Contrat OpenAPI** : `/register` renvoie `{ data: UserResponse }`. Schéma `UserResponse` = `{ id (uuid), email, createdAt (ISO 8601) }`. Aligné depuis séance 7 dans `docs/conception/openapi.yaml`.
- **Front** : la `RegisterPage` redirige vers `/login` après un `201`, avec un `Callout` success affiché via `location.state.flashSuccess` (RR7 navigation state). Message type : « *Compte créé. Connecte-toi pour continuer.* »
- **Pas d'endpoint `/logout` côté serveur** : cohérent avec ADR 0002 D6 (logout = `localStorage.removeItem('token')` côté front). L'absence d'auto-login simplifie ce point — pas de session backend à invalider.
- **Tests back** : `AuthControllerRegisterTest::testNominalReturns201` vérifie que la réponse contient `data.id`, `data.email`, `data.createdAt` mais **ne contient pas** `data.token` (test de non-régression).

## Trade-off accepté — anti-énumération

`/register` renvoie un `409` explicite si l'email existe déjà (`type: https://datashare.fr/errors/email-already-exists`). Cela rompt la symétrie souhaitable avec `/login`, qui doit rester opaque (réponse identique pour « email inconnu » et « mauvais mot de passe ») afin de ne pas leaker l'existence d'un compte.

**Décision MVP** : on accepte le 409 explicite. Justifications :

- Pas d'infrastructure email transactionnel en MVP — la mitigation idéale (réponse 200 systématique + email « si ce n'est pas vous, ignorez ») n'est pas implémentable.
- Surface d'attaque limitée : DataShare est un MVP destiné à freelances et petites entreprises, pas une cible d'énumération massive.
- Mitigation MVP partielle disponible : rate limiter par IP sur `/register` (à instrumenter dans `SECURITY.md`).

**Mitigations V2 possibles** :

1. Email transactionnel sortant : `/register` renvoie toujours 202 ; un mail différencié est envoyé selon que l'email existe ou non.
2. Délai constant côté serveur (`time-equalizing`) sur la branche succès et la branche conflit, pour éviter les attaques par chronométrage.

À tracer dans `SECURITY.md`.

## Évolutions envisageables

- **V2** : vérification email obligatoire avant premier login (token signé envoyé par mail, endpoint `/auth/verify-email`).
- **V2** : si la vérif email est basculée *post-login* plutôt que *pré-login*, l'auto-login redevient compatible avec l'archi (mais reste un mauvais signal SRP).
- **V2** : consentements RGPD/CGU à la création.

## Préparation à l'oral

**Questions probables et réponses défendables :**

1. *« Pourquoi pas d'auto-login alors que c'est le pattern dominant ? »* — Cumuler création et authentification dans le même endpoint viole SRP. Plus important encore : si on insère un jour une vérif email entre les deux, l'auto-login devient incompatible. La séparation rend la roadmap V2 additive plutôt que cassante.

2. *« C'est pas une friction inutile pour le user ? »* — Coût marginal : une saisie de mot de passe sur un champ déjà mémorisé par le navigateur. Le gain architectural est supérieur au coût UX.

3. *« Comment gères-tu l'énumération d'emails sur /register ? »* — Trade-off MVP assumé : 409 explicite, pas d'infra mail. En V2, mitigation par email transactionnel + délai constant. Tracé dans `SECURITY.md`.

4. *« Pourquoi `/register` ne renvoie pas le user complet et un token comme Auth0 ? »* — Auth0 fait du SaaS d'authentification — son endpoint ne fait que ça, donc pas de problème SRP. Dans une app comme DataShare, `/register` est un endpoint applicatif parmi d'autres, et le service de création de compte est séparé du service d'authentification.

5. *« Qu'est-ce que ça change concrètement côté code ? »* — Le `UserRegistrationService` n'a aucune dépendance vers `JWTTokenManagerInterface`. Côté tests, on mocke deux ensembles de dépendances disjoints. Le jour où on remplace JWT par OAuth2, `UserRegistrationService` est zero-touch.
