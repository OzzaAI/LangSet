import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ContextManager, startInterviewSession } from "@/lib/langgraph/interview-workflow";

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
        { error: "Tab ID is required for session management" },
        { status: 400 }
      );
    }

    // Create or get existing session for this tab
    const interviewState = await ContextManager.getOrCreateSession(
      session.session.userId,
      tabId
    );

    // Start the interview session in database
    const sessionId = await startInterviewSession(session.session.userId);
    
    // Generate initial question
    const initialQuestion = await generateInitialQuestion(session.session.userId);

    return NextResponse.json({
      sessionId,
      question: initialQuestion,
      context: {
        extracted_skills: interviewState.extracted_skills,
        identified_workflows: interviewState.identified_workflows,
        conversation_count: interviewState.conversation_history.length
      }
    });

  } catch (error) {
    console.error("Interview start error:", error);
    return NextResponse.json(
      { error: "Failed to start interview session" },
      { status: 500 }
    );
  }
}

async function generateInitialQuestion(userId: string): Promise<string> {
  // Get user profile to personalize initial question
  const userProfile = await getUserProfile(userId);
  
  const initialQuestions = [
    "What's the most complex technical challenge you've solved recently, and how did you approach it?",
    "Walk me through your typical workflow when starting a new project in your field.",
    "What tools and technologies do you find essential in your day-to-day work, and why?",
    "Describe a time when you had to learn a new skill quickly for work. How did you approach it?",
    "What's a common mistake you see people make in your field, and how would you avoid it?"
  ];
  
  // Simple logic to select appropriate initial question
  // In production, this could be more sophisticated
  return initialQuestions[Math.floor(Math.random() * initialQuestions.length)];
}

async function getUserProfile(userId: string) {
  // This would fetch user profile from database
  // Placeholder implementation
  return {
    name: "User",
    skills: [],
    experience_level: "intermediate"
  };
}