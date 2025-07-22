"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Store, 
  Upload, 
  Download, 
  Share2, 
  DollarSign, 
  Users, 
  Star, 
  TrendingUp,
  ExternalLink,
  ArrowRight,
  Zap,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Settings,
  Plus
} from "lucide-react";
import ViralShare from "@/app/[locale]/dashboard/_components/viral-share";

interface Agent {
  id: string;
  name: string;
  spec: string;
  userId: string;
  userName?: string;
  createdAt: string;
  downloads?: number;
  rating?: number;
  price?: number;
  description?: string;
  category?: string;
  shares?: number;
}

interface MarketplaceStats {
  totalAgents: number;
  totalDownloads: number;
  totalShares: number;
  revenue: number;
}

export default function MarketplacePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<MarketplaceStats>({
    totalAgents: 0,
    totalDownloads: 0,
    totalShares: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [selectedAgentForSharing, setSelectedAgentForSharing] = useState<Agent | null>(null);
  const router = useRouter();

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "automation", label: "Automation" },
    { value: "analytics", label: "Analytics" },
    { value: "communication", label: "Communication" },
    { value: "productivity", label: "Productivity" },
    { value: "marketing", label: "Marketing" },
    { value: "other", label: "Other" }
  ];

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      
      // Load agents from the database
      const response = await fetch("/api/marketplace");
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
        setStats(data.stats || {
          totalAgents: 0,
          totalDownloads: 0,
          totalShares: 0,
          revenue: 0
        });
      } else {
        // Fallback with mock data
        const mockAgents: Agent[] = [
          {
            id: "1",
            name: "Email Automation Pro",
            spec: "name: Email Automation Pro\\ndescription: Advanced email automation with smart triggers",
            userId: "user1",
            userName: "John Doe",
            createdAt: new Date().toISOString(),
            downloads: 234,
            rating: 4.8,
            price: 2500, // $25.00
            description: "Advanced email automation with smart triggers and AI-powered responses",
            category: "automation",
            shares: 45
          },
          {
            id: "2", 
            name: "Analytics Dashboard",
            spec: "name: Analytics Dashboard\\ndescription: Comprehensive data visualization and insights",
            userId: "user2",
            userName: "Jane Smith",
            createdAt: new Date().toISOString(),
            downloads: 156,
            rating: 4.6,
            price: 3500, // $35.00
            description: "Real-time analytics with custom dashboards and reporting",
            category: "analytics",
            shares: 32
          },
          {
            id: "3",
            name: "Lead Gen Assistant",
            spec: "name: Lead Gen Assistant\\ndescription: AI-powered lead generation and qualification",
            userId: "user3", 
            userName: "Mike Johnson",
            createdAt: new Date().toISOString(),
            downloads: 189,
            rating: 4.9,
            price: 4500, // $45.00
            description: "Automated lead generation with intelligent qualification and scoring",
            category: "marketing",
            shares: 67
          }
        ];
        
        setAgents(mockAgents);
        setStats({
          totalAgents: mockAgents.length,
          totalDownloads: mockAgents.reduce((sum, agent) => sum + (agent.downloads || 0), 0),
          totalShares: mockAgents.reduce((sum, agent) => sum + (agent.shares || 0), 0),
          revenue: 12750 // Mock revenue
        });
      }
    } catch (error) {
      console.error("Failed to load marketplace data:", error);
      toast.error("Failed to load marketplace data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  useEffect(() => {
    let filtered = agents;
    
    if (searchTerm) {
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.description && agent.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(agent => agent.category === selectedCategory);
    }
    
    setFilteredAgents(filtered);
  }, [agents, searchTerm, selectedCategory]);

  const handleUploadAgent = async () => {
    setUploading(true);
    try {
      // Navigate to the convert API with a callback to marketplace
      router.push("/dashboard/convert?redirect=marketplace");
    } catch (error) {
      toast.error("Failed to start upload process");
    } finally {
      setUploading(false);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const extractDescription = (spec: string): string => {
    const lines = spec.split('\\n');
    const descLine = lines.find(line => line.startsWith('description:'));
    return descLine ? descLine.replace('description:', '').trim() : 'No description available';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-white/20 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 h-32 rounded-lg backdrop-blur-sm"></div>
          ))}
        </div>
        <div className="bg-white/10 h-96 rounded-lg backdrop-blur-sm"></div>
      </div>
    );
  }

  return (
    <>
      {/* Marketplace Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Store className="w-6 h-6 text-teal-400" />
          Agent Marketplace
        </h1>
        <p className="text-gray-300 mt-2">
          Discover, share, and monetize AI agents across the Ozza community
        </p>
      </div>

      {/* Marketplace Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-6 w-6 text-teal-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300">Total Agents</p>
              <p className="text-2xl font-semibold text-white">{stats.totalAgents}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Download className="h-6 w-6 text-teal-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300">Downloads</p>
              <p className="text-2xl font-semibold text-white">{stats.totalDownloads}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Share2 className="h-6 w-6 text-teal-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300">Shares</p>
              <p className="text-2xl font-semibold text-white">{stats.totalShares}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-6 w-6 text-teal-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300">Revenue</p>
              <p className="text-2xl font-semibold text-white">{formatPrice(stats.revenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-teal-400" />
            Browse Agents
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={loadMarketplaceData}
              className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 hover:border-purple-400/50 rounded-lg px-4 py-2 text-sm font-medium text-blue-300 hover:text-purple-200 transition-all duration-300 backdrop-blur-xl flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button 
              onClick={handleUploadAgent}
              disabled={uploading}
              className="bg-gradient-to-r from-teal-500/20 to-green-500/20 hover:from-teal-500/30 hover:to-green-500/30 border border-teal-400/30 hover:border-green-400/50 rounded-lg px-4 py-2 text-sm font-medium text-teal-300 hover:text-green-200 transition-all duration-300 backdrop-blur-xl flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload Agent"}
            </button>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50"
                />
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="sm:w-48">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value} className="bg-gray-800">
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">{agent.name}</h3>
                <p className="text-sm text-gray-400">by {agent.userName || 'Anonymous'}</p>
              </div>
              {agent.price && (
                <div className="bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg px-2 py-1 text-sm font-medium">
                  {formatPrice(agent.price)}
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-300 mb-4 line-clamp-2">
              {agent.description || extractDescription(agent.spec)}
            </p>
            
            <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{agent.downloads || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                <span>{agent.shares || 0}</span>
              </div>
              {agent.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  <span>{agent.rating}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex-1 bg-gradient-to-r from-teal-500/20 to-green-500/20 hover:from-teal-500/30 hover:to-green-500/30 border border-teal-400/30 hover:border-green-400/50 rounded-lg px-3 py-2 text-sm font-medium text-teal-300 hover:text-green-200 transition-all duration-300 backdrop-blur-xl flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </button>
              <button 
                onClick={() => setSelectedAgentForSharing(agent)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAgents.length === 0 && !loading && (
        <div className="bg-gradient-to-br from-white/3 via-white/1 to-white/2 backdrop-blur-xl border border-white/8 rounded-xl p-8 text-center">
          <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No agents found</h3>
          <p className="text-gray-400 mb-4">
            {searchTerm || selectedCategory !== "all" 
              ? "Try adjusting your search or filter criteria" 
              : "Be the first to upload an agent to the marketplace"
            }
          </p>
          <button 
            onClick={handleUploadAgent}
            className="bg-gradient-to-r from-teal-500/20 to-green-500/20 hover:from-teal-500/30 hover:to-green-500/30 border border-teal-400/30 hover:border-green-400/50 rounded-lg px-4 py-2 text-sm font-medium text-teal-300 hover:text-green-200 transition-all duration-300 backdrop-blur-xl flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Upload First Agent
          </button>
        </div>
      )}

      {/* Viral Sharing Modal/Sidebar */}
      {selectedAgentForSharing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Share Agent
                </h3>
                <button
                  onClick={() => setSelectedAgentForSharing(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <ViralShare
                agentId={selectedAgentForSharing.id}
                agentName={selectedAgentForSharing.name}
                agentDescription={selectedAgentForSharing.description}
                onShareComplete={(platform, link) => {
                  console.log(`Shared to ${platform}: ${link}`);
                  // Refresh marketplace data to update share counts
                  loadMarketplaceData();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}