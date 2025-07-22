# LangSet MVP Development Roadmap

## Executive Summary
Transform the current basic starter kit into a fully functional ethical AI data marketplace MVP in 5 phases over 5 weeks. Current implementation is ~35% complete with UI frameworks in place but missing core functionality.

## Current State Analysis
- ✅ **UI Framework**: Next.js 14, Tailwind, shadcn/ui components
- ✅ **Authentication**: Better Auth with LinkedIn OAuth (basic)
- ✅ **Database**: Drizzle ORM with PostgreSQL schema
- ✅ **Progressive CTAs**: Implemented with instance thresholds
- ❌ **LLM Orchestration**: No LangGraph integration
- ❌ **Interview System**: No guided data collection
- ❌ **Quality Scoring**: Basic algorithm, no LLM evaluation
- ❌ **Vector Database**: No Pinecone integration
- ❌ **Anonymization**: No PII detection/removal
- ❌ **Revenue Distribution**: Incorrect platform fee (10% vs 20%)

---

## Phase 1: Refactor & Enhance Existing (Week 1)
**Goal**: Solidify foundation and fix critical gaps
**Duration**: 5 days
**Team**: 2 developers

### LinkedIn OAuth Enhancement
**Current Issue**: Basic profile collection, missing job history/skills
- **Day 1-2**: Expand LinkedIn OAuth scopes
  - Add `r_fullprofile` scope for detailed work history
  - Implement skills extraction from LinkedIn API
  - Store certifications and education data
- **Day 3**: Legal compliance improvements
  - Add IP disclaimers during signup
  - Implement consent tracking in database
  - Create terms of service acceptance flow

### Database Schema Fixes
**Current Issue**: Inconsistent field references, incorrect platform fee
- **Day 4**: Schema corrections
  - Fix `dataset.creatorId` vs `dataset.userId` inconsistencies
  - Update platform fee from 10% to 20% in schema
  - Add anonymization status fields
- **Day 5**: Data migration scripts
  - Create migration for existing data
  - Add indexes for performance optimization

### Success Metrics
- [ ] LinkedIn OAuth collects 15+ profile data points
- [ ] Legal compliance score: 100% (all required disclaimers)
- [ ] Database integrity: 0 referential errors
- [ ] Platform fee correctly set to 20%

### Dependencies
- LinkedIn Developer Account verification
- Legal review of terms/privacy policy
- Database backup before migration

---

## Phase 2: Implement Core Interview Loop (Week 2)
**Goal**: Build LLM-guided data collection system
**Duration**: 7 days
**Team**: 3 developers (1 LLM specialist, 2 full-stack)

### LangGraph Integration
**Current Issue**: No LLM orchestration framework
- **Day 1-2**: LangGraph setup and architecture
  - Install and configure LangGraph
  - Design interview workflow graph
  - Create global context management system
- **Day 3-4**: Interview node implementation
  - Master prompt for skill-based questioning
  - Dynamic follow-up generation
  - Session state management across browser tabs
- **Day 5**: Context compaction system
  - Summarization prompts for long conversations
  - Key skill/workflow preservation logic
  - Storage optimization for large contexts

### Interview → Refine → Submit Pipeline
**Current Issue**: No automated instance generation
- **Day 6**: Instance generation hooks
  - Threshold detection system (flexible saturation scores)
  - Automated JSON bundle creation (~10 instances per session)
  - Quality pre-scoring before refinement
- **Day 7**: Refinement workflow
  - LLM-powered quality suggestions
  - User editing interface improvements
  - Submission validation and storage

### Success Metrics
- [ ] Interview sessions generate 10+ instances per completion
- [ ] Context compaction reduces storage by 70% while preserving key data
- [ ] User completion rate: 65%+ complete interview threshold
- [ ] Average session quality score: 75+/100

### Dependencies
- OpenAI API credits and rate limits
- LangGraph library installation
- Vector embedding model selection

---

## Phase 3: Build Marketplace & Revenue System (Week 3)
**Goal**: Enable buying/selling with proper revenue distribution
**Duration**: 7 days
**Team**: 3 developers (1 payments, 2 marketplace)

### Marketplace Infrastructure
**Current Issue**: Basic listings, no advanced features
- **Day 1-2**: Enhanced listing system
  - Bundle creation and management
  - Advanced search and filtering
  - Dataset preview and sampling
- **Day 3**: Offer system improvements
  - Negotiation workflows
  - Offer expiration handling
  - Bulk purchase options

### Revenue Distribution System
**Current Issue**: Incorrect platform fee, no automated payments
- **Day 4-5**: Payment integration
  - Stripe Connect for seller payouts
  - Automated 20% platform fee collection
  - Pro-rata revenue sharing for bundles
- **Day 6**: Transaction management
  - Escrow-style payment holding
  - Automatic release triggers
  - Dispute resolution framework
- **Day 7**: Financial reporting
  - Seller earnings dashboard
  - Platform revenue analytics
  - Tax document generation prep

### Success Metrics
- [ ] Marketplace conversion rate: 15%+ (listings to sales)
- [ ] Payment processing: 99.5% success rate
- [ ] Revenue distribution accuracy: 100%
- [ ] Average transaction value: $75+

### Dependencies
- Stripe account approval and verification
- Legal review of marketplace terms
- Tax compliance research

---

## Phase 4: Integrate Advanced Tech Stack (Week 4)
**Goal**: Add vector search, anonymization, and performance optimization
**Duration**: 7 days
**Team**: 2 senior developers

### Vector Database Integration
**Current Issue**: No semantic search capabilities
- **Day 1-2**: Pinecone setup
  - Database configuration and indexing
  - Embedding generation for datasets
  - Semantic search implementation
- **Day 3**: Search enhancement
  - Similar dataset recommendations
  - Quality-based ranking algorithms
  - Relevance scoring optimization

### Anonymization Pipeline
**Current Issue**: No PII protection system
- **Day 4-5**: PII detection and removal
  - Named entity recognition implementation
  - Sensitive data pattern matching
  - Automated anonymization suggestions
- **Day 6**: Privacy compliance
  - GDPR compliance features
  - Data retention policies
  - User data export/deletion

### Performance & Scale Optimization
- **Day 7**: System optimization
  - Database query optimization
  - Caching layer implementation
  - CDN setup for static assets

### Success Metrics
- [ ] Vector search relevance: 85%+ user satisfaction
- [ ] PII detection accuracy: 95%+ true positives
- [ ] Page load times: <2s for dashboard
- [ ] Database query performance: <100ms average

### Dependencies
- Pinecone account and quota allocation
- Privacy law compliance review
- Performance testing tools setup

---

## Phase 5: Testing, Polish & Deploy (Week 5)
**Goal**: Production readiness and launch preparation
**Duration**: 7 days
**Team**: Full team (4 developers, 1 QA)

### Comprehensive Testing
**Current Issue**: Limited test coverage
- **Day 1-2**: Automated testing
  - Unit tests for core functions
  - Integration tests for API endpoints
  - End-to-end user journey tests
- **Day 3**: Performance testing
  - Load testing with realistic data volumes
  - Stress testing payment flows
  - Security penetration testing

### User Experience Polish
- **Day 4**: UI/UX refinements
  - Stan Store design consistency check
  - Mobile responsiveness improvements
  - Accessibility compliance (WCAG 2.1)
- **Day 5**: Onboarding optimization
  - Tutorial system implementation
  - Progress tracking improvements
  - Help documentation

### Production Deployment
- **Day 6**: Infrastructure setup
  - Production environment configuration
  - Monitoring and alerting systems
  - Backup and disaster recovery
- **Day 7**: Launch preparation
  - Final security audit
  - Performance baseline establishment
  - Launch day monitoring setup

### Success Metrics
- [ ] Test coverage: 80%+ for critical paths
- [ ] Performance targets: All pages <2s load time
- [ ] Security audit: 0 critical vulnerabilities
- [ ] User onboarding completion: 70%+

### Dependencies
- Production hosting environment
- SSL certificates and domain setup
- Monitoring service subscriptions

---

## Key Success Metrics & KPIs

### User Engagement
- **Daily Instance Creation**: 20 instances/day limit utilization: 60%+
- **Quality Score Achievement**: 80%+ scores for earnings boost eligibility: 30%+ users
- **Interview Completion Rate**: 65%+ complete threshold requirements
- **Monthly Active Users**: 500+ by end of Phase 5

### Marketplace Performance
- **Dataset Creation to Sale Conversion**: 25%
- **Average Transaction Value**: $75+
- **Seller Retention Rate**: 70%+ after first sale
- **Buyer Satisfaction**: 4.5+ stars average rating

### Technical Performance
- **System Uptime**: 99.5%+
- **API Response Time**: <200ms average
- **Database Query Performance**: <100ms average
- **Payment Success Rate**: 99.5%+

### Revenue Metrics
- **Platform Revenue**: $10K+ monthly by end of Phase 5
- **Revenue per User**: $15+ monthly average
- **Cost per Acquisition**: <$25
- **Lifetime Value**: $150+ per user

---

## Risk Mitigation & Contingencies

### Technical Risks
1. **LangGraph Integration Complexity**
   - *Mitigation*: Spike work in Phase 1, fallback to basic OpenAI integration
   - *Timeline Impact*: +2 days

2. **Pinecone Performance Issues**
   - *Mitigation*: Local vector database fallback (pgvector)
   - *Timeline Impact*: +3 days

3. **Payment Integration Delays**
   - *Mitigation*: Manual payment processing for initial users
   - *Timeline Impact*: +1 week

### Business Risks
1. **LinkedIn API Rate Limits**
   - *Mitigation*: Implement queue system and user flow optimization
   - *Impact*: Reduced onboarding speed

2. **Legal Compliance Issues**
   - *Mitigation*: Early legal review, conservative data handling
   - *Impact*: Feature scope reduction

### Resource Constraints
1. **Developer Availability**
   - *Mitigation*: Cross-training, external contractor backup
   - *Timeline Impact*: Flexible scope adjustment

2. **Infrastructure Costs**
   - *Mitigation*: Serverless-first approach, cost monitoring
   - *Budget Impact*: 20% cost increase acceptable

---

## Technology Stack Decisions

### Core Framework (Existing)
- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth

### New Integrations (Phase 2-4)
- **LLM Orchestration**: LangGraph + OpenAI GPT-4
- **Vector Database**: Pinecone (primary), pgvector (fallback)
- **Payments**: Stripe Connect
- **Anonymization**: spaCy NER + custom patterns
- **Monitoring**: Vercel Analytics + Sentry

### Infrastructure
- **Hosting**: Vercel (frontend) + Railway (backend)
- **Database**: Supabase PostgreSQL
- **CDN**: Vercel Edge Network
- **Storage**: Vercel Blob Storage

This roadmap transforms the current 35% complete codebase into a fully functional MVP that addresses all identified gaps while maintaining the existing UI investments and architectural decisions.