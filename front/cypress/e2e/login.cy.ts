describe('Login + parcours complet', () => {
  const apiUrl = Cypress.env('apiUrl');
  const email = 'login-user@example.fr';
  const password = 'plainPassword';

  beforeEach(() => {
    cy.resetUsers();
    cy.request('POST', `${apiUrl}/api/auth/register`, { email, password })
      .its('status')
      .should('eq', 201);
  });

  describe('Parcours OK', () => {
    it('connecte un utilisateur existant et redirige vers /upload', () => {
      cy.visit('/login');
      cy.findByLabelText('Email').type(email);
      cy.findByLabelText('Mot de passe').type(password);
      cy.findByRole('button', { name: 'Se connecter' }).click();

      cy.location('pathname').should('eq', '/upload');
      cy.contains('Téléversement').should('be.visible');
      cy.contains(`Connecté en tant que ${email}`).should('be.visible');
    });

    it('persiste la session après reload puis permet le logout', () => {
      cy.visit('/login');
      cy.findByLabelText('Email').type(email);
      cy.findByLabelText('Mot de passe').type(password);
      cy.findByRole('button', { name: 'Se connecter' }).click();
      cy.location('pathname').should('eq', '/upload');

      cy.reload();
      cy.location('pathname').should('eq', '/upload');
      cy.contains(`Connecté en tant que ${email}`).should('be.visible');

      cy.findByRole('button', { name: 'Se déconnecter' }).click();
      cy.location('pathname').should('eq', '/login');
      cy.window().its('localStorage').invoke('getItem', 'datashare-auth')
        .then((raw) => {
          const parsed = JSON.parse(raw ?? '{}');
          expect(parsed.state?.token, 'token cleared').to.be.null;
        });
    });

    it('parcours bout-en-bout : création de compte → connexion → /upload', () => {
      cy.resetUsers();
      const newEmail = 'new-user@example.fr';

      cy.visit('/register');
      cy.findByLabelText('Email').type(newEmail);
      cy.findByLabelText('Mot de passe').type(password);
      cy.findByLabelText('Vérification du mot de passe').type(password);
      cy.findByRole('button', { name: 'Créer un compte' }).click();

      cy.location('pathname').should('eq', '/login');
      cy.contains('Compte créé. Connecte-toi pour continuer.').should('be.visible');

      cy.findByLabelText('Email').type(newEmail);
      cy.findByLabelText('Mot de passe').type(password);
      cy.findByRole('button', { name: 'Se connecter' }).click();

      cy.location('pathname').should('eq', '/upload');
      cy.contains(`Connecté en tant que ${newEmail}`).should('be.visible');
    });
  });

  describe('Parcours KO 401', () => {
    beforeEach(() => {
      cy.intercept('POST', '**/api/auth/login').as('loginCall');
    });

    it("affiche un Callout error sur mot de passe incorrect", () => {
      cy.visit('/login');
      cy.findByLabelText('Email').type(email);
      cy.findByLabelText('Mot de passe').type('wrongPassword');
      cy.findByRole('button', { name: 'Se connecter' }).click();

      cy.wait('@loginCall').its('response.statusCode').should('eq', 401);
      cy.contains('Email ou mot de passe incorrect.').should('be.visible');
      cy.location('pathname').should('eq', '/login');
    });

    it("affiche le même message générique pour un user inconnu (anti-énumération)", () => {
      cy.visit('/login');
      cy.findByLabelText('Email').type('unknown@example.fr');
      cy.findByLabelText('Mot de passe').type('whatever');
      cy.findByRole('button', { name: 'Se connecter' }).click();

      cy.wait('@loginCall').its('response.statusCode').should('eq', 401);
      cy.contains('Email ou mot de passe incorrect.').should('be.visible');
    });
  });
});
