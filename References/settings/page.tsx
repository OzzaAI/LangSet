"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import Link from "next/link";
import { 
  Palette, 
  Save, 
  Eye, 
  Settings,
  ArrowRight,
  ExternalLink,
  Bell,
  Clock,
  DollarSign,
  AlertTriangle,
  UserCheck,
  Shield,
  Zap,
  Key,
  Webhook,
  Paintbrush
} from "lucide-react";

interface WhiteLabelConfig {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string;
  brandName: string;
  favicon: string;
}

export default function SettingsPage() {
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>({
    logoUrl: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#1e40af",
    customDomain: "",
    brandName: "",
    favicon: "",
  });
  const [coachMode, setCoachMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/user-settings");
        if (response.ok) {
          const data = await response.json();
          if (data.settings.whiteLabelConfig) {
            setWhiteLabelConfig({ ...whiteLabelConfig, ...data.settings.whiteLabelConfig });
          }
          if (data.settings.preferences?.coachMode !== undefined) {
            setCoachMode(data.settings.preferences.coachMode);
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const handleWhiteLabelSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whiteLabelConfig }),
      });

      if (response.ok) {
        toast.success("White-label settings saved successfully!");
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save white-label settings");
      console.error("Error saving settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCoachModeToggle = async (enabled: boolean) => {
    try {
      const response = await fetch("/api/user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          preferences: { coachMode: enabled }
        }),
      });

      if (response.ok) {
        setCoachMode(enabled);
        toast.success(`Coach mode ${enabled ? 'enabled' : 'disabled'} successfully!`);
      } else {
        throw new Error("Failed to update coach mode");
      }
    } catch (error) {
      toast.error("Failed to update coach mode");
      console.error("Error updating coach mode:", error);
    }
  };

  const handlePreview = () => {
    // Apply preview styles temporarily
    const root = document.documentElement;
    root.style.setProperty("--primary", whiteLabelConfig.primaryColor);
    root.style.setProperty("--primary-foreground", "#ffffff");
    toast.success("Preview applied! Reload to revert.");
  };
  return (
    <>
      {/* Settings Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="w-6 h-6 text-teal-400" />
          Settings
        </h1>
        <p className="text-gray-300 mt-2">
          Manage your profile, preferences, and white-label customization
        </p>
      </div>

      {/* White Label Customization - Full Width Like Income Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Palette className="w-6 h-6 text-teal-400" />
            White Label Customization
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={handlePreview}
              className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 hover:border-purple-400/50 rounded-lg px-4 py-2 text-sm font-medium text-blue-300 hover:text-purple-200 transition-all duration-300 backdrop-blur-xl flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Brand Identity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Brand Identity</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Brand Name</label>
                  <input
                    type="text"
                    placeholder="Your Coaching Brand"
                    value={whiteLabelConfig.brandName}
                    onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, brandName: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Logo URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png"
                    value={whiteLabelConfig.logoUrl}
                    onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50"
                  />
                </div>
              </div>
            </div>

            {/* Colors & Domain */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Colors & Domain</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={whiteLabelConfig.primaryColor}
                        onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-12 h-10 rounded-lg border border-white/10 bg-white/5"
                      />
                      <input
                        type="text"
                        value={whiteLabelConfig.primaryColor}
                        onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#3b82f6"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={whiteLabelConfig.secondaryColor}
                        onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-12 h-10 rounded-lg border border-white/10 bg-white/5"
                      />
                      <input
                        type="text"
                        value={whiteLabelConfig.secondaryColor}
                        onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        placeholder="#1e40af"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Custom Domain</label>
                  <input
                    type="text"
                    placeholder="coaching.yourdomain.com"
                    value={whiteLabelConfig.customDomain}
                    onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, customDomain: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <button 
              onClick={handleWhiteLabelSave}
              disabled={loading}
              className="bg-gradient-to-r from-teal-500/20 to-green-500/20 hover:from-teal-500/30 hover:to-green-500/30 border border-teal-400/30 hover:border-green-400/50 rounded-lg px-6 py-2 text-sm font-medium text-teal-300 hover:text-green-200 transition-all duration-300 backdrop-blur-xl flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save White Label Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Coach Mode Toggle */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-teal-400" />
            Coach Mode
          </h2>
        </div>
        
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                Enable Coach Dashboard
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Unlock advanced coaching features including client onboarding metrics, revenue sharing from marketplace downloads, and enhanced analytics for managing your coaching business.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                  <span>Client onboarding tracking</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                  <span>Marketplace revenue sharing (50%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                  <span>Viral growth analytics</span>
                </div>
              </div>
            </div>
            <div className="ml-6">
              <button
                onClick={() => handleCoachModeToggle(!coachMode)}
                disabled={loadingSettings}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  coachMode 
                    ? 'bg-gradient-to-r from-teal-500 to-green-500' 
                    : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    coachMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid - Match Coach Dashboard Pattern */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Profile Settings */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-teal-400" />
              Profile Information
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
              <input
                type="text"
                placeholder="Your display name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
              <textarea
                placeholder="Tell your clients about yourself..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Specializations</label>
              <input
                type="text"
                placeholder="e.g., Life Coaching, Business Coaching"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50"
              />
            </div>
          </div>

          <div className="mt-6">
            <button className="text-teal-300 hover:text-teal-200 text-sm font-medium flex items-center gap-1">
              Save Profile <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-400" />
              Notifications
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Email Notifications</p>
                <p className="text-xs text-gray-400">Receive email updates about your clients</p>
              </div>
              <div className="w-12 h-6 bg-teal-500/30 rounded-full relative cursor-pointer border border-teal-400/50">
                <div className="w-5 h-5 bg-teal-400 rounded-full absolute top-0.5 right-0.5 transition-all"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Session Reminders</p>
                <p className="text-xs text-gray-400">Get notified before upcoming sessions</p>
              </div>
              <div className="w-12 h-6 bg-teal-500/30 rounded-full relative cursor-pointer border border-teal-400/50">
                <div className="w-5 h-5 bg-teal-400 rounded-full absolute top-0.5 right-0.5 transition-all"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Client Messages</p>
                <p className="text-xs text-gray-400">Notifications for new client messages</p>
              </div>
              <div className="w-12 h-6 bg-gray-600 rounded-full relative cursor-pointer border border-gray-500">
                <div className="w-5 h-5 bg-gray-400 rounded-full absolute top-0.5 left-0.5 transition-all"></div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button className="text-teal-300 hover:text-teal-200 text-sm font-medium flex items-center gap-1">
              Save Preferences <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Session Settings */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" />
              Session Settings
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Default Session Duration</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50">
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hourly Rate</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="number"
                  placeholder="150"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time Zone</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50">
                <option value="et">Eastern Time (ET)</option>
                <option value="ct">Central Time (CT)</option>
                <option value="mt">Mountain Time (MT)</option>
                <option value="pt">Pacific Time (PT)</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button className="text-teal-300 hover:text-teal-200 text-sm font-medium flex items-center gap-1">
              Save Settings <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-400" />
              Advanced Features
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branding */}
            <Link href="/dashboard/branding" className="group">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-teal-400/30 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                    <Paintbrush className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Custom Branding</h4>
                    <p className="text-sm text-gray-400">White-label customization</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Upload your logo, customize colors, and enable white-label mode for your brand.
                </p>
                <div className="flex items-center text-teal-300 text-sm font-medium group-hover:text-teal-200">
                  Customize Branding <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Integrations */}
            <Link href="/dashboard/integrations" className="group">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-teal-400/30 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                    <Key className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Integrations & API</h4>
                    <p className="text-sm text-gray-400">Connect external tools</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Generate API keys, set up webhooks, and connect with Zapier, Slack, and more.
                </p>
                <div className="flex items-center text-teal-300 text-sm font-medium group-hover:text-teal-200">
                  Manage Integrations <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>

          {/* Onboarding Tour */}
          <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-300" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Onboarding Tour</h4>
                  <p className="text-sm text-gray-400">Retake the guided tour</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  // Reset onboarding status to trigger tour
                  fetch('/api/onboarding/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completed: false, step: 0 })
                  }).then(() => {
                    window.location.href = '/dashboard';
                  });
                }}
                className="text-teal-300 hover:text-teal-200 text-sm font-medium flex items-center gap-1"
              >
                Start Tour <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Danger Zone
            </h3>
          </div>
          
          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
            <p className="text-sm text-red-200 mb-4">
              Deleting your account will immediately cancel your subscription and permanently remove all of your data. This action
              cannot be undone.
            </p>
            <DeleteAccountButton />
          </div>
        </div>
      </div>
    </>
  );
} 