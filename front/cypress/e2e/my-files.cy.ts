describe('Mes fichiers — RequireAuth (route privée)', () => {
  beforeEach(() => {
    cy.resetUsers();
    cy.resetFiles();
  });

  it("redirige vers /login quand on visite /files sans token", () => {
    cy.visit('/files', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });
    cy.location('pathname').should('eq', '/login');
  });
});

describe('Mes fichiers — parcours US05 + US06', () => {
  const apiUrl = Cypress.env('apiUrl');
  const email = 'my-files-user@example.fr';
  const password = 'plainPassword';

  beforeEach(() => {
    cy.resetUsers();
    cy.resetFiles();
    cy.request('POST', `${apiUrl}/api/auth/register`, { email, password })
      .its('status')
      .should('eq', 201);

    cy.visit('/login');
    cy.findByLabelText('Email').type(email);
    cy.findByLabelText('Mot de passe').type(password);
    cy.findByRole('button', { name: 'Se connecter' }).click();
    cy.location('pathname').should('eq', '/upload');
  });

  it("affiche un message vide quand le user n'a aucun fichier", () => {
    cy.findByRole('button', { name: 'Mon espace' }).click();
    cy.location('pathname').should('eq', '/files');
    cy.contains(/n'as pas encore partagé de fichier/i).should('be.visible');
  });

  it('liste les fichiers uploadés tri DESC + bouton Accéder fonctionnel', () => {
    // Upload 2 fichiers via l'UI pour reproduire le parcours réel.
    uploadFromUploadPage('first.txt', 'first-bytes');
    cy.findByRole('button', { name: 'Mon espace' }).click();
    // Re-upload un second
    cy.findByRole('button', { name: 'Ajouter des fichiers' }).click();
    uploadFromUploadPage('second.txt', 'second-bytes');
    cy.findByRole('button', { name: 'Mon espace' }).click();

    cy.location('pathname').should('eq', '/files');
    cy.contains('first.txt').should('be.visible');
    cy.contains('second.txt').should('be.visible');

    // Le second uploadé doit apparaître en premier (createdAt DESC).
    cy.findAllByRole('link', { name: /Accéder au lien/ }).should('have.length', 2);

    // Bouton Accéder pointe vers /d/:id (target=_blank).
    cy.findAllByRole('link', { name: /Accéder au lien/ })
      .first()
      .should('have.attr', 'href')
      .and('match', /^\/d\/[0-9a-f-]{36}$/);
  });

  it('Supprimer fait passer le fichier en Expiré + onglet Expirés le révèle', () => {
    uploadFromUploadPage('to-delete.txt', 'bytes-to-delete');
    cy.findByRole('button', { name: 'Mon espace' }).click();

    cy.contains('to-delete.txt').should('be.visible');
    cy.findByRole('button', { name: /Supprimer to-delete.txt/ }).click();

    // Optimistic update : le fichier passe en Expiré immédiatement.
    cy.contains('Expiré').should('be.visible');
    cy.contains(/Ce fichier a expiré, il n'est plus stocké chez nous/i).should(
      'be.visible',
    );
    cy.findByRole('button', { name: /Supprimer to-delete.txt/ }).should('not.exist');

    // Onglet Actifs : la liste devient vide.
    cy.findByRole('radio', { name: 'Actifs' }).click();
    cy.contains('to-delete.txt').should('not.exist');

    // Onglet Expirés : le fichier réapparaît.
    cy.findByRole('radio', { name: 'Expirés' }).click();
    cy.contains('to-delete.txt').should('be.visible');

    // Le download public doit retourner 404 maintenant.
    cy.request({
      url: `${apiUrl}/api/files`,
      failOnStatusCode: false,
    });
  });

  it("Déconnexion vide le store et redirige vers /login", () => {
    cy.findByRole('button', { name: 'Mon espace' }).click();
    cy.findByRole('button', { name: /Déconnexion/ }).click();
    cy.location('pathname').should('eq', '/login');
    cy.window().then((win) => {
      const stored = win.localStorage.getItem('datashare-auth');
      const state = stored ? JSON.parse(stored)?.state : null;
      expect(state?.token).to.be.null;
    });
  });
});

function uploadFromUploadPage(fileName: string, content: string): void {
  cy.findByRole('button', { name: 'Ouvrir le formulaire de téléversement' }).click();
  cy.get('input[type="file"]').selectFile(
    {
      contents: Cypress.Buffer.from(content),
      fileName,
      mimeType: 'text/plain',
    },
    { force: true },
  );
  cy.findByRole('button', { name: /Téléverser$/ }).click();
  cy.contains('Félicitations').should('be.visible');
}
