import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/langset_test'
process.env.OPENAI_API_KEY = 'mock-openai-key'
process.env.PINECONE_API_KEY = 'mock-pinecone-key'
process.env.PINECONE_INDEX_NAME = 'langset-test'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock'
process.env.BETTER_AUTH_SECRET = 'mock-auth-secret'
process.env.BETTER_AUTH_URL = 'http://localhost:3000'

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock crypto for Node.js compatibility
const crypto = require('crypto')
global.crypto = {
  randomUUID: () => crypto.randomUUID(),
}

// Mock fetch globally
global.fetch = jest.fn()

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})