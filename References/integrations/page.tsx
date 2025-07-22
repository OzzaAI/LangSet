"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Key, 
  Webhook, 
  Copy, 
  RefreshCw, 
  TestTube, 
  Plus, 
  Trash2, 
  ExternalLink,
  Zap,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Integration {
  id: string;
  apiKey: string;
  apiKeyFull: string;
  webhookUrl: string | null;
  enabledEvents: string[];
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

const availableEvents = [
  { value: 'chat.message', label: 'New Chat Message' },
  { value: 'file.upload', label: 'File Upload' },
  { value: 'user.signup', label: 'User Signup' },
  { value: 'subscription.created', label: 'Subscription Created' },
  { value: 'subscription.updated', label: 'Subscription Updated' },
  { value: 'project.created', label: 'Project Created' },
  { value: 'project.completed', label: 'Project Completed' },
];

const integrationMarketplace = [
  {
    name: 'Zapier',
    description: 'Connect to 5000+ apps with Zapier automation',
    icon: '⚡',
    status: 'available',
    setupUrl: 'https://zapier.com/apps/ozza/integrations'
  },
  {
    name: 'Slack',
    description: 'Get notifications in your Slack channels',
    icon: '💬',
    status: 'coming-soon'
  },
  {
    name: 'Discord',
    description: 'Send updates to your Discord server',
    icon: '🎮',
    status: 'coming-soon'
  },
  {
    name: 'Webhooks',
    description: 'Custom webhook integrations for developers',
    icon: '🔗',
    status: 'available'
  }
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  
  // Form states
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to load integrations');
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/integrations/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.apiKey);
        setShowApiKeyDialog(true);
        await fetchIntegrations();
        toast.success('API key generated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate API key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    } finally {
      setCreating(false);
    }
  };

  const regenerateApiKey = async (integrationId: string) => {
    try {
      const response = await fetch('/api/integrations/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ regenerate: true, integrationId }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.apiKey);
        setShowApiKeyDialog(true);
        await fetchIntegrations();
        toast.success('API key regenerated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to regenerate API key');
      }
    } catch (error) {
      console.error('Error regenerating API key:', error);
      toast.error('Failed to regenerate API key');
    }
  };

  const updateIntegration = async (id: string, updates: Partial<Integration>) => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        await fetchIntegrations();
        toast.success('Integration updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update integration');
      }
    } catch (error) {
      console.error('Error updating integration:', error);
      toast.error('Failed to update integration');
    }
  };

  const deleteIntegration = async (id: string) => {
    try {
      const response = await fetch(`/api/integrations?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchIntegrations();
        toast.success('Integration deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete integration');
      }
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast.error('Failed to delete integration');
    }
  };

  const testWebhook = async (integration: Integration) => {
    if (!integration.webhookUrl) {
      toast.error('No webhook URL configured');
      return;
    }

    setTesting(integration.id);
    try {
      const response = await fetch('/api/integrations/webhook/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl: integration.webhookUrl,
          secret: 'test-secret' // In production, use the actual webhook secret
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Webhook test successful! Status: ${result.status}`);
      } else {
        toast.error(`Webhook test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Failed to test webhook');
    } finally {
      setTesting(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations & API</h1>
        <p className="text-muted-foreground">
          Connect Ozza with your favorite tools and services.
        </p>
      </div>

      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Generate API keys to access Ozza programmatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first API key to start integrating with Ozza
              </p>
              <Button onClick={generateApiKey} disabled={creating}>
                <Plus className="h-4 w-4 mr-2" />
                {creating ? 'Generating...' : 'Generate API Key'}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Your API Keys</h3>
                <Button onClick={generateApiKey} disabled={creating} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {creating ? 'Generating...' : 'New Key'}
                </Button>
              </div>
              
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.isActive ? "default" : "secondary"}>
                          {integration.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Created {new Date(integration.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(integration.apiKeyFull)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateApiKey(integration.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteIntegration(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>API Key</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={integration.apiKey}
                            readOnly
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Status</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Switch
                              checked={integration.isActive}
                              onCheckedChange={(checked) => 
                                updateIntegration(integration.id, { isActive: checked })
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              {integration.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        {integration.lastUsed && (
                          <div className="text-right">
                            <Label>Last Used</Label>
                            <p className="text-sm text-muted-foreground">
                              {new Date(integration.lastUsed).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Webhooks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>
            Receive real-time notifications when events occur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="border rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`webhook-${integration.id}`}>Webhook URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id={`webhook-${integration.id}`}
                      value={integration.webhookUrl || ''}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://your-app.com/webhook"
                      onBlur={() => {
                        if (webhookUrl !== integration.webhookUrl) {
                          updateIntegration(integration.id, { webhookUrl });
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(integration)}
                      disabled={!integration.webhookUrl || testing === integration.id}
                    >
                      {testing === integration.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Events to Subscribe</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableEvents.map((event) => (
                      <div key={event.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`${integration.id}-${event.value}`}
                          checked={integration.enabledEvents.includes(event.value)}
                          onChange={(e) => {
                            const newEvents = e.target.checked
                              ? [...integration.enabledEvents, event.value]
                              : integration.enabledEvents.filter(ev => ev !== event.value);
                            updateIntegration(integration.id, { enabledEvents: newEvents });
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label 
                          htmlFor={`${integration.id}-${event.value}`}
                          className="text-sm font-normal"
                        >
                          {event.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Integration Marketplace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Integration Marketplace
          </CardTitle>
          <CardDescription>
            Connect with popular tools and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {integrationMarketplace.map((integration) => (
              <div key={integration.name} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{integration.icon}</div>
                    <div>
                      <h3 className="font-medium">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={integration.status === 'available' ? 'default' : 'secondary'}
                  >
                    {integration.status === 'available' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {integration.status === 'available' ? 'Available' : 'Coming Soon'}
                  </Badge>
                </div>
                
                {integration.status === 'available' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      if (integration.setupUrl) {
                        window.open(integration.setupUrl, '_blank');
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Key Display Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your New API Key</DialogTitle>
            <DialogDescription>
              Copy this API key now. For security reasons, you won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>API Key</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={newApiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(newApiKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Usage Example</h4>
              <pre className="text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer ${newApiKey}" \\
     -H "Content-Type: application/json" \\
     https://api.ozza.ai/v1/chat`}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
