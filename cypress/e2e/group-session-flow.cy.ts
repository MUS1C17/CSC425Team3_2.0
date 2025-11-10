describe('Group and Session Flow', () => {
  // Test user credentials
  const email = `test${Date.now()}@example.com`;
  const password = 'testPassword123!';
  const firstName = 'Test';
  const lastName = 'User';

  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should create a group and manage sessions', () => {
    // Sign up
    cy.visit('/auth/sign-up');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="first_name"]').type(firstName);
    cy.get('input[name="last_name"]').type(lastName);
    cy.get('form').submit();
    cy.url().should('include', '/auth/sign-up-success');

    // Login
    cy.visit('/auth/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('form').submit();
    cy.url().should('include', '/protected');

    // Create a group
    cy.visit('/groups/new');
    cy.get('input[name="name"]').type('Test Group');
    cy.get('input[name="description"]').type('Test Group Description');
    cy.get('form').submit();
    cy.url().should('match', /\/groups\/[\w-]+$/);

    // Create a session
    cy.contains('Create Session').click();
    cy.get('input[name="title"]').type('Test Session');
    cy.get('input[name="startTime"]').type('2024-01-01T10:00');
    cy.get('form').submit();
    cy.url().should('match', /\/sessions\/[\w-]+$/);

    // Ask a question
    cy.contains('Ask Question').click();
    cy.get('input[name="content"]').type('Test Question');
    cy.get('form').submit();
    cy.contains('Test Question').should('be.visible');

    // Verify progress bar updates
    cy.get('[role="progressbar"]').should('exist');
  });
});