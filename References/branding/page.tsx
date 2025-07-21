"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Upload, Palette, Eye, Save } from 'lucide-react';
import { uploadImageAssets } from '@/lib/upload-image';

interface BrandingData {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  isWhiteLabelEnabled: boolean;
  customDomain: string | null;
  brandName: string | null;
  favicon: string | null;
}

export default function BrandingPage() {
  const [branding, setBranding] = useState<BrandingData>({
    logoUrl: null,
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    accentColor: '#06b6d4',
    isWhiteLabelEnabled: false,
    customDomain: null,
    brandName: null,
    favicon: null
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const response = await fetch('/api/branding');
      if (response.ok) {
        const data = await response.json();
        setBranding(data);
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
      toast.error('Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branding),
      });

      if (response.ok) {
        toast.success('Branding settings saved successfully');
        // Apply theme changes immediately
        applyTheme();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save branding settings');
      }
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = `branding/logos/${Date.now()}-${file.name}`;
      const logoUrl = await uploadImageAssets(buffer, key);
      
      setBranding(prev => ({ ...prev, logoUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const applyTheme = () => {
    const root = document.documentElement;
    root.style.setProperty('--primary', branding.primaryColor);
    root.style.setProperty('--secondary', branding.secondaryColor);
    root.style.setProperty('--accent', branding.accentColor);
  };

  const previewTheme = () => {
    applyTheme();
    toast.success('Theme preview applied! Save to make it permanent.');
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
        <h1 className="text-3xl font-bold">Branding & White-Label</h1>
        <p className="text-muted-foreground">
          Customize your app's appearance and enable white-label mode for your brand.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo & Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo & Assets
            </CardTitle>
            <CardDescription>
              Upload your brand logo and favicon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logo">Brand Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                {branding.logoUrl && (
                  <img 
                    src={branding.logoUrl} 
                    alt="Brand logo" 
                    className="h-12 w-12 object-contain rounded border"
                  />
                )}
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
              </div>
              {uploading && (
                <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
              )}
            </div>

            <div>
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={branding.brandName || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, brandName: e.target.value }))}
                placeholder="Your Brand Name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Color Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Theme
            </CardTitle>
            <CardDescription>
              Customize your brand colors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="primaryColor"
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={branding.secondaryColor}
                  onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  placeholder="#1e40af"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="accentColor"
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={branding.accentColor}
                  onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                  placeholder="#06b6d4"
                />
              </div>
            </div>

            <Button onClick={previewTheme} variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              Preview Theme
            </Button>
          </CardContent>
        </Card>

        {/* White-Label Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>White-Label Mode</CardTitle>
            <CardDescription>
              Hide Ozza branding and use your own. Premium feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="whiteLabelMode">Enable White-Label Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Remove Ozza branding and use your own brand identity
                </p>
              </div>
              <Switch
                id="whiteLabelMode"
                checked={branding.isWhiteLabelEnabled}
                onCheckedChange={(checked) => setBranding(prev => ({ ...prev, isWhiteLabelEnabled: checked }))}
              />
            </div>

            {branding.isWhiteLabelEnabled && (
              <>
                <Separator />
                <div>
                  <Label htmlFor="customDomain">Custom Domain</Label>
                  <Input
                    id="customDomain"
                    value={branding.customDomain || ''}
                    onChange={(e) => setBranding(prev => ({ ...prev, customDomain: e.target.value }))}
                    placeholder="your-domain.com"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Contact support to configure your custom domain
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
