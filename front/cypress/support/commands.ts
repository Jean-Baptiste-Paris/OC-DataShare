declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Vide la table users côté back via l'endpoint test-only
       * POST /test/users/reset (chargé uniquement quand APP_ENV=test).
       */
      resetUsers(): Chainable<void>;

      /**
       * Vide la table files et le dossier de stockage test côté back via
       * POST /test/files/reset (chargé uniquement quand APP_ENV=test).
       */
      resetFiles(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('resetUsers', () => {
  const apiUrl = Cypress.env('apiUrl');
  cy.request('POST', `${apiUrl}/test/users/reset`);
});

Cypress.Commands.add('resetFiles', () => {
  const apiUrl = Cypress.env('apiUrl');
  cy.request('POST', `${apiUrl}/test/files/reset`);
});

export {};
