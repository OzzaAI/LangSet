import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { GlobalSessionManager, createInterviewWorkflow } from "@/lib/langgraph/core-workflow";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { sessionId, answer, tabId } = await request.json();
    
    if (!sessionId || !answer || !tabId) {
      return NextResponse.json(
        { error: "Session ID, answer, and tab ID are required" },
        { status: 400 }
      );
    }

    // Validate answer
    if (answer.trim().length < 15) {
      return NextResponse.json(
        { error: "Please provide a more detailed answer (minimum 15 characters)" },
        { status: 400 }
      );
    }

    console.log(`[LangGraph API] Processing answer for session: ${sessionId}, tab: ${tabId}`);

    // Get current session state
    const currentState = GlobalSessionManager.getSession(session.session.userId, tabId);
    
    if (!currentState) {
      return NextResponse.json(
        { error: "Session not found. Please start a new interview." },
        { status: 404 }
      );
    }

    // Extract skills and workflows from answer (enhanced extraction)
    const extractedSkills = extractSkillsFromText(answer);
    const identifiedWorkflows = extractWorkflowsFromText(answer);

    // Update conversation history
    const newConversationEntry = {
      question: currentState.current_question,
      answer: answer.trim(),
      timestamp: new Date(),
      skills_extracted: extractedSkills,
      workflows_identified: identifiedWorkflows
    };

    // Update state with new data
    const updatedState = {
      ...currentState,
      conversation_history: [...currentState.conversation_history, newConversationEntry],
      global_context: currentState.global_context + `\n\nQ: ${currentState.current_question}\nA: ${answer.trim()}`,
      extracted_skills: [...new Set([...currentState.extracted_skills, ...extractedSkills])],
      identified_workflows: [...new Set([...currentState.identified_workflows, ...identifiedWorkflows])]
    };

    // Create workflow and process next step
    const workflow = createInterviewWorkflow();
    const result = await workflow.invoke(updatedState);

    // Update session with workflow result
    GlobalSessionManager.updateSession(session.session.userId, tabId, result);

    // Check if interview is complete
    if (result.generation_ready && result.generated_instances.length > 0) {
      console.log(`[LangGraph API] Interview completed for session: ${sessionId}`);
      
      // Close session after completion
      setTimeout(() => {
        GlobalSessionManager.closeSession(session.session.userId, tabId);
      }, 1000);
      
      return NextResponse.json({
        isComplete: true,
        message: "Interview completed successfully! Instances generated via LangGraph.",
        instancesGenerated: result.generated_instances.length,
        instances: result.generated_instances,
        thresholdMetrics: result.threshold_metrics,
        sessionSummary: {
          questionsAnswered: result.conversation_history.length,
          skillsIdentified: result.extracted_skills.length,
          workflowsCaptured: result.identified_workflows.length,
          finalScore: result.threshold_metrics.overall_score
        },
        nextSteps: {
          redirect: "/edit",
          message: "You can now refine your LangGraph-generated dataset instances"
        }
      });
    }

    // Return next question for continued interview
    return NextResponse.json({
      isComplete: false,
      nextQuestion: result.current_question,
      progress: {
        questionsAnswered: result.conversation_history.length,
        skillsIdentified: result.extracted_skills.length,
        workflowsCaptured: result.identified_workflows.length,
        thresholdScore: result.threshold_metrics.overall_score
      },
      thresholdMetrics: {
        conversationDepth: result.threshold_metrics.conversation_depth,
        skillDiversity: result.threshold_metrics.skill_diversity,
        workflowComplexity: result.threshold_metrics.workflow_complexity,
        contextRichness: result.threshold_metrics.context_richness,
        overallScore: result.threshold_metrics.overall_score
      },
      context: {
        newSkillsFound: extractedSkills,
        newWorkflowsFound: identifiedWorkflows,
        globalSkillsCount: result.extracted_skills.length,
        globalWorkflowsCount: result.identified_workflows.length
      }
    });

  } catch (error) {
    console.error("[LangGraph API] Answer processing error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Session not found")) {
        return NextResponse.json(
          { error: "Interview session expired. Please start a new interview." },
          { status: 404 }
        );
      }
      
      if (error.message.includes("Rate limit") || error.message.includes("quota")) {
        return NextResponse.json(
          { error: "API rate limit reached. Please wait a moment before continuing." },
          { status: 429 }
        );
      }

      if (error.message.includes("LangGraph") || error.message.includes("workflow")) {
        return NextResponse.json(
          { 
            error: "Workflow processing failed. Please try again.",
            details: error.message 
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to process your answer with LangGraph workflow",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Close session endpoint for tab cleanup
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { tabId } = await request.json();
    
    if (!tabId) {
      return NextResponse.json(
        { error: "Tab ID is required" },
        { status: 400 }
      );
    }

    await GlobalSessionManager.closeSession(session.session.userId, tabId);

    return NextResponse.json({
      message: "Session closed and context saved successfully"
    });

  } catch (error) {
    console.error("[LangGraph API] Session close error:", error);
    return NextResponse.json(
      { error: "Failed to close session" },
      { status: 500 }
    );
  }
}

// Enhanced skill extraction using patterns and NLP-like matching
function extractSkillsFromText(text: string): string[] {
  const skillPatterns = [
    // Programming languages
    /\b(?:javascript|typescript|python|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|scala|r|matlab|sql)\b/gi,
    
    // Frameworks and libraries
    /\b(?:react|angular|vue|node\.?js|express|django|flask|spring|rails|laravel|symfony|hibernate|redux|mobx|rxjs|jest|cypress|selenium)\b/gi,
    
    // Cloud and DevOps
    /\b(?:aws|azure|gcp|google cloud|docker|kubernetes|terraform|ansible|jenkins|github actions|gitlab ci|circleci|heroku|vercel|netlify)\b/gi,
    
    // Databases
    /\b(?:postgresql|mysql|mongodb|redis|elasticsearch|cassandra|dynamodb|firestore|sqlite|oracle|sql server)\b/gi,
    
    // Tools and technologies
    /\b(?:git|webpack|vite|babel|eslint|prettier|figma|sketch|adobe|photoshop|illustrator|linux|bash|powershell|vim|vscode)\b/gi,
    
    // Methodologies
    /\b(?:agile|scrum|kanban|devops|ci\/cd|tdd|bdd|microservices|rest|graphql|api design|system design|performance optimization)\b/gi
  ];

  const skills = new Set<string>();
  
  skillPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => skills.add(match.toLowerCase()));
  });

  return Array.from(skills);
}

// Enhanced workflow extraction using process indicators
function extractWorkflowsFromText(text: string): string[] {
  const workflows = new Set<string>();
  const lowerText = text.toLowerCase();
  
  // Look for step-by-step processes
  if (lowerText.includes('first') && lowerText.includes('then')) {
    workflows.add('Step-by-step process methodology');
  }
  
  if (lowerText.includes('planning') && (lowerText.includes('execution') || lowerText.includes('implementation'))) {
    workflows.add('Planning and execution workflow');
  }
  
  if (lowerText.includes('testing') && (lowerText.includes('deploy') || lowerText.includes('release'))) {
    workflows.add('Testing and deployment process');
  }
  
  if (lowerText.includes('review') && (lowerText.includes('code') || lowerText.includes('pull request'))) {
    workflows.add('Code review workflow');
  }
  
  if (lowerText.includes('debug') && (lowerText.includes('fix') || lowerText.includes('solve'))) {
    workflows.add('Debugging and problem-solving methodology');
  }
  
  if (lowerText.includes('design') && (lowerText.includes('prototype') || lowerText.includes('iterate'))) {
    workflows.add('Design and iteration process');
  }
  
  if (lowerText.includes('data') && (lowerText.includes('analysis') || lowerText.includes('processing'))) {
    workflows.add('Data analysis and processing workflow');
  }
  
  // Project management indicators
  if (lowerText.includes('requirement') && lowerText.includes('specification')) {
    workflows.add('Requirements gathering and specification');
  }
  
  if (lowerText.includes('stakeholder') && lowerText.includes('communication')) {
    workflows.add('Stakeholder communication process');
  }

  return Array.from(workflows);
}