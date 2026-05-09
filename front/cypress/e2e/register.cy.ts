describe('Register — scénarios KO', () => {
  beforeEach(() => {
    cy.resetUsers();
    cy.visit('/register');
  });

  describe('Validation client (aucun appel back)', () => {
    beforeEach(() => {
      cy.intercept('POST', '**/api/auth/register').as('registerCall');
    });

    it('affiche les 3 erreurs requises quand le formulaire est vide', () => {
      cy.findByRole('button', { name: 'Créer un compte' }).click();

      cy.contains("L'email est obligatoire.").should('be.visible');
      cy.contains('Le mot de passe est obligatoire.').should('be.visible');
      cy.contains('La confirmation est obligatoire.').should('be.visible');
      cy.get('@registerCall.all').should('have.length', 0);
    });

    it("affiche une erreur de format quand l'email est malformé", () => {
      cy.findByLabelText('Email').type('not-an-email');
      cy.findByLabelText('Mot de passe').type('longenough');
      cy.findByLabelText('Vérification du mot de passe').type('longenough');
      cy.findByRole('button', { name: 'Créer un compte' }).click();

      cy.contains("Format d'email invalide.").should('be.visible');
      cy.get('@registerCall.all').should('have.length', 0);
    });

    it('affiche une erreur quand le mot de passe est trop court', () => {
      cy.findByLabelText('Email').type('foo@bar.fr');
      cy.findByLabelText('Mot de passe').type('short');
      cy.findByLabelText('Vérification du mot de passe').type('short');
      cy.findByRole('button', { name: 'Créer un compte' }).click();

      cy.contains(/au moins 8 caractères/).should('be.visible');
      cy.get('@registerCall.all').should('have.length', 0);
    });

    it("affiche une erreur quand la confirmation diffère du mot de passe", () => {
      cy.findByLabelText('Email').type('foo@bar.fr');
      cy.findByLabelText('Mot de passe').type('longenough');
      cy.findByLabelText('Vérification du mot de passe').type('different1');
      cy.findByRole('button', { name: 'Créer un compte' }).click();

      cy.contains('Les deux mots de passe ne correspondent pas.').should('be.visible');
      cy.get('@registerCall.all').should('have.length', 0);
    });
  });

  describe('Conflit email (409)', () => {
    it("affiche un Callout error et marque le champ quand l'email est déjà pris", () => {
      const apiUrl = Cypress.env('apiUrl');
      const email = 'taken@example.fr';

      cy.request('POST', `${apiUrl}/api/auth/register`, {
        email,
        password: 'plainPassword',
      })
        .its('status')
        .should('eq', 201);

      cy.findByLabelText('Email').type(email);
      cy.findByLabelText('Mot de passe').type('plainPassword');
      cy.findByLabelText('Vérification du mot de passe').type('plainPassword');
      cy.findByRole('button', { name: 'Créer un compte' }).click();

      cy.contains(/Un compte avec cet email existe déjà/).should('be.visible');
      cy.findByLabelText('Email').should('have.attr', 'aria-invalid', 'true');
      cy.location('pathname').should('eq', '/register');
    });
  });
});
