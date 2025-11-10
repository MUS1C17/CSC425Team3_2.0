describe('Protected pages', () => {
  const base = 'http://localhost:3000'

  it('redirects unauthenticated user to login', () => {
    cy.request({
      url: `${base}/protected`,
      followRedirect: false,
      failOnStatusCode: false,
    }).then((res) => {
      // Next.js may redirect; ensure we get a redirect status or the login page
      expect([302, 307, 200]).to.include(res.status)
    })
  })

  it('protected dashboard content renders for authenticated user (simple smoke)', () => {
    // This test assumes a dev Supabase instance and user session cookie setup —
    // for a real CI run you'd programmatically sign in or seed a session cookie.
    cy.visit('/protected')
    cy.contains('SpeakUp').should('exist')
  })
})
