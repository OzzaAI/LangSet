/**
 * E2E Test: Complete User Journey
 * Tests the full MVP flow: Onboard → Create session → Refine instances → Submit dataset → Accept offer
 */

describe('Complete User Journey - MVP Flow', () => {
  beforeEach(() => {
    // Reset database state for clean tests
    cy.task('resetDatabase')
    
    // Mock external services
    cy.intercept('GET', 'https://api.linkedin.com/**', {
      statusCode: 200,
      body: {
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john.doe@techcorp.com',
        headline: 'Senior Software Engineer',
        summary: 'Experienced in React, Node.js, and cloud architecture',
        positions: {
          values: [{
            title: 'Senior Software Engineer',
            company: { name: 'TechCorp Inc.' },
            summary: 'Led development of microservices architecture'
          }]
        }
      }
    }).as('linkedinProfile')
  })

  it('should complete full user journey successfully', () => {
    // Step 1: User Registration with LinkedIn OAuth
    cy.visit('/')
    cy.get('[data-testid="get-started-btn"]').click()
    
    cy.url().should('include', '/signup')
    cy.get('[data-testid="signup-with-linkedin"]').click()
    
    cy.wait('@linkedinProfile')
    
    // Should redirect to onboarding
    cy.url().should('include', '/onboarding')
    cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome, John!')
    
    // Verify extracted skills are displayed
    cy.get('[data-testid="extracted-skills"]').should('contain', 'React')
    cy.get('[data-testid="extracted-skills"]').should('contain', 'Node.js')
    
    // Complete onboarding
    cy.get('[data-testid="start-contributing-btn"]').click()
    cy.url().should('include', '/dashboard')

    // Step 2: Start Interview Session
    cy.get('[data-testid="new-interview-btn"]').click()
    cy.url().should('include', '/interview')
    
    cy.startInterviewSession()
    
    // Verify initial question is displayed
    cy.get('[data-testid="current-question"]')
      .should('contain', 'What technologies do you primarily work with')

    // Step 3: Complete Interview Questions
    const interviewAnswers = [
      'I primarily work with React and TypeScript for frontend development. I use Next.js for full-stack applications and have experience with server-side rendering, static site generation, and API routes. For state management, I use React Context API and Redux Toolkit when needed.',
      
      'For backend development, I use Node.js with Express.js and Fastify. I implement RESTful APIs and GraphQL endpoints. I work with PostgreSQL and MongoDB databases, and I use Prisma and Drizzle ORM for database operations.',
      
      'In terms of DevOps, I use Docker for containerization and deploy applications to AWS using ECS and Lambda. I set up CI/CD pipelines with GitHub Actions and manage infrastructure with Terraform. I also work with Kubernetes for orchestration in larger projects.',
      
      'For testing, I write unit tests with Jest and React Testing Library. I implement integration tests and use Cypress for end-to-end testing. I practice test-driven development and maintain high code coverage.',
      
      'I follow clean architecture principles and implement design patterns like Repository, Factory, and Observer. I use TypeScript for type safety and ESLint and Prettier for code quality. I practice code reviews and pair programming.'
    ]
    
    cy.completeInterviewQuestions(interviewAnswers)
    
    // Verify threshold is met and instances are generated
    cy.get('[data-testid="threshold-met-message"]')
      .should('contain', 'Great! We\'ve generated 10 high-quality instances')
    
    cy.get('[data-testid="view-generated-instances"]').click()

    // Step 4: Review and Refine Generated Instances
    cy.url().should('include', '/datasets/')
    
    // Verify instances are displayed
    cy.get('[data-testid="instance-card"]').should('have.length', 10)
    
    // Check quality scores
    cy.get('[data-testid="average-quality-score"]')
      .should('contain', '85') // Should be high quality
    
    // Refine a low-quality instance
    cy.get('[data-testid="instance-card"]').first().click()
    cy.get('[data-testid="edit-instance-btn"]').click()
    
    // Improve the answer
    const improvedAnswer = 'React hooks are functions that allow you to use state and lifecycle features in functional components. The most common hooks are useState for managing state and useEffect for side effects. Here\'s an example: \n\n```javascript\nimport { useState, useEffect } from \'react\';\n\nfunction UserProfile({ userId }) {\n  const [user, setUser] = useState(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetchUser(userId).then(userData => {\n      setUser(userData);\n      setLoading(false);\n    });\n  }, [userId]);\n\n  return loading ? <div>Loading...</div> : <div>{user.name}</div>;\n}\n```\n\nBest practices include: 1) Always include dependencies in useEffect, 2) Use custom hooks for reusable logic, 3) Avoid excessive re-renders by memoizing expensive computations with useMemo.'
    
    cy.get('[data-testid="answer-editor"]').clear().type(improvedAnswer)
    cy.get('[data-testid="save-instance-btn"]').click()
    
    // Verify quality score improved
    cy.get('[data-testid="quality-score"]').should('contain', '92')
    
    // Check for contradictions
    cy.get('[data-testid="check-contradictions-btn"]').click()
    cy.get('[data-testid="contradictions-result"]')
      .should('contain', 'No contradictions detected')

    // Step 5: Anonymization and Submission
    cy.get('[data-testid="submit-for-review-btn"]').click()
    
    // Anonymization consent dialog
    cy.get('[data-testid="anonymization-consent-modal"]').should('be.visible')
    cy.get('[data-testid="anonymize-companies-checkbox"]').check()
    cy.get('[data-testid="anonymize-persons-checkbox"]').check()
    cy.get('[data-testid="preserve-technical-terms-checkbox"]').check()
    
    // Review anonymization preview
    cy.get('[data-testid="anonymization-preview"]').should('be.visible')
    cy.get('[data-testid="preview-content"]')
      .should('contain', '[COMPANY_1]')
      .should('contain', 'React') // Technical terms preserved
      .should('not.contain', 'TechCorp')
    
    // Consent to submission
    cy.get('[data-testid="data-usage-consent"]').check()
    cy.get('[data-testid="commercial-use-consent"]').check()
    cy.get('[data-testid="confirm-submission-btn"]').click()
    
    cy.submitDataset('test-dataset-123')

    // Step 6: Track Submission Status
    cy.get('[data-testid="submission-success-message"]')
      .should('contain', 'Dataset submitted successfully')
    
    cy.get('[data-testid="submission-id"]').should('be.visible')
    
    // Wait for anonymization to complete
    cy.waitForAnonymization('test-dataset-123')
    
    cy.get('[data-testid="anonymization-complete-badge"]')
      .should('contain', 'Anonymization Complete')

    // Step 7: Review Marketplace Listing
    cy.visit('/marketplace')
    cy.get('[data-testid="my-datasets-tab"]').click()
    
    cy.get('[data-testid="dataset-card"]').should('contain', 'Professional Development Dataset')
    cy.get('[data-testid="dataset-status"]').should('contain', 'Under Review')
    
    // Check earnings potential
    cy.get('[data-testid="potential-earnings"]').should('be.visible')

    // Step 8: Simulate Dataset Approval and Sale
    // Mock admin approval
    cy.task('approveDataset', 'test-dataset-123')
    
    cy.reload()
    cy.get('[data-testid="dataset-status"]').should('contain', 'Available')
    
    // Mock a buyer purchase
    cy.task('simulatePurchase', {
      datasetId: 'test-dataset-123',
      buyerId: 'buyer-456',
      pricePerInstance: 2.50
    })
    
    // Check earnings dashboard
    cy.visit('/dashboard')
    cy.get('[data-testid="total-earnings"]').should('contain', '$25.00')
    cy.get('[data-testid="instances-sold"]').should('contain', '10')

    // Step 9: Quota and Subscription Management
    cy.checkQuotaStatus().then((quotaStatus) => {
      expect(quotaStatus.quota.current).to.equal(10)
      expect(quotaStatus.quota.remaining).to.equal(10)
      expect(quotaStatus.quota.tier).to.equal('basic')
    })
    
    // Test quota enforcement
    cy.get('[data-testid="new-interview-btn"]').click()
    cy.startInterviewSession()
    
    // Try to generate more instances (should hit quota)
    const moreAnswers = Array(15).fill('Additional answer to test quota limits')
    cy.completeInterviewQuestions(moreAnswers)
    
    cy.get('[data-testid="quota-exceeded-modal"]')
      .should('contain', 'Daily quota exceeded')
    
    // Test subscription upgrade
    cy.get('[data-testid="upgrade-subscription-btn"]').click()
    cy.get('[data-testid="pro-tier-card"]').click()
    cy.get('[data-testid="confirm-upgrade-btn"]').click()
    
    cy.get('[data-testid="subscription-success-message"]')
      .should('contain', 'Upgraded to Pro tier')

    // Step 10: Verify Data Privacy and Consent
    cy.visit('/privacy/my-data')
    
    // Verify consent logs
    cy.get('[data-testid="consent-log"]').should('be.visible')
    cy.get('[data-testid="consent-entry"]').should('contain', 'Data processing consent')
    cy.get('[data-testid="consent-entry"]').should('contain', 'Anonymization consent')
    
    // Verify data download capability
    cy.get('[data-testid="download-my-data-btn"]').click()
    cy.get('[data-testid="data-export-modal"]').should('be.visible')
    
    // Test data deletion request
    cy.get('[data-testid="delete-account-btn"]').click()
    cy.get('[data-testid="deletion-confirmation-modal"]').should('be.visible')
    cy.get('[data-testid="confirm-deletion-checkbox"]').check()
    cy.get('[data-testid="final-delete-btn"]').click()
    
    cy.get('[data-testid="deletion-scheduled-message"]')
      .should('contain', 'Account deletion scheduled')
  })

  it('should handle edge cases and errors gracefully', () => {
    // Test network failures
    cy.intercept('POST', '/api/interview/langgraph/start', {
      forceNetworkError: true
    }).as('networkError')
    
    cy.loginWithLinkedIn()
    cy.get('[data-testid="new-interview-btn"]').click()
    
    cy.get('[data-testid="error-message"]')
      .should('contain', 'Unable to start interview session')
    
    cy.get('[data-testid="retry-btn"]').should('be.visible')

    // Test quota limits
    cy.intercept('POST', '/api/billing/quota', {
      statusCode: 429,
      body: { error: 'Quota exceeded', remaining: 0 }
    }).as('quotaExceeded')
    
    cy.get('[data-testid="new-interview-btn"]').click()
    
    cy.get('[data-testid="quota-limit-modal"]')
      .should('contain', 'Daily limit reached')

    // Test anonymization failures
    cy.intercept('POST', '/api/datasets/*/anonymize', {
      statusCode: 500,
      body: { error: 'Anonymization service unavailable' }
    }).as('anonymizationError')
    
    // Create and submit dataset
    cy.task('createTestDataset', 'test-dataset-456')
    cy.submitDataset('test-dataset-456')
    
    cy.get('[data-testid="anonymization-error-message"]')
      .should('contain', 'Anonymization failed')
    cy.get('[data-testid="manual-review-notice"]')
      .should('contain', 'Dataset queued for manual review')
  })

  it('should respect ethical constraints and prevent abuse', () => {
    cy.loginWithLinkedIn()

    // Test PII redaction failure handling
    const piiAnswer = 'My name is John Smith and I work at Microsoft. My email is john.smith@microsoft.com and my phone is 555-123-4567.'
    
    cy.startInterviewSession()
    cy.get('[data-testid="answer-textarea"]').type(piiAnswer)
    cy.get('[data-testid="submit-answer-btn"]').click()
    
    // Should detect and warn about PII
    cy.get('[data-testid="pii-warning-modal"]')
      .should('contain', 'Personal information detected')
    
    cy.get('[data-testid="detected-pii-list"]')
      .should('contain', 'Email address')
      .should('contain', 'Phone number')
      .should('contain', 'Person name')
    
    // User should be able to revise
    cy.get('[data-testid="revise-answer-btn"]').click()
    
    const revisedAnswer = 'I work at a large technology company and have experience with cloud services and enterprise software development.'
    cy.get('[data-testid="answer-textarea"]').clear().type(revisedAnswer)
    cy.get('[data-testid="submit-answer-btn"]').click()
    
    cy.get('[data-testid="pii-warning-modal"]').should('not.exist')

    // Test content quality thresholds
    const lowQualityAnswer = 'Yes.'
    
    cy.get('[data-testid="answer-textarea"]').clear().type(lowQualityAnswer)
    cy.get('[data-testid="submit-answer-btn"]').click()
    
    cy.get('[data-testid="quality-warning-modal"]')
      .should('contain', 'Please provide more detail')

    // Test spam/abuse prevention
    const spamAnswer = 'Buy crypto now! Visit scam-site.com for amazing deals!'
    
    cy.get('[data-testid="answer-textarea"]').clear().type(spamAnswer)
    cy.get('[data-testid="submit-answer-btn"]').click()
    
    cy.get('[data-testid="content-violation-modal"]')
      .should('contain', 'Content may violate guidelines')

    // Test rate limiting
    for (let i = 0; i < 20; i++) {
      cy.get('[data-testid="submit-answer-btn"]').click()
    }
    
    cy.get('[data-testid="rate-limit-warning"]')
      .should('contain', 'Please slow down')
  })

  it('should maintain data integrity throughout the pipeline', () => {
    cy.loginWithLinkedIn()
    
    // Create a dataset with known content
    const testQuestion = 'How do you implement authentication in React applications?'
    const testAnswer = 'I implement authentication using JWT tokens stored in httpOnly cookies. I create a custom hook useAuth() that manages authentication state and provides login/logout functions.'
    
    cy.startInterviewSession()
    cy.get('[data-testid="answer-textarea"]').type(testAnswer)
    cy.get('[data-testid="submit-answer-btn"]').click()
    
    // Complete the interview
    cy.completeInterviewQuestions([testAnswer])
    
    // Navigate to dataset and verify content integrity
    cy.get('[data-testid="view-generated-instances"]').click()
    
    cy.get('[data-testid="instance-question"]')
      .should('contain', 'authentication')
      .should('contain', 'React')
    
    cy.get('[data-testid="instance-answer"]')
      .should('contain', 'JWT tokens')
      .should('contain', 'httpOnly cookies')
      .should('contain', 'useAuth()')
    
    // Submit for anonymization
    cy.submitDataset('test-dataset-789')
    cy.waitForAnonymization('test-dataset-789')
    
    // Verify content integrity after anonymization
    cy.get('[data-testid="anonymized-instance-answer"]')
      .should('contain', 'JWT tokens') // Technical terms preserved
      .should('contain', 'httpOnly cookies')
      .should('contain', 'useAuth()')
      .should('not.contain', 'TechCorp') // Company names anonymized
    
    // Verify in marketplace
    cy.visit('/marketplace')
    cy.get('[data-testid="dataset-preview"]').click()
    
    cy.get('[data-testid="sample-instance"]')
      .should('contain', 'JWT tokens')
      .should('not.contain', 'john@')
  })
})