/**
 * Input Sanitization and Validation for LangSet MVP
 * Prevents XSS, injection attacks, and ensures data integrity
 */

import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify with JSDOM for server-side usage
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// Configure DOMPurify with safe defaults
purify.addHook('beforeSanitizeElements', function (node, data) {
  // Additional security hook - can add custom logic here
});

// HTML sanitization using DOMPurify - industry standard and secure
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  // Configure DOMPurify to allow only safe formatting tags
  const cleanHTML = purify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [], // No attributes allowed for maximum security
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'iframe', 'style'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'style'],
    USE_PROFILES: { html: true },
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    IN_PLACE: false
  });
  
  return cleanHTML.trim();
}

// SQL injection prevention patterns
export function validateSQLSafety(input: string): boolean {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION\s+SELECT)/i,
    /(\bOR\s+1\s*=\s*1\b)/i,
    /(\bAND\s+1\s*=\s*1\b)/i,
    /(';\s*(DROP|DELETE|INSERT|UPDATE))/i,
    /(--|\*\/|\*\*)/,
    /(\$\{.*\})/
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
}

// XSS prevention for user content using DOMPurify
export function sanitizeUserContent(content: string): string {
  if (!content) return '';
  
  // Use DOMPurify for comprehensive XSS prevention
  const sanitized = purify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [], // No attributes for maximum security
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'iframe', 'style', 'link'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'style', 'href', 'src'],
    USE_PROFILES: { html: true },
    KEEP_CONTENT: true,
    SANITIZE_DOM: true,
    SANITIZE_NAMED_PROPS: true,
    SANITIZE_NAMED_PROPS_PREFIX: 'user-content',
    RETURN_DOM: false
  });
  
  return sanitized.trim();
}

// Deep sanitization for nested objects
export function deepSanitize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeUserContent(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepSanitize(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Validation schemas using Zod
export const ValidationSchemas = {
  // User input validation
  userAnswer: z.string()
    .min(10, 'Answer must be at least 10 characters')
    .max(5000, 'Answer cannot exceed 5000 characters')
    .refine(validateSQLSafety, 'Invalid content detected'),
  
  question: z.string()
    .min(5, 'Question must be at least 5 characters')
    .max(1000, 'Question cannot exceed 1000 characters')
    .refine(validateSQLSafety, 'Invalid content detected'),
  
  tags: z.array(z.string()
    .min(1, 'Tag cannot be empty')
    .max(50, 'Tag cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9\s\-\.#\+]+$/, 'Tag contains invalid characters')
  ).max(10, 'Cannot have more than 10 tags'),
  
  email: z.string().email('Invalid email format'),
  
  datasetName: z.string()
    .min(3, 'Dataset name must be at least 3 characters')
    .max(100, 'Dataset name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'Dataset name contains invalid characters'),
  
  // File upload validation
  fileName: z.string()
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'Filename contains invalid characters')
    .refine(name => !name.includes('..'), 'Path traversal not allowed'),
};

// Content filtering for inappropriate content
export function filterInappropriateContent(content: string): {
  isAppropriate: boolean;
  issues: string[];
  filteredContent?: string;
} {
  const issues: string[] = [];
  let isAppropriate = true;
  
  // Profanity detection (basic patterns)
  const profanityPatterns = [
    /\b(f\*+k|sh\*+t|d\*+n|h\*+l)\b/gi,
    /\b(damn|hell|crap|stupid|idiot|moron)\b/gi
  ];
  
  if (profanityPatterns.some(pattern => pattern.test(content))) {
    isAppropriate = false;
    issues.push('Content contains inappropriate language');
  }
  
  // Spam detection
  const spamPatterns = [
    /\b(buy now|click here|limited time|act fast)\b/gi,
    /\b(www\.|http|\.com|\.org|\.net)\b/gi,
    /\b(contact me at|email me|call me)\b/gi
  ];
  
  if (spamPatterns.some(pattern => pattern.test(content))) {
    isAppropriate = false;
    issues.push('Content appears promotional or spam-like');
  }
  
  // Hate speech detection (basic patterns)
  const hateSpeechPatterns = [
    /\b(hate|kill|destroy|eliminate)\s+(all|every|those)\b/gi
  ];
  
  if (hateSpeechPatterns.some(pattern => pattern.test(content))) {
    isAppropriate = false;
    issues.push('Content may contain hate speech');
  }
  
  return {
    isAppropriate,
    issues,
    filteredContent: isAppropriate ? content : undefined
  };
}

// PII detection patterns
export function detectPII(text: string): Array<{
  type: string;
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}> {
  const piiPatterns = [
    {
      name: 'email',
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      confidence: 0.95
    },
    {
      name: 'phone',
      regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      confidence: 0.90
    },
    {
      name: 'ssn',
      regex: /\b\d{3}-\d{2}-\d{4}\b/g,
      confidence: 0.95
    },
    {
      name: 'credit_card',
      regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      confidence: 0.90
    },
    {
      name: 'ip_address',
      regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      confidence: 0.85
    },
    {
      name: 'person_name',
      regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
      confidence: 0.70
    },
    {
      name: 'url',
      regex: /https?:\/\/[^\s]+/g,
      confidence: 0.90
    }
  ];
  
  const detected = [];
  
  for (const pattern of piiPatterns) {
    const matches = text.matchAll(pattern.regex);
    for (const match of matches) {
      // Additional validation for some patterns
      let isValid = true;
      if (pattern.name === 'person_name') {
        // Filter out common false positives
        const commonWords = ['React Native', 'Machine Learning', 'Data Science', 'Web Development'];
        isValid = !commonWords.includes(match[0]);
      }
      
      if (isValid && match.index !== undefined) {
        detected.push({
          type: pattern.name,
          value: match[0],
          confidence: pattern.confidence,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    }
  }
  
  return detected;
}

// File upload safety checks
export function validateFileUpload(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size exceeds 10MB limit');
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'text/plain', 'application/json', 'text/csv'
  ];
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  // Check filename
  const validationResult = ValidationSchemas.fileName.safeParse(file.name);
  if (!validationResult.success) {
    errors.push('Invalid filename');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Request validation middleware
export function validateRequest(schema: z.ZodSchema, data: unknown) {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.issues.map(issue => issue.message).join(', ')}`);
  }
  
  return result.data;
}

// Security headers
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
} as const;