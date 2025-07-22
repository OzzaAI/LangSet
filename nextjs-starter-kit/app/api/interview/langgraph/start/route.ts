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

    const { tabId } = await request.json();
    
    if (!tabId) {
      return NextResponse.json(
        { error: "Tab ID is required for multi-session management" },
        { status: 400 }
      );
    }

    console.log(`[LangGraph API] Starting interview session for user: ${session.session.userId}, tab: ${tabId}`);

    // Initialize session with global context management
    const interviewState = await GlobalSessionManager.initializeSession(
      session.session.userId,
      tabId
    );

    // Create workflow instance
    const workflow = createInterviewWorkflow();
    
    // Execute initial interview node
    const result = await workflow.invoke(interviewState);

    // Update session with workflow result
    GlobalSessionManager.updateSession(session.session.userId, tabId, result);

    return NextResponse.json({
      sessionId: result.session_id,
      tabId: tabId,
      question: result.current_question,
      progress: {
        questionsAnswered: result.conversation_history.length,
        skillsIdentified: result.extracted_skills.length,
        workflowsCaptured: result.identified_workflows.length,
        thresholdScore: result.threshold_metrics.overall_score
      },
      context: {
        extracted_skills: result.extracted_skills,
        identified_workflows: result.identified_workflows,
        has_global_context: result.global_context.length > 0
      }
    });

  } catch (error) {
    console.error("[LangGraph API] Interview start error:", error);
    return NextResponse.json(
      { 
        error: "Failed to start LangGraph interview session",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session status for split-screen testing
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tabId = searchParams.get("tabId");

    if (!tabId) {
      return NextResponse.json(
        { error: "Tab ID is required" },
        { status: 400 }
      );
    }

    const interviewState = GlobalSessionManager.getSession(session.session.userId, tabId);

    if (!interviewState) {
      return NextResponse.json(
        { error: "No active session found for this tab" },
        { status: 404 }
      );
    }

    // Get all user sessions for split-screen view
    const allUserSessions = GlobalSessionManager.getAllUserSessions(session.session.userId);

    return NextResponse.json({
      currentSession: {
        sessionId: interviewState.session_id,
        tabId: interviewState.tab_id,
        currentQuestion: interviewState.current_question,
        isComplete: interviewState.generation_ready,
        progress: {
          questionsAnswered: interviewState.conversation_history.length,
          skillsIdentified: interviewState.extracted_skills.length,
          workflowsCaptured: interviewState.identified_workflows.length,
          thresholdScore: interviewState.threshold_metrics.overall_score
        }
      },
      allSessions: allUserSessions.map(s => ({
        tabId: s.tab_id,
        sessionId: s.session_id,
        questionsAnswered: s.conversation_history.length,
        isComplete: s.generation_ready
      })),
      sharedContext: {
        globalSkills: interviewState.extracted_skills,
        globalWorkflows: interviewState.identified_workflows,
        contextLength: interviewState.global_context.length
      }
    });

  } catch (error) {
    console.error("[LangGraph API] Session status error:", error);
    return NextResponse.json(
      { error: "Failed to get session status" },
      { status: 500 }
    );
  }
}