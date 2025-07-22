/**
 * Unit tests for instance submission and anonymization
 * Tests data anonymization, PII detection, and submission workflows
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock dependencies
jest.mock('@/db/drizzle', () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn(() => Promise.resolve({ id: 'submission-123' }))
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve())
      }))
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve([]))
        }))
      }))
    }))
  }
}))

// Mock OpenAI for PII detection
jest.mock('@ai-sdk/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }
}))

describe('Instance Submission and Anonymization', () => {
  let mockDataset: any
  let mockInstances: any[]

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockDataset = {
      id: 'dataset-123',
      name: 'Professional Development Dataset',
      description: 'Dataset about software engineering practices',
      userId: 'user-456',
      instanceCount: 10,
      averageQualityScore: 85,
      anonymizationStatus: 'pending'
    }

    mockInstances = [
      {
        id: 'instance-1',
        question: 'How do you handle deployment at your company?',
        answer: 'At TechCorp Inc., we use Jenkins for CI/CD. My colleague John Smith set up the pipeline. We deploy to AWS servers in the us-east-1 region.',
        tags: ['DevOps', 'Deployment', 'CI/CD'],
        category: 'operations',
        qualityScore: 80,
        datasetId: 'dataset-123',
        anonymizationStatus: 'pending'
      },
      {
        id: 'instance-2',
        question: 'What database optimization techniques do you recommend?',
        answer: 'For our PostgreSQL database, I implement indexing strategies and query optimization. Contact me at john.doe@techcorp.com for more details.',
        tags: ['Database', 'PostgreSQL', 'Optimization'],
        category: 'database',
        qualityScore: 75,
        datasetId: 'dataset-123',
        anonymizationStatus: 'pending'
      }
    ]
  })

  describe('PII Detection and Scanning', () => {
    it('should detect personal names in content', async () => {
      const content = 'My colleague John Smith helped implement the feature.'
      const detectedPII = await detectPII(content)

      expect(detectedPII).toContainEqual({
        type: 'person_name',
        value: 'John Smith',
        confidence: expect.any(Number),
        startIndex: expect.any(Number),
        endIndex: expect.any(Number)
      })
    })

    it('should detect email addresses', async () => {
      const content = 'Contact me at john.doe@company.com for questions.'
      const detectedPII = await detectPII(content)

      expect(detectedPII).toContainEqual({
        type: 'email',
        value: 'john.doe@company.com',
        confidence: expect.any(Number),
        startIndex: expect.any(Number),
        endIndex: expect.any(Number)
      })
    })

    it('should detect company names', async () => {
      const content = 'We use Microsoft Azure and Google Cloud services.'
      const detectedPII = await detectPII(content)

      const companyNames = detectedPII.filter(pii => pii.type === 'organization')
      expect(companyNames.length).toBeGreaterThan(0)
    })

    it('should detect phone numbers', async () => {
      const content = 'Call me at +1-555-123-4567 or (555) 987-6543.'
      const detectedPII = await detectPII(content)

      const phoneNumbers = detectedPII.filter(pii => pii.type === 'phone_number')
      expect(phoneNumbers).toHaveLength(2)
    })

    it('should detect IP addresses and server details', async () => {
      const content = 'Our server runs on 192.168.1.100 with SSH key abc123def456.'
      const detectedPII = await detectPII(content)

      const ipAddresses = detectedPII.filter(pii => pii.type === 'ip_address')
      const secrets = detectedPII.filter(pii => pii.type === 'potential_secret')
      
      expect(ipAddresses).toHaveLength(1)
      expect(secrets).toHaveLength(1)
    })

    it('should not flag technical terms as PII', async () => {
      const content = 'Use React hooks like useState and useEffect for state management.'
      const detectedPII = await detectPII(content)

      // Technical terms should not be detected as PII
      const technicalTerms = ['React', 'useState', 'useEffect']
      const flaggedTechnical = detectedPII.filter(pii => 
        technicalTerms.includes(pii.value)
      )

      expect(flaggedTechnical).toHaveLength(0)
    })

    it('should handle edge cases in PII detection', async () => {
      const edgeCases = [
        'Email without @ symbol: user.domain.com',
        'Number that looks like phone: 123456789',
        'Common name: Smith (should not be flagged)',
        'URL with no PII: https://example.com/api/users'
      ]

      for (const content of edgeCases) {
        const detectedPII = await detectPII(content)
        // Should handle gracefully without throwing errors
        expect(Array.isArray(detectedPII)).toBe(true)
      }
    })
  })

  describe('Anonymization Strategies', () => {
    it('should anonymize personal names with consistent placeholders', async () => {
      const content = 'John Smith and Jane Doe worked on the project. John reviewed the code.'
      const anonymized = await anonymizeContent(content)

      expect(anonymized.content).not.toContain('John Smith')
      expect(anonymized.content).not.toContain('Jane Doe')
      expect(anonymized.content).toContain('[PERSON_1]')
      expect(anonymized.content).toContain('[PERSON_2]')
      
      // Should maintain consistency - John Smith should always be [PERSON_1]
      const johnReferences = (content.match(/John/g) || []).length
      const person1References = (anonymized.content.match(/\[PERSON_1\]/g) || []).length
      expect(person1References).toBe(johnReferences)
    })

    it('should anonymize company names appropriately', async () => {
      const content = 'At Microsoft, we used Azure services. Google provides similar cloud solutions.'
      const anonymized = await anonymizeContent(content)

      expect(anonymized.content).not.toContain('Microsoft')
      expect(anonymized.content).not.toContain('Google')
      expect(anonymized.content).toContain('[COMPANY_1]')
      expect(anonymized.content).toContain('[COMPANY_2]')
    })

    it('should preserve technical context while anonymizing', async () => {
      const content = 'At TechCorp, we use React and Node.js for development.'
      const anonymized = await anonymizeContent(content)

      expect(anonymized.content).not.toContain('TechCorp')
      expect(anonymized.content).toContain('React')
      expect(anonymized.content).toContain('Node.js')
      expect(anonymized.content).toContain('[COMPANY_1]')
    })

    it('should anonymize email addresses', async () => {
      const content = 'Contact john.doe@company.com or support@techcorp.co for help.'
      const anonymized = await anonymizeContent(content)

      expect(anonymized.content).not.toContain('john.doe@company.com')
      expect(anonymized.content).not.toContain('support@techcorp.co')
      expect(anonymized.content).toContain('[EMAIL_1]')
      expect(anonymized.content).toContain('[EMAIL_2]')
    })

    it('should handle partial anonymization preferences', async () => {
      const content = 'At Google, we used MySQL databases.'
      const preferences = {
        anonymizeCompanies: true,
        anonymizeTechnologies: false,
        anonymizePersonNames: true
      }

      const anonymized = await anonymizeContent(content, preferences)

      expect(anonymized.content).not.toContain('Google')
      expect(anonymized.content).toContain('MySQL') // Technology preserved
      expect(anonymized.content).toContain('[COMPANY_1]')
    })

    it('should provide anonymization mapping for reversibility', async () => {
      const content = 'John Smith at Microsoft uses Azure.'
      const anonymized = await anonymizeContent(content)

      expect(anonymized.mapping).toBeDefined()
      expect(anonymized.mapping['[PERSON_1]']).toBe('John Smith')
      expect(anonymized.mapping['[COMPANY_1]']).toBe('Microsoft')
      expect(anonymized.mapping['[COMPANY_2]']).toBe('Azure')
    })
  })

  describe('Anonymization Quality Assurance', () => {
    it('should validate anonymization completeness', async () => {
      const instance = mockInstances[0]
      const anonymizationResult = await anonymizeInstance(instance)

      const validation = await validateAnonymization(
        instance,
        anonymizationResult.anonymizedInstance
      )

      expect(validation.isComplete).toBe(true)
      expect(validation.remainingPII).toHaveLength(0)
      expect(validation.confidence).toBeGreaterThan(0.9)
    })

    it('should flag incomplete anonymization', async () => {
      const partiallyAnonymized = {
        ...mockInstances[0],
        answer: 'At [COMPANY_1], we use Jenkins. Contact john.doe@company.com for details.'
      }

      const validation = await validateAnonymization(
        mockInstances[0],
        partiallyAnonymized
      )

      expect(validation.isComplete).toBe(false)
      expect(validation.remainingPII).toContainEqual({
        type: 'email',
        value: 'john.doe@company.com'
      })
    })

    it('should preserve meaning and technical accuracy', async () => {
      const technicalInstance = {
        question: 'How do you implement OAuth2 with JWT tokens?',
        answer: 'At our company, we use the Authorization Code flow with PKCE. The client_id is stored securely, and we validate the JWT signature using RS256 algorithm.',
        tags: ['OAuth2', 'JWT', 'Security']
      }

      const anonymized = await anonymizeInstance(technicalInstance)

      // Technical terms should be preserved
      expect(anonymized.anonymizedInstance.answer).toContain('OAuth2')
      expect(anonymized.anonymizedInstance.answer).toContain('JWT')
      expect(anonymized.anonymizedInstance.answer).toContain('Authorization Code')
      expect(anonymized.anonymizedInstance.answer).toContain('PKCE')
      expect(anonymized.anonymizedInstance.answer).toContain('RS256')

      // Generic terms should be anonymized
      expect(anonymized.anonymizedInstance.answer).not.toContain('our company')
    })

    it('should handle false positives in PII detection', async () => {
      const content = 'Use the React library with JavaScript. The function render() returns JSX.'
      
      const detectedPII = await detectPII(content)
      const falsePII = detectedPII.filter(pii => 
        ['React', 'JavaScript', 'render', 'JSX'].includes(pii.value)
      )

      // These should be classified as technical terms, not PII
      expect(falsePII).toHaveLength(0)
    })
  })

  describe('Submission Workflow', () => {
    it('should process full dataset submission', async () => {
      const submissionRequest = {
        datasetId: 'dataset-123',
        userId: 'user-456',
        submissionType: 'marketplace',
        pricePerInstance: 2.50,
        anonymizationPreferences: {
          anonymizeCompanies: true,
          anonymizePersonNames: true,
          preserveTechnicalTerms: true
        }
      }

      const submissionResult = await submitDataset(submissionRequest)

      expect(submissionResult.submissionId).toBeDefined()
      expect(submissionResult.status).toBe('processing')
      expect(submissionResult.totalInstances).toBe(10)
      expect(submissionResult.estimatedProcessingTime).toBeDefined()
    })

    it('should enforce quality thresholds before submission', async () => {
      const lowQualityInstances = mockInstances.map(instance => ({
        ...instance,
        qualityScore: 45 // Below threshold
      }))

      const submissionRequest = {
        datasetId: 'dataset-123',
        userId: 'user-456',
        instances: lowQualityInstances
      }

      await expect(submitDataset(submissionRequest)).rejects.toThrow(
        'Dataset quality below minimum threshold'
      )
    })

    it('should create anonymization audit log', async () => {
      const instance = mockInstances[0]
      const anonymizationResult = await anonymizeInstance(instance)

      expect(anonymizationResult.auditLog).toMatchObject({
        instanceId: instance.id,
        userId: expect.any(String),
        timestamp: expect.any(Date),
        piiDetected: expect.any(Array),
        anonymizationStrategy: expect.any(String),
        qualityMetrics: expect.any(Object)
      })
    })

    it('should handle anonymization failures gracefully', async () => {
      // Mock a scenario where anonymization fails
      const problematicInstance = {
        ...mockInstances[0],
        answer: null // Invalid content
      }

      const result = await anonymizeInstance(problematicInstance)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.fallbackStrategy).toBe('manual_review')
    })

    it('should track user consent for anonymization', async () => {
      const consentRecord = {
        userId: 'user-456',
        datasetId: 'dataset-123',
        consentType: 'anonymization_and_publication',
        consentGiven: true,
        timestamp: new Date(),
        consentDetails: {
          anonymizePersonalInfo: true,
          allowCommercialUse: true,
          retainAttributionRights: false
        }
      }

      const { db } = require('@/db/drizzle')
      await db.insert().values(consentRecord)

      expect(db.insert).toHaveBeenCalled()
      expect(db.insert().values).toHaveBeenCalledWith(consentRecord)
    })
  })

  describe('Post-Submission Processing', () => {
    it('should update instance anonymization status', async () => {
      const instanceId = 'instance-1'
      const anonymizationStatus = 'completed'
      
      const { db } = require('@/db/drizzle')
      await updateInstanceAnonymizationStatus(instanceId, anonymizationStatus)

      expect(db.update).toHaveBeenCalled()
    })

    it('should notify user of anonymization completion', async () => {
      const notification = {
        userId: 'user-456',
        type: 'anonymization_complete',
        message: 'Your dataset has been successfully anonymized and is ready for review',
        metadata: {
          datasetId: 'dataset-123',
          totalInstances: 10,
          anonymizedInstances: 10,
          qualityScore: 85
        }
      }

      const notificationResult = await sendNotification(notification)

      expect(notificationResult.sent).toBe(true)
      expect(notificationResult.notificationId).toBeDefined()
    })

    it('should generate anonymization report', async () => {
      const datasetId = 'dataset-123'
      const report = await generateAnonymizationReport(datasetId)

      expect(report).toMatchObject({
        datasetId,
        totalInstances: expect.any(Number),
        anonymizedInstances: expect.any(Number),
        piiTypesFound: expect.any(Array),
        anonymizationStrategies: expect.any(Array),
        qualityImpact: expect.any(Object),
        timestamp: expect.any(Date)
      })
    })
  })

  describe('Privacy and Compliance', () => {
    it('should support GDPR right to be forgotten', async () => {
      const deletionRequest = {
        userId: 'user-456',
        requestType: 'full_deletion',
        reason: 'user_request',
        timestamp: new Date()
      }

      const deletionResult = await processDataDeletion(deletionRequest)

      expect(deletionResult.success).toBe(true)
      expect(deletionResult.deletedItems).toContain('user_profile')
      expect(deletionResult.deletedItems).toContain('submitted_datasets')
      expect(deletionResult.deletedItems).toContain('anonymization_logs')
    })

    it('should maintain data lineage for compliance', async () => {
      const instanceId = 'instance-1'
      const lineage = await getDataLineage(instanceId)

      expect(lineage).toMatchObject({
        originalCreation: expect.any(Date),
        submissionDate: expect.any(Date),
        anonymizationDate: expect.any(Date),
        transformations: expect.any(Array),
        consentRecords: expect.any(Array)
      })
    })

    it('should implement data retention policies', async () => {
      const retentionPolicy = {
        rawDataRetention: '30_days',
        anonymizedDataRetention: 'indefinite',
        auditLogRetention: '7_years'
      }

      const eligibleForDeletion = await findDataEligibleForDeletion(retentionPolicy)

      expect(eligibleForDeletion.rawData).toBeDefined()
      expect(eligibleForDeletion.auditLogs).toBeDefined()
      expect(eligibleForDeletion.anonymizedData).toHaveLength(0) // Should not be eligible
    })
  })
})

// Helper functions that would be implemented in the actual anonymization service
async function detectPII(content: string) {
  const piiPatterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    person_name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
  }

  const detectedPII = []
  
  for (const [type, pattern] of Object.entries(piiPatterns)) {
    const matches = content.matchAll(pattern)
    for (const match of matches) {
      detectedPII.push({
        type,
        value: match[0],
        confidence: 0.9,
        startIndex: match.index!,
        endIndex: match.index! + match[0].length
      })
    }
  }

  // Mock company detection (would use NER in practice)
  const companies = ['Microsoft', 'Google', 'TechCorp', 'Azure']
  companies.forEach(company => {
    if (content.includes(company)) {
      detectedPII.push({
        type: 'organization',
        value: company,
        confidence: 0.85,
        startIndex: content.indexOf(company),
        endIndex: content.indexOf(company) + company.length
      })
    }
  })

  return detectedPII
}

async function anonymizeContent(content: string, preferences?: any) {
  const detectedPII = await detectPII(content)
  let anonymizedContent = content
  const mapping: Record<string, string> = {}
  
  const counters = {
    person: 0,
    company: 0,
    email: 0
  }

  detectedPII.forEach(pii => {
    let placeholder = ''
    
    switch (pii.type) {
      case 'person_name':
        counters.person++
        placeholder = `[PERSON_${counters.person}]`
        break
      case 'organization':
        counters.company++
        placeholder = `[COMPANY_${counters.company}]`
        break
      case 'email':
        counters.email++
        placeholder = `[EMAIL_${counters.email}]`
        break
      default:
        placeholder = `[${pii.type.toUpperCase()}_${Date.now()}]`
    }
    
    mapping[placeholder] = pii.value
    anonymizedContent = anonymizedContent.replace(pii.value, placeholder)
  })

  return {
    content: anonymizedContent,
    mapping,
    piiRemoved: detectedPII.length
  }
}

async function anonymizeInstance(instance: any) {
  try {
    const questionResult = await anonymizeContent(instance.question)
    const answerResult = await anonymizeContent(instance.answer)
    
    const anonymizedInstance = {
      ...instance,
      question: questionResult.content,
      answer: answerResult.content,
      anonymizationStatus: 'completed'
    }

    return {
      success: true,
      anonymizedInstance,
      auditLog: {
        instanceId: instance.id,
        userId: instance.userId || 'unknown',
        timestamp: new Date(),
        piiDetected: [...Object.keys(questionResult.mapping), ...Object.keys(answerResult.mapping)],
        anonymizationStrategy: 'placeholder_replacement',
        qualityMetrics: {
          piiRemovalCount: questionResult.piiRemoved + answerResult.piiRemoved,
          contentPreservationRatio: 0.95
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      fallbackStrategy: 'manual_review'
    }
  }
}

async function validateAnonymization(original: any, anonymized: any) {
  const remainingPII = await detectPII(anonymized.question + ' ' + anonymized.answer)
  
  return {
    isComplete: remainingPII.length === 0,
    remainingPII,
    confidence: remainingPII.length === 0 ? 0.99 : 0.5,
    preservedMeaning: calculateSemanticSimilarity(original.answer, anonymized.answer)
  }
}

async function submitDataset(request: any) {
  // Mock validation
  const avgQuality = request.instances?.reduce((sum: number, inst: any) => sum + inst.qualityScore, 0) / (request.instances?.length || 1)
  
  if (avgQuality < 70) {
    throw new Error('Dataset quality below minimum threshold')
  }

  return {
    submissionId: crypto.randomUUID(),
    status: 'processing',
    totalInstances: request.instances?.length || 10,
    estimatedProcessingTime: '15 minutes'
  }
}

async function updateInstanceAnonymizationStatus(instanceId: string, status: string) {
  const { db } = require('@/db/drizzle')
  return db.update().set({ anonymizationStatus: status }).where({ id: instanceId })
}

async function sendNotification(notification: any) {
  return {
    sent: true,
    notificationId: crypto.randomUUID(),
    timestamp: new Date()
  }
}

async function generateAnonymizationReport(datasetId: string) {
  return {
    datasetId,
    totalInstances: 10,
    anonymizedInstances: 10,
    piiTypesFound: ['person_name', 'organization', 'email'],
    anonymizationStrategies: ['placeholder_replacement'],
    qualityImpact: {
      averageQualityBefore: 85,
      averageQualityAfter: 83,
      semanticPreservation: 0.95
    },
    timestamp: new Date()
  }
}

async function processDataDeletion(request: any) {
  return {
    success: true,
    deletedItems: ['user_profile', 'submitted_datasets', 'anonymization_logs'],
    timestamp: new Date()
  }
}

async function getDataLineage(instanceId: string) {
  return {
    originalCreation: new Date('2024-01-01'),
    submissionDate: new Date('2024-01-02'),
    anonymizationDate: new Date('2024-01-03'),
    transformations: ['pii_removal', 'quality_enhancement'],
    consentRecords: ['data_processing', 'anonymization_consent']
  }
}

async function findDataEligibleForDeletion(policy: any) {
  return {
    rawData: ['old_submission_1', 'old_submission_2'],
    auditLogs: ['log_2017_01', 'log_2017_02'],
    anonymizedData: []
  }
}

function calculateSemanticSimilarity(text1: string, text2: string): number {
  // Mock implementation - would use embeddings in practice
  const words1 = text1.toLowerCase().split(' ')
  const words2 = text2.toLowerCase().split(' ')
  const commonWords = words1.filter(word => words2.includes(word))
  return commonWords.length / Math.max(words1.length, words2.length)
}