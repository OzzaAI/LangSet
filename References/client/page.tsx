'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, TrendingUp, CheckCircle, AlertCircle, Lightbulb, Settings } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any>(null); // Replace 'any' with a proper type later
  const [agencyDetails, setAgencyDetails] = useState<any>(null); // Agency details for branding
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const router = useRouter();

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('Message cannot be empty.');
      return;
    }

    setIsSendingMessage(true);
    try {
      const response = await fetch('/api/client/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      toast.success('Message sent successfully!');
      setMessageContent('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  useEffect(() => {
    const checkClientAccess = async () => {
      try {
        const sessionResponse = await authClient.getSession();
        if (!sessionResponse?.data?.session) {
          router.push('/login');
          return;
        }

        const userRole = sessionResponse.data.session.user.role;
        if (userRole !== 'client' && userRole !== 'admin') {
          setError('Access denied - Client or Admin role required.');
          return;
        }

        // Fetch agency details for branding
        const agencyResponse = await fetch('/api/client/agency-details');
        if (agencyResponse.ok) {
          const agencyData = await agencyResponse.json();
          setAgencyDetails(agencyData);
        } else {
          console.error('Failed to fetch agency details');
        }

        // For now, mock data for client dashboard
        setClientData({
          name: sessionResponse.data.session.user.name || 'Client',
          progress: 75,
          completedTasks: 15,
          totalTasks: 20,
          recentUpdates: [
            { id: '1', text: 'Completed onboarding module.', date: '2025-06-25' },
            { id: '2', text: 'New task assigned: Review Q3 goals.', date: '2025-06-24' },
          ],
          automationPerformance: {
            uptime: '99.9%',
            tasksAutomated: 12345,
            costSavings: '$15,000',
          },
          automationDetails: [
            { id: 'a1', title: 'Email Automation', description: 'Automates client communication.', link: '#' },
            { id: 'a2', title: 'Data Entry Bot', description: 'Automates data input into CRM.', link: '#' },
          ],
        });

      } catch (err) {
        console.error('Error checking client access:', err);
        setError('Failed to load client data.');
      } finally {
        setLoading(false);
      }
    };

    checkClientAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client dashboard...</p>
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

  if (!clientData) {
    return <div>No data available</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {clientData.name}!</h1>
          <p className="text-muted-foreground">Your dashboard from {agencyDetails?.name || 'your agency'}.</p>
        </div>
        {agencyDetails?.logo_url && (
          <Image src={agencyDetails.logo_url} alt={agencyDetails.name || 'Agency Logo'} width={80} height={80} className="rounded-lg" />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientData.progress}%</div>
            <p className="text-xs text-muted-foreground">Of your coaching journey completed.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientData.completedTasks} / {clientData.totalTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks finished.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voice Concerns</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">Have a question or concern? Reach out to your agency.</p>
            <Button>Contact Agency</Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Automation Performance */}
      <Card>
        <CardHeader>
          <CardTitle>AI Automation Performance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Uptime</p>
            <p className="text-2xl font-bold">{clientData.automationPerformance.uptime}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tasks Automated</p>
            <p className="text-2xl font-bold">{clientData.automationPerformance.tasksAutomated}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Estimated Cost Savings</p>
            <p className="text-2xl font-bold">{clientData.automationPerformance.costSavings}</p>
          </div>
        </CardContent>
      </Card>

      {/* Automation Details & Learning */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Details & Learning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {clientData.automationDetails.length === 0 ? (
            <p className="text-muted-foreground">No automation details available.</p>
          ) : (
            clientData.automationDetails.map((automation: any) => (
              <div key={automation.id} className="border-b pb-3 last:border-b-0">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" /> {automation.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">{automation.description}</p>
                {automation.link && (
                  <Button variant="link" className="p-0 h-auto mt-2">
                    <a href={automation.link} target="_blank" rel="noopener noreferrer">Learn More</a>
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Communication with Agency */}
      <Card>
        <CardHeader>
          <CardTitle>Communication with Your Agency</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Use the form below to send a message to your agency regarding your automations or any concerns.</p>
          <div className="space-y-4">
            <Label htmlFor="message">Your Message</Label>
            <textarea
              id="message"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Type your message here..."
            ></textarea>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" /> Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}