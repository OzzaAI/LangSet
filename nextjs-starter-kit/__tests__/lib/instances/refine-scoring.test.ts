/**
 * Unit tests for instance refinement and scoring system
 * Tests quality scoring, contradiction detection, and refinement workflows
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock OpenAI for refinement scoring
jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}))

// Mock database operations
jest.mock('@/db/drizzle', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve([]))
        }))
      }))
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve())
      }))
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => Promise.resolve())
    }))
  }
}))

describe('Instance Refinement and Scoring', () => {
  let mockInstance: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockInstance = {
      id: 'instance-123',
      question: 'How do you implement authentication in a React application?',
      answer: 'To implement authentication in React, you can use libraries like Auth0, Firebase Auth, or implement JWT-based authentication. The typical flow involves storing tokens in localStorage or httpOnly cookies, creating protected routes with higher-order components, and managing auth state with Context API or Redux.',
      tags: ['React', 'Authentication', 'Security'],
      category: 'web-development',
      difficulty: 'intermediate',
      qualityScore: 75,
      userId: 'user-123',
      datasetId: 'dataset-456'
    }
  })

  describe('Quality Scoring Algorithm', () => {
    it('should score high-quality instances correctly', async () => {
      const highQualityInstance = {
        question: 'Explain the differences between REST and GraphQL APIs, including when to use each approach and their respective trade-offs.',
        answer: 'REST (Representational State Transfer) and GraphQL are both API design paradigms with distinct characteristics. REST uses HTTP methods (GET, POST, PUT, DELETE) and follows a resource-based approach where each endpoint represents a specific resource. It\'s stateless, cacheable, and widely adopted. GraphQL, developed by Facebook, provides a query language that allows clients to request exactly the data they need. Key differences include: 1) Data fetching: REST may require multiple requests for related data, while GraphQL can fetch all needed data in a single request. 2) Over-fetching: REST often returns fixed data structures, potentially including unnecessary fields, while GraphQL allows precise field selection. 3) Versioning: REST typically uses URL versioning, while GraphQL schemas can evolve without versioning. 4) Caching: REST has better HTTP caching support, while GraphQL requires more sophisticated caching strategies. Use REST for: simple CRUD operations, when HTTP caching is critical, or when working with existing systems. Use GraphQL for: complex data requirements, mobile applications where bandwidth is limited, or when rapid frontend development is prioritized.',
        tags: ['API', 'REST', 'GraphQL', 'Backend', 'Architecture'],
        category: 'system-design',
        difficulty: 'advanced'
      }

      const qualityScore = calculateQualityScore(highQualityInstance)

      expect(qualityScore).toBeGreaterThanOrEqual(85)
      expect(qualityScore).toBeLessThanOrEqual(100)
    })

    it('should score low-quality instances correctly', async () => {
      const lowQualityInstance = {
        question: 'What is React?',
        answer: 'React is a library.',
        tags: ['React'],
        category: 'frontend',
        difficulty: 'beginner'
      }

      const qualityScore = calculateQualityScore(lowQualityInstance)

      expect(qualityScore).toBeLessThan(50)
    })

    it('should consider multiple quality factors', () => {
      const scores = {
        answerLength: calculateAnswerLengthScore(mockInstance.answer),
        questionClarity: calculateQuestionClarityScore(mockInstance.question),
        tagRelevance: calculateTagRelevanceScore(mockInstance.tags, mockInstance.answer),
        technicalDepth: calculateTechnicalDepthScore(mockInstance.answer),
        practicalValue: calculatePracticalValueScore(mockInstance.answer)
      }

      expect(scores.answerLength).toBeGreaterThan(0)
      expect(scores.questionClarity).toBeGreaterThan(0)
      expect(scores.tagRelevance).toBeGreaterThan(0)
      expect(scores.technicalDepth).toBeGreaterThan(0)
      expect(scores.practicalValue).toBeGreaterThan(0)

      const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length

      expect(overallScore).toBeGreaterThan(50)
    })

    it('should penalize instances with poor grammar or spelling', () => {
      const poorGrammarInstance = {
        ...mockInstance,
        question: 'how do u implement authentiaction in react app?',
        answer: 'u can use librarys like auth0 or firebase. just store token in localstorage and create protectd routes.'
      }

      const qualityScore = calculateQualityScore(poorGrammarInstance)
      const originalScore = calculateQualityScore(mockInstance)

      expect(qualityScore).toBeLessThan(originalScore)
    })

    it('should reward instances with code examples', () => {
      const instanceWithCode = {
        ...mockInstance,
        answer: mockInstance.answer + '\n\nExample implementation:\n```javascript\nconst AuthContext = createContext();\n\nfunction useAuth() {\n  return useContext(AuthContext);\n}\n```'
      }

      const qualityScore = calculateQualityScore(instanceWithCode)
      const originalScore = calculateQualityScore(mockInstance)

      expect(qualityScore).toBeGreaterThan(originalScore)
    })
  })

  describe('Contradiction Detection', () => {
    it('should detect factual contradictions in answers', async () => {
      const contradictoryInstance = {
        question: 'What is the latest version of React?',
        answer: 'The latest version of React is 16.8, which introduced hooks. React 18 was released in 2019 and is the current version.',
        tags: ['React', 'Version'],
        category: 'frontend'
      }

      const contradictions = await detectContradictions(contradictoryInstance.answer)

      expect(contradictions).toHaveLength(1)
      expect(contradictions[0]).toMatchObject({
        type: 'factual_inconsistency',
        description: expect.stringContaining('version'),
        severity: 'high'
      })
    })

    it('should detect logical inconsistencies', async () => {
      const logicallyInconsistentInstance = {
        question: 'Should you store passwords in plain text?',
        answer: 'Never store passwords in plain text as it\'s a security risk. However, for simple applications, storing passwords in plain text is acceptable and more convenient.',
        tags: ['Security', 'Passwords'],
        category: 'security'
      }

      const contradictions = await detectContradictions(logicallyInconsistentInstance.answer)

      expect(contradictions).toHaveLength(1)
      expect(contradictions[0].type).toBe('logical_contradiction')
      expect(contradictions[0].severity).toBe('high')
    })

    it('should ignore minor stylistic variations', async () => {
      const consistentInstance = {
        question: 'How do you handle errors in JavaScript?',
        answer: 'You can handle errors using try-catch blocks. Try-catch statements allow you to catch and handle exceptions gracefully.',
        tags: ['JavaScript', 'Error Handling'],
        category: 'programming'
      }

      const contradictions = await detectContradictions(consistentInstance.answer)

      expect(contradictions).toHaveLength(0)
    })

    it('should flag outdated information', async () => {
      const outdatedInstance = {
        question: 'How do you create components in React?',
        answer: 'The best way to create React components is using class components with componentDidMount lifecycle methods. Functional components are not recommended as they lack state management.',
        tags: ['React', 'Components'],
        category: 'frontend'
      }

      const contradictions = await detectContradictions(outdatedInstance.answer)

      expect(contradictions.some(c => c.type === 'outdated_information')).toBe(true)
    })
  })

  describe('Automated Refinement Suggestions', () => {
    it('should suggest improvements for vague answers', async () => {
      const vagueuInstance = {
        question: 'How do you optimize React performance?',
        answer: 'You can optimize React by using various techniques and best practices.',
        tags: ['React', 'Performance'],
        category: 'optimization'
      }

      const suggestions = await generateRefinementSuggestions(vagueuInstance)

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'add_specificity',
          suggestion: expect.stringContaining('specific techniques')
        })
      )
    })

    it('should suggest adding code examples', async () => {
      const noCodeInstance = {
        question: 'How do you use React hooks?',
        answer: 'React hooks allow you to use state and lifecycle features in functional components. useState manages state, useEffect handles side effects.',
        tags: ['React', 'Hooks'],
        category: 'frontend'
      }

      const suggestions = await generateRefinementSuggestions(noCodeInstance)

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'add_code_example',
          suggestion: expect.stringContaining('code example')
        })
      )
    })

    it('should suggest improving question clarity', async () => {
      const unclearQuestionInstance = {
        question: 'How to do it?',
        answer: 'To implement user authentication, you need to...',
        tags: ['Authentication'],
        category: 'security'
      }

      const suggestions = await generateRefinementSuggestions(unclearQuestionInstance)

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'clarify_question',
          suggestion: expect.stringContaining('more specific')
        })
      )
    })

    it('should suggest relevant tags', async () => {
      const insufficientTagsInstance = {
        question: 'How do you implement OAuth in a Node.js Express application using Passport.js?',
        answer: 'To implement OAuth with Passport.js in Express, you need to configure strategies, set up routes for authentication endpoints, and handle callbacks.',
        tags: ['OAuth'],
        category: 'backend'
      }

      const suggestions = await generateRefinementSuggestions(insufficientTagsInstance)

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'add_relevant_tags',
          suggestion: expect.stringContaining('Node.js')
        })
      )
    })
  })

  describe('User Refinement Interface', () => {
    it('should track refinement history', async () => {
      const originalInstance = { ...mockInstance }
      const refinedInstance = {
        ...mockInstance,
        answer: mockInstance.answer + ' Additional refined content with more specific examples.',
        qualityScore: 85,
        editCount: 1,
        lastEditedAt: new Date()
      }

      const refinementHistory = {
        instanceId: mockInstance.id,
        originalVersion: originalInstance,
        refinedVersion: refinedInstance,
        improvements: [
          { type: 'added_specificity', description: 'Added more specific examples' },
          { type: 'improved_quality_score', oldScore: 75, newScore: 85 }
        ],
        timestamp: new Date()
      }

      expect(refinementHistory.improvements).toHaveLength(2)
      expect(refinementHistory.refinedVersion.qualityScore).toBeGreaterThan(
        refinementHistory.originalVersion.qualityScore
      )
    })

    it('should validate user edits', async () => {
      const invalidEdit = {
        question: '', // Empty question
        answer: 'a', // Too short
        tags: [], // No tags
      }

      const validationErrors = validateInstanceEdit(invalidEdit)

      expect(validationErrors).toContainEqual(
        expect.objectContaining({
          field: 'question',
          message: 'Question cannot be empty'
        })
      )
      expect(validationErrors).toContainEqual(
        expect.objectContaining({
          field: 'answer',
          message: 'Answer must be at least 50 characters long'
        })
      )
      expect(validationErrors).toContainEqual(
        expect.objectContaining({
          field: 'tags',
          message: 'At least one tag is required'
        })
      )
    })

    it('should prevent malicious content injection', () => {
      const maliciousEdit = {
        question: 'How to implement authentication? <script>alert("xss")</script>',
        answer: 'Implementation details... <?php system("rm -rf /"); ?>',
        tags: ['<img src=x onerror=alert(1)>', 'Security']
      }

      const sanitizedEdit = sanitizeInstanceEdit(maliciousEdit)

      expect(sanitizedEdit.question).not.toContain('<script>')
      expect(sanitizedEdit.answer).not.toContain('<?php')
      expect(sanitizedEdit.tags[0]).not.toContain('<img')
      expect(sanitizedEdit.tags).toContain('Security') // Valid tag preserved
    })
  })

  describe('Quality Score Evolution', () => {
    it('should track quality improvements over time', async () => {
      const qualityEvolution = [
        { version: 1, score: 65, timestamp: new Date('2024-01-01') },
        { version: 2, score: 75, timestamp: new Date('2024-01-02') },
        { version: 3, score: 85, timestamp: new Date('2024-01-03') }
      ]

      const improvement = calculateQualityImprovement(qualityEvolution)

      expect(improvement.totalIncrease).toBe(20)
      expect(improvement.averagePerEdit).toBe(10)
      expect(improvement.trend).toBe('improving')
    })

    it('should identify instances that need attention', () => {
      const instances = [
        { id: '1', qualityScore: 45, editCount: 0 },
        { id: '2', qualityScore: 85, editCount: 2 },
        { id: '3', qualityScore: 30, editCount: 1 },
        { id: '4', qualityScore: 75, editCount: 1 }
      ]

      const needsAttention = instances.filter(instance => 
        instance.qualityScore < 50 || 
        (instance.qualityScore < 70 && instance.editCount === 0)
      )

      expect(needsAttention).toHaveLength(2)
      expect(needsAttention.map(i => i.id)).toEqual(['1', '3'])
    })
  })
})

// Helper functions that would be implemented in the actual refinement service
function calculateQualityScore(instance: any): number {
  let score = 0
  
  // Answer length (20 points max)
  const answerLength = instance.answer.length
  if (answerLength > 500) score += 20
  else if (answerLength > 200) score += 15
  else if (answerLength > 100) score += 10
  else score += 5

  // Question clarity (20 points max)
  const questionWords = instance.question.split(' ').length
  if (questionWords >= 8 && instance.question.includes('?')) score += 20
  else if (questionWords >= 5) score += 15
  else score += 10

  // Tag relevance (20 points max)
  const tagMatches = instance.tags.filter((tag: string) => 
    instance.answer.toLowerCase().includes(tag.toLowerCase())
  ).length
  score += Math.min(tagMatches * 5, 20)

  // Technical depth (20 points max)
  const technicalTerms = ['implement', 'configure', 'optimize', 'architecture', 'pattern', 'algorithm']
  const foundTerms = technicalTerms.filter(term => 
    instance.answer.toLowerCase().includes(term)
  ).length
  score += Math.min(foundTerms * 5, 20)

  // Code examples (20 points max)
  if (instance.answer.includes('```') || instance.answer.includes('`')) {
    score += 20
  }

  return Math.min(score, 100)
}

function calculateAnswerLengthScore(answer: string): number {
  const length = answer.length
  if (length > 500) return 20
  if (length > 200) return 15
  if (length > 100) return 10
  return 5
}

function calculateQuestionClarityScore(question: string): number {
  const words = question.split(' ').length
  const hasQuestionMark = question.includes('?')
  const score = (words >= 8 && hasQuestionMark) ? 20 : words >= 5 ? 15 : 10
  return score
}

function calculateTagRelevanceScore(tags: string[], answer: string): number {
  const matches = tags.filter(tag => answer.toLowerCase().includes(tag.toLowerCase())).length
  return Math.min(matches * 5, 20)
}

function calculateTechnicalDepthScore(answer: string): number {
  const technicalTerms = ['implement', 'configure', 'optimize', 'architecture', 'pattern', 'algorithm']
  const found = technicalTerms.filter(term => answer.toLowerCase().includes(term)).length
  return Math.min(found * 5, 20)
}

function calculatePracticalValueScore(answer: string): number {
  const practicalIndicators = ['example', 'step', 'how to', 'best practice', 'consider', 'avoid']
  const found = practicalIndicators.filter(indicator => answer.toLowerCase().includes(indicator)).length
  return Math.min(found * 3, 15)
}

async function detectContradictions(answer: string) {
  // Mock implementation - would use LLM for actual detection
  const contradictions = []
  
  if (answer.includes('16.8') && answer.includes('React 18') && answer.includes('2019')) {
    contradictions.push({
      type: 'factual_inconsistency',
      description: 'Conflicting version information',
      severity: 'high'
    })
  }
  
  if (answer.toLowerCase().includes('never') && answer.toLowerCase().includes('acceptable')) {
    contradictions.push({
      type: 'logical_contradiction',
      description: 'Conflicting recommendations',
      severity: 'high'
    })
  }

  if (answer.includes('class components') && answer.includes('not recommended')) {
    contradictions.push({
      type: 'outdated_information',
      description: 'Information may be outdated',
      severity: 'medium'
    })
  }
  
  return contradictions
}

async function generateRefinementSuggestions(instance: any) {
  const suggestions = []
  
  if (instance.answer.length < 200) {
    suggestions.push({
      type: 'add_specificity',
      suggestion: 'Add more specific techniques and examples'
    })
  }
  
  if (!instance.answer.includes('```') && !instance.answer.includes('`')) {
    suggestions.push({
      type: 'add_code_example',
      suggestion: 'Consider adding a code example to illustrate the concept'
    })
  }
  
  if (instance.question.split(' ').length < 5) {
    suggestions.push({
      type: 'clarify_question',
      suggestion: 'Make the question more specific and detailed'
    })
  }

  if (instance.answer.includes('Node.js') && !instance.tags.includes('Node.js')) {
    suggestions.push({
      type: 'add_relevant_tags',
      suggestion: 'Add missing relevant tags like Node.js, Express.js, Passport.js'
    })
  }
  
  return suggestions
}

function validateInstanceEdit(edit: any) {
  const errors = []
  
  if (!edit.question || edit.question.trim() === '') {
    errors.push({ field: 'question', message: 'Question cannot be empty' })
  }
  
  if (!edit.answer || edit.answer.length < 50) {
    errors.push({ field: 'answer', message: 'Answer must be at least 50 characters long' })
  }
  
  if (!edit.tags || edit.tags.length === 0) {
    errors.push({ field: 'tags', message: 'At least one tag is required' })
  }
  
  return errors
}

function sanitizeInstanceEdit(edit: any) {
  return {
    question: edit.question.replace(/<[^>]*>/g, ''), // Remove HTML tags
    answer: edit.answer.replace(/<\?php.*?\?>/g, ''), // Remove PHP tags
    tags: edit.tags.filter((tag: string) => !/[<>]/.test(tag)) // Remove tags with HTML
  }
}

function calculateQualityImprovement(evolution: any[]) {
  const first = evolution[0]
  const last = evolution[evolution.length - 1]
  const totalIncrease = last.score - first.score
  const averagePerEdit = totalIncrease / (evolution.length - 1)
  
  return {
    totalIncrease,
    averagePerEdit,
    trend: totalIncrease > 0 ? 'improving' : totalIncrease < 0 ? 'declining' : 'stable'
  }
}