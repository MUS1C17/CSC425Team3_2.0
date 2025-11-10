describe('Testing login form', () => {
    beforeEach(() => {
        cy.visit('localhost:3001/auth/login', { timeout: 6000 });
    });

    it('Tests login with valid credentials', () => {
        cy.log('Login into automation user');
        cy.get('[data-cy="emailInput"]').type('automation@example.com', { force: true });
        cy.get('[data-cy="passwordInput"]').type('automation', { force: true });
        cy.get('[data-cy="loginButton"]').click({ force: true });
        cy.url().should('eq', 'http://localhost:3001/protected', { timeout: 10000 });

        cy.log('Create new group');
        cy.get('[data-cy="createGroupButton"]').click({ force: true });
        cy.get('[data-cy="groupNameInput"]').type('Automation Test' + Date.now(), { force: true });
        cy.get('[data-cy="descriptionTextArea"]').type('This group was created during automation test. It is absolutely safe to delete.', { force: true });
        cy.get('[data-cy="createGroupButton"]').click({ force: true });

        cy.log('Verify success message shows up');
        cy.get('[data-cy="groupCreatedMessage"]', { timeout: 6000 }).contains('Group created! Share code').should('be.visible');
    });
});