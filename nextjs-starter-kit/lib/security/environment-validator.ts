/**
 * Environment Variable Validation and Security
 * Ensures all required environment variables are present and secure
 */

import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Core application
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // Database
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-', 'Invalid OpenAI API key format'),
  
  // Pinecone
  PINECONE_API_KEY: z.string().min(36, 'Invalid Pinecone API key'),
  PINECONE_INDEX_NAME: z.string().min(1, 'Pinecone index name required'),
  PINECONE_ENVIRONMENT: z.string().min(1, 'Pinecone environment required'),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Stripe secret key format'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Invalid Stripe publishable key format'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Invalid Stripe webhook secret format'),
  
  // AWS (optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url('Invalid BETTER_AUTH_URL'),
  
  // LinkedIn OAuth (optional)
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  
  // Security settings
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().positive()).optional(),
  SESSION_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  
  // Monitoring and logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional().default('info'),
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  
  // Feature flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').optional().default(false),
  ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').optional().default(true),
  ENABLE_SECURITY_HEADERS: z.string().transform(val => val === 'true').optional().default(true),
});

type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig | null = null;

// Validate environment variables on startup
export function validateEnvironment(): EnvConfig {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    
    // Additional security checks
    performSecurityChecks(validatedEnv);
    
    console.info('[Environment] ✅ All environment variables validated successfully');
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      
      console.error('[Environment] ❌ Environment validation failed:');
      missingVars.forEach(err => console.error(`  - ${err}`));
      
      // In production, fail fast
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
    throw error;
  }
}

// Security checks for environment variables
function performSecurityChecks(env: EnvConfig): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check for default/weak secrets
  const weakSecrets = [
    'secret',
    'password',
    'changeme',
    '123456',
    'test',
    'development',
    'local'
  ];

  if (weakSecrets.some(weak => 
    env.NEXTAUTH_SECRET.toLowerCase().includes(weak) ||
    env.BETTER_AUTH_SECRET.toLowerCase().includes(weak)
  )) {
    if (env.NODE_ENV === 'production') {
      errors.push('Weak authentication secrets detected in production');
    } else {
      warnings.push('Weak authentication secrets detected');
    }
  }

  // Check for test API keys in production
  if (env.NODE_ENV === 'production') {
    if (env.STRIPE_SECRET_KEY.includes('test')) {
      errors.push('Test Stripe keys found in production environment');
    }
    
    if (env.OPENAI_API_KEY.includes('test')) {
      errors.push('Test OpenAI API key found in production environment');
    }
  }

  // Check URL configurations
  if (env.NODE_ENV === 'production') {
    if (env.NEXTAUTH_URL.includes('localhost') || env.NEXTAUTH_URL.includes('127.0.0.1')) {
      errors.push('Localhost URLs found in production environment');
    }
  }

  // Check database URL security
  if (env.DATABASE_URL.includes('password') && !env.DATABASE_URL.includes('%')) {
    warnings.push('Database URL may contain unencoded password');
  }

  // Output warnings and errors
  if (warnings.length > 0) {
    console.warn('[Environment] ⚠️ Security warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (errors.length > 0) {
    console.error('[Environment] ❌ Security errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    
    if (env.NODE_ENV === 'production') {
      console.error('[Environment] 🚨 Refusing to start in production with security errors');
      process.exit(1);
    }
  }
}

// Safe environment getter with validation
export function getEnv(): EnvConfig {
  if (!validatedEnv) {
    throw new Error('Environment not validated. Call validateEnvironment() first.');
  }
  return validatedEnv;
}

// Check if running in production
export function isProduction(): boolean {
  const env = getEnv();
  return env.NODE_ENV === 'production';
}

// Check if running in development
export function isDevelopment(): boolean {
  const env = getEnv();
  return env.NODE_ENV === 'development';
}

// Safe API key getter that never exposes keys to client
export function getServerOnlyEnv() {
  const env = getEnv();
  
  // Only return server-side environment variables
  // Never expose these to the client
  return {
    DATABASE_URL: env.DATABASE_URL,
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    PINECONE_API_KEY: env.PINECONE_API_KEY,
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
    AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
    LINKEDIN_CLIENT_SECRET: env.LINKEDIN_CLIENT_SECRET,
  };
}

// Client-safe environment variables
export function getClientEnv() {
  const env = getEnv();
  
  // Only return client-safe environment variables
  return {
    NODE_ENV: env.NODE_ENV,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY,
    LINKEDIN_CLIENT_ID: env.LINKEDIN_CLIENT_ID,
    ENABLE_ANALYTICS: env.ENABLE_ANALYTICS,
  };
}

// Environment health check
export function performHealthCheck(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
  timestamp: string;
} {
  const issues: string[] = [];
  
  try {
    const env = getEnv();
    
    // Check critical services
    if (!env.DATABASE_URL) {
      issues.push('Database URL not configured');
    }
    
    if (!env.OPENAI_API_KEY) {
      issues.push('OpenAI API key not configured');
    }
    
    if (!env.PINECONE_API_KEY) {
      issues.push('Pinecone API key not configured');
    }
    
    if (!env.STRIPE_SECRET_KEY && env.NODE_ENV === 'production') {
      issues.push('Stripe not configured for production');
    }
    
    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (issues.length > 0) {
      status = issues.length > 2 ? 'unhealthy' : 'degraded';
    }
    
    return {
      status,
      issues,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      issues: ['Environment validation failed'],
      timestamp: new Date().toISOString()
    };
  }
}

// Initialize environment validation on import
try {
  validateEnvironment();
} catch (error) {
  console.error('[Environment] Failed to initialize environment validation:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}