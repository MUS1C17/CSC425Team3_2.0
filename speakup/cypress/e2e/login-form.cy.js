describe('Testing login form', () => {
    beforeEach(() => {
        cy.visit('localhost:3000/auth/login', {timeout: 10000});
});

     it('Render login page', () => {
        cy.log('Navigate to the login page and render all the elements');
        cy.get('[data-cy="emailLabel"]').contains('Email').should('be.visible');
        cy.get('[data-cy="emailInput"]').should('be.visible').and('have.attr', 'required');
        cy.get('[data-cy="passwordLabel"]').contains('Password').should('be.visible');
        cy.get('[data-cy="passwordInput"]').should('be.visible').and('have.attr', 'required');
        cy.get('[data-cy="loginButton"]').contains('Sign In').should('be.visible');
        cy.get('[data-cy="continueWithGoogleButton"]').contains('Continue with Google').should('be.visible');
        cy.get('[data-cy="signUpLink"]').contains('Create account').should('be.visible');
        cy.get('[data-cy="forgotPasswordLink"]').contains('Forgot password?').should('be.visible');
    });

    it('Tests login with unvalid credentials', () => {
        cy.log('Navigate to the login page and enter invalid credentials');
        cy.get('[data-cy="emailInput"]').type('invalidEmail@email.com', {force: true});
        cy.get('[data-cy="passwordInput"]').type('invalidPassword', {force: true});
        cy.get('[data-cy="loginButton"]').click({force: true})

        cy.log('Verify error message shows up');
        cy.get('[data-cy="errorMessage"]').contains('Invalid login credentials').should('be.visible')
    });

     it('Tests login with valid credentials', () => {
        cy.log('Navigate to the login page and enter invalid credentials');
        cy.get('[data-cy="emailInput"]').type('automation@example.com', {force: true});
        cy.get('[data-cy="passwordInput"]').type('automation', {force: true});
        cy.get('[data-cy="loginButton"]').click({force: true});
        cy.url().should('eq', 'http://localhost:3000/protected', {timeout: 10000});
    });
});
