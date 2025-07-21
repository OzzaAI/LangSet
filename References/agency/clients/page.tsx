
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { PlusCircle, User, Mail, Calendar } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function AgencyClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agency/clients'); // Updated API path
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      setClients(data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteClient = async () => {
    if (!newClientEmail || !newClientName) {
      toast.error('Please enter client name and email.');
      return;
    }

    setLoading(true);
    setGeneratedInviteLink(null); // Clear previous link

    try {
      const response = await fetch('/api/agency/invite-client', { // Updated API path
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newClientEmail, name: newClientName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to invite client');
      }

      const data = await response.json();
      toast.success(`Invitation sent to ${data.email}!`);
      setNewClientEmail('');
      setNewClientName('');
      setGeneratedInviteLink(data.inviteLink); // Store the generated link
      fetchClients(); // Refresh client list
    } catch (error: any) {
      console.error('Error inviting client:', error);
      toast.error(error.message || 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading clients...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Client Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Invite New Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Client Name"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="email"
              placeholder="Client Email"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleInviteClient} className="sm:w-auto" disabled={loading}>
              <PlusCircle className="mr-2 h-4 w-4" /> {loading ? 'Inviting...' : 'Invite Client'}
            </Button>
          </div>
          {generatedInviteLink && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex flex-col sm:flex-row items-center gap-3">
              <p className="text-sm text-blue-800 break-all flex-1">Invite Link: <span className="font-mono text-blue-900">{generatedInviteLink}</span></p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatedInviteLink);
                  toast.info('Invite link copied to clipboard!');
                }}
              >
                Copy Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p>No clients found. Invite your first client above!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><User className="inline-block mr-2 h-4 w-4" />Name</TableHead>
                  <TableHead><Mail className="inline-block mr-2 h-4 w-4" />Email</TableHead>
                  <TableHead><Calendar className="inline-block mr-2 h-4 w-4" />Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/agency/clients/${client.id}/progress`)}> {/* Updated path */}
                        View Progress
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
