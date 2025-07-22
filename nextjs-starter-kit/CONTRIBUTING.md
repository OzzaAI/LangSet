# Contributing to LangSet MVP

Thank you for your interest in contributing to LangSet! This document provides guidelines and information for contributors.

## 🎯 Project Vision

LangSet aims to create the most ethical, transparent, and fair AI data marketplace, where domain experts are properly compensated for their knowledge while maintaining strict privacy and quality standards.

## 🤝 How to Contribute

### Types of Contributions

We welcome several types of contributions:

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Implement features, fix bugs, or improve performance
- **Documentation**: Improve guides, API docs, or code comments
- **Testing**: Add test coverage or improve existing tests
- **Security**: Report vulnerabilities or improve security measures

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js 18+ installed
- Git configured with your GitHub account
- Basic understanding of TypeScript and React
- Familiarity with the tech stack (Next.js, PostgreSQL, OpenAI, Pinecone)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/langset-mvp.git
   cd langset-mvp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Fill in your API keys and database URL
   ```

4. **Database Setup**
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit push
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Run Tests**
   ```bash
   npm run test
   npm run test:e2e
   ```

## 📋 Development Workflow

### 1. Issue Creation

Before starting work:
- Check existing issues to avoid duplication
- Create an issue describing the bug/feature
- Wait for maintainer feedback before starting work on large features
- Use appropriate issue templates

### 2. Branch Strategy

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description

# For security fixes
git checkout -b security/vulnerability-description
```

### 3. Code Changes

Follow these guidelines:
- Write clean, readable TypeScript code
- Add appropriate type annotations
- Include unit tests for new functionality
- Update documentation as needed
- Follow the existing code style

### 4. Testing Requirements

All contributions must include appropriate tests:

```bash
# Unit tests (required for all new functions)
npm run test

# E2E tests (required for user-facing features)
npm run test:e2e

# Performance tests (for performance-related changes)
npm run test:load
```

### 5. Commit Guidelines

Use conventional commits:

```bash
# Format: type(scope): description
git commit -m "feat(auth): add LinkedIn OAuth integration"
git commit -m "fix(interview): resolve threshold calculation bug"
git commit -m "docs(api): update authentication endpoints"
git commit -m "test(billing): add subscription workflow tests"
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `test`: Test additions/modifications
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `security`: Security improvements
- `chore`: Maintenance tasks

### 6. Pull Request Process

1. **Pre-PR Checklist**
   - [ ] Code compiles without errors
   - [ ] All tests pass
   - [ ] Security scan passes
   - [ ] Documentation updated
   - [ ] Self-review completed

2. **PR Creation**
   - Use the PR template
   - Provide clear description of changes
   - Link related issues
   - Add screenshots for UI changes
   - Request appropriate reviewers

3. **Review Process**
   - Address reviewer feedback promptly
   - Update tests if requested
   - Maintain clean commit history

## 🎨 Code Style Guide

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types and clear naming
interface UserProfile {
  id: string;
  email: string;
  subscriptionTier: 'basic' | 'pro' | 'enterprise';
  createdAt: Date;
}

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // Implementation
}

// ❌ Bad: Any types and unclear naming
function getUser(id: any): any {
  // Implementation
}
```

### Component Guidelines

```tsx
// ✅ Good: Typed props and clear structure
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ children, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${disabled ? 'opacity-50' : ''}`}
    >
      {children}
    </button>
  );
}

// ❌ Bad: Untyped props and unclear structure
export function Button(props: any) {
  return <button {...props} />;
}
```

### API Route Guidelines

```typescript
// ✅ Good: Proper error handling and types
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ValidationSchema.parse(body);
    
    const result = await processData(validatedData);
    return NextResponse.json({ data: result });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ❌ Bad: No error handling or validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await processData(body);
  return NextResponse.json(result);
}
```

## 🧪 Testing Guidelines

### Unit Testing

```typescript
// ✅ Good: Comprehensive test coverage
describe('UserQuotaService', () => {
  it('should enforce daily quota limits', async () => {
    const userId = 'test-user';
    const quotaService = new UserQuotaService();
    
    // Test quota enforcement
    const result = await quotaService.checkQuota(userId, 25);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should handle subscription upgrades', async () => {
    // Test implementation
  });
});

// ❌ Bad: Incomplete or unclear tests
describe('quota', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
```

### E2E Testing

```typescript
// ✅ Good: Full user journey testing
describe('Interview Completion Flow', () => {
  it('should complete full interview to dataset creation', () => {
    cy.loginWithLinkedIn();
    cy.startInterviewSession();
    cy.completeInterviewQuestions(answers);
    cy.get('[data-testid="instances-generated"]').should('be.visible');
    cy.submitDataset('test-dataset');
    cy.get('[data-testid="submission-success"]').should('contain', 'Success');
  });
});
```

## 🛡️ Security Guidelines

### Security Requirements

All contributions must follow security best practices:

1. **Input Validation**
   ```typescript
   // ✅ Always validate and sanitize user input
   const schema = z.object({
     email: z.string().email(),
     content: z.string().max(5000)
   });
   const validatedData = schema.parse(input);
   const sanitizedContent = sanitizeHTML(validatedData.content);
   ```

2. **Authentication Checks**
   ```typescript
   // ✅ Always verify authentication for protected routes
   const session = await auth.api.getSession({ headers: await headers() });
   if (!session?.session?.userId) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```

3. **Environment Variables**
   ```typescript
   // ✅ Never expose secrets to client-side
   const apiKey = process.env.OPENAI_API_KEY; // Server-side only
   
   // ❌ Don't expose secrets
   const publicKey = process.env.SECRET_KEY; // Don't do this
   ```

### Security Review Process

For security-related contributions:
1. Create issues with `security` label
2. Follow responsible disclosure for vulnerabilities
3. Include security impact assessment
4. Add appropriate tests for security measures

## 📚 Documentation Standards

### Code Documentation

```typescript
/**
 * Processes user interview responses and generates high-quality training instances
 * @param userId - The ID of the user conducting the interview
 * @param sessionId - The current interview session ID
 * @param responses - Array of question-answer pairs from the interview
 * @returns Promise resolving to generated instances with quality scores
 * @throws {QuotaExceededException} When user exceeds daily instance generation limit
 * @throws {ValidationError} When responses fail quality validation
 */
export async function generateInstances(
  userId: string,
  sessionId: string,
  responses: InterviewResponse[]
): Promise<GeneratedInstance[]> {
  // Implementation
}
```

### API Documentation

```typescript
/**
 * POST /api/interview/start
 * 
 * Starts a new interview session for knowledge extraction
 * 
 * Request Body:
 * {
 *   "userId": string,
 *   "domain": string (optional),
 *   "sessionConfig": {
 *     "maxQuestions": number,
 *     "targetInstances": number
 *   }
 * }
 * 
 * Response:
 * {
 *   "sessionId": string,
 *   "firstQuestion": string,
 *   "status": "active"
 * }
 * 
 * Errors:
 * - 401: User not authenticated
 * - 429: Quota exceeded
 * - 500: Internal server error
 */
```

## 🐛 Bug Reports

When reporting bugs, include:

### Bug Report Template

```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 96]
- Node.js version: [e.g. 18.17.0]

**Additional Context**
Any other context about the problem.

**Screenshots**
If applicable, add screenshots.
```

## ✨ Feature Requests

For new features, include:

### Feature Request Template

```markdown
**Feature Summary**
Brief description of the feature.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
Detailed description of the proposed feature.

**Alternative Solutions**
Other approaches considered.

**Additional Context**
Any other context, mockups, or examples.

**Acceptance Criteria**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

## 🏆 Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- GitHub repository contributors page
- Release notes for significant contributions
- Special recognition for security contributions

## 📞 Getting Help

If you need help:

1. **GitHub Discussions**: For general questions and discussions
2. **GitHub Issues**: For bugs and feature requests
3. **Discord Community**: For real-time chat and support
4. **Email**: security@langset.dev for security-related issues

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

### Our Standards

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome people of all backgrounds and experience levels
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Professional**: Maintain professional communication

## 📋 Review Process

### Review Criteria

Pull requests are reviewed for:
- **Functionality**: Does it work as intended?
- **Code Quality**: Is it readable and maintainable?
- **Security**: Are there any security implications?
- **Performance**: Does it maintain acceptable performance?
- **Testing**: Is it adequately tested?
- **Documentation**: Is it properly documented?

### Review Timeline

- **Small fixes**: 1-2 days
- **Features**: 3-7 days
- **Security fixes**: Priority review within 24 hours

Thank you for contributing to LangSet! Together, we're building the future of ethical AI data marketplaces. 🚀