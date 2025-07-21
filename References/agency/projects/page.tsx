'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
// import ProjectDashboard from '@/components/projects/ProjectDashboard';

export default function AgencyProjectsPage() {
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
          <p className="mt-4 text-gray-600">Loading projects...</p>
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
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage all your agency projects</p>
        </div>
      </div>

      {/* <ProjectDashboard 
        agencyId={userSession.user.id} 
        userId={userSession.user.id} 
        userRole={userSession.user.role} 
      /> */}
      <div className="p-6 text-center text-muted-foreground">
        Project dashboard temporarily disabled for testing
      </div>
    </div>
  );
}