"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TagsInput } from "@/components/ui/tags-input";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  SkipForward,
  TrendingUp,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";

interface QualityMetrics {
  score: number;
  breakdown: {
    length: number;
    uniqueness: number;
    clarity: number;
    completeness: number;
  };
  suggestions: string[];
}

interface Instance {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  qualityScore: number;
  editCount: number;
  lastEditedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DailyEdits {
  count: number;
  limit: number;
  remaining: number;
}

export default function EditPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dailyEdits, setDailyEdits] = useState<DailyEdits>({ count: 0, limit: 20, remaining: 20 });
  const [showQualityPreview, setShowQualityPreview] = useState(false);
  const [qualityPreview, setQualityPreview] = useState<QualityMetrics | null>(null);
  const router = useRouter();

  // Form state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const currentInstance = instances[currentIndex];

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  useEffect(() => {
    if (currentInstance) {
      setQuestion(currentInstance.question);
      setAnswer(currentInstance.answer);
      setTags(currentInstance.tags || []);
      setQualityPreview(null);
    }
  }, [currentInstance]);

  const fetchInstances = useCallback(async () => {
    try {
      const response = await fetch("/api/edit/instances");
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/sign-in");
          return;
        }
        throw new Error("Failed to fetch instances");
      }

      const data = await response.json();
      setInstances(data.instances);
      setDailyEdits(data.dailyEdits);
    } catch (error) {
      console.error("Error fetching instances:", error);
      toast.error("Failed to load instances");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const generateQualityPreview = async () => {
    if (!question.trim() || !answer.trim()) {
      setQualityPreview(null);
      return;
    }

    // Simple client-side quality scoring (matches server logic)
    const metrics = calculateQualityScore(question, answer, tags);
    setQualityPreview(metrics);
  };

  const calculateQualityScore = (q: string, a: string, t: string[]): QualityMetrics => {
    const breakdown = {
      length: calculateLengthScore(q, a),
      uniqueness: calculateUniquenessScore(q, a),
      clarity: calculateClarityScore(q, a),
      completeness: calculateCompletenessScore(q, a, t),
    };

    const score = Math.round(
      (breakdown.length * 0.2 + 
       breakdown.uniqueness * 0.3 + 
       breakdown.clarity * 0.3 + 
       breakdown.completeness * 0.2)
    );

    const suggestions = generateSuggestions(breakdown, q, a, t);

    return { score, breakdown, suggestions };
  };

  const calculateLengthScore = (q: string, a: string): number => {
    const qLen = q.trim().length;
    const aLen = a.trim().length;
    
    const qScore = qLen >= 10 && qLen <= 200 ? 100 : Math.max(0, qLen < 10 ? (qLen / 10) * 100 : 100 - ((qLen - 200) / 10));
    const aScore = aLen >= 20 && aLen <= 1000 ? 100 : Math.max(0, aLen < 20 ? (aLen / 20) * 100 : 100 - ((aLen - 1000) / 50));
    
    return Math.round((qScore + aScore) / 2);
  };

  const calculateUniquenessScore = (q: string, a: string): number => {
    const qWords = new Set(q.toLowerCase().split(/\s+/));
    const aWords = new Set(a.toLowerCase().split(/\s+/));
    const commonWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'and', 'or', 'but']);
    
    let uniqueWords = 0;
    qWords.forEach(word => {
      if (!commonWords.has(word) && word.length > 2) uniqueWords++;
    });
    aWords.forEach(word => {
      if (!commonWords.has(word) && word.length > 2) uniqueWords++;
    });

    const totalWords = qWords.size + aWords.size;
    const uniqueRatio = totalWords > 0 ? uniqueWords / totalWords : 0;
    return Math.min(100, Math.round(uniqueRatio * 150));
  };

  const calculateClarityScore = (q: string, a: string): number => {
    let score = 100;
    if (!q.includes('?') && !q.toLowerCase().match(/^(what|how|why|when|where|who)/)) score -= 20;
    if (!a.match(/[.!?]$/)) score -= 15;
    return Math.max(0, score);
  };

  const calculateCompletenessScore = (q: string, a: string, t: string[]): number => {
    let score = 50;
    if (t && t.length > 0) score += Math.min(30, t.length * 10);
    return Math.min(100, score);
  };

  const generateSuggestions = (breakdown: Record<string, number>, q: string, a: string, t: string[]): string[] => {
    const suggestions: string[] = [];
    if (breakdown.length < 70) {
      if (q.length < 10) suggestions.push("Consider making your question more detailed");
      if (a.length < 20) suggestions.push("Provide a more comprehensive answer");
    }
    if (breakdown.uniqueness < 60) suggestions.push("Try using more varied vocabulary");
    if (breakdown.clarity < 70) {
      if (!q.includes('?')) suggestions.push("Consider adding a question mark");
      if (!a.match(/[.!]$/)) suggestions.push("End with proper punctuation");
    }
    if (breakdown.completeness < 60 && (!t || t.length === 0)) {
      suggestions.push("Add relevant tags to categorize this content");
    }
    return suggestions;
  };

  const saveInstance = async () => {
    if (!currentInstance) return;
    
    if (dailyEdits.remaining <= 0) {
      toast.error("Daily edit limit reached (20/20)");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/edit/instances/${currentInstance.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          tags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save instance");
      }

      // Update local state
      const updatedInstances = [...instances];
      updatedInstances[currentIndex] = data.instance;
      setInstances(updatedInstances);
      setDailyEdits(data.dailyEdits);

      toast.success("Instance saved successfully!");
      
      // Move to next instance
      if (currentIndex < instances.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }

    } catch (error) {
      console.error("Error saving instance:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to save instance");
      }
    } finally {
      setSaving(false);
    }
  };

  const skipInstance = () => {
    if (currentIndex < instances.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast.info("You've reached the end of the instances");
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentIndex < instances.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading instances...</p>
        </div>
      </div>
    );
  }

  if (!instances.length) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Instances Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              No learning instances are available for editing at the moment.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Header with Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Edit Mode</h1>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
        
        {/* Daily Progress */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Daily Progress</span>
              <span className="text-sm text-gray-600">
                {dailyEdits.count}/{dailyEdits.limit} edits today
              </span>
            </div>
            <Progress 
              value={(dailyEdits.count / dailyEdits.limit) * 100} 
              className="h-2"
            />
            {dailyEdits.remaining <= 5 && dailyEdits.remaining > 0 && (
              <p className="text-sm text-orange-600 mt-1">
                Only {dailyEdits.remaining} edits remaining today
              </p>
            )}
            {dailyEdits.remaining === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Daily edit limit reached. Come back tomorrow!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Instance Counter */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Instance {currentIndex + 1} of {instances.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQualityPreview(!showQualityPreview)}
            >
              {showQualityPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Quality Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateQualityPreview}
            >
              <RefreshCw className="h-4 w-4" />
              Update Score
            </Button>
          </div>
        </div>
      </div>

      {/* Main Edit Interface */}
      <div {...swipeHandlers} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Edit Instance</span>
              <div className="flex items-center gap-2">
                {currentInstance.qualityScore && (
                  <Badge variant={currentInstance.qualityScore >= 80 ? "default" : currentInstance.qualityScore >= 60 ? "secondary" : "destructive"}>
                    Quality: {currentInstance.qualityScore}/100
                  </Badge>
                )}
                <Badge variant="outline">
                  Edits: {currentInstance.editCount}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Question */}
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question..."
                className="min-h-[80px]"
              />
            </div>

            {/* Answer */}
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter your answer..."
                className="min-h-[120px]"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <TagsInput
                value={tags}
                onChange={setTags}
                placeholder="Add tags..."
              />
            </div>

            {/* Quality Preview */}
            {showQualityPreview && qualityPreview && (
              <Card className="bg-blue-50 dark:bg-blue-950">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-medium">Quality Preview</span>
                    <Badge variant={qualityPreview.score >= 80 ? "default" : qualityPreview.score >= 60 ? "secondary" : "destructive"}>
                      {qualityPreview.score}/100
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Length</p>
                      <p className="font-bold">{qualityPreview.breakdown.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Uniqueness</p>
                      <p className="font-bold">{qualityPreview.breakdown.uniqueness}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Clarity</p>
                      <p className="font-bold">{qualityPreview.breakdown.clarity}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Complete</p>
                      <p className="font-bold">{qualityPreview.breakdown.completeness}</p>
                    </div>
                  </div>

                  {qualityPreview.suggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Suggestions:</p>
                      <ul className="text-sm space-y-1">
                        {qualityPreview.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 text-orange-500 mt-0.5 shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={saveInstance}
                disabled={saving || dailyEdits.remaining <= 0}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save & Next"}
              </Button>
              
              <Button
                variant="outline"
                onClick={skipInstance}
                disabled={currentIndex >= instances.length - 1}
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <span className="text-sm text-gray-500 self-center">
            Swipe or use arrows to navigate
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.min(instances.length - 1, currentIndex + 1))}
            disabled={currentIndex >= instances.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}