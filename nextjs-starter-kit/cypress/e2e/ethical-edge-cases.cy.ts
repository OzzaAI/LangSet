/**
 * E2E Test: Ethical Edge Cases and Security
 * Tests ethical constraints, PII handling, and security edge cases
 */

describe('Ethical Edge Cases and Security Tests', () => {
  beforeEach(() => {
    cy.task('resetDatabase')
    cy.loginWithLinkedIn()
  })

  describe('PII Detection and Prevention', () => {
    it('should detect and prevent submission of personal information', () => {
      const piiContent = {
        question: 'How do you handle user authentication in your company?',
        answer: 'At Acme Corp, I work with John Smith (john.smith@acmecorp.com, phone: +1-555-123-4567) to implement OAuth 2.0. Our server IP is 192.168.1.100 and we use API key abc123def456ghi789. Social Security Numbers like 123-45-6789 are stored encrypted.'
      }

      cy.visit('/interview')
      cy.startInterviewSession()
      
      cy.get('[data-testid="answer-textarea"]').type(piiContent.answer)
      cy.get('[data-testid="submit-answer-btn"]').click()
      
      // Should trigger PII detection
      cy.get('[data-testid="pii-detection-modal"]').should('be.visible')
      
      // Verify all PII types are detected
      cy.get('[data-testid="detected-pii-email"]')
        .should('contain', 'john.smith@acmecorp.com')
      cy.get('[data-testid="detected-pii-phone"]')
        .should('contain', '+1-555-123-4567')
      cy.get('[data-testid="detected-pii-person"]')
        .should('contain', 'John Smith')
      cy.get('[data-testid="detected-pii-company"]')
        .should('contain', 'Acme Corp')
      cy.get('[data-testid="detected-pii-ip"]')
        .should('contain', '192.168.1.100')
      cy.get('[data-testid="detected-pii-api-key"]')
        .should('contain', 'abc123def456ghi789')
      cy.get('[data-testid="detected-pii-ssn"]')
        .should('contain', '123-45-6789')
      
      // User should not be able to proceed without fixing
      cy.get('[data-testid="continue-with-pii-btn"]').should('be.disabled')
      
      // Suggest sanitization
      cy.get('[data-testid="auto-sanitize-btn"]').click()
      
      cy.get('[data-testid="sanitized-preview"]')
        .should('contain', '[COMPANY_1]')
        .should('contain', '[PERSON_1]')
        .should('contain', '[EMAIL_1]')
        .should('not.contain', 'john.smith@acmecorp.com')
        .should('not.contain', 'John Smith')
    })

    it('should handle false positives in PII detection', () => {
      const technicalContent = 'Use React 18.2.0 with Node.js 16.14.0. The API endpoint is https://api.example.com/users/123 and returns JSON responses.'
      
      cy.visit('/interview')
      cy.startInterviewSession()
      
      cy.get('[data-testid="answer-textarea"]').type(technicalContent)
      cy.get('[data-testid="submit-answer-btn"]').click()
      
      // Should not trigger PII warnings for technical content
      cy.get('[data-testid="pii-detection-modal"]').should('not.exist')
      cy.get('[data-testid="next-question"]').should('be.visible')
    })

    it('should enforce PII redaction in anonymization', () => {
      // Create dataset with PII that somehow got through
      cy.task('createDatasetWithPII', {
        instanceId: 'test-instance-pii',
        question: 'How do you deploy applications?',
        answer: 'We deploy using Jenkins. Contact sarah@company.com for access to the deployment server at 10.0.0.50.'
      })
      
      cy.visit('/datasets/test-dataset-pii')
      cy.get('[data-testid="submit-for-anonymization-btn"]').click()
      
      // Anonymization should catch remaining PII
      cy.get('[data-testid="pre-anonymization-scan"]').should('be.visible')
      cy.get('[data-testid="pii-found-warning"]')
        .should('contain', 'Additional PII detected during anonymization')
      
      cy.get('[data-testid="mandatory-redaction-notice"]')
        .should('contain', 'The following information will be automatically redacted')
      
      cy.get('[data-testid="redaction-preview"]')
        .should('contain', '[EMAIL_REDACTED]')
        .should('contain', '[IP_REDACTED]')
        .should('not.contain', 'sarah@company.com')
    })
  })

  describe('Content Quality and Abuse Prevention', () => {
    it('should prevent low-effort spam submissions', () => {
      const spamAnswers = [
        'Yes.',
        'No.',
        'Maybe.',
        'I don\'t know.',
        'It depends.',
        'Good question.',
        'Use Google.',
        'Check Stack Overflow.',
        'Read the docs.',
        'Just code it.'
      ]
      
      cy.visit('/interview')
      cy.startInterviewSession()
      
      spamAnswers.forEach((answer, index) => {
        cy.get('[data-testid="answer-textarea"]').clear().type(answer)
        cy.get('[data-testid="submit-answer-btn"]').click()
        
        if (index < 3) {
          cy.get('[data-testid="low-quality-warning"]')
            .should('contain', 'Please provide more detailed responses')
        } else {
          cy.get('[data-testid="spam-detection-modal"]')
            .should('contain', 'Pattern of low-quality responses detected')
          return // Break out of loop
        }
      })
      
      // Should be temporarily blocked
      cy.get('[data-testid="temporary-restriction-notice"]')
        .should('contain', 'Please wait before continuing')
    })

    it('should detect and prevent promotional content', () => {
      const promotionalAnswers = [
        'For best results, visit our website at www.mycompany.com/products',
        'Contact me at sales@mycompany.com for consulting services',
        'Check out my course on Udemy: "Complete JavaScript Guide"',
        'Buy my book on Amazon: "Web Development Mastery"',
        'Subscribe to my newsletter for more tips!'
      ]
      
      cy.visit('/interview')
      cy.startInterviewSession()
      
      promotionalAnswers.forEach(answer => {
        cy.get('[data-testid="answer-textarea"]').clear().type(answer)
        cy.get('[data-testid="submit-answer-btn"]').click()
        
        cy.get('[data-testid="promotional-content-warning"]')
          .should('contain', 'Content appears promotional')
        
        cy.get('[data-testid="revise-answer-btn"]').click()
      })
    })

    it('should enforce professional language standards', () => {
      const inappropriateContent = 'This is a f***ing terrible way to implement authentication. Any idiot would know that.'
      
      cy.visit('/interview')
      cy.startInterviewSession()
      
      cy.get('[data-testid="answer-textarea"]').type(inappropriateContent)
      cy.get('[data-testid="submit-answer-btn"]').click()
      
      cy.get('[data-testid="language-standards-warning"]')
        .should('contain', 'Please maintain professional language')
      
      cy.get('[data-testid="suggest-alternatives-btn"]').click()
      
      cy.get('[data-testid="alternative-phrasing"]')
        .should('contain', 'This approach to implementing authentication has significant drawbacks')
    })
  })

  describe('Data Ownership and Attribution', () => {
    it('should track and enforce data ownership', () => {
      // User A creates content
      cy.loginWithEmail('user-a@example.com', 'password123')
      
      cy.visit('/interview')
      cy.startInterviewSession()
      cy.completeInterviewQuestions(['My proprietary algorithm for data processing'])
      
      cy.get('[data-testid="view-generated-instances"]').click()
      const datasetIdA = 'dataset-user-a'
      
      // Verify ownership
      cy.get('[data-testid="dataset-owner"]').should('contain', 'user-a@example.com')
      
      // User B tries to access/modify User A's content
      cy.loginWithEmail('user-b@example.com', 'password123')
      
      cy.visit(`/datasets/${datasetIdA}`)
      cy.get('[data-testid="access-denied-message"]')
        .should('contain', 'You do not have permission to access this dataset')
      
      // User B cannot edit User A's instances
      cy.request({
        method: 'PUT',
        url: `/api/instances/user-a-instance-1`,
        failOnStatusCode: false,
        body: { answer: 'Modified content' }
      }).then(response => {
        expect(response.status).to.eq(403)
        expect(response.body).to.have.property('error', 'Access denied')
      })
    })

    it('should handle collaborative dataset scenarios', () => {
      // Create shared workspace
      cy.task('createSharedWorkspace', {
        workspaceId: 'workspace-123',
        members: ['user-a@example.com', 'user-b@example.com'],
        permissions: {
          'user-a@example.com': ['read', 'write', 'admin'],
          'user-b@example.com': ['read', 'write']
        }
      })
      
      cy.loginWithEmail('user-a@example.com', 'password123')
      cy.visit('/workspaces/workspace-123')
      
      // User A creates dataset in shared workspace
      cy.get('[data-testid="create-shared-dataset-btn"]').click()
      cy.get('[data-testid="dataset-name"]').type('Shared Development Dataset')
      cy.get('[data-testid="create-dataset-btn"]').click()
      
      // User B can now access and contribute
      cy.loginWithEmail('user-b@example.com', 'password123')
      cy.visit('/workspaces/workspace-123')
      
      cy.get('[data-testid="shared-dataset-card"]')
        .should('contain', 'Shared Development Dataset')
      cy.get('[data-testid="contribute-btn"]').click()
      
      // Both users should be attributed
      cy.get('[data-testid="contributors-list"]')
        .should('contain', 'user-a@example.com')
        .should('contain', 'user-b@example.com')
    })

    it('should prevent intellectual property violations', () => {
      const potentialIPViolation = 'Here is the proprietary code from my company\'s internal system: function secretAlgorithm() { return companySecret * 42; }'
      
      cy.visit('/interview')
      cy.startInterviewSession()
      
      cy.get('[data-testid="answer-textarea"]').type(potentialIPViolation)
      cy.get('[data-testid="submit-answer-btn"]').click()
      
      cy.get('[data-testid="ip-concern-modal"]')
        .should('contain', 'Potential intellectual property concern')
      
      cy.get('[data-testid="ip-warning-text"]')
        .should('contain', 'proprietary code')
        .should('contain', 'company\'s internal system')
      
      cy.get('[data-testid="ip-attestation-required"]')
        .should('contain', 'I confirm this information is not proprietary')
      
      // User must explicitly attest or revise
      cy.get('[data-testid="revise-content-btn"]').click()
      
      const revisedAnswer = 'Here is a general approach to implementing algorithms: function genericAlgorithm() { return publicValue * commonConstant; }'
      cy.get('[data-testid="answer-textarea"]').clear().type(revisedAnswer)
      cy.get('[data-testid="submit-answer-btn"]').click()
      
      cy.get('[data-testid="ip-concern-modal"]').should('not.exist')
    })
  })

  describe('Privacy and Consent Management', () => {
    it('should enforce granular consent preferences', () => {
      cy.visit('/privacy/consent')
      
      // User provides granular consent
      cy.get('[data-testid="data-processing-consent"]').check()
      cy.get('[data-testid="anonymization-consent"]').check()
      cy.get('[data-testid="commercial-use-consent"]').uncheck() // Opt out
      cy.get('[data-testid="research-use-consent"]').check()
      cy.get('[data-testid="save-preferences-btn"]').click()
      
      // Create dataset
      cy.visit('/interview')
      cy.startInterviewSession()
      cy.completeInterviewQuestions(['Technical content for testing consent'])
      
      cy.get('[data-testid="view-generated-instances"]').click()
      cy.get('[data-testid="submit-for-review-btn"]').click()
      
      // Should respect consent preferences
      cy.get('[data-testid="usage-restrictions-notice"]')
        .should('contain', 'Commercial use: Not permitted')
        .should('contain', 'Research use: Permitted')
      
      // Marketplace should reflect restrictions
      cy.visit('/marketplace/my-datasets')
      cy.get('[data-testid="dataset-usage-type"]')
        .should('contain', 'Research only')
      
      cy.get('[data-testid="commercial-sale-disabled"]')
        .should('contain', 'Commercial sales disabled per user preferences')
    })

    it('should handle consent withdrawal', () => {
      // User initially gives full consent
      cy.visit('/privacy/consent')
      cy.get('[data-testid="full-consent-btn"]').click()
      
      // Create and submit dataset
      cy.visit('/interview')
      cy.startInterviewSession()
      cy.completeInterviewQuestions(['Content created with full consent'])
      
      cy.get('[data-testid="view-generated-instances"]').click()
      cy.submitDataset('consent-test-dataset')
      
      // Later, user withdraws consent
      cy.visit('/privacy/consent')
      cy.get('[data-testid="withdraw-commercial-consent-btn"]').click()
      
      cy.get('[data-testid="withdrawal-confirmation-modal"]')
        .should('contain', 'This will affect existing submissions')
      
      cy.get('[data-testid="confirm-withdrawal-btn"]').click()
      
      // Existing dataset should be updated
      cy.visit('/marketplace/my-datasets')
      cy.get('[data-testid="dataset-status"]')
        .should('contain', 'Commercial use withdrawn')
      
      // New commercial buyers should be prevented
      cy.task('attemptCommercialPurchase', 'consent-test-dataset')
        .then(result => {
          expect(result.success).to.be.false
          expect(result.reason).to.equal('Commercial consent withdrawn')
        })
    })

    it('should provide comprehensive data export', () => {
      cy.visit('/privacy/my-data')
      
      cy.get('[data-testid="export-all-data-btn"]').click()
      
      cy.get('[data-testid="export-options"]').should('be.visible')
      cy.get('[data-testid="include-raw-submissions"]').check()
      cy.get('[data-testid="include-anonymized-data"]').check()
      cy.get('[data-testid="include-consent-logs"]').check()
      cy.get('[data-testid="include-earnings-data"]').check()
      
      cy.get('[data-testid="start-export-btn"]').click()
      
      cy.get('[data-testid="export-progress"]').should('be.visible')
      
      // Wait for export completion
      cy.get('[data-testid="export-complete-notification"]', { timeout: 30000 })
        .should('contain', 'Data export ready for download')
      
      cy.get('[data-testid="download-export-btn"]').click()
      
      // Verify export contents (would need to check downloaded file)
      cy.task('verifyExportContents', 'latest-export.json')
        .then(exportData => {
          expect(exportData).to.have.property('userProfile')
          expect(exportData).to.have.property('submissions')
          expect(exportData).to.have.property('consentHistory')
          expect(exportData).to.have.property('earningsHistory')
        })
    })
  })

  describe('System Abuse Prevention', () => {
    it('should prevent automated content generation', () => {
      const repetitiveAnswers = Array(20).fill(0).map((_, i) => 
        `This is automated answer number ${i} with slight variations in content.`
      )
      
      cy.visit('/interview')
      cy.startInterviewSession()
      
      let captchaTriggered = false
      
      repetitiveAnswers.forEach((answer, index) => {
        if (captchaTriggered) return
        
        cy.get('[data-testid="answer-textarea"]').clear().type(answer)
        cy.get('[data-testid="submit-answer-btn"]').click()
        
        // Should trigger CAPTCHA after suspicious pattern
        cy.get('body').then($body => {
          if ($body.find('[data-testid="captcha-challenge"]').length > 0) {
            captchaTriggered = true
            cy.get('[data-testid="automation-detection-notice"]')
              .should('contain', 'Automated behavior detected')
          }
        })
      })
      
      expect(captchaTriggered).to.be.true
    })

    it('should rate limit API calls', () => {
      // Attempt rapid API calls
      const rapidCalls = Array(100).fill(0).map((_, i) => 
        cy.request({
          method: 'POST',
          url: '/api/interview/langgraph/answer',
          failOnStatusCode: false,
          body: { answer: `Rapid call ${i}` }
        })
      )
      
      Promise.all(rapidCalls).then(responses => {
        const rateLimitedResponses = responses.filter(r => r.status === 429)
        expect(rateLimitedResponses.length).to.be.greaterThan(0)
        
        rateLimitedResponses.forEach(response => {
          expect(response.body).to.have.property('error')
          expect(response.body.error).to.contain('rate limit')
        })
      })
    })

    it('should prevent duplicate content submission', () => {
      const duplicateAnswer = 'This is the exact same answer I will submit multiple times to test duplicate detection.'
      
      cy.visit('/interview')
      cy.startInterviewSession()
      
      // Submit the same answer multiple times
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="answer-textarea"]').clear().type(duplicateAnswer)
        cy.get('[data-testid="submit-answer-btn"]').click()
        
        if (i >= 2) {
          cy.get('[data-testid="duplicate-content-warning"]')
            .should('contain', 'Similar content already provided')
          
          cy.get('[data-testid="encourage-variety-message"]')
            .should('contain', 'Try to provide diverse responses')
        }
      }
    })
  })

  describe('Security Vulnerability Prevention', () => {
    it('should prevent XSS attacks in user content', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')" />',
        '<svg onload="alert(\'xss\')" />'
      ]
      
      cy.visit('/interview')
      cy.startInterviewSession()
      
      xssPayloads.forEach(payload => {
        cy.get('[data-testid="answer-textarea"]').clear().type(payload)
        cy.get('[data-testid="submit-answer-btn"]').click()
        
        // Verify XSS content is sanitized
        cy.get('[data-testid="submitted-answer"]')
          .should('not.contain', '<script>')
          .should('not.contain', 'javascript:')
          .should('not.contain', 'onerror')
          .should('not.contain', 'onload')
      })
      
      // Verify no script execution occurred
      cy.window().then(win => {
        expect(win.xssTriggered).to.be.undefined
      })
    })

    it('should prevent SQL injection attempts', () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "' UNION SELECT * FROM sensitive_data; --"
      ]
      
      sqlPayloads.forEach(payload => {
        cy.request({
          method: 'POST',
          url: '/api/instances/search',
          failOnStatusCode: false,
          body: { query: payload }
        }).then(response => {
          // Should not succeed with SQL injection
          expect(response.status).to.not.equal(200)
          expect(response.body).to.not.have.property('sensitiveData')
        })
      })
    })

    it('should enforce CSRF protection', () => {
      // Attempt to make request without proper CSRF token
      cy.request({
        method: 'POST',
        url: '/api/datasets/create',
        failOnStatusCode: false,
        body: { name: 'Unauthorized Dataset' },
        headers: {
          'Content-Type': 'application/json'
          // Missing CSRF token
        }
      }).then(response => {
        expect(response.status).to.equal(403)
        expect(response.body.error).to.contain('CSRF')
      })
    })
  })
})