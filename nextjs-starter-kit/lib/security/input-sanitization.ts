/**
 * Input Sanitization and Validation for LangSet MVP
 * Prevents XSS, injection attacks, and ensures data integrity
 */

import { z } from 'zod';

// HTML sanitization - remove dangerous tags and attributes
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  // Remove script tags and javascript: protocols
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick, onload
  
  // Remove dangerous HTML tags
  const dangerousTags = [
    'script', 'object', 'embed', 'form', 'input', 'button',
    'frame', 'frameset', 'iframe', 'meta', 'link', 'style'
  ];
  
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosing, '');
  });
  
  // Allow only safe formatting tags
  const allowedTags = ['b', 'i', 'em', 'strong', 'code', 'pre', 'p', 'br'];
  const tagPattern = /<(\/?)([\w-]+)([^>]*)>/g;
  
  sanitized = sanitized.replace(tagPattern, (match, closing, tagName, attributes) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Remove all attributes from allowed tags for safety
      return `<${closing}${tagName}>`;
    }
    return ''; // Remove disallowed tags
  });
  
  return sanitized.trim();
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

// XSS prevention for user content
export function sanitizeUserContent(content: string): string {
  if (!content) return '';
  
  // First pass - HTML sanitization
  let sanitized = sanitizeHTML(content);
  
  // Encode remaining special characters
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  // Only encode if not already part of allowed HTML tags
  sanitized = sanitized.replace(/[&<>"'/]/g, (char) => {
    // Don't encode if it's part of an allowed HTML tag
    return htmlEntities[char as keyof typeof htmlEntities] || char;
  });
  
  return sanitized;
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