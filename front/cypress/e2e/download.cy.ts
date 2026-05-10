describe('Download — parcours US02', () => {
  const apiUrl = Cypress.env('apiUrl');
  const email = 'download-user@example.fr';
  const password = 'plainPassword';

  beforeEach(() => {
    cy.resetUsers();
    cy.resetFiles();
  });

  it('expose les métadonnées et permet de télécharger un fichier partagé sans être connecté', () => {
    // Étape 1 : créer un compte + uploader un fichier via l'UI, puis capturer
    // l'URL de partage générée.
    cy.request('POST', `${apiUrl}/api/auth/register`, { email, password })
      .its('status')
      .should('eq', 201);

    cy.visit('/login');
    cy.findByLabelText('Email').type(email);
    cy.findByLabelText('Mot de passe').type(password);
    cy.findByRole('button', { name: 'Se connecter' }).click();
    cy.location('pathname').should('eq', '/upload');

    cy.findByRole('button', { name: 'Ouvrir le formulaire de téléversement' }).click();
    cy.fixture('sample.txt', null).then((fileContent) => {
      cy.get('input[type="file"]').selectFile(
        {
          contents: fileContent,
          fileName: 'sample.txt',
          mimeType: 'text/plain',
        },
        { force: true },
      );
    });
    cy.findByRole('button', { name: /Téléverser$/ }).click();

    cy.contains('a', /\/d\/[0-9a-f-]{36}$/)
      .invoke('attr', 'href')
      .then((shareUrl) => {
        expect(shareUrl, 'share URL').to.be.a('string');

        // Étape 2 : visiter le lien de partage en simulant un destinataire
        // anonyme (vide localStorage → pas de JWT).
        cy.clearLocalStorage();
        cy.visit(shareUrl as string);

        const fileId = (shareUrl as string).split('/d/')[1];

        cy.contains('Télécharger un fichier').should('be.visible');
        cy.contains('sample.txt').should('be.visible');

        cy.findByRole('link', { name: /Télécharger/ })
          .should('have.attr', 'href')
          .and('match', new RegExp(`/api/share/${fileId}/download$`));

        // CTA droit du header = "Se connecter" (destinataire anonyme).
        cy.findByRole('button', { name: 'Se connecter' }).should('be.visible');
      });
  });

  it('affiche un message "lien invalide" pour un token inexistant', () => {
    const unknownToken = '00000000-0000-4000-8000-000000000000';
    cy.visit(`/d/${unknownToken}`);

    cy.contains(/lien est invalide ou le fichier n'est plus disponible/i).should(
      'be.visible',
    );
    cy.findByRole('link', { name: /Télécharger/ }).should('not.exist');
  });
});
