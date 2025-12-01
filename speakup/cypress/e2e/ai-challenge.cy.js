describe('AI challenge workflow', () => {
  beforeEach(() => {
    cy.intercept('POST', '/ai/generateChallenge', {
      statusCode: 200,
      body: {
        submissionId: 'stub-1',
        challenge: {
          question: 'Stubbed AI question?',
          idealAnswer: 'Stubbed ideal answer',
          whyItMatters: 'Because testing',
          difficulty: 'easy',
          coachTip: 'Keep it short',
        },
        promptTemplate: 'template',
      },
    }).as('generateChallenge')

    cy.intercept('POST', '/ai/submitForFeedback', {
      statusCode: 200,
      body: {
        submissionId: 'stub-1',
        feedback: {
          verdict: 'almost',
          strength: 'Nice start',
          gap: 'Needs detail',
          improve: 'Add one example',
        },
        promptTemplate: 'feedback-template',
      },
    }).as('submitFeedback')

    cy.visit('http://localhost:3000/groups/1/sessions/1/qna', { timeout: 20000 })
  })

  it('generates a challenge, accepts an answer, and shows feedback', () => {
    cy.get('[data-cy="ai-challenge-button"]').should('be.visible').click({ force: true })
    cy.wait('@generateChallenge')
    cy.get('[data-cy="ai-challenge-modal"]').should('be.visible')
    cy.get('[data-cy="ai-answer-input"]').type('Here is my take', { force: true })
    cy.get('[data-cy="ai-submit-answer"]').click({ force: true })
    cy.wait('@submitFeedback')
    cy.get('[data-cy="ai-feedback"]').should('contain.text', 'Verdict')
    cy.get('[data-cy="ai-history-row"]').first().should('be.visible')
  })
})
