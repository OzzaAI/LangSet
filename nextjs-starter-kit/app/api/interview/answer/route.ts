import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { processInterviewAnswer, ContextManager } from "@/lib/langgraph/interview-workflow";
import { defaultCSRFProtection } from "@/lib/security/csrf-protection";
import { withErrorHandler, Errors } from "@/lib/monitoring/error-handler";
import { logger, createRequestContext } from "@/lib/monitoring/error-logger";

async function handleInterviewAnswer(request: NextRequest) {
  // Authenticate user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session?.userId) {
    throw Errors.authentication();
  }

  const requestContext = createRequestContext(request, session.session.userId, session.session.id);

  // CSRF Protection
  const csrfResult = await defaultCSRFProtection(
    request, 
    session.session.id, 
    session.session.userId
  );

  if (!csrfResult.protected) {
    throw Errors.authorization(csrfResult.error || "CSRF protection failed");
  }

  const { sessionId, answer, tabId } = await request.json();
  
  if (!sessionId || !answer || !tabId) {
    throw Errors.validation("Session ID, answer, and tab ID are required");
  }

  // Validate answer length and content
  if (answer.trim().length < 10) {
    throw Errors.validation("Please provide a more detailed answer (minimum 10 characters)");
  }

  // Log business event
  await logger.logBusinessEvent(
    'interview_answer_submitted',
    session.session.userId,
    { sessionId, tabId, answerLength: answer.length },
    requestContext
  );

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
    
    await logger.logBusinessEvent(
      'interview_completed',
      session.session.userId,
      { sessionId, tabId, instancesGenerated: result.instances?.length || 0 },
      requestContext
    );
    
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
}

// Export with error handler
export const POST = withErrorHandler(handleInterviewAnswer, 'interview');

async function getInterviewStatus(request: NextRequest) {
  // Get session status for a specific tab
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session?.userId) {
    throw Errors.authentication();
  }

  const { searchParams } = new URL(request.url);
  const tabId = searchParams.get("tabId");

  if (!tabId) {
    throw Errors.validation("Tab ID is required");
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
}

// Export with error handler
export const GET = withErrorHandler(getInterviewStatus, 'interview');