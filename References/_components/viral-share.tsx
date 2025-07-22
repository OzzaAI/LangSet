"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  Share2, 
  ExternalLink, 
  Copy, 
  Check,
  Users,
  MessageCircle,
  Twitter,
  Linkedin,
  Facebook,
  Mail,
  Link as LinkIcon
} from "lucide-react";

interface ViralShareProps {
  agentId: string;
  agentName: string;
  agentDescription?: string;
  onShareComplete?: (platform: string, link: string) => void;
}

interface SharePlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  shareUrl: (text: string, url: string) => string;
}

const platforms: SharePlatform[] = [
  {
    id: "skool",
    name: "Skool",
    icon: <Users className="w-4 h-4" />,
    color: "text-purple-300",
    bgColor: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-400/30",
    shareUrl: (text, url) => `https://www.skool.com/share?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: <Twitter className="w-4 h-4" />,
    color: "text-blue-300",
    bgColor: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-400/30",
    shareUrl: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin className="w-4 h-4" />,
    color: "text-blue-400",
    bgColor: "from-blue-600/20 to-blue-500/20",
    borderColor: "border-blue-500/30",
    shareUrl: (text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook className="w-4 h-4" />,
    color: "text-blue-500",
    bgColor: "from-blue-700/20 to-blue-600/20",
    borderColor: "border-blue-600/30",
    shareUrl: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
  }
];

export default function ViralShare({ agentId, agentName, agentDescription, onShareComplete }: ViralShareProps) {
  const [sharing, setSharing] = useState<string | null>(null);
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const generateShareText = () => {
    const description = agentDescription || "Check out this amazing AI agent";
    return `🤖 ${agentName}: ${description} - Built with Ozza AI Platform`;
  };

  const handleShare = async (platform: SharePlatform) => {
    setSharing(platform.id);
    
    try {
      // Generate referral link via API
      const response = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          platform: platform.id,
          generateReferralLink: true
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate referral link");
      }

      const data = await response.json();
      const referralLink = data.share.link;
      
      // Store generated link
      setGeneratedLinks(prev => ({
        ...prev,
        [platform.id]: referralLink
      }));

      // Generate share text
      const shareText = generateShareText();
      
      // Open share URL in new window
      const shareUrl = platform.shareUrl(shareText, referralLink);
      window.open(shareUrl, "_blank", "width=600,height=400");
      
      // Call completion callback
      onShareComplete?.(platform.id, referralLink);
      
      toast.success(`Shared to ${platform.name}! Your referral link is ready.`);
      
    } catch (error) {
      console.error("Share error:", error);
      toast.error(`Failed to share to ${platform.name}`);
    } finally {
      setSharing(null);
    }
  };

  const copyLink = async (platformId: string) => {
    const link = generatedLinks[platformId];
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(platformId);
      toast.success("Referral link copied to clipboard!");
      
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const generateDirectLink = async () => {
    setSharing("direct");
    
    try {
      const response = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          platform: "direct",
          generateReferralLink: true
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate direct link");
      }

      const data = await response.json();
      const directLink = data.share.link;
      
      setGeneratedLinks(prev => ({
        ...prev,
        direct: directLink
      }));

      await navigator.clipboard.writeText(directLink);
      toast.success("Direct referral link copied to clipboard!");
      
      onShareComplete?.("direct", directLink);
      
    } catch (error) {
      console.error("Direct link error:", error);
      toast.error("Failed to generate direct link");
    } finally {
      setSharing(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-teal-400" />
          Share & Earn
        </h3>
        <div className="text-xs px-2 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
          Viral Growth
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-6">
        Share <span className="font-medium text-white">{agentName}</span> with your network and earn commissions on downloads!
      </p>

      {/* Social Platforms */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-300">Share on Social Platforms</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {platforms.map((platform) => (
            <div key={platform.id} className="space-y-2">
              <button
                onClick={() => handleShare(platform)}
                disabled={sharing === platform.id}
                className={`w-full bg-gradient-to-r ${platform.bgColor} hover:opacity-80 border ${platform.borderColor} rounded-lg px-4 py-3 text-sm font-medium ${platform.color} transition-all duration-300 backdrop-blur-xl flex items-center justify-center gap-2`}
              >
                {platform.icon}
                {sharing === platform.id ? "Sharing..." : `Share to ${platform.name}`}
              </button>
              
              {/* Show generated link with copy option */}
              {generatedLinks[platform.id] && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedLinks[platform.id]}
                    readOnly
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 truncate"
                  />
                  <button
                    onClick={() => copyLink(platform.id)}
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    {copiedLink === platform.id ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Direct Link */}
      <div className="border-t border-white/10 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Direct Referral Link</h4>
        <div className="space-y-2">
          <button
            onClick={generateDirectLink}
            disabled={sharing === "direct"}
            className="w-full bg-gradient-to-r from-gray-500/20 to-gray-400/20 hover:from-gray-500/30 hover:to-gray-400/30 border border-gray-400/30 rounded-lg px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 backdrop-blur-xl flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            {sharing === "direct" ? "Generating..." : "Generate Direct Link"}
          </button>
          
          {generatedLinks.direct && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={generatedLinks.direct}
                readOnly
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-gray-300"
              />
              <button
                onClick={() => copyLink("direct")}
                className="bg-white/10 border border-white/20 rounded px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                {copiedLink === "direct" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Earnings Info */}
      <div className="mt-6 bg-white/5 rounded-lg p-3 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-sm font-medium text-green-300">Earnings Potential</span>
        </div>
        <p className="text-xs text-gray-400">
          Earn 10% commission on every download from your referral links. Share strategically to maximize your impact!
        </p>
      </div>
    </div>
  );
}