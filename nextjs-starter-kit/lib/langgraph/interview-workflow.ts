import { OpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";
import { db } from "@/db/drizzle";
import { user, instance, dataset, interviewSession } from "@/db/schema";
import { eq } from "drizzle-orm";

// Interview state interface
export interface InterviewState {
  user_id: string;
  session_id: string;
  global_context: string;
  current_question: string;
  conversation_history: Array<{
    question: string;
    answer: string;
    timestamp: Date;
  }>;
  extracted_skills: string[];
  identified_workflows: string[];
  threshold_score: number;
  instance_count: number;
  is_complete: boolean;
  generated_instances?: any[];
}

// LangGraph configuration
const INTERVIEW_CONFIG = {
  model: new OpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
    maxTokens: 2000,
  }),
  
  thresholds: {
    minimum_instances: 5,
    saturation_score: 85,
    max_questions: 25,
    context_tokens: 8000,
  },
  
  context: {
    max_size: 16000,
    compact_ratio: 0.6,
    preserve_skills: true,
    preserve_workflows: true,
  }
};

// Master prompt for interview questioning
const MASTER_INTERVIEW_PROMPT = `
You are an expert interviewer for LangSet, an ethical AI data marketplace. Your goal is to extract valuable, specific knowledge from professionals through strategic questioning.

CORE PRINCIPLES:
1. Focus on practical, actionable knowledge
2. Dive deep into specific workflows and processes  
3. Extract concrete examples and scenarios
4. Identify transferable skills and methodologies
5. Maintain professional, curious tone

QUESTION STRATEGY:
- Start broad, then narrow to specifics
- Ask for concrete examples and step-by-step processes
- Explore edge cases and problem-solving approaches
- Identify tools, frameworks, and methodologies used
- Uncover decision-making criteria and best practices

CURRENT CONTEXT:
User Profile: {user_profile}
Previous Conversation: {conversation_history}
Identified Skills: {extracted_skills}
Workflows Discovered: {identified_workflows}

INSTRUCTIONS:
Generate the next question that will extract the most valuable, specific knowledge. 
Focus on areas not yet fully explored. Ask for concrete examples and detailed processes.

Question:`;

// Context compaction prompt
const CONTEXT_COMPACTION_PROMPT = `
Rewrite the following conversation context concisely while preserving ALL key skills, workflows, and specific knowledge.

PRESERVE THESE ELEMENTS:
- Specific skills and technologies mentioned
- Step-by-step workflows and processes
- Tools and frameworks used
- Problem-solving approaches
- Decision-making criteria
- Concrete examples and scenarios

ORIGINAL CONTEXT:
{original_context}

COMPACTED CONTEXT (target: {target_length} tokens):`;

// Instance generation prompt  
const INSTANCE_GENERATION_PROMPT = `
Based on the interview conversation, generate exactly 10 high-quality question-answer pairs for a professional dataset.

REQUIREMENTS:
- Each Q&A should capture specific, actionable knowledge
- Questions should be clear and professionally worded
- Answers should be detailed but concise (100-300 words)
- Include relevant tags for each instance
- Focus on practical applications and real-world scenarios

CONVERSATION CONTEXT:
{conversation_context}

EXTRACTED SKILLS: {skills}
IDENTIFIED WORKFLOWS: {workflows}

Generate 10 instances in this JSON format:
[
  {
    "question": "Clear, specific question",
    "answer": "Detailed, actionable answer",
    "tags": ["tag1", "tag2", "tag3"],
    "category": "skill_area",
    "difficulty": "beginner|intermediate|advanced"
  }
]

Instances:`;

/**
 * Interview Node - Handles conversational interview process
 */
async function interviewNode(state: InterviewState): Promise<Partial<InterviewState>> {
  try {
    const prompt = MASTER_INTERVIEW_PROMPT
      .replace("{user_profile}", await getUserProfile(state.user_id))
      .replace("{conversation_history}", formatConversationHistory(state.conversation_history))
      .replace("{extracted_skills}", state.extracted_skills.join(", "))
      .replace("{identified_workflows}", state.identified_workflows.join(", "));

    const response = await INTERVIEW_CONFIG.model.invoke(prompt);
    
    return {
      current_question: response.content as string,
      next_action: "threshold_check"
    };
  } catch (error) {
    console.error("Interview node error:", error);
    return { 
      next_action: "error",
      error: "Failed to generate interview question"
    };
  }
}

/**
 * Threshold Check Node - Determines if enough data has been collected
 */
async function thresholdCheckNode(state: InterviewState): Promise<Partial<InterviewState>> {
  try {
    // Calculate saturation score based on multiple factors
    const conversationDepth = Math.min(state.conversation_history.length / 15, 1) * 30;
    const skillDiversity = Math.min(state.extracted_skills.length / 8, 1) * 25;
    const workflowComplexity = Math.min(state.identified_workflows.length / 5, 1) * 25;
    const contextRichness = Math.min(state.global_context.length / 4000, 1) * 20;
    
    const threshold_score = conversationDepth + skillDiversity + workflowComplexity + contextRichness;
    
    // Decision logic for continuation
    const shouldContinue = (
      threshold_score < INTERVIEW_CONFIG.thresholds.saturation_score &&
      state.conversation_history.length < INTERVIEW_CONFIG.thresholds.max_questions &&
      state.global_context.length < INTERVIEW_CONFIG.thresholds.context_tokens
    );
    
    return {
      threshold_score,
      next_action: shouldContinue ? "continue_interview" : "generate_instances"
    };
  } catch (error) {
    console.error("Threshold check error:", error);
    return { 
      next_action: "error",
      error: "Failed to calculate threshold score"
    };
  }
}

/**
 * Generate Instances Node - Creates dataset instances from conversation
 */
async function generateInstancesNode(state: InterviewState): Promise<Partial<InterviewState>> {
  try {
    const prompt = INSTANCE_GENERATION_PROMPT
      .replace("{conversation_context}", state.global_context)
      .replace("{skills}", state.extracted_skills.join(", "))
      .replace("{workflows}", state.identified_workflows.join(", "));

    const response = await INTERVIEW_CONFIG.model.invoke(prompt);
    
    // Parse JSON response
    const instances = JSON.parse(response.content as string);
    
    // Store instances in database
    const datasetId = await createDataset(state.user_id, state.session_id);
    await storeInstances(instances, datasetId, state.user_id);
    
    return {
      generated_instances: instances,
      instance_count: instances.length,
      is_complete: true,
      next_action: "update_context"
    };
  } catch (error) {
    console.error("Instance generation error:", error);
    return { 
      next_action: "error",
      error: "Failed to generate instances"
    };
  }
}

/**
 * Update Context Node - Manages context compaction and storage
 */
async function updateContextNode(state: InterviewState): Promise<Partial<InterviewState>> {
  try {
    // Check if context needs compaction
    if (state.global_context.length > INTERVIEW_CONFIG.context.max_size) {
      const targetLength = Math.floor(state.global_context.length * INTERVIEW_CONFIG.context.compact_ratio);
      
      const compactionPrompt = CONTEXT_COMPACTION_PROMPT
        .replace("{original_context}", state.global_context)
        .replace("{target_length}", targetLength.toString());
      
      const response = await INTERVIEW_CONFIG.model.invoke(compactionPrompt);
      state.global_context = response.content as string;
    }
    
    // Update database with final context
    await updateUserContext(state.user_id, {
      global_context: state.global_context,
      extracted_skills: state.extracted_skills,
      identified_workflows: state.identified_workflows,
      threshold_score: state.threshold_score
    });
    
    return {
      next_action: "complete"
    };
  } catch (error) {
    console.error("Context update error:", error);
    return { 
      next_action: "error",
      error: "Failed to update context"
    };
  }
}

/**
 * Interview Workflow Graph Definition
 */
export function createInterviewWorkflow() {
  const workflow = new StateGraph<InterviewState>({
    channels: {
      user_id: "string",
      session_id: "string", 
      global_context: "string",
      current_question: "string",
      conversation_history: "array",
      extracted_skills: "array",
      identified_workflows: "array",
      threshold_score: "number",
      instance_count: "number",
      is_complete: "boolean",
      generated_instances: "array"
    }
  });

  // Add nodes
  workflow.addNode("interview", interviewNode);
  workflow.addNode("threshold_check", thresholdCheckNode);
  workflow.addNode("generate_instances", generateInstancesNode);
  workflow.addNode("update_context", updateContextNode);

  // Define edges and conditional routing
  workflow.addEdge("interview", "threshold_check");
  
  workflow.addConditionalEdges(
    "threshold_check",
    (state: InterviewState) => state.next_action,
    {
      "continue_interview": "interview",
      "generate_instances": "generate_instances",
      "error": END
    }
  );
  
  workflow.addEdge("generate_instances", "update_context");
  workflow.addEdge("update_context", END);

  // Set entry point
  workflow.setEntryPoint("interview");

  return workflow.compile();
}

/**
 * Session Management Functions
 */
export async function startInterviewSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  
  await db.insert(interviewSession).values({
    id: sessionId,
    userId,
    status: "active",
    thresholdScore: 0,
    sessionData: {},
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return sessionId;
}

export async function processInterviewAnswer(
  sessionId: string, 
  answer: string
): Promise<{ question: string; isComplete: boolean; instances?: any[] }> {
  
  // Load current session state
  const session = await db
    .select()
    .from(interviewSession)
    .where(eq(interviewSession.id, sessionId))
    .limit(1);
  
  if (!session[0]) {
    throw new Error("Session not found");
  }
  
  const currentState: InterviewState = session[0].sessionData as InterviewState;
  
  // Add answer to conversation history
  currentState.conversation_history.push({
    question: currentState.current_question,
    answer,
    timestamp: new Date()
  });
  
  // Update global context
  currentState.global_context += `\nQ: ${currentState.current_question}\nA: ${answer}`;
  
  // Extract skills and workflows (simplified - could use more sophisticated NLP)
  const skillMatches = answer.match(/\b(?:React|Python|JavaScript|TypeScript|SQL|AWS|Docker|Kubernetes|Node\.js|Express|MongoDB|PostgreSQL)\b/gi) || [];
  currentState.extracted_skills = [...new Set([...currentState.extracted_skills, ...skillMatches])];
  
  // Run workflow
  const workflow = createInterviewWorkflow();
  const result = await workflow.invoke(currentState);
  
  // Update session in database
  await db
    .update(interviewSession)
    .set({
      sessionData: result,
      thresholdScore: result.threshold_score,
      updatedAt: new Date(),
      ...(result.is_complete && { 
        status: "completed",
        completedAt: new Date() 
      })
    })
    .where(eq(interviewSession.id, sessionId));
  
  return {
    question: result.current_question || "",
    isComplete: result.is_complete || false,
    instances: result.generated_instances
  };
}

/**
 * Multi-Session Context Management
 */
export class ContextManager {
  private static sessions: Map<string, InterviewState> = new Map();
  
  static async getOrCreateSession(userId: string, tabId: string): Promise<InterviewState> {
    const sessionKey = `${userId}_${tabId}`;
    
    if (!this.sessions.has(sessionKey)) {
      // Load user's global context from database
      const userContext = await this.loadUserContext(userId);
      
      const newSession: InterviewState = {
        user_id: userId,
        session_id: crypto.randomUUID(),
        global_context: userContext.global_context || "",
        current_question: "",
        conversation_history: [],
        extracted_skills: userContext.extracted_skills || [],
        identified_workflows: userContext.identified_workflows || [],
        threshold_score: 0,
        instance_count: 0,
        is_complete: false
      };
      
      this.sessions.set(sessionKey, newSession);
    }
    
    return this.sessions.get(sessionKey)!;
  }
  
  static updateSession(userId: string, tabId: string, updates: Partial<InterviewState>) {
    const sessionKey = `${userId}_${tabId}`;
    const session = this.sessions.get(sessionKey);
    
    if (session) {
      Object.assign(session, updates);
      this.sessions.set(sessionKey, session);
    }
  }
  
  static async saveAndCloseSession(userId: string, tabId: string) {
    const sessionKey = `${userId}_${tabId}`;
    const session = this.sessions.get(sessionKey);
    
    if (session) {
      await updateUserContext(userId, {
        global_context: session.global_context,
        extracted_skills: session.extracted_skills,
        identified_workflows: session.identified_workflows,
        threshold_score: session.threshold_score
      });
      
      this.sessions.delete(sessionKey);
    }
  }
  
  private static async loadUserContext(userId: string) {
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    return {
      global_context: userData[0]?.globalContext || "",
      extracted_skills: userData[0]?.extractedSkills || [],
      identified_workflows: userData[0]?.identifiedWorkflows || []
    };
  }
}

/**
 * Helper Functions
 */
async function getUserProfile(userId: string): Promise<string> {
  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  
  if (!userData[0]) return "No profile available";
  
  return `
    Name: ${userData[0].name}
    Email: ${userData[0].email}
    LinkedIn Profile: ${userData[0].linkedinProfile || "Not connected"}
    Skills: ${userData[0].extractedSkills?.join(", ") || "None identified"}
  `;
}

function formatConversationHistory(history: InterviewState["conversation_history"]): string {
  return history
    .slice(-5) // Last 5 exchanges
    .map(exchange => `Q: ${exchange.question}\nA: ${exchange.answer}`)
    .join("\n\n");
}

async function createDataset(userId: string, sessionId: string): Promise<string> {
  const datasetId = crypto.randomUUID();
  
  await db.insert(dataset).values({
    id: datasetId,
    name: `Interview Dataset ${new Date().toLocaleDateString()}`,
    description: `Generated from interview session ${sessionId}`,
    userId,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return datasetId;
}

async function storeInstances(instances: any[], datasetId: string, userId: string) {
  const instanceRecords = instances.map(inst => ({
    id: crypto.randomUUID(),
    question: inst.question,
    answer: inst.answer,
    tags: inst.tags,
    qualityScore: calculateInitialQuality(inst),
    editCount: 0,
    datasetId,
    lastEditedBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await db.insert(instance).values(instanceRecords);
}

async function updateUserContext(userId: string, context: any) {
  await db
    .update(user)
    .set({
      globalContext: context.global_context,
      extractedSkills: context.extracted_skills,
      identifiedWorkflows: context.identified_workflows,
      updatedAt: new Date()
    })
    .where(eq(user.id, userId));
}

function calculateInitialQuality(instance: any): number {
  // Simple initial quality calculation
  const questionScore = instance.question.length > 20 ? 25 : 15;
  const answerScore = instance.answer.length > 100 ? 35 : 20;
  const tagScore = instance.tags.length > 2 ? 20 : 10;
  const clarityScore = instance.answer.includes(".") ? 20 : 10;
  
  return questionScore + answerScore + tagScore + clarityScore;
}

export default createInterviewWorkflow;