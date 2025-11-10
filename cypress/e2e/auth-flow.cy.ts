describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000')
  })

  it('should sign up a new user', () => {
    cy.visit('/auth/sign-up')
    cy.get('input[name="email"]').type(`test${Date.now()}@example.com`)
    cy.get('input[name="password"]').type('testPassword123!')
    cy.get('input[name="first_name"]').type('Test')
    cy.get('input[name="last_name"]').type('User')
    cy.get('form').submit()
    cy.url().should('include', '/auth/sign-up-success')
  })

  it('should login an existing user', () => {
    cy.visit('/auth/login')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('testPassword123!')
    cy.get('form').submit()
    cy.url().should('include', '/protected')
  })

  it('should protect routes when not authenticated', () => {
    cy.visit('/protected')
    cy.url().should('include', '/auth/login')
  })
})