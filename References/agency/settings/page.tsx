'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Palette, Image as ImageIcon, Save, Building } from 'lucide-react';

interface AgencySettings {
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

export default function AgencySettingsPage() {
  const [settings, setSettings] = useState<AgencySettings>({
    name: '',
    logo_url: '',
    primary_color: '#3B82F6', // Default blue
    secondary_color: '#6B7280', // Default gray
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agency/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch agency settings');
      }
      const data = await response.json();
      setSettings({
        name: data.name || '',
        logo_url: data.logo_url || '',
        primary_color: data.primary_color || '#3B82F6',
        secondary_color: data.secondary_color || '#6B7280',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load agency settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/agency/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Agency Settings</h1>
      <p className="text-muted-foreground">Manage your agency's profile and branding.</p>

      <Card>
        <CardHeader>
          <CardTitle>Agency Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Agency Name</Label>
            <Input
              id="name"
              value={settings.name}
              onChange={handleInputChange}
              placeholder="Your Agency Name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={settings.logo_url || ''}
              onChange={handleInputChange}
              placeholder="https://example.com/your-logo.png"
            />
            {settings.logo_url && (
              <div className="mt-2">
                <ImageIcon className="inline-block mr-2 h-4 w-4" /> Current Logo Preview (URL only)
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={settings.primary_color || '#3B82F6'}
                  onChange={handleInputChange}
                  className="w-12 h-12 p-0 border-none"
                />
                <Input
                  id="primary_color_text"
                  value={settings.primary_color || '#3B82F6'}
                  onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
                <Palette className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={settings.secondary_color || '#6B7280'}
                  onChange={handleInputChange}
                  className="w-12 h-12 p-0 border-none"
                />
                <Input
                  id="secondary_color_text"
                  value={settings.secondary_color || '#6B7280'}
                  onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                  placeholder="#6B7280"
                  className="flex-1"
                />
                <Palette className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={isSaving || loading}>
            <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
