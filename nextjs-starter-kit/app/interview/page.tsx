"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Send, 
  Brain, 
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Zap
} from "lucide-react";

interface InterviewProgress {
  questionsAnswered: number;
  skillsIdentified: number;
  workflowsCaptured: number;
  thresholdScore?: number;
}

export default function InterviewPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState<InterviewProgress>({
    questionsAnswered: 0,
    skillsIdentified: 0,
    workflowsCaptured: 0
  });
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [identifiedWorkflows, setIdentifiedWorkflows] = useState<string[]>([]);
  const [generatedInstances, setGeneratedInstances] = useState<any[]>([]);
  
  const router = useRouter();
  const tabId = useRef(crypto.randomUUID());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    startInterview();
    
    // Handle tab close/refresh to save session
    const handleBeforeUnload = () => {
      if (sessionId) {
        navigator.sendBeacon('/api/interview/close', JSON.stringify({
          sessionId,
          tabId: tabId.current
        }));
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const startInterview = async () => {
    try {
      setIsStarting(true);
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabId: tabId.current })
      });

      if (!response.ok) {
        throw new Error('Failed to start interview');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setCurrentQuestion(data.question);
      setExtractedSkills(data.context.extracted_skills || []);
      setIdentifiedWorkflows(data.context.identified_workflows || []);
      
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error('Failed to start interview. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim() || !sessionId) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answer: userAnswer,
          tabId: tabId.current
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process answer');
      }

      const data = await response.json();
      
      if (data.isComplete) {
        setIsComplete(true);
        setGeneratedInstances(data.instances || []);
        toast.success(`Interview completed! Generated ${data.instancesGenerated} dataset instances.`);
      } else {
        setCurrentQuestion(data.nextQuestion);
        setProgress(data.progress);
        setUserAnswer('');
        
        // Focus textarea for next answer
        setTimeout(() => textareaRef.current?.focus(), 100);
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit answer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      submitAnswer();
    }
  };

  const getProgressPercentage = () => {
    const maxQuestions = 15; // Estimated maximum for visualization
    return Math.min((progress.questionsAnswered / maxQuestions) * 100, 100);
  };

  if (isStarting) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="flex justify-center items-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h3 className="text-lg font-medium mb-2">Initializing Interview</h3>
                <p className="text-gray-600">
                  Setting up your personalized knowledge extraction session...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Interview Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-lg mb-4">
                Great job! Your knowledge has been transformed into valuable dataset instances.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{generatedInstances.length}</div>
                  <div className="text-sm text-gray-600">Instances Generated</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{extractedSkills.length}</div>
                  <div className="text-sm text-gray-600">Skills Identified</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{identifiedWorkflows.length}</div>
                  <div className="text-sm text-gray-600">Workflows Captured</div>
                </div>
              </div>
            </div>

            {extractedSkills.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Skills Identified:</h4>
                <div className="flex flex-wrap gap-2">
                  {extractedSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => router.push('/edit')}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Refine Your Dataset
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Progress Header */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Knowledge Interview
            </h1>
            <div className="text-sm text-gray-600">
              Question {progress.questionsAnswered + 1}
            </div>
          </div>
          
          <Progress value={getProgressPercentage()} className="mb-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                {progress.questionsAnswered} questions answered
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                {progress.skillsIdentified} skills identified
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-sm">
                {progress.workflowsCaptured} workflows captured
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Current Question
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-lg">{currentQuestion}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Answer:</label>
                <Textarea
                  ref={textareaRef}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Share your detailed answer here... (Ctrl+Enter to submit)"
                  className="min-h-[120px]"
                  disabled={isLoading}
                />
                <div className="text-xs text-gray-500">
                  Tip: Be specific and include examples. Press Ctrl+Enter to submit quickly.
                </div>
              </div>
              
              <Button
                onClick={submitAnswer}
                disabled={!userAnswer.trim() || isLoading}
                className="w-full flex items-center gap-2"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Answer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Context */}
        <div className="space-y-4">
          {extractedSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identified Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {extractedSkills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {identifiedWorkflows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Captured Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {identifiedWorkflows.map((workflow, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {workflow}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interview Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                <span>Be specific and include concrete examples</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                <span>Describe step-by-step processes</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                <span>Mention tools and technologies used</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                <span>Share decision-making criteria</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}