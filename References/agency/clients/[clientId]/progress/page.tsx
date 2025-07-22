'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import ClientPortal from '@/components/projects/ClientPortal';

export default function ClientProgressPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);

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
        setError('Failed to load client progress.');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      checkAccess();
    }
  }, [clientId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client progress...</p>
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

  if (!userSession || !clientId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Client Progress</h1>
          <p className="text-muted-foreground">View project progress for this client</p>
        </div>
      </div>

      {/* Client Portal Component - Agency View */}
      <ClientPortal 
        clientId={clientId}
        userId={userSession.user.id} 
        userRole="agency" // Agency viewing client data
        isAgencyView={true}
      />
    </div>
  );
}
