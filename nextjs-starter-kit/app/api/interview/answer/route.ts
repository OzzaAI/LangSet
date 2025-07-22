import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { processInterviewAnswer, ContextManager } from "@/lib/langgraph/interview-workflow";

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

    // Validate answer length and content
    if (answer.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a more detailed answer (minimum 10 characters)" },
        { status: 400 }
      );
    }

    // Process the answer through LangGraph workflow
    const result = await processInterviewAnswer(sessionId, answer.trim());
    
    // Update session context
    ContextManager.updateSession(session.session.userId, tabId, {
      conversation_history: [...(await ContextManager.getOrCreateSession(session.session.userId, tabId)).conversation_history, {
        question: result.question,
        answer: answer.trim(),
        timestamp: new Date()
      }]
    });

    // If interview is complete, clean up session
    if (result.isComplete) {
      await ContextManager.saveAndCloseSession(session.session.userId, tabId);
      
      return NextResponse.json({
        isComplete: true,
        message: "Interview completed successfully!",
        instancesGenerated: result.instances?.length || 0,
        instances: result.instances,
        nextSteps: {
          redirect: "/edit",
          message: "You can now refine your generated dataset instances"
        }
      });
    }

    // Return next question
    return NextResponse.json({
      isComplete: false,
      nextQuestion: result.question,
      progress: {
        questionsAnswered: (await ContextManager.getOrCreateSession(session.session.userId, tabId)).conversation_history.length,
        skillsIdentified: (await ContextManager.getOrCreateSession(session.session.userId, tabId)).extracted_skills.length,
        workflowsCaptured: (await ContextManager.getOrCreateSession(session.session.userId, tabId)).identified_workflows.length
      }
    });

  } catch (error) {
    console.error("Interview answer processing error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Session not found")) {
        return NextResponse.json(
          { error: "Interview session expired. Please start a new interview." },
          { status: 404 }
        );
      }
      
      if (error.message.includes("Rate limit")) {
        return NextResponse.json(
          { error: "Please wait a moment before sending another answer." },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to process your answer. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session status for a specific tab
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

    const interviewState = await ContextManager.getOrCreateSession(
      session.session.userId,
      tabId
    );

    return NextResponse.json({
      sessionId: interviewState.session_id,
      currentQuestion: interviewState.current_question,
      isComplete: interviewState.is_complete,
      progress: {
        questionsAnswered: interviewState.conversation_history.length,
        skillsIdentified: interviewState.extracted_skills.length,
        workflowsCaptured: interviewState.identified_workflows.length,
        thresholdScore: interviewState.threshold_score
      },
      context: {
        extracted_skills: interviewState.extracted_skills,
        identified_workflows: interviewState.identified_workflows
      }
    });

  } catch (error) {
    console.error("Interview status error:", error);
    return NextResponse.json(
      { error: "Failed to get interview status" },
      { status: 500 }
    );
  }
}