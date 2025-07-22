'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, Users, Building, BarChart3, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

type PrivacySettings = {
  blindMode: boolean;
  shareClientNames: boolean;
  shareRevenue: boolean;
  shareMetrics: boolean;
  shareConversions: boolean;
  allowCoachAccess: boolean;
  allowCoachChat: boolean;
  shareIssues: boolean;
};

export default function PrivacySettings() {
  const [settings, setSettings] = useState<PrivacySettings>({
    blindMode: true,
    shareClientNames: false,
    shareRevenue: true,
    shareMetrics: true,
    shareConversions: true,
    allowCoachAccess: false,
    allowCoachChat: true,
    shareIssues: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load current privacy settings
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/agency/privacy-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSetting = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
      // If enabling blind mode, disable coach access
      ...(key === 'blindMode' && value ? { allowCoachAccess: false } : {}),
      // If allowing coach access, disable blind mode
      ...(key === 'allowCoachAccess' && value ? { blindMode: false } : {}),
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/agency/privacy-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast.success('Privacy settings updated successfully');
      } else {
        toast.error('Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Privacy & Data Sharing</h1>
        <p className="text-muted-foreground">
          Control what data your coach can see and how they can interact with your agency
        </p>
      </div>

      {/* Blind Mode Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Blind Mode Protection</CardTitle>
            {settings.blindMode && <Badge variant="secondary">Active</Badge>}
          </div>
          <CardDescription>
            When enabled, your coach sees only aggregated analytics data without client names or sensitive details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.blindMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="font-medium">
                {settings.blindMode ? 'Blind Mode Enabled' : 'Full Visibility Mode'}
              </span>
            </div>
            <Switch
              checked={settings.blindMode}
              onCheckedChange={(checked) => updateSetting('blindMode', checked)}
            />
          </div>
          
          {settings.blindMode && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your coach can see performance metrics and analytics but cannot access client names, 
                specific project details, or your agency's internal data.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detailed Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Granular Data Sharing Controls</CardTitle>
          <CardDescription>
            Fine-tune what specific data points your coach can access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <h4 className="font-medium">Client Information</h4>
            </div>
            
            <div className="flex items-center justify-between pl-6">
              <div>
                <span className="text-sm font-medium">Share client names and details</span>
                <p className="text-xs text-muted-foreground">Allow coach to see specific client information</p>
              </div>
              <Switch
                checked={settings.shareClientNames}
                onCheckedChange={(checked) => updateSetting('shareClientNames', checked)}
                disabled={settings.blindMode}
              />
            </div>
          </div>

          {/* Financial Data */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <h4 className="font-medium">Financial & Performance Data</h4>
            </div>
            
            <div className="flex items-center justify-between pl-6">
              <div>
                <span className="text-sm font-medium">Revenue numbers</span>
                <p className="text-xs text-muted-foreground">Share monthly revenue and financial metrics</p>
              </div>
              <Switch
                checked={settings.shareRevenue}
                onCheckedChange={(checked) => updateSetting('shareRevenue', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between pl-6">
              <div>
                <span className="text-sm font-medium">Conversion rates</span>
                <p className="text-xs text-muted-foreground">Share website and campaign conversion data</p>
              </div>
              <Switch
                checked={settings.shareConversions}
                onCheckedChange={(checked) => updateSetting('shareConversions', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between pl-6">
              <div>
                <span className="text-sm font-medium">Performance metrics</span>
                <p className="text-xs text-muted-foreground">Share detailed analytics and KPIs</p>
              </div>
              <Switch
                checked={settings.shareMetrics}
                onCheckedChange={(checked) => updateSetting('shareMetrics', checked)}
              />
            </div>
          </div>

          {/* Coach Access */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <h4 className="font-medium">Coach Access & Communication</h4>
            </div>
            
            <div className="flex items-center justify-between pl-6">
              <div>
                <span className="text-sm font-medium">Direct agency access</span>
                <p className="text-xs text-muted-foreground">Allow coach to view/edit agency projects (disables blind mode)</p>
              </div>
              <Switch
                checked={settings.allowCoachAccess}
                onCheckedChange={(checked) => updateSetting('allowCoachAccess', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between pl-6">
              <div>
                <span className="text-sm font-medium">Coach chat/messaging</span>
                <p className="text-xs text-muted-foreground">Enable direct communication with your coach</p>
              </div>
              <Switch
                checked={settings.allowCoachChat}
                onCheckedChange={(checked) => updateSetting('allowCoachChat', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between pl-6">
              <div>
                <span className="text-sm font-medium">Issue reporting</span>
                <p className="text-xs text-muted-foreground">Share technical issues and support requests with coach</p>
              </div>
              <Switch
                checked={settings.shareIssues}
                onCheckedChange={(checked) => updateSetting('shareIssues', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Privacy Level</CardTitle>
          <CardDescription>
            Summary of your data sharing preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Protection Level:</span>
              <Badge variant={settings.blindMode ? 'default' : 'secondary'}>
                {settings.blindMode ? 'High Privacy (Blind Mode)' : 'Standard Privacy'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Coach can see:</span>
              <span className="text-sm text-muted-foreground">
                {settings.blindMode 
                  ? 'Aggregated metrics only' 
                  : 'Detailed data based on settings above'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Direct access:</span>
              <Badge variant={settings.allowCoachAccess ? 'destructive' : 'default'}>
                {settings.allowCoachAccess ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </div>
    </div>
  );
}