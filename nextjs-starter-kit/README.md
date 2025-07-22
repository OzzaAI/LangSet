# LangSet MVP - Ethical AI Data Marketplace

**LangSet** is a production-ready MVP for an ethical AI data marketplace that enables professionals to monetize their domain expertise through high-quality, anonymized training data.

## 🎯 MVP Overview

LangSet revolutionizes how AI training data is collected by creating a fair, transparent marketplace where domain experts are compensated for their knowledge while maintaining strict ethical standards and privacy protection.

### Core Value Proposition
- **For Contributors**: Monetize your professional expertise through quality-based compensation
- **For Buyers**: Access high-quality, ethically sourced, anonymized training data
- **For AI Development**: Enable responsible AI training with transparent data provenance

## ✨ Key Features

### 🧠 LangGraph Orchestration
- **Intelligent Interview System**: AI-driven conversations that extract professional knowledge
- **Multi-Session Management**: Seamless experience across browser tabs with shared context
- **Adaptive Threshold Detection**: Smart algorithms determine when sufficient knowledge is captured
- **Quality-First Generation**: Only high-quality instances proceed to marketplace

### 🔍 Pinecone Vector Database
- **Semantic Instance Search**: Find related content through vector similarity
- **Auto-Bundling**: Intelligent dataset organization based on topic clustering
- **Duplicate Detection**: Prevent content repetition and ensure uniqueness
- **Scalable Architecture**: Enterprise-ready vector search infrastructure

### 💰 Ethical Monetization
- **Quality-Based Earnings**: 1-5 star quality scores translate to 0.5x-1.5x earnings multipliers
- **Transparent Pricing**: Clear per-instance pricing with quality bonuses
- **Fair Revenue Sharing**: Contributors retain ownership and control over their data
- **Subscription Tiers**: Basic (20/day), Pro (50/day), Enterprise (200/day) instance quotas

### 🔒 Privacy & Security
- **Advanced PII Detection**: Multi-layer scanning for personal information
- **Smart Anonymization**: Preserve technical knowledge while removing identifying information
- **Consent Management**: Granular user control over data usage and commercial rights
- **GDPR Compliance**: Full data protection regulation compliance with right to deletion

### 🎛️ Professional Workflow
- **Interview-to-Dataset Pipeline**: Streamlined process from knowledge capture to marketplace
- **Quality Refinement Tools**: Built-in editing and improvement suggestions
- **Real-time Collaboration**: Multi-user workspace support for team contributions
- **Performance Analytics**: Track earnings, quality scores, and marketplace performance

## 🏗️ Architecture Overview

```mermaid
graph TB
    A[User Interview] --> B[LangGraph Orchestration]
    B --> C[Threshold Analysis]
    C --> D[Instance Generation]
    D --> E[Quality Scoring]
    E --> F[Anonymization Engine]
    F --> G[Pinecone Vector DB]
    G --> H[Marketplace Listing]
    
    I[Billing System] --> J[Stripe Integration]
    J --> K[Quota Management]
    K --> B
    
    L[Security Layer] --> M[Rate Limiting]
    L --> N[Input Sanitization]
    L --> O[PII Detection]
    O --> F
```

### Tech Stack
- **Framework**: Next.js 14 with App Router and TypeScript
- **AI Orchestration**: LangChain + LangGraph for complex workflow management
- **Vector Database**: Pinecone for semantic search and similarity matching
- **LLM**: OpenAI GPT-4o/4o-mini with optimized model selection
- **Database**: PostgreSQL with Drizzle ORM for type safety
- **Authentication**: Better-auth with OAuth2 (LinkedIn, Google)
- **Payments**: Stripe for subscriptions and payouts
- **Security**: Multi-layer validation, rate limiting, and PII protection
- **Testing**: Jest for unit tests, Cypress for E2E testing
- **Performance**: Multi-tier caching, LLM optimization, load testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- OpenAI API key
- Pinecone account and API key
- Stripe account for payments
- LinkedIn OAuth credentials (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/langset-mvp.git
cd langset-mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Core Application
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secure-secret-key-32-chars-min
DATABASE_URL=postgresql://user:password@host:5432/langset

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=langset-instances
PINECONE_ENVIRONMENT=your-pinecone-environment

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Authentication (Optional)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Better Auth
BETTER_AUTH_SECRET=your-better-auth-secret-32-chars-min
BETTER_AUTH_URL=http://localhost:3000
```

### Database Setup

```bash
# Generate database schema
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit push

# (Optional) Seed with test data
npm run db:seed
```

### Development Server

```bash
# Start the development server
npm run dev

# Run tests
npm run test
npm run test:e2e

# Run performance tests
npm run test:load
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 📖 User Journey

### For Contributors
1. **Sign Up**: Register with LinkedIn OAuth to auto-extract professional skills
2. **Interview Session**: Engage in AI-driven conversations about your expertise
3. **Quality Review**: Review and refine generated instances for maximum quality
4. **Anonymization**: Approve privacy-preserving content transformation
5. **Marketplace**: Track performance, earnings, and quality metrics
6. **Monetization**: Receive quality-based compensation for valuable contributions

### For Data Buyers
1. **Browse Marketplace**: Search datasets by domain, quality score, and price
2. **Preview Content**: Review anonymized samples and quality metrics
3. **Purchase Datasets**: Secure transactions with usage rights management
4. **Integration**: Download or API access for training data integration
5. **Quality Assurance**: Rate content quality to maintain marketplace standards

## 🔧 Configuration & Customization

### Subscription Tiers
Modify `lib/billing/quota-service.ts` to adjust quota limits and pricing:

```typescript
export const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    instanceQuotaDaily: 20,
    price: 0,
    features: ['20 instances/day', 'Basic support']
  },
  pro: {
    name: 'Professional', 
    instanceQuotaDaily: 50,
    price: 19.99,
    features: ['50 instances/day', 'Priority support', 'Advanced analytics']
  }
};
```

### Quality Scoring
Customize quality calculations in `lib/instances/quality-scoring.ts`:

```typescript
export const QUALITY_MULTIPLIERS = {
  1: 0.5,  // 1-star quality = 50% earnings
  2: 0.7,  // 2-star quality = 70% earnings
  3: 1.0,  // 3-star quality = 100% earnings
  4: 1.2,  // 4-star quality = 120% earnings
  5: 1.5   // 5-star quality = 150% earnings
};
```

### Anonymization Rules
Configure PII detection patterns in `lib/security/input-sanitization.ts`:

```typescript
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  person_name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
  // Add custom patterns as needed
};
```

## 🧪 Testing

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### E2E Tests
```bash
# Run Cypress tests headless
npm run test:e2e

# Open Cypress GUI
npm run test:e2e:open
```

### Performance Testing
```bash
# Run load tests with 100 concurrent users
npm run test:load

# Light load test (10 users, 5 minutes)
npm run test:load:light

# Heavy load test (200 users, 30 minutes)
npm run test:load:heavy
```

## 📊 Monitoring & Analytics

### Performance Metrics
- **LLM Response Times**: Target <5s for 95% of requests
- **Cache Hit Rates**: Target >70% for frequent queries
- **API Response Times**: Target <1s for standard operations
- **Error Rates**: Target <1% for critical paths

### Security Monitoring
- **PII Detection Accuracy**: Continuous monitoring of anonymization effectiveness
- **Rate Limiting**: Track and adjust limits based on usage patterns
- **Authentication Security**: Monitor failed login attempts and suspicious activity

### Business Metrics
- **Quality Score Trends**: Track contributor quality improvement over time
- **Marketplace Activity**: Monitor dataset views, purchases, and ratings
- **Revenue Analytics**: Track earnings distribution and payout metrics

## 🛡️ Security & Compliance

### Security Features
- **Multi-Layer Input Validation**: XSS, SQL injection, and content filtering
- **Rate Limiting**: Configurable limits per endpoint and user type
- **PII Detection**: Advanced pattern matching and ML-based detection
- **Environment Security**: Secure handling of API keys and secrets
- **Session Security**: Secure session management with Better-auth

### Privacy Protection
- **Data Anonymization**: Sophisticated PII removal while preserving technical content
- **Consent Management**: Granular user control over data usage
- **Right to Deletion**: GDPR-compliant data removal processes
- **Data Lineage**: Complete tracking of data transformations

### Compliance
- **GDPR Ready**: Full compliance with EU data protection regulations
- **Data Processing Records**: Comprehensive audit trails
- **Consent Logging**: Detailed records of user permissions
- **Breach Notification**: Automated incident reporting systems

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Build for production
   npm run build
   
   # Start production server
   npm start
   ```

2. **Environment Variables**
   - Set all production API keys and secrets
   - Configure production database URLs
   - Update CORS and security headers

3. **Database Migration**
   ```bash
   # Run production migrations
   NODE_ENV=production npx drizzle-kit push
   ```

4. **Monitoring Setup**
   - Configure error tracking (Sentry recommended)
   - Set up performance monitoring
   - Enable security scanning

### Scaling Considerations
- **LLM Optimization**: Implement request batching and caching
- **Database Performance**: Use connection pooling and read replicas
- **Vector Search**: Scale Pinecone index for high-volume queries
- **Caching Strategy**: Multi-tier caching with Redis for production

## 📈 Roadmap & Future Enhancements

### Phase 2: Advanced Features
- **Multi-Modal Support**: Support for image, audio, and video content
- **Collaborative Datasets**: Team-based content creation workflows  
- **Advanced Analytics**: ML-powered insights and recommendations
- **API Marketplace**: Direct API access for training data consumers

### Phase 3: Enterprise Features
- **White-Label Solutions**: Custom branding for enterprise clients
- **Advanced Security**: SOC 2 compliance and enterprise security features
- **Custom Workflows**: Configurable data collection and processing pipelines
- **Integration Hub**: Pre-built integrations with popular ML platforms

## 🤝 Contributing

We welcome contributions to LangSet! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test && npm run test:e2e`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled with comprehensive type safety
- **Testing**: Maintain >80% code coverage for critical paths
- **Security**: All inputs must be validated and sanitized
- **Performance**: New features must meet performance benchmarks
- **Documentation**: Update relevant documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Full documentation site](https://docs.langset.dev)
- **Issues**: [GitHub Issues](https://github.com/your-org/langset-mvp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/langset-mvp/discussions)
- **Security**: Report security issues to security@langset.dev

---

**Built with ethical AI principles and modern web technologies.**

*LangSet enables the future of responsible AI training data creation.*