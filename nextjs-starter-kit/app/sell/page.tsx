"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  calculatePricingSuggestion, 
  calculateBundlePricing, 
  formatPrice, 
  calculatePlatformFee,
  calculateSellerAmount 
} from "@/lib/pricing";
import { toast } from "sonner";
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  Users,
  Filter,
  Eye,
  BarChart3
} from "lucide-react";

interface Dataset {
  id: string;
  name: string;
  description?: string;
  instanceCount: number;
  averageQualityScore: number;
  totalEditCount: number;
  careerNiches: string[];
  tags: string[];
  createdAt: string;
}

// interface PricingSuggestion {
//   suggested: number;
//   min: number;
//   max: number;
//   reasoning: string[];
//   factors: {
//     quality: number;
//     quantity: number;
//     uniqueness: number;
//     engagement: number;
//   };
// }

const FILTER_OPTIONS = {
  careerNiches: [
    "Technology", "Marketing", "Sales", "Design", "Engineering",
    "Product Management", "Finance", "Operations", "Human Resources",
    "Consulting", "Healthcare", "Education", "Legal", "Real Estate"
  ],
  qualityRange: [
    { label: "High Quality (80-100)", min: 80, max: 100 },
    { label: "Good Quality (60-79)", min: 60, max: 79 },
    { label: "Average Quality (40-59)", min: 40, max: 59 },
    { label: "Needs Work (0-39)", min: 0, max: 39 },
  ],
  instanceCount: [
    { label: "Large (100+ instances)", min: 100, max: Infinity },
    { label: "Medium (25-99 instances)", min: 25, max: 99 },
    { label: "Small (10-24 instances)", min: 10, max: 24 },
    { label: "Starter (1-9 instances)", min: 1, max: 9 },
  ],
};

export default function SellPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showBundleMode, setShowBundleMode] = useState(false);
  const [filters, setFilters] = useState({
    careerNiches: [] as string[],
    qualityRange: null as { min: number; max: number } | null,
    instanceCount: null as { min: number; max: number } | null,
  });
  
  // Listing form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const fetchDatasets = useCallback(async () => {
    try {
      const response = await fetch("/api/sell/datasets");
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/sign-in");
          return;
        }
        throw new Error("Failed to fetch datasets");
      }

      const data = await response.json();
      setDatasets(data.datasets);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      toast.error("Failed to load datasets");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const filteredDatasets = datasets.filter(dataset => {
    if (filters.careerNiches.length > 0) {
      const hasMatchingNiche = dataset.careerNiches.some(niche => 
        filters.careerNiches.includes(niche)
      );
      if (!hasMatchingNiche) return false;
    }

    if (filters.qualityRange) {
      const score = dataset.averageQualityScore;
      if (score < filters.qualityRange.min || score > filters.qualityRange.max) {
        return false;
      }
    }

    if (filters.instanceCount) {
      const count = dataset.instanceCount;
      if (count < filters.instanceCount.min || count > filters.instanceCount.max) {
        return false;
      }
    }

    return true;
  });

  const selectedDatasetsArray = Array.from(selectedDatasets)
    .map(id => datasets.find(d => d.id === id))
    .filter(Boolean) as Dataset[];

  const pricing = showBundleMode && selectedDatasetsArray.length > 1
    ? calculateBundlePricing(selectedDatasetsArray)
    : selectedDatasetsArray.length === 1
    ? calculatePricingSuggestion(selectedDatasetsArray[0])
    : null;

  const finalPrice = useCustomPrice && customPrice 
    ? Math.round(parseFloat(customPrice) * 100) 
    : pricing?.suggested || 0;

  const toggleDatasetSelection = (datasetId: string) => {
    const newSelected = new Set(selectedDatasets);
    if (newSelected.has(datasetId)) {
      newSelected.delete(datasetId);
    } else {
      newSelected.add(datasetId);
    }
    setSelectedDatasets(newSelected);
  };

  const clearFilters = () => {
    setFilters({
      careerNiches: [],
      qualityRange: null,
      instanceCount: null,
    });
  };

  const createListing = async () => {
    if (selectedDatasets.size === 0) {
      toast.error("Please select at least one dataset");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title for your listing");
      return;
    }

    if (useCustomPrice && (!customPrice || parseFloat(customPrice) <= 0)) {
      toast.error("Please enter a valid custom price");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/sell/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: finalPrice,
          datasetIds: Array.from(selectedDatasets),
          isBundle: selectedDatasets.size > 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create listing");
      }

      toast.success("Listing created successfully!");
      
      // Copy shareable link to clipboard
      if (data.listing.shareableLink) {
        try {
          await navigator.clipboard.writeText(data.listing.shareableLink);
          toast.success("Shareable link copied to clipboard!");
        } catch (error) {
          console.error("Failed to copy link:", error);
        }
      }

      // Reset form
      setSelectedDatasets(new Set());
      setTitle("");
      setDescription("");
      setCustomPrice("");
      setUseCustomPrice(false);
      setShowBundleMode(false);

    } catch (error) {
      console.error("Error creating listing:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create listing");
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sell Your Datasets</h1>
          <p className="text-gray-600 mt-2">
            Turn your knowledge into revenue. Create listings for your datasets and reach buyers worldwide.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/offers")}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Offers
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters & Datasets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bundle Mode Toggle */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Bundle Mode</span>
                  <Badge variant="secondary">15% discount</Badge>
                </div>
                <Button
                  variant={showBundleMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowBundleMode(!showBundleMode)}
                >
                  {showBundleMode ? "Disable" : "Enable"} Bundling
                </Button>
              </div>
              {showBundleMode && (
                <p className="text-sm text-gray-600 mt-2">
                  Select multiple datasets to create a bundle. Buyers get a 15% discount, increasing sales appeal.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Datasets
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Career Niches Filter */}
              <div>
                <Label className="text-sm font-medium">Career Niches</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {FILTER_OPTIONS.careerNiches.map(niche => (
                    <div key={niche} className="flex items-center space-x-2">
                      <Checkbox
                        id={niche}
                        checked={filters.careerNiches.includes(niche)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters(prev => ({
                              ...prev,
                              careerNiches: [...prev.careerNiches, niche]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              careerNiches: prev.careerNiches.filter(n => n !== niche)
                            }));
                          }
                        }}
                      />
                      <label htmlFor={niche} className="text-sm">{niche}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Range Filter */}
              <div>
                <Label className="text-sm font-medium">Quality Range</Label>
                <div className="space-y-2 mt-2">
                  {FILTER_OPTIONS.qualityRange.map(range => (
                    <div key={range.label} className="flex items-center space-x-2">
                      <Checkbox
                        id={range.label}
                        checked={filters.qualityRange?.min === range.min && filters.qualityRange?.max === range.max}
                        onCheckedChange={(checked) => {
                          setFilters(prev => ({
                            ...prev,
                            qualityRange: checked ? { min: range.min, max: range.max } : null
                          }));
                        }}
                      />
                      <label htmlFor={range.label} className="text-sm">{range.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instance Count Filter */}
              <div>
                <Label className="text-sm font-medium">Dataset Size</Label>
                <div className="space-y-2 mt-2">
                  {FILTER_OPTIONS.instanceCount.map(range => (
                    <div key={range.label} className="flex items-center space-x-2">
                      <Checkbox
                        id={range.label}
                        checked={filters.instanceCount?.min === range.min && filters.instanceCount?.max === range.max}
                        onCheckedChange={(checked) => {
                          setFilters(prev => ({
                            ...prev,
                            instanceCount: checked ? { min: range.min, max: range.max } : null
                          }));
                        }}
                      />
                      <label htmlFor={range.label} className="text-sm">{range.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datasets List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Your Datasets ({filteredDatasets.length})
              </CardTitle>
              {selectedDatasets.size > 0 && (
                <p className="text-sm text-gray-600">
                  {selectedDatasets.size} dataset{selectedDatasets.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </CardHeader>
            <CardContent>
              {filteredDatasets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No datasets match your filters</p>
                  <Button variant="ghost" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDatasets.map(dataset => {
                    const isSelected = selectedDatasets.has(dataset.id);
                    const pricing = calculatePricingSuggestion(dataset);
                    
                    return (
                      <div
                        key={dataset.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => toggleDatasetSelection(dataset.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{dataset.name}</h3>
                              <Badge variant={isSelected ? "default" : "secondary"}>
                                {isSelected ? "Selected" : "Available"}
                              </Badge>
                            </div>
                            
                            {dataset.description && (
                              <p className="text-sm text-gray-600 mb-2">{dataset.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                {dataset.instanceCount} instances
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {dataset.averageQualityScore}/100 quality
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {dataset.totalEditCount} edits
                              </span>
                            </div>
                            
                            {dataset.careerNiches.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {dataset.careerNiches.slice(0, 3).map(niche => (
                                  <Badge key={niche} variant="outline" className="text-xs">
                                    {niche}
                                  </Badge>
                                ))}
                                {dataset.careerNiches.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{dataset.careerNiches.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right ml-4">
                            <p className="font-bold text-lg">{formatPrice(pricing.suggested)}</p>
                            <p className="text-xs text-gray-500">
                              {formatPrice(pricing.min)} - {formatPrice(pricing.max)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pricing & Listing Creation */}
        <div className="space-y-6">
          {/* Pricing Analysis */}
          {pricing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(pricing.suggested)}
                  </p>
                  <p className="text-sm text-gray-600">Suggested Price</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Range: {formatPrice(pricing.min)} - {formatPrice(pricing.max)}
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Pricing Factors</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Quality</p>
                      <p className="font-bold">{(pricing.factors.quality * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Quantity</p>
                      <p className="font-bold">{(pricing.factors.quantity * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Uniqueness</p>
                      <p className="font-bold">{(pricing.factors.uniqueness * 100).toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Engagement</p>
                      <p className="font-bold">{(pricing.factors.engagement * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Reasoning</h4>
                  <ul className="text-xs space-y-1">
                    {pricing.reasoning.map((reason, index) => (
                      <li key={index} className="text-gray-600">• {reason}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Revenue Breakdown */}
          {finalPrice > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Listing Price:</span>
                  <span className="font-medium">{formatPrice(finalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Platform Fee (10%):</span>
                  <span>-{formatPrice(calculatePlatformFee(finalPrice))}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-green-600">
                  <span>You Receive:</span>
                  <span>{formatPrice(calculateSellerAmount(finalPrice))}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Listing Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter listing title..."
                  maxLength={100}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your dataset(s)..."
                  className="min-h-[80px]"
                  maxLength={500}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="custom-price"
                    checked={useCustomPrice}
                    onCheckedChange={setUseCustomPrice}
                  />
                  <label htmlFor="custom-price" className="text-sm font-medium">
                    Use custom price
                  </label>
                </div>
                
                {useCustomPrice && (
                  <div>
                    <Label htmlFor="custom-price-input">Custom Price ($)</Label>
                    <Input
                      id="custom-price-input"
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                    />
                  </div>
                )}
              </div>
              
              <Button
                onClick={createListing}
                disabled={creating || selectedDatasets.size === 0}
                className="w-full"
              >
                {creating ? "Creating..." : "Create Listing"}
              </Button>
              
              {selectedDatasets.size === 0 && (
                <p className="text-sm text-gray-500 text-center">
                  Select at least one dataset to create a listing
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}