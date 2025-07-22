"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Send, 
  Brain, 
  CheckCircle,
  Split,
  Plus,
  X,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";

interface SessionState {
  tabId: string;
  sessionId: string | null;
  currentQuestion: string;
  userAnswer: string;
  isLoading: boolean;
  isComplete: boolean;
  progress: {
    questionsAnswered: number;
    skillsIdentified: number;
    workflowsCaptured: number;
    thresholdScore: number;
  };
  thresholdMetrics?: {
    conversationDepth: number;
    skillDiversity: number;
    workflowComplexity: number;
    contextRichness: number;
    overallScore: number;
  };
  extractedSkills: string[];
  identifiedWorkflows: string[];
}

export default function SplitScreenInterviewPage() {
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [globalContext, setGlobalContext] = useState({
    globalSkills: [] as string[],
    globalWorkflows: [] as string[],
    contextLength: 0
  });
  const [isStarting, setIsStarting] = useState(false);

  // Create initial session on mount
  useEffect(() => {
    addNewSession();
  }, []);

  const addNewSession = async () => {
    if (sessions.length >= 3) {
      toast.error("Maximum 3 concurrent sessions allowed");
      return;
    }

    setIsStarting(true);
    const newTabId = `tab_${crypto.randomUUID()}`;
    
    try {
      const response = await fetch('/api/interview/langgraph/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabId: newTabId })
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      
      const newSession: SessionState = {
        tabId: newTabId,
        sessionId: data.sessionId,
        currentQuestion: data.question,
        userAnswer: "",
        isLoading: false,
        isComplete: false,
        progress: data.progress,
        extractedSkills: data.context.extracted_skills || [],
        identifiedWorkflows: data.context.identified_workflows || []
      };

      setSessions(prev => [...prev, newSession]);
      
      // Update global context
      setGlobalContext({
        globalSkills: data.context.extracted_skills || [],
        globalWorkflows: data.context.identified_workflows || [],
        contextLength: data.context.has_global_context ? 1000 : 0
      });

      toast.success(`New interview session started (Tab ${sessions.length + 1})`);

    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start new session');
    } finally {
      setIsStarting(false);
    }
  };

  const removeSession = async (tabId: string) => {
    try {
      // Close session on backend
      await fetch('/api/interview/langgraph/answer', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabId })
      });

      setSessions(prev => prev.filter(s => s.tabId !== tabId));
      toast.success("Session closed and context saved");

    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Failed to close session');
    }
  };

  const submitAnswer = async (tabId: string) => {
    const session = sessions.find(s => s.tabId === tabId);
    if (!session || !session.userAnswer.trim() || !session.sessionId) return;

    // Update loading state
    setSessions(prev => prev.map(s => 
      s.tabId === tabId ? { ...s, isLoading: true } : s
    ));

    try {
      const response = await fetch('/api/interview/langgraph/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          answer: session.userAnswer,
          tabId: tabId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process answer');
      }

      const data = await response.json();
      
      if (data.isComplete) {
        setSessions(prev => prev.map(s => 
          s.tabId === tabId ? {
            ...s,
            isComplete: true,
            isLoading: false,
            progress: data.sessionSummary
          } : s
        ));
        
        toast.success(`Session ${tabId} completed! Generated ${data.instancesGenerated} instances.`);
      } else {
        setSessions(prev => prev.map(s => 
          s.tabId === tabId ? {
            ...s,
            currentQuestion: data.nextQuestion,
            userAnswer: "",
            isLoading: false,
            progress: data.progress,
            thresholdMetrics: data.thresholdMetrics,
            extractedSkills: [...new Set([...s.extractedSkills, ...(data.context.newSkillsFound || [])])],
            identifiedWorkflows: [...new Set([...s.identifiedWorkflows, ...(data.context.newWorkflowsFound || [])])]
          } : s
        ));

        // Update global context
        setGlobalContext(prev => ({
          globalSkills: Array.from(new Set([...prev.globalSkills, ...(data.context.newSkillsFound || [])])),
          globalWorkflows: Array.from(new Set([...prev.globalWorkflows, ...(data.context.newWorkflowsFound || [])])),
          contextLength: prev.contextLength + session.userAnswer.length
        }));
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit answer');
      
      setSessions(prev => prev.map(s => 
        s.tabId === tabId ? { ...s, isLoading: false } : s
      ));
    }
  };

  const updateAnswer = (tabId: string, answer: string) => {
    setSessions(prev => prev.map(s => 
      s.tabId === tabId ? { ...s, userAnswer: answer } : s
    ));
  };

  const getThresholdProgress = (metrics?: SessionState['thresholdMetrics']) => {
    if (!metrics) return 0;
    return Math.min(metrics.overallScore, 100);
  };

  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Split className="h-8 w-8 text-primary" />
              LangGraph Split-Screen Interview
            </h1>
            <p className="text-gray-600 mt-2">
              Test multi-session workflow with shared global context
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={addNewSession}
              disabled={isStarting || sessions.length >= 3}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Session
            </Button>
          </div>
        </div>

        {/* Global Context Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Shared Global Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{globalContext.globalSkills.length}</div>
                <div className="text-sm text-gray-600">Total Skills</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <Zap className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{globalContext.globalWorkflows.length}</div>
                <div className="text-sm text-gray-600">Total Workflows</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{Math.round(globalContext.contextLength / 100)}</div>
                <div className="text-sm text-gray-600">Context Size (x100 chars)</div>
              </div>
            </div>
            
            {globalContext.globalSkills.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Global Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {globalContext.globalSkills.slice(0, 10).map((skill, index) => (
                    <Badge key={index} variant="outline">{skill}</Badge>
                  ))}
                  {globalContext.globalSkills.length > 10 && (
                    <Badge variant="secondary">+{globalContext.globalSkills.length - 10} more</Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session Grid */}
      <div className={`grid gap-6 ${
        sessions.length === 1 ? 'grid-cols-1' :
        sessions.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
        'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
      }`}>
        {sessions.map((session, index) => (
          <Card key={session.tabId} className={`${session.isComplete ? 'border-green-500' : 'border-blue-500'} border-2`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Session {index + 1}
                  {session.isComplete && <CheckCircle className="h-5 w-5 text-green-600" />}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSession(session.tabId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Progress Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>LangGraph Threshold Progress</span>
                  <span>{getThresholdProgress(session.thresholdMetrics)}%</span>
                </div>
                <Progress value={getThresholdProgress(session.thresholdMetrics)} className="h-2" />
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-bold">{session.progress.questionsAnswered}</div>
                    <div className="text-gray-500">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{session.progress.skillsIdentified}</div>
                    <div className="text-gray-500">Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{session.progress.workflowsCaptured}</div>
                    <div className="text-gray-500">Workflows</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {!session.isComplete ? (
                <>
                  {/* Current Question */}
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Current Question:</p>
                    <p className="text-sm">{session.currentQuestion}</p>
                  </div>
                  
                  {/* Answer Input */}
                  <div className="space-y-2">
                    <Textarea
                      value={session.userAnswer}
                      onChange={(e) => updateAnswer(session.tabId, e.target.value)}
                      placeholder="Enter your detailed answer..."
                      className="min-h-[100px] text-sm"
                      disabled={session.isLoading}
                    />
                    
                    <Button
                      onClick={() => submitAnswer(session.tabId)}
                      disabled={!session.userAnswer.trim() || session.isLoading}
                      size="sm"
                      className="w-full"
                    >
                      {session.isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Answer
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-600 mb-2">Session Complete!</h3>
                  <p className="text-sm text-gray-600">
                    LangGraph workflow generated instances successfully.
                  </p>
                </div>
              )}

              {/* Session-specific Context */}
              {session.extractedSkills.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-xs font-medium mb-2">Session Skills:</h4>
                  <div className="flex flex-wrap gap-1">
                    {session.extractedSkills.slice(0, 5).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                    ))}
                    {session.extractedSkills.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{session.extractedSkills.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Threshold Breakdown */}
              {session.thresholdMetrics && (
                <div className="border-t pt-3">
                  <h4 className="text-xs font-medium mb-2">LangGraph Metrics:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Depth: {session.thresholdMetrics.conversationDepth}</div>
                    <div>Diversity: {session.thresholdMetrics.skillDiversity}</div>
                    <div>Workflow: {session.thresholdMetrics.workflowComplexity}</div>
                    <div>Richness: {session.thresholdMetrics.contextRichness}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Sessions State */}
      {sessions.length === 0 && !isStarting && (
        <Card>
          <CardContent className="text-center py-12">
            <Split className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No Active Sessions</h3>
            <p className="text-gray-600 mb-4">
              Start your first LangGraph interview session to begin testing multi-session workflows.
            </p>
            <Button onClick={addNewSession}>
              <Plus className="h-4 w-4 mr-2" />
              Start First Session
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}