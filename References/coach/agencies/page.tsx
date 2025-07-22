'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DelightfulButton } from '@/components/ui/delightful-button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { delightfulToast } from '@/components/ui/delightful-toast';
import { useOptimisticAction } from '@/hooks/use-optimistic-action';
import { Building, Mail, Calendar, PlusCircle, Users, Copy } from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function CoachAgenciesPage() {
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityLink, setCommunityLink] = useState<string | null>(null);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coach/agencies');
      if (!response.ok) {
        throw new Error('Failed to fetch agencies');
      }
      const data = await response.json();
      setAgencies(data.agencies);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      toast.error('Failed to load agencies.');
    } finally {
      setLoading(false);
    }
  };

  const { execute: executeGenerateLink, isLoading: isGeneratingLink, isSuccess: linkGenerated } = useOptimisticAction({
    onSuccess: (result: any) => {
      setCommunityLink(result.communityLink);
    },
    successMessage: 'Community link generated successfully!',
    errorMessage: 'Failed to generate community link',
  });

  const generateCommunityLink = async () => {
    await executeGenerateLink(async () => {
      const response = await fetch('/api/generate-agency-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'community' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate link');
      }

      return result;
    });
  };

  if (loading) {
    return <div className="p-6">Loading agencies...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Agency Management</h1>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Community Growth Link</p>
              <p className="text-xs text-muted-foreground">Share this link to grow your agency network (max 100 signups)</p>
            </div>
            <DelightfulButton 
              onClick={generateCommunityLink} 
              className="gap-2 whitespace-nowrap"
              isLoading={isGeneratingLink}
              isSuccess={linkGenerated}
              loadingText="Generating..."
              successText="Link Ready!"
              optimistic={true}
              haptic="medium"
              celebration={true}
            >
              <Users className="h-4 w-4" />
              Generate Community Link
            </DelightfulButton>
          </div>
        </CardContent>
      </Card>
      {communityLink && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">Community Link Generated!</CardTitle>
            <CardDescription>Share this link to invite new coaches to join your network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
              <code className="flex-1 text-sm break-all">{communityLink}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(communityLink);
                  delightfulToast.copied('Community link');
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Agencies</CardTitle>
        </CardHeader>
        <CardContent>
          {agencies.length === 0 ? (
            <p>No agencies found. Invite your first agency above!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Building className="inline-block mr-2 h-4 w-4" />Name</TableHead>
                  <TableHead><Mail className="inline-block mr-2 h-4 w-4" />Email</TableHead>
                  <TableHead><Calendar className="inline-block mr-2 h-4 w-4" />Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell className="font-medium">{agency.name}</TableCell>
                    <TableCell>{agency.email}</TableCell>
                    <TableCell>{new Date(agency.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {/* Add actions like View Details, Manage Clients, etc. */}
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/coach/agencies/${agency.id}/details`)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
