/**
 * Unit tests for LangGraph interview workflow
 * Tests interview node, threshold triggers, and workflow orchestration
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { 
  createInterviewWorkflow, 
  GlobalSessionManager, 
  InterviewWorkflowState,
  WORKFLOW_CONFIG 
} from '@/lib/langgraph/core-workflow'

// Mock dependencies
jest.mock('@langchain/langgraph', () => ({
  StateGraph: jest.fn().mockImplementation(() => ({
    addNode: jest.fn(),
    addConditionalEdges: jest.fn(),
    setEntryPoint: jest.fn(),
    compile: jest.fn(() => ({
      invoke: jest.fn(),
      stream: jest.fn()
    }))
  })),
  END: 'END',
  START: 'START'
}))

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn()
  }))
}))

jest.mock('@langchain/core/messages', () => ({
  HumanMessage: jest.fn(),
  AIMessage: jest.fn(),
  SystemMessage: jest.fn()
}))

jest.mock('@/db/drizzle', () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn(() => Promise.resolve({ id: 'mock-session-id' }))
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve([{
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            extractedSkills: ['JavaScript', 'React'],
            identifiedWorkflows: ['development'],
            globalContext: 'Previous context'
          }]))
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

// Mock quota service
jest.mock('@/lib/billing/quota-service', () => ({
  enforceQuotaCheck: jest.fn(() => Promise.resolve()),
  checkAndConsumeQuota: jest.fn(() => Promise.resolve({
    allowed: true,
    newQuotaStatus: { current: 1, remaining: 19, limit: 20 }
  }))
}))

describe('LangGraph Interview Workflow', () => {
  let mockWorkflowState: InterviewWorkflowState

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockWorkflowState = {
      user_id: 'user-123',
      session_id: 'session-456',
      tab_id: 'tab-789',
      global_context: 'Previous conversation context',
      conversation_history: [
        {
          question: 'What technologies do you use?',
          answer: 'I primarily work with React and Node.js',
          timestamp: new Date(),
          skills_extracted: ['React', 'Node.js'],
          workflows_identified: ['web development']
        }
      ],
      current_question: '',
      extracted_skills: ['React', 'Node.js'],
      identified_workflows: ['web development'],
      threshold_metrics: {
        conversation_depth: 0,
        skill_diversity: 0,
        workflow_complexity: 0,
        context_richness: 0,
        overall_score: 0
      },
      generation_ready: false,
      generated_instances: [],
      next_node: 'interview'
    }
  })

  describe('Interview Node', () => {
    it('should generate contextual questions based on conversation history', async () => {
      const mockLLMResponse = {
        content: 'Can you describe your experience with React hooks and state management?'
      }

      WORKFLOW_CONFIG.model.invoke = jest.fn().mockResolvedValue(mockLLMResponse)

      // Import the interview node function (would need to export it)
      const { interviewNode } = require('@/lib/langgraph/core-workflow')
      const result = await interviewNode(mockWorkflowState)

      expect(WORKFLOW_CONFIG.model.invoke).toHaveBeenCalled()
      expect(result.current_question).toBe(mockLLMResponse.content)
      expect(result.next_node).toBe('threshold_check')
    })

    it('should build on previously identified skills', async () => {
      const mockLLMResponse = {
        content: 'Tell me about your Node.js deployment strategies'
      }

      WORKFLOW_CONFIG.model.invoke = jest.fn().mockResolvedValue(mockLLMResponse)

      const { interviewNode } = require('@/lib/langgraph/core-workflow')
      await interviewNode(mockWorkflowState)

      const callArgs = WORKFLOW_CONFIG.model.invoke.mock.calls[0][0][0]
      expect(callArgs.content || callArgs).toContain('Node.js')
      expect(callArgs.content || callArgs).toContain('React')
    })

    it('should handle interview node errors gracefully', async () => {
      WORKFLOW_CONFIG.model.invoke = jest.fn().mockRejectedValue(new Error('LLM API Error'))

      const { interviewNode } = require('@/lib/langgraph/core-workflow')
      const result = await interviewNode(mockWorkflowState)

      expect(result.error_message).toContain('Interview generation failed')
      expect(result.next_node).toBe('error')
    })
  })

  describe('Threshold Check Node', () => {
    it('should calculate advanced threshold metrics', async () => {
      mockWorkflowState.conversation_history = [
        {
          question: 'What technologies do you use?',
          answer: 'I work with React, Node.js, and PostgreSQL. I use React hooks for state management and have experience with Next.js for server-side rendering. For backend services, I implement REST APIs with Express.js and use PostgreSQL for data persistence.',
          timestamp: new Date(),
          skills_extracted: ['React', 'Node.js', 'PostgreSQL'],
          workflows_identified: ['full-stack development', 'API development']
        },
        {
          question: 'How do you handle deployment?',
          answer: 'I use Docker for containerization and deploy to AWS ECS. I have CI/CD pipelines set up with GitHub Actions that run tests, build images, and deploy to staging and production environments.',
          timestamp: new Date(),
          skills_extracted: ['Docker', 'AWS', 'CI/CD'],
          workflows_identified: ['DevOps', 'deployment automation']
        }
      ]

      const { thresholdCheckNode } = require('@/lib/langgraph/core-workflow')
      const result = await thresholdCheckNode(mockWorkflowState)

      expect(result.threshold_metrics).toBeDefined()
      expect(result.threshold_metrics.conversation_depth).toBeGreaterThan(0)
      expect(result.threshold_metrics.skill_diversity).toBeGreaterThan(0)
      expect(result.threshold_metrics.workflow_complexity).toBeGreaterThan(0)
      expect(result.threshold_metrics.overall_score).toBeGreaterThan(0)
    })

    it('should trigger instance generation when threshold is met', async () => {
      mockWorkflowState.conversation_history = Array.from({ length: 8 }, (_, i) => ({
        question: `Question ${i}`,
        answer: `Detailed answer with technical content about software development processes and methodologies that demonstrates deep expertise in the field ${i}`,
        timestamp: new Date(),
        skills_extracted: [`Skill${i}`, `TechStack${i}`],
        workflows_identified: [`Workflow${i}`]
      }))

      mockWorkflowState.extracted_skills = ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker']
      mockWorkflowState.identified_workflows = ['full-stack dev', 'DevOps', 'testing']

      const { thresholdCheckNode } = require('@/lib/langgraph/core-workflow')
      const result = await thresholdCheckNode(mockWorkflowState)

      expect(result.generation_ready).toBe(true)
      expect(result.next_node).toBe('generate_instances')
      expect(result.threshold_metrics.overall_score).toBeGreaterThanOrEqual(75)
    })

    it('should continue interview when threshold not met', async () => {
      mockWorkflowState.conversation_history = [
        {
          question: 'What do you do?',
          answer: 'I code',
          timestamp: new Date(),
          skills_extracted: [],
          workflows_identified: []
        }
      ]

      const { thresholdCheckNode } = require('@/lib/langgraph/core-workflow')
      const result = await thresholdCheckNode(mockWorkflowState)

      expect(result.generation_ready).toBe(false)
      expect(result.next_node).toBe('interview')
      expect(result.threshold_metrics.overall_score).toBeLessThan(75)
    })

    it('should enforce maximum question limit', async () => {
      mockWorkflowState.conversation_history = Array.from({ length: 25 }, (_, i) => ({
        question: `Question ${i}`,
        answer: `Answer ${i}`,
        timestamp: new Date(),
        skills_extracted: [],
        workflows_identified: []
      }))

      const { thresholdCheckNode } = require('@/lib/langgraph/core-workflow')
      const result = await thresholdCheckNode(mockWorkflowState)

      expect(result.generation_ready).toBe(true)
      expect(result.next_node).toBe('generate_instances')
    })
  })

  describe('Generate Instances Node', () => {
    it('should enforce quota before generating instances', async () => {
      const { enforceQuotaCheck } = require('@/lib/billing/quota-service')
      
      mockWorkflowState.generation_ready = true

      const { generateInstancesNode } = require('@/lib/langgraph/core-workflow')
      await generateInstancesNode(mockWorkflowState)

      expect(enforceQuotaCheck).toHaveBeenCalledWith(
        'user-123', 
        WORKFLOW_CONFIG.generation.instances_per_session
      )
    })

    it('should generate valid JSON instances', async () => {
      const mockInstances = [
        {
          question: 'How do you implement React hooks?',
          answer: 'React hooks are functions that let you use state and lifecycle features...',
          tags: ['React', 'JavaScript', 'Frontend'],
          category: 'web-development',
          difficulty: 'intermediate',
          confidence_score: 85
        },
        {
          question: 'What are the benefits of TypeScript?',
          answer: 'TypeScript provides static type checking, better IDE support...',
          tags: ['TypeScript', 'JavaScript', 'Development'],
          category: 'programming-languages',
          difficulty: 'beginner',
          confidence_score: 90
        }
      ]

      const mockLLMResponse = {
        content: JSON.stringify(mockInstances)
      }

      WORKFLOW_CONFIG.model.invoke = jest.fn().mockResolvedValue(mockLLMResponse)

      const { generateInstancesNode } = require('@/lib/langgraph/core-workflow')
      const result = await generateInstancesNode(mockWorkflowState)

      expect(result.generated_instances).toHaveLength(2)
      expect(result.generated_instances[0]).toMatchObject({
        question: expect.any(String),
        answer: expect.any(String),
        tags: expect.any(Array),
        category: expect.any(String),
        difficulty: expect.any(String)
      })
      expect(result.next_node).toBe('context_update')
    })

    it('should handle malformed JSON gracefully', async () => {
      const mockLLMResponse = {
        content: 'Invalid JSON { malformed'
      }

      WORKFLOW_CONFIG.model.invoke = jest.fn().mockResolvedValue(mockLLMResponse)

      const { generateInstancesNode } = require('@/lib/langgraph/core-workflow')
      const result = await generateInstancesNode(mockWorkflowState)

      expect(result.error_message).toContain('Failed to parse generated instances')
      expect(result.next_node).toBe('error')
    })

    it('should validate instance quality', async () => {
      const mockInstances = [
        {
          question: 'Good question with sufficient detail?',
          answer: 'This is a comprehensive answer that provides detailed information about the topic and includes specific examples and best practices.',
          tags: ['tag1', 'tag2', 'tag3'],
          category: 'development',
          difficulty: 'intermediate'
        },
        {
          question: 'Bad',
          answer: 'Short',
          tags: [],
          category: '',
          difficulty: ''
        }
      ]

      const mockLLMResponse = {
        content: JSON.stringify(mockInstances)
      }

      WORKFLOW_CONFIG.model.invoke = jest.fn().mockResolvedValue(mockLLMResponse)

      const { generateInstancesNode } = require('@/lib/langgraph/core-workflow')
      const result = await generateInstancesNode(mockWorkflowState)

      // Only the valid instance should pass validation
      expect(result.generated_instances).toHaveLength(1)
      expect(result.generated_instances[0].question).toBe('Good question with sufficient detail?')
    })
  })

  describe('Context Update Node', () => {
    it('should compress context when over token limit', async () => {
      const longContext = 'A'.repeat(15000) // Exceeds token limit
      mockWorkflowState.global_context = longContext

      const mockCompressedResponse = {
        content: 'Compressed context maintaining key information'
      }

      WORKFLOW_CONFIG.model.invoke = jest.fn().mockResolvedValue(mockCompressedResponse)

      const { contextUpdateNode } = require('@/lib/langgraph/core-workflow')
      const result = await contextUpdateNode(mockWorkflowState)

      expect(WORKFLOW_CONFIG.model.invoke).toHaveBeenCalled()
      expect(result.global_context).toBe(mockCompressedResponse.content)
      expect(result.global_context.length).toBeLessThan(longContext.length)
    })

    it('should preserve context when under token limit', async () => {
      const shortContext = 'Short context that fits within limits'
      mockWorkflowState.global_context = shortContext

      const { contextUpdateNode } = require('@/lib/langgraph/core-workflow')
      const result = await contextUpdateNode(mockWorkflowState)

      expect(result.global_context).toBe(shortContext)
      expect(result.next_node).toBe('complete')
    })
  })

  describe('GlobalSessionManager', () => {
    it('should initialize new session with global context', async () => {
      const session = await GlobalSessionManager.initializeSession('user-123', 'tab-456')

      expect(session.user_id).toBe('user-123')
      expect(session.tab_id).toBe('tab-456')
      expect(session.session_id).toBeDefined()
      expect(session.extracted_skills).toEqual(['JavaScript', 'React'])
      expect(session.global_context).toBe('Previous context')
    })

    it('should manage multiple tab sessions', async () => {
      await GlobalSessionManager.initializeSession('user-123', 'tab-1')
      await GlobalSessionManager.initializeSession('user-123', 'tab-2')

      const session1 = GlobalSessionManager.getSession('user-123', 'tab-1')
      const session2 = GlobalSessionManager.getSession('user-123', 'tab-2')

      expect(session1).not.toBeNull()
      expect(session2).not.toBeNull()
      expect(session1?.tab_id).toBe('tab-1')
      expect(session2?.tab_id).toBe('tab-2')
    })

    it('should sync global context across sessions', () => {
      const updates = {
        extracted_skills: ['React', 'Node.js', 'TypeScript'],
        global_context: 'Updated context'
      }

      GlobalSessionManager.updateSession('user-123', 'tab-1', updates)

      const session = GlobalSessionManager.getSession('user-123', 'tab-1')
      expect(session?.extracted_skills).toEqual(['React', 'Node.js', 'TypeScript'])
      expect(session?.global_context).toBe('Updated context')
    })

    it('should close sessions and save state', async () => {
      await GlobalSessionManager.initializeSession('user-123', 'tab-close')
      await GlobalSessionManager.closeSession('user-123', 'tab-close')

      const session = GlobalSessionManager.getSession('user-123', 'tab-close')
      expect(session).toBeNull()
    })
  })
})