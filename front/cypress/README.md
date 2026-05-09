# Tests E2E (Cypress)

## Pré-requis pour exécution locale

Trois services doivent tourner en parallèle :

1. **Back Symfony en environnement test**, sur la base `datashare_test` :
   ```sh
   cd api
   APP_ENV=test symfony server:start --port=8000 --no-tls
   ```
   La table `users` est vidée par Cypress entre tests via `POST /test/users/reset`
   (endpoint chargé uniquement quand `APP_ENV=test`, 404 sinon).

2. **Front Vite** :
   ```sh
   cd front
   npm run dev
   ```
   `front/.env.local` doit contenir `VITE_API_URL=http://127.0.0.1:8000`
   (ou ajuster `cypress.config.ts` `env.apiUrl` si autre port).

3. **Cypress** :
   ```sh
   cd front
   npm run e2e:open    # mode interactif (recommandé pour développer)
   npm run e2e:run     # mode headless (CI)
   ```

## Périmètre actuel

- `register.cy.ts` — scénarios **KO** uniquement (validation client + 409 email pris).
- Scénarios **OK** (création + connexion + arrivée sur l'espace) seront ajoutés
  une fois US04 (login) implémentée.

## Architecture

- `cypress/support/commands.ts` — commande custom `cy.resetUsers()` qui POST
  vers l'endpoint test-only Symfony.
- `cypress/support/e2e.ts` — entrypoint chargé avant chaque spec, importe
  `@testing-library/cypress` (queries `findByLabelText`, `findByRole` cohérentes
  avec les tests Vitest).
- `cypress.config.ts` — `baseUrl: http://localhost:5173`, `env.apiUrl` pour le back.
