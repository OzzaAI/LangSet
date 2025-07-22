/// <reference types="cypress" />

// Custom commands for LangSet E2E testing
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with OAuth (mock)
       * @example cy.loginWithLinkedIn()
       */
      loginWithLinkedIn(): Chainable<Element>

      /**
       * Custom command to login with email/password
       * @example cy.loginWithEmail('user@example.com', 'password123')
       */
      loginWithEmail(email: string, password: string): Chainable<Element>

      /**
       * Custom command to create a test user
       * @example cy.createTestUser({ email: 'test@example.com', name: 'Test User' })
       */
      createTestUser(userData: { email: string; name: string; password?: string }): Chainable<any>

      /**
       * Custom command to start an interview session
       * @example cy.startInterviewSession()
       */
      startInterviewSession(): Chainable<Element>

      /**
       * Custom command to complete interview questions
       * @example cy.completeInterviewQuestions(['answer1', 'answer2'])
       */
      completeInterviewQuestions(answers: string[]): Chainable<Element>

      /**
       * Custom command to submit dataset for review
       * @example cy.submitDataset('dataset-123')
       */
      submitDataset(datasetId: string): Chainable<Element>

      /**
       * Custom command to check quota status
       * @example cy.checkQuotaStatus()
       */
      checkQuotaStatus(): Chainable<any>

      /**
       * Custom command to mock LLM responses
       * @example cy.mockLLMResponse('interview', 'What technologies do you use?')
       */
      mockLLMResponse(endpoint: string, response: string): Chainable<Element>

      /**
       * Custom command to wait for anonymization to complete
       * @example cy.waitForAnonymization('dataset-123')
       */
      waitForAnonymization(datasetId: string): Chainable<Element>
    }
  }
}

// Login commands
Cypress.Commands.add('loginWithLinkedIn', () => {
  cy.intercept('POST', '/api/auth/callback/linkedin', {
    statusCode: 200,
    body: {
      user: {
        id: 'test-user-123',
        email: 'test@langset.dev',
        name: 'Test User',
        linkedinProfile: {
          headline: 'Software Engineer',
          skills: ['JavaScript', 'React', 'Node.js']
        }
      },
      session: {
        sessionToken: 'mock-session-token'
      }
    }
  }).as('linkedinCallback')

  cy.visit('/login')
  cy.get('[data-testid="linkedin-login-btn"]').click()
  cy.wait('@linkedinCallback')
  cy.url().should('include', '/dashboard')
})

Cypress.Commands.add('loginWithEmail', (email: string, password: string) => {
  cy.intercept('POST', '/api/auth/sign-in', {
    statusCode: 200,
    body: {
      user: {
        id: 'test-user-123',
        email: email,
        name: 'Test User'
      },
      session: {
        sessionToken: 'mock-session-token'
      }
    }
  }).as('emailLogin')

  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-submit-btn"]').click()
  cy.wait('@emailLogin')
  cy.url().should('include', '/dashboard')
})

// User management commands
Cypress.Commands.add('createTestUser', (userData) => {
  cy.request({
    method: 'POST',
    url: '/api/test/create-user',
    body: userData
  }).then((response) => {
    expect(response.status).to.eq(200)
    return cy.wrap(response.body)
  })
})

// Interview workflow commands
Cypress.Commands.add('startInterviewSession', () => {
  cy.intercept('POST', '/api/interview/langgraph/start', {
    statusCode: 200,
    body: {
      sessionId: 'test-session-123',
      question: 'What technologies do you primarily work with in your current role?',
      status: 'active'
    }
  }).as('startSession')

  cy.visit('/interview')
  cy.get('[data-testid="start-interview-btn"]').click()
  cy.wait('@startSession')
})

Cypress.Commands.add('completeInterviewQuestions', (answers: string[]) => {
  answers.forEach((answer, index) => {
    cy.intercept('POST', '/api/interview/langgraph/answer', {
      statusCode: 200,
      body: {
        nextQuestion: index < answers.length - 1 
          ? `Follow-up question ${index + 2}?` 
          : null,
        thresholdMet: index === answers.length - 1,
        instancesGenerated: index === answers.length - 1 ? 10 : 0
      }
    }).as(`submitAnswer${index}`)

    cy.get('[data-testid="answer-textarea"]').clear().type(answer)
    cy.get('[data-testid="submit-answer-btn"]').click()
    cy.wait(`@submitAnswer${index}`)

    if (index < answers.length - 1) {
      cy.get('[data-testid="next-question"]').should('be.visible')
    }
  })
})

// Dataset management commands
Cypress.Commands.add('submitDataset', (datasetId: string) => {
  cy.intercept('POST', `/api/datasets/${datasetId}/submit`, {
    statusCode: 200,
    body: {
      submissionId: 'submission-123',
      status: 'processing',
      anonymizationStarted: true
    }
  }).as('submitDataset')

  cy.visit(`/datasets/${datasetId}`)
  cy.get('[data-testid="submit-dataset-btn"]').click()
  
  // Consent dialog
  cy.get('[data-testid="consent-checkbox"]').check()
  cy.get('[data-testid="confirm-submit-btn"]').click()
  cy.wait('@submitDataset')
})

// Quota and billing commands
Cypress.Commands.add('checkQuotaStatus', () => {
  cy.request({
    method: 'GET',
    url: '/api/billing/quota?includeEarnings=true'
  }).then((response) => {
    expect(response.status).to.eq(200)
    return cy.wrap(response.body)
  })
})

// Mock and testing utilities
Cypress.Commands.add('mockLLMResponse', (endpoint: string, response: string) => {
  cy.intercept('POST', `**/${endpoint}`, {
    statusCode: 200,
    body: { content: response }
  }).as(`mock${endpoint}`)
})

Cypress.Commands.add('waitForAnonymization', (datasetId: string) => {
  cy.intercept('GET', `/api/datasets/${datasetId}/anonymization-status`, {
    statusCode: 200,
    body: { status: 'completed', anonymizedInstances: 10, piiRemoved: 15 }
  }).as('anonymizationComplete')

  // Poll for completion
  const checkStatus = () => {
    cy.request(`/api/datasets/${datasetId}/anonymization-status`).then((response) => {
      if (response.body.status === 'processing') {
        cy.wait(2000).then(checkStatus)
      }
    })
  }

  checkStatus()
  cy.wait('@anonymizationComplete')
})

// Global error handling
Cypress.on('uncaught:exception', (err) => {
  // Ignore specific errors that don't affect test functionality
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  return true
})