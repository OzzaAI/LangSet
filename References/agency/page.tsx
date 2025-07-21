'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LayoutDashboard, Settings, FolderKanban, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
// import ProjectDashboard from '@/components/projects/ProjectDashboard';

export default function AgencyDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAgencyAccess = async () => {
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
        console.error('Error checking agency access:', err);
        setError('Failed to load agency data.');
      } finally {
        setLoading(false);
      }
    };

    checkAgencyAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agency dashboard...</p>
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
            <button
              onClick={() => router.push('/login')}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If we have a user session, show the full project dashboard
  if (userSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agency Dashboard</h1>
            <p className="text-muted-foreground">Manage your projects and client deliverables</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/dashboard/agency/projects/new">
                <FolderKanban className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">$12,345</div>
              <p className="text-xs text-muted-foreground">Mock monthly earnings</p>
              <Button asChild className="mt-4 w-full" size="sm">
                <Link href="/dashboard/agency/billing">View Billing</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">All Projects</div>
              <p className="text-xs text-muted-foreground">Manage your active projects</p>
              <Button asChild className="mt-4 w-full" size="sm">
                <Link href="/dashboard/agency/projects">View Projects</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Client Portal</div>
              <p className="text-xs text-muted-foreground">Manage clients and invitations</p>
              <Button asChild className="mt-4 w-full" size="sm">
                <Link href="/dashboard/agency/clients">Manage Clients</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Tracking</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Track Time</div>
              <p className="text-xs text-muted-foreground">Log hours and generate reports</p>
              <Button asChild className="mt-4 w-full" size="sm">
                <Link href="/dashboard/agency/time">Time Reports</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Deliverables</div>
              <p className="text-xs text-muted-foreground">Manage project files</p>
              <Button asChild className="mt-4 w-full" size="sm">
                <Link href="/dashboard/agency/files">View Files</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Project Dashboard Component */}
        {/* <ProjectDashboard 
          agencyId={userSession.user.id} 
          userId={userSession.user.id} 
          userRole={userSession.user.role} 
        /> */}
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Project dashboard temporarily disabled for testing</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
