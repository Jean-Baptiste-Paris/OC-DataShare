describe('Upload — parcours US01', () => {
  const apiUrl = Cypress.env('apiUrl');
  const email = 'upload-user@example.fr';
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

  it('téléverse un fichier valide et affiche le lien de partage', () => {
    cy.intercept('POST', '**/api/files').as('uploadCall');

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

    cy.contains('sample.txt').should('be.visible');
    cy.findByRole('button', { name: /Téléverser$/ }).click();

    cy.wait('@uploadCall').its('response.statusCode').should('eq', 201);

    cy.contains('Félicitations').should('be.visible');
    cy.findByRole('button', { name: /Copier le lien/ }).should('be.visible');
    cy.contains('a', /\/d\/[0-9a-f-]{36}$/).should('be.visible');
  });

  it("rejette une extension blacklistée côté client (pas d'appel API)", () => {
    cy.intercept('POST', '**/api/files').as('uploadCall');

    cy.findByRole('button', { name: 'Ouvrir le formulaire de téléversement' }).click();

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('arbitrary bytes'),
        fileName: 'malware.exe',
        mimeType: 'application/octet-stream',
      },
      { force: true },
    );

    cy.contains(/\.exe.*pas autorisé/i).should('be.visible');

    cy.get('@uploadCall.all').should('have.length', 0);
  });
});
