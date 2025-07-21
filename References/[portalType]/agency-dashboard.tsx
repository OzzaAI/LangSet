'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Globe, TrendingUp, Settings, MessageCircle } from 'lucide-react';

type Client = {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
};

type AgencyData = {
  user: {
    id: string;
    email: string;
    role: string;
  };
  account: {
    id: string;
    name: string;
    plan_id: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  clients: Client[];
  stats: {
    total_clients: number;
    active_websites: number;
    this_month_signups: number;
  };
};

export default function AgencyDashboard() {
  const handleGenerateCommunityLink = async () => {
    try {
      const response = await fetch('/api/generate-community-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.communityLink) {
        toast.success('Community Link Generated!', {
          description: (
            <div className="flex items-center space-x-2">
              <span className="truncate">{result.communityLink}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(result.communityLink)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ),
          duration: 5000,
        });
      } else {
        toast.error('Failed to generate community link', {
          description: result.error || 'Unknown error',
        });
      }
    } catch (err) {
      console.error('Error generating community link:', err);
      toast.error('An unexpected error occurred');
    }
  };
  const [agencyData, setAgencyData] = useState<AgencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAgencyData = async () => {
      try {
        const { data: { session } } = await authClient.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // Mock data for now - would fetch from API
        const mockData: AgencyData = {
          user: {
            id: session.userId,
            email: session.user.email,
            role: 'agency_owner'
          },
          account: {
            id: 'agency_123',
            name: 'Your Agency',
            plan_id: 'pro',
            primary_color: '#3B82F6',
            secondary_color: '#10B981'
          },
          clients: [
            {
              id: '1',
              name: 'Local Restaurant',
              email: 'owner@restaurant.com',
              status: 'active',
              created_at: '2024-01-15'
            },
            {
              id: '2', 
              name: 'Fitness Studio',
              email: 'info@fitnessstudio.com',
              status: 'pending',
              created_at: '2024-01-20'
            }
          ],
          stats: {
            total_clients: 2,
            active_websites: 1,
            this_month_signups: 2
          }
        };

        setAgencyData(mockData);
      } catch (err) {
        console.error('Error fetching agency data:', err);
        setError('Failed to load agency data');
      } finally {
        setLoading(false);
      }
    };

    fetchAgencyData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agencyData) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agency Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {agencyData.user.email}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencyData.stats.total_clients}</div>
            <p className="text-xs text-muted-foreground">
              +{agencyData.stats.this_month_signups} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Websites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencyData.stats.active_websites}</div>
            <p className="text-xs text-muted-foreground">
              Sites currently live
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+25%</div>
            <p className="text-xs text-muted-foreground">
              vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your agency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" onClick={handleGenerateCommunityLink}>
              <Plus className="h-6 w-6 mb-2" />
              Generate Community Link
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Globe className="h-6 w-6 mb-2" />
              Create Website
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Settings className="h-6 w-6 mb-2" />
              Agency Settings
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <MessageCircle className="h-6 w-6 mb-2" />
              Contact Coach
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Clients</CardTitle>
          <CardDescription>
            Your latest client acquisitions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agencyData.clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                    {client.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}