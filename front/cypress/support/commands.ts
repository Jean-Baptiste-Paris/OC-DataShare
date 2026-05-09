declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Vide la table users côté back via l'endpoint test-only
       * POST /test/users/reset (chargé uniquement quand APP_ENV=test).
       */
      resetUsers(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('resetUsers', () => {
  const apiUrl = Cypress.env('apiUrl');
  cy.request('POST', `${apiUrl}/test/users/reset`);
});

export {};
