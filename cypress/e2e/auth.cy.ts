describe('Auth API (Cypress)', () => {
  const base = 'http://localhost:3000'

  it('signup success', () => {
    cy.request({
      method: 'POST',
      url: `${base}/api/auth/signup`,
      body: { email: 'new@example.com', password: 'secret' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.equal(200)
      expect(res.body.user).to.deep.equal({ id: 'uid999', email: 'new@example.com' })
    })
  })

  it('signup duplicate user returns 400', () => {
    cy.request({
      method: 'POST',
      url: `${base}/api/auth/signup`,
      body: { email: 'exists@example.com', password: 'secret' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.equal(400)
      expect(res.body.error).to.match(/already/i)
    })
  })

  it('login success', () => {
    cy.request({
      method: 'POST',
      url: `${base}/api/auth/login`,
      body: { email: 'user@example.com', password: 'correct' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.equal(200)
      expect(res.body.user).to.deep.equal({ id: 'uid123', email: 'user@example.com' })
    })
  })

  it('login invalid credentials returns 401', () => {
    cy.request({
      method: 'POST',
      url: `${base}/api/auth/login`,
      body: { email: 'user@example.com', password: 'wrong' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.equal(401)
      expect(res.body.error).to.match(/invalid/i)
    })
  })

  it('logout success', () => {
    cy.request({
      method: 'POST',
      url: `${base}/api/auth/logout`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.equal(200)
      expect(res.body).to.deep.equal({ ok: true })
    })
  })
})
