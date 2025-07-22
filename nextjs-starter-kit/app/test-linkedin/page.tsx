"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Temporary fallback - using Unicode symbols instead of lucide icons

export default function TestLinkedInPage() {
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
      }
      setLoading(false);
    } catch {
      setError('Failed to fetch user data');
      setLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    try {
      // Use Better Auth client method for Generic OAuth
      const response = await fetch('/api/auth/sign-in/oauth2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: 'linkedin',
          callbackURL: '/test-linkedin'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        setError('Failed to initiate LinkedIn OAuth');
      }
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      setError('Failed to connect to LinkedIn');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            LinkedIn Integration Test
          </h1>
          <p className="text-muted-foreground">
            Test the LinkedIn OAuth integration for LangSet.ai
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Not Logged In */}
        {!user && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <span className="text-blue-600">🔗</span>
                Connect with LinkedIn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">
                Sign in with LinkedIn to test the integration
              </p>
              <Button 
                onClick={handleLinkedInLogin}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                🔗 Sign in with LinkedIn →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logged In */}
        {user && (
          <div className="space-y-6">
            {/* User Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>👤</span>
                  User Profile
                  {user.linkedinProfile && (
                    <Badge variant="secondary" className="ml-auto">
                      <span className="mr-1">🔗</span>
                      LinkedIn Verified
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="font-semibold">{user.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="font-semibold">{user.email || 'Not provided'}</p>
                  </div>
                  {user.credibilityScore && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Credibility Score</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${user.credibilityScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-primary">{user.credibilityScore}/100</span>
                      </div>
                    </div>
                  )}
                  {user.referralCode && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Referral Code</label>
                      <p className="font-mono bg-muted px-2 py-1 rounded text-sm">
                        {user.referralCode}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* LinkedIn Profile Data */}
            {user.linkedinProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-blue-600">🔗</span>
                    LinkedIn Profile Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">LinkedIn ID</label>
                        <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {user.linkedinProfile.id}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <p className="font-semibold">
                          {user.linkedinProfile.firstName} {user.linkedinProfile.lastName}
                        </p>
                      </div>
                      {user.linkedinProfile.headline && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Headline</label>
                          <p className="text-sm">{user.linkedinProfile.headline}</p>
                        </div>
                      )}
                      {user.linkedinProfile.industry && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Industry</label>
                          <p className="text-sm">{user.linkedinProfile.industry}</p>
                        </div>
                      )}
                    </div>

                    {/* Raw JSON Data */}
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                        View Raw JSON Data
                      </summary>
                      <pre className="mt-2 bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(user.linkedinProfile, null, 2)}
                      </pre>
                    </details>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <Button onClick={fetchUserData} variant="outline">
                Refresh Data
              </Button>
              <Button onClick={handleLogout} variant="destructive">
                Sign Out
              </Button>
              <Button onClick={() => window.location.href = "/"}>
                Back to Homepage
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Create a LinkedIn app at <code>developer.linkedin.com</code></p>
            <p>2. Add redirect URL: <code>http://localhost:3000/api/auth/oauth2/callback/linkedin</code></p>
            <p>3. Update <code>.env</code> with your LinkedIn Client ID and Secret</p>
            <p>4. Restart the server and test the login flow</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}