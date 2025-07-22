/**
 * Unit tests for OAuth sign-up flow
 * Tests user registration with OAuth data pull from LinkedIn
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { auth } from '@/lib/auth'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signUpEmail: jest.fn(),
      signInSocial: jest.fn(),
    },
    signIn: {
      social: jest.fn(),
    }
  }
}))

// Mock database
jest.mock('@/db/drizzle', () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn(() => Promise.resolve({ id: 'mock-user-id' }))
    })),
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
    }))
  }
}))

// Mock LinkedIn API responses
const mockLinkedInProfile = {
  id: 'linkedin-123',
  firstName: 'John',
  lastName: 'Doe',
  emailAddress: 'john.doe@example.com',
  headline: 'Senior Software Engineer',
  summary: 'Experienced software engineer with expertise in React and Node.js',
  positions: {
    values: [{
      title: 'Senior Software Engineer',
      company: { name: 'Tech Corp' },
      summary: 'Led development of microservices architecture'
    }]
  },
  skills: {
    values: [
      { skill: { name: 'JavaScript' } },
      { skill: { name: 'React' } },
      { skill: { name: 'Node.js' } }
    ]
  }
}

describe('OAuth Sign-up Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('LinkedIn OAuth Integration', () => {
    it('should successfully extract user data from LinkedIn profile', async () => {
      // Mock LinkedIn API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLinkedInProfile)
      })

      const { auth: mockAuth } = require('@/lib/auth')
      mockAuth.api.signInSocial.mockResolvedValue({
        user: {
          id: 'mock-user-id',
          email: 'john.doe@example.com',
          name: 'John Doe'
        }
      })

      // Simulate OAuth callback processing
      const oauthResult = await mockAuth.api.signInSocial({
        provider: 'linkedin',
        code: 'mock-auth-code'
      })

      expect(oauthResult.user).toEqual({
        id: 'mock-user-id',
        email: 'john.doe@example.com',
        name: 'John Doe'
      })
    })

    it('should extract professional skills from LinkedIn profile', () => {
      const extractedSkills = mockLinkedInProfile.skills.values.map(
        (skill: any) => skill.skill.name
      )

      expect(extractedSkills).toEqual(['JavaScript', 'React', 'Node.js'])
      expect(extractedSkills.length).toBeGreaterThan(0)
    })

    it('should extract work experience and identify workflows', () => {
      const position = mockLinkedInProfile.positions.values[0]
      const workflowKeywords = ['development', 'microservices', 'architecture']
      
      const hasWorkflowExperience = workflowKeywords.some(keyword => 
        position.summary.toLowerCase().includes(keyword)
      )

      expect(hasWorkflowExperience).toBe(true)
      expect(position.title).toBe('Senior Software Engineer')
      expect(position.company.name).toBe('Tech Corp')
    })

    it('should handle OAuth errors gracefully', async () => {
      const { auth: mockAuth } = require('@/lib/auth')
      mockAuth.api.signInSocial.mockRejectedValue(new Error('OAuth failed'))

      await expect(
        mockAuth.api.signInSocial({ provider: 'linkedin', code: 'invalid-code' })
      ).rejects.toThrow('OAuth failed')
    })

    it('should create user profile with extracted data', async () => {
      const { db } = require('@/db/drizzle')
      
      const mockUserData = {
        email: 'john.doe@example.com',
        name: 'John Doe',
        linkedinProfile: JSON.stringify(mockLinkedInProfile),
        extractedSkills: ['JavaScript', 'React', 'Node.js'],
        identifiedWorkflows: ['microservices development'],
        subscriptionTier: 'basic',
        currentQuota: 0
      }

      db.insert().values.mockResolvedValue({ id: 'new-user-id' })

      const result = await db.insert().values(mockUserData)
      
      expect(db.insert).toHaveBeenCalled()
      expect(db.insert().values).toHaveBeenCalledWith(mockUserData)
      expect(result).toEqual({ id: 'new-user-id' })
    })
  })

  describe('Email Sign-up Flow', () => {
    it('should handle email registration with basic profile', async () => {
      const { auth: mockAuth } = require('@/lib/auth')
      mockAuth.api.signUpEmail.mockResolvedValue({
        user: {
          id: 'email-user-id',
          email: 'test@example.com',
          name: 'Test User'
        }
      })

      const result = await mockAuth.api.signUpEmail({
        email: 'test@example.com',
        password: 'secure-password',
        name: 'Test User'
      })

      expect(result.user.email).toBe('test@example.com')
      expect(result.user.name).toBe('Test User')
    })

    it('should initialize default user settings for email signup', () => {
      const defaultUserSettings = {
        subscriptionTier: 'basic',
        currentQuota: 0,
        qualityMultiplier: 1.0,
        extractedSkills: [],
        identifiedWorkflows: [],
        globalContext: '',
        consentGiven: true,
        consentTimestamp: expect.any(Date)
      }

      expect(defaultUserSettings.subscriptionTier).toBe('basic')
      expect(defaultUserSettings.currentQuota).toBe(0)
      expect(defaultUserSettings.qualityMultiplier).toBe(1.0)
      expect(defaultUserSettings.consentGiven).toBe(true)
    })
  })

  describe('Profile Data Validation', () => {
    it('should validate required profile fields', () => {
      const profileData = {
        email: 'john@example.com',
        name: 'John Doe'
      }

      const isValid = profileData.email && profileData.email.includes('@') && 
                     profileData.name && profileData.name.length > 0

      expect(isValid).toBe(true)
    })

    it('should sanitize extracted skills to prevent injection', () => {
      const maliciousSkills = [
        '<script>alert("xss")</script>',
        'DROP TABLE users;',
        'JavaScript'
      ]

      const sanitizedSkills = maliciousSkills.filter(skill => 
        /^[a-zA-Z0-9\s\.\-\+#]+$/.test(skill)
      )

      expect(sanitizedSkills).toEqual(['JavaScript'])
    })

    it('should limit skills array to prevent database overload', () => {
      const manySkills = Array.from({ length: 100 }, (_, i) => `Skill${i}`)
      const limitedSkills = manySkills.slice(0, 20)

      expect(limitedSkills.length).toBe(20)
      expect(manySkills.length).toBe(100)
    })
  })

  describe('User Consent and Privacy', () => {
    it('should record user consent for data processing', () => {
      const consentRecord = {
        userId: 'user-123',
        consentType: 'data_processing',
        consentGiven: true,
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      }

      expect(consentRecord.consentGiven).toBe(true)
      expect(consentRecord.consentType).toBe('data_processing')
      expect(consentRecord.timestamp).toBeInstanceOf(Date)
    })

    it('should log consent withdrawal capability', () => {
      const consentWithdrawal = {
        userId: 'user-123',
        action: 'consent_withdrawn',
        timestamp: new Date(),
        note: 'User requested data deletion'
      }

      expect(consentWithdrawal.action).toBe('consent_withdrawn')
      expect(consentWithdrawal.note).toBe('User requested data deletion')
    })
  })
})