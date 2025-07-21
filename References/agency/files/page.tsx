'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FileManagement from '@/components/projects/FileManagement';

export default function AgencyFilesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const sessionResponse = await authClient.getSession();
        if (!sessionResponse?.data?.session) {
          router.push('/login');
          return;
        }

        const userRole = sessionResponse.data.session.user.role;
        if (userRole !== 'agency' && userRole !== 'admin') {
          setError('Access denied - Agency or Admin role required.');
          return;
        }

        setUserSession(sessionResponse.data.session);
      } catch (err) {
        console.error('Error checking access:', err);
        setError('Failed to load page.');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userSession) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Files & Deliverables</h1>
          <p className="text-muted-foreground">Manage files across all your projects</p>
        </div>
      </div>

      {/* Agency-wide file management */}
      <Card>
        <CardHeader>
          <CardTitle>Agency File Overview</CardTitle>
          <CardDescription>Files and deliverables across all projects</CardDescription>
        </CardHeader>
        <CardContent>
          <FileManagement 
            projectId="all" // Special ID for agency-wide view
            userId={userSession.user.id} 
            userRole={userSession.user.role} 
          />
        </CardContent>
      </Card>
    </div>
  );
}