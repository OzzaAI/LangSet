/**
 * Client-side CSRF Protection Helper
 * Manages CSRF tokens for secure API requests
 */

interface CSRFTokenData {
  csrfToken: string;
  expires: string;
}

class CSRFManager {
  private static instance: CSRFManager;
  private csrfToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private constructor() {
    // Initialize CSRF token on first use
    this.initializeToken();
  }

  static getInstance(): CSRFManager {
    if (!CSRFManager.instance) {
      CSRFManager.instance = new CSRFManager();
    }
    return CSRFManager.instance;
  }

  private async initializeToken(): Promise<void> {
    try {
      const response = await fetch('/api/csrf/token', {
        credentials: 'include',
      });

      if (response.ok) {
        const data: CSRFTokenData = await response.json();
        this.csrfToken = data.csrfToken;
        this.tokenExpiry = new Date(data.expires);
      } else {
        console.error('[CSRF Client] Failed to initialize token');
      }
    } catch (error) {
      console.error('[CSRF Client] Error initializing token:', error);
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      const response = await fetch('/api/csrf/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentToken: this.csrfToken
        }),
      });

      if (response.ok) {
        const data: CSRFTokenData = await response.json();
        this.csrfToken = data.csrfToken;
        this.tokenExpiry = new Date(data.expires);
      } else {
        console.error('[CSRF Client] Failed to refresh token');
        // Retry initialization if refresh fails
        await this.initializeToken();
      }
    } catch (error) {
      console.error('[CSRF Client] Error refreshing token:', error);
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    // Consider token expired if less than 1 hour remaining
    return Date.now() > (this.tokenExpiry.getTime() - 60 * 60 * 1000);
  }

  async getCSRFToken(): Promise<string | null> {
    // Check if token needs refresh
    if (!this.csrfToken || this.isTokenExpired()) {
      await this.refreshToken();
    }

    return this.csrfToken;
  }

  async getCSRFHeaders(): Promise<Record<string, string>> {
    const token = await this.getCSRFToken();
    
    if (!token) {
      throw new Error('Failed to obtain CSRF token');
    }

    return {
      'X-CSRF-Token': token,
    };
  }

  // Helper method for making secure API requests
  async secureRequest(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const csrfHeaders = await this.getCSRFHeaders();
    
    const headers = {
      'Content-Type': 'application/json',
      ...csrfHeaders,
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });
  }

  // Helper for POST requests
  async post(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.secureRequest(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // Helper for PUT requests
  async put(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.secureRequest(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // Helper for DELETE requests
  async delete(url: string, options: RequestInit = {}): Promise<Response> {
    return this.secureRequest(url, {
      method: 'DELETE',
      ...options,
    });
  }

  // Helper for PATCH requests
  async patch(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.secureRequest(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // Clear token on logout
  clearToken(): void {
    this.csrfToken = null;
    this.tokenExpiry = null;
  }
}

// Export singleton instance
export const csrfManager = CSRFManager.getInstance();

// Helper hook for React components
export function useCSRF() {
  const getToken = () => csrfManager.getCSRFToken();
  const getHeaders = () => csrfManager.getCSRFHeaders();
  const clearToken = () => csrfManager.clearToken();
  
  const securePost = (url: string, data?: any) => csrfManager.post(url, data);
  const securePut = (url: string, data?: any) => csrfManager.put(url, data);
  const secureDelete = (url: string) => csrfManager.delete(url);
  const securePatch = (url: string, data?: any) => csrfManager.patch(url, data);

  return {
    getToken,
    getHeaders,
    clearToken,
    post: securePost,
    put: securePut,
    delete: secureDelete,
    patch: securePatch,
  };
}

// Utility function for existing code to easily add CSRF protection
export async function withCSRFProtection<T>(
  apiCall: (headers: Record<string, string>) => Promise<T>
): Promise<T> {
  const headers = await csrfManager.getCSRFHeaders();
  return apiCall(headers);
}

export default csrfManager;