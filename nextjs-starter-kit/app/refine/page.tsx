"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Edit3, 
  Star, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Sparkles,
  Target,
  Award,
  RefreshCw
} from "lucide-react";
import { useCSRF } from "@/lib/client/csrf-client";

interface Instance {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  qualityScore: number;
  editCount: number;
  category: string;
  difficulty: string;
  suggestions: string[];
}

interface RefineStats {
  totalInstances: number;
  avgQualityScore: number;
  improvementPotential: number;
  completedRefinements: number;
}

export default function RefinePage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [editedAnswer, setEditedAnswer] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [stats, setStats] = useState<RefineStats | null>(null);
  const [filter, setFilter] = useState<"all" | "low" | "medium" | "high">("all");

  const { post } = useCSRF();

  useEffect(() => {
    loadRefinableInstances();
  }, []);

  const loadRefinableInstances = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/edit/instances', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setInstances(data.instances || []);
        setStats(data.stats);
      } else {
        console.error('Failed to load instances for refinement');
      }
    } catch (error) {
      console.error('Error loading instances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectInstanceForEditing = (instance: Instance) => {
    setSelectedInstance(instance);
    setEditedQuestion(instance.question);
    setEditedAnswer(instance.answer);
    setEditedTags([...instance.tags]);
  };

  const saveRefinement = async () => {
    if (!selectedInstance) return;

    try {
      setSaving(true);
      
      const response = await post(`/api/edit/instances/${selectedInstance.id}`, {
        question: editedQuestion.trim(),
        answer: editedAnswer.trim(),
        tags: editedTags.filter(tag => tag.trim()),
        refinementSource: "manual_refine_page"
      });

      if (response.ok) {
        const updatedInstance = await response.json();
        
        // Update instances list
        setInstances(prev => 
          prev.map(inst => 
            inst.id === selectedInstance.id 
              ? { ...updatedInstance.instance }
              : inst
          )
        );

        // Reset selection
        setSelectedInstance(null);
        setEditedQuestion("");
        setEditedAnswer("");
        setEditedTags([]);

        // Reload stats
        loadRefinableInstances();
      } else {
        console.error('Failed to save refinement');
      }
    } catch (error) {
      console.error('Error saving refinement:', error);
    } finally {
      setSaving(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !editedTags.includes(tag.trim())) {
      setEditedTags(prev => [...prev, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return "High Quality";
    if (score >= 60) return "Medium Quality";
    return "Needs Improvement";
  };

  const filteredInstances = instances.filter(instance => {
    switch (filter) {
      case "low":
        return instance.qualityScore < 60;
      case "medium":
        return instance.qualityScore >= 60 && instance.qualityScore < 80;
      case "high":
        return instance.qualityScore >= 80;
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading your instances for refinement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="h-8 w-8 text-[#00D26A]" />
          <h1 className="text-3xl font-bold">Dataset Refinement Studio</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Polish your instances to maximize quality scores and earnings potential
        </p>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Instances</p>
                <p className="text-2xl font-bold">{stats.totalInstances}</p>
              </div>
              <Target className="h-8 w-8 text-[#00D26A] opacity-60" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Quality</p>
                <p className={`text-2xl font-bold ${getQualityColor(stats.avgQualityScore)}`}>
                  {stats.avgQualityScore}%
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 opacity-60" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Improvement Potential</p>
                <p className="text-2xl font-bold text-[#00D26A]">
                  +{stats.improvementPotential}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#00D26A] opacity-60" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refinements</p>
                <p className="text-2xl font-bold">{stats.completedRefinements}</p>
              </div>
              <Award className="h-8 w-8 text-purple-500 opacity-60" />
            </div>
          </GlassCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instance List */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Instances</h2>
              <div className="flex space-x-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "low" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("low")}
                >
                  Low
                </Button>
                <Button
                  variant={filter === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("medium")}
                >
                  Med
                </Button>
                <Button
                  variant={filter === "high" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("high")}
                >
                  High
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredInstances.map((instance) => (
                <Card
                  key={instance.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedInstance?.id === instance.id
                      ? "ring-2 ring-[#00D26A] bg-[#00D26A]/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => selectInstanceForEditing(instance)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {instance.category}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className={`h-4 w-4 ${getQualityColor(instance.qualityScore)}`} />
                        <span className={`text-sm font-medium ${getQualityColor(instance.qualityScore)}`}>
                          {instance.qualityScore}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm font-medium line-clamp-2">
                      {instance.question}
                    </p>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {instance.answer}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        {instance.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {instance.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{instance.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      
                      {instance.editCount > 0 && (
                        <div className="flex items-center space-x-1">
                          <Edit3 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {instance.editCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {filteredInstances.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {filter === "all" 
                      ? "No instances found. Create some instances first!" 
                      : `No ${filter} quality instances found.`
                    }
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Editor Panel */}
        <div className="lg:col-span-2">
          {selectedInstance ? (
            <GlassCard className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Refine Instance</h2>
                  <div className="flex items-center space-x-2">
                    <Star className={`h-5 w-5 ${getQualityColor(selectedInstance.qualityScore)}`} />
                    <span className={`font-medium ${getQualityColor(selectedInstance.qualityScore)}`}>
                      {selectedInstance.qualityScore}% - {getQualityLabel(selectedInstance.qualityScore)}
                    </span>
                  </div>
                </div>

                {/* Quality Improvement Suggestions */}
                {selectedInstance.suggestions.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                          Improvement Suggestions
                        </h3>
                        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                          {selectedInstance.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span>•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Question Editor */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Question</label>
                  <Textarea
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    placeholder="Enter a clear, specific question..."
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {editedQuestion.length} characters
                  </p>
                </div>

                {/* Answer Editor */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Answer</label>
                  <Textarea
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    placeholder="Provide a detailed, actionable answer..."
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {editedAnswer.length} characters
                  </p>
                </div>

                {/* Tags Editor */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add a tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={saveRefinement}
                    disabled={isSaving || !editedQuestion.trim() || !editedAnswer.trim()}
                    className="bg-[#00D26A] hover:bg-[#00B356]"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Refinement
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedInstance(null);
                      setEditedQuestion("");
                      setEditedAnswer("");
                      setEditedTags([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-6">
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Select an Instance to Refine
                </h3>
                <p className="text-muted-foreground">
                  Choose an instance from the list to start improving its quality score
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}