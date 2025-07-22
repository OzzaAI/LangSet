import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { db } from "@/db/drizzle";
import { user, instance, dataset, interviewSession } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Enhanced state interface for LangGraph workflow
export interface InterviewWorkflowState {
  user_id: string;
  session_id: string;
  tab_id: string;
  global_context: string;
  conversation_history: Array<{
    question: string;
    answer: string;
    timestamp: Date;
    skills_extracted: string[];
    workflows_identified: string[];
  }>;
  current_question: string;
  extracted_skills: string[];
  identified_workflows: string[];
  threshold_metrics: {
    conversation_depth: number;
    skill_diversity: number;
    workflow_complexity: number;
    context_richness: number;
    overall_score: number;
  };
  generation_ready: boolean;
  generated_instances: any[];
  error_message?: string;
  next_node: string;
}

// Configuration for LangGraph workflow
export const WORKFLOW_CONFIG = {
  model: new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
    maxTokens: 2000,
    openAIApiKey: process.env.OPENAI_API_KEY,
  }),
  
  thresholds: {
    min_conversation_depth: 5,
    min_skill_diversity: 3,
    min_workflow_complexity: 2,
    saturation_score: 75,
    max_questions: 20,
    context_token_limit: 12000,
  },
  
  generation: {
    instances_per_session: 10,
    min_quality_threshold: 60,
    max_retries: 3,
  }
};

// Advanced prompts for different workflow nodes
const PROMPTS = {
  INTERVIEW: `You are an expert knowledge interviewer for LangSet, an ethical AI data marketplace. Your goal is to extract valuable, specific professional knowledge through strategic questioning.

CONTEXT ANALYSIS:
User Profile: {user_profile}
Session Progress: {session_progress}
Previously Identified Skills: {extracted_skills}
Captured Workflows: {identified_workflows}
Recent Conversation: {recent_conversation}

INTERVIEW STRATEGY:
1. Build on previous discoveries - don't repeat covered ground
2. Dive deeper into specific processes and methodologies
3. Ask for concrete examples with step-by-step details
4. Explore decision-making criteria and best practices
5. Identify tools, frameworks, and technologies used
6. Uncover edge cases and problem-solving approaches

CURRENT FOCUS AREAS:
{focus_areas}

Generate the next question that will extract the most valuable, actionable knowledge. Make it specific and build naturally from the conversation flow.

Next Question:`,

  THRESHOLD_ANALYSIS: `Analyze the interview session to determine if sufficient knowledge has been captured for high-quality dataset generation.

CONVERSATION HISTORY:
{conversation_history}

CURRENT METRICS:
- Questions Asked: {questions_count}
- Skills Identified: {skills_count}
- Workflows Captured: {workflows_count}
- Context Length: {context_length} characters

EVALUATION CRITERIA:
1. Conversation Depth (0-30 points): Quality and detail of responses
2. Skill Diversity (0-25 points): Variety of technical skills mentioned
3. Workflow Complexity (0-25 points): Detailed processes and methodologies
4. Context Richness (0-20 points): Concrete examples and scenarios

Provide scores for each criterion and determine if the session is ready for instance generation.

Analysis:`,

  INSTANCE_GENERATION: `Generate exactly {instance_count} high-quality question-answer pairs for a professional dataset based on the interview conversation.

INTERVIEW CONTEXT:
{full_context}

EXTRACTED KNOWLEDGE:
Skills: {skills}
Workflows: {workflows}
Key Topics: {key_topics}

GENERATION REQUIREMENTS:
1. Each Q&A should capture specific, actionable professional knowledge
2. Questions must be clear, professionally worded, and practical
3. Answers should be detailed but concise (150-400 words)
4. Include relevant tags for categorization
5. Assign appropriate difficulty levels
6. Focus on transferable knowledge and real-world applications

OUTPUT FORMAT (Valid JSON Array):
[
  {
    "question": "Clear, specific professional question",
    "answer": "Detailed, actionable answer with concrete examples",
    "tags": ["tag1", "tag2", "tag3"],
    "category": "primary_skill_area",
    "difficulty": "beginner|intermediate|advanced",
    "confidence_score": 85
  }
]

Generated Instances:`,

  CONTEXT_UPDATE: `Compress and optimize the conversation context while preserving all critical knowledge elements.

ORIGINAL CONTEXT ({original_length} chars):
{original_context}

COMPRESSION GOALS:
- Target length: {target_length} characters
- Preserve ALL identified skills and workflows
- Maintain concrete examples and specific processes
- Keep decision-making criteria and best practices
- Compress redundant information and small talk

PRESERVED ELEMENTS:
Skills: {skills_to_preserve}
Workflows: {workflows_to_preserve}

Optimized Context:`,
};

/**
 * Interview Node - Generates contextual questions
 */
async function interviewNode(
  state: InterviewWorkflowState,
  config?: RunnableConfig
): Promise<Partial<InterviewWorkflowState>> {
  try {
    console.log(`[LangGraph] Interview Node - User: ${state.user_id}, Session: ${state.session_id}`);
    
    // Prepare context for question generation
    const userProfile = await getUserProfile(state.user_id);
    const sessionProgress = calculateSessionProgress(state);
    const recentConversation = formatRecentConversation(state.conversation_history, 3);
    const focusAreas = identifyFocusAreas(state);
    
    const prompt = PROMPTS.INTERVIEW
      .replace('{user_profile}', userProfile)
      .replace('{session_progress}', sessionProgress)
      .replace('{extracted_skills}', state.extracted_skills.join(', ') || 'None yet')
      .replace('{identified_workflows}', state.identified_workflows.join(', ') || 'None yet')
      .replace('{recent_conversation}', recentConversation)
      .replace('{focus_areas}', focusAreas);

    const response = await WORKFLOW_CONFIG.model.invoke([
      new SystemMessage(prompt)
    ]);
    
    // Log execution for debugging
    await logWorkflowExecution(state.user_id, state.session_id, 'interview', {
      input: { conversation_length: state.conversation_history.length },
      output: { question_generated: true },
      execution_time: Date.now()
    });

    return {
      current_question: response.content as string,
      next_node: "threshold_check"
    };

  } catch (error) {
    console.error('[LangGraph] Interview Node Error:', error);
    return {
      error_message: `Interview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      next_node: "error"
    };
  }
}

/**
 * Threshold Check Node - Advanced scoring algorithm
 */
async function thresholdCheckNode(
  state: InterviewWorkflowState,
  config?: RunnableConfig
): Promise<Partial<InterviewWorkflowState>> {
  try {
    console.log(`[LangGraph] Threshold Check - Session: ${state.session_id}`);
    
    // Advanced threshold calculation
    const metrics = await calculateAdvancedThresholds(state);
    
    // LLM-assisted threshold analysis for complex cases
    if (metrics.overall_score > 60 && metrics.overall_score < 80) {
      const llmAnalysis = await getLLMThresholdAnalysis(state);
      if (llmAnalysis.recommendation === 'generate') {
        metrics.overall_score = 85; // Override based on LLM recommendation
      }
    }
    
    const shouldGenerate = (
      metrics.overall_score >= WORKFLOW_CONFIG.thresholds.saturation_score ||
      state.conversation_history.length >= WORKFLOW_CONFIG.thresholds.max_questions
    );

    await logWorkflowExecution(state.user_id, state.session_id, 'threshold_check', {
      input: { metrics_calculated: metrics },
      output: { should_generate: shouldGenerate },
      execution_time: Date.now()
    });

    return {
      threshold_metrics: metrics,
      generation_ready: shouldGenerate,
      next_node: shouldGenerate ? "generate_instances" : "interview"
    };

  } catch (error) {
    console.error('[LangGraph] Threshold Check Error:', error);
    return {
      error_message: `Threshold analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      next_node: "error"
    };
  }
}

/**
 * Generate Instances Node - Creates high-quality datasets
 */
async function generateInstancesNode(
  state: InterviewWorkflowState,
  config?: RunnableConfig
): Promise<Partial<InterviewWorkflowState>> {
  try {
    console.log(`[LangGraph] Generate Instances - Session: ${state.session_id}`);
    
    // Enforce quota check before generating instances
    const { enforceQuotaCheck } = await import("@/lib/billing/quota-service");
    await enforceQuotaCheck(state.user_id, WORKFLOW_CONFIG.generation.instances_per_session);
    
    const fullContext = state.global_context;
    const keyTopics = extractKeyTopics(state.conversation_history);
    
    const prompt = PROMPTS.INSTANCE_GENERATION
      .replace('{instance_count}', WORKFLOW_CONFIG.generation.instances_per_session.toString())
      .replace('{full_context}', fullContext)
      .replace('{skills}', state.extracted_skills.join(', '))
      .replace('{workflows}', state.identified_workflows.join(', '))
      .replace('{key_topics}', keyTopics.join(', '));

    const response = await WORKFLOW_CONFIG.model.invoke([
      new SystemMessage(prompt)
    ]);
    
    // Parse and validate generated instances
    let instances: any[];
    try {
      instances = JSON.parse(response.content as string);
      if (!Array.isArray(instances)) {
        throw new Error('Generated content is not an array');
      }
    } catch (parseError) {
      throw new Error(`Failed to parse generated instances: ${parseError}`);
    }
    
    // Quality validation and enhancement
    const validatedInstances = await validateAndEnhanceInstances(instances, state);
    
    // Store instances in database
    const datasetId = await createDatasetFromSession(state);
    await storeGeneratedInstances(validatedInstances, datasetId, state.user_id);
    
    await logWorkflowExecution(state.user_id, state.session_id, 'generate_instances', {
      input: { context_length: fullContext.length },
      output: { instances_generated: validatedInstances.length },
      execution_time: Date.now()
    });

    return {
      generated_instances: validatedInstances,
      next_node: "context_update"
    };

  } catch (error) {
    console.error('[LangGraph] Generate Instances Error:', error);
    return {
      error_message: `Instance generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      next_node: "error"
    };
  }
}

/**
 * Context Update Node - Intelligent context management
 */
async function contextUpdateNode(
  state: InterviewWorkflowState,
  config?: RunnableConfig
): Promise<Partial<InterviewWorkflowState>> {
  try {
    console.log(`[LangGraph] Context Update - Session: ${state.session_id}`);
    
    let updatedContext = state.global_context;
    
    // Context compression if needed
    if (state.global_context.length > WORKFLOW_CONFIG.thresholds.context_token_limit) {
      const targetLength = Math.floor(state.global_context.length * 0.7);
      
      const compressionPrompt = PROMPTS.CONTEXT_UPDATE
        .replace('{original_length}', state.global_context.length.toString())
        .replace('{original_context}', state.global_context)
        .replace('{target_length}', targetLength.toString())
        .replace('{skills_to_preserve}', state.extracted_skills.join(', '))
        .replace('{workflows_to_preserve}', state.identified_workflows.join(', '));

      const compressionResponse = await WORKFLOW_CONFIG.model.invoke([
        new SystemMessage(compressionPrompt)
      ]);
      
      updatedContext = compressionResponse.content as string;
      
      // Log compression metrics
      await logContextCompaction(state.user_id, {
        original_length: state.global_context.length,
        compacted_length: updatedContext.length,
        skills_preserved: state.extracted_skills.length,
        workflows_preserved: state.identified_workflows.length
      });
    }
    
    // Update user's global context in database
    await updateUserGlobalContext(state.user_id, {
      global_context: updatedContext,
      extracted_skills: state.extracted_skills,
      identified_workflows: state.identified_workflows,
      last_session_id: state.session_id
    });
    
    // Mark session as completed
    await markSessionCompleted(state.session_id, state.threshold_metrics.overall_score);

    await logWorkflowExecution(state.user_id, state.session_id, 'context_update', {
      input: { original_context_length: state.global_context.length },
      output: { updated_context_length: updatedContext.length },
      execution_time: Date.now()
    });

    return {
      global_context: updatedContext,
      next_node: "complete"
    };

  } catch (error) {
    console.error('[LangGraph] Context Update Error:', error);
    return {
      error_message: `Context update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      next_node: "error"
    };
  }
}

/**
 * Create and configure the LangGraph workflow
 */
export function createInterviewWorkflow() {
  // Define the state graph
  const workflow = new StateGraph<InterviewWorkflowState>({
    channels: {
      user_id: "string",
      session_id: "string", 
      tab_id: "string",
      global_context: "string",
      conversation_history: "array",
      current_question: "string",
      extracted_skills: "array",
      identified_workflows: "array",
      threshold_metrics: "object",
      generation_ready: "boolean",
      generated_instances: "array",
      error_message: "string",
      next_node: "string"
    }
  });

  // Add workflow nodes
  workflow.addNode("interview", interviewNode);
  workflow.addNode("threshold_check", thresholdCheckNode);
  workflow.addNode("generate_instances", generateInstancesNode);
  workflow.addNode("context_update", contextUpdateNode);

  // Define conditional edges
  workflow.addConditionalEdges(
    "interview",
    (state: InterviewWorkflowState) => state.next_node,
    {
      "threshold_check": "threshold_check",
      "error": END
    }
  );

  workflow.addConditionalEdges(
    "threshold_check", 
    (state: InterviewWorkflowState) => state.next_node,
    {
      "interview": "interview",
      "generate_instances": "generate_instances",
      "error": END
    }
  );

  workflow.addConditionalEdges(
    "generate_instances",
    (state: InterviewWorkflowState) => state.next_node,
    {
      "context_update": "context_update",
      "error": END
    }
  );

  workflow.addConditionalEdges(
    "context_update",
    (state: InterviewWorkflowState) => state.next_node,
    {
      "complete": END,
      "error": END
    }
  );

  // Set entry point
  workflow.setEntryPoint("interview");

  return workflow.compile();
}

/**
 * Session Manager - Handles multiple browser tabs with shared context
 */
export class GlobalSessionManager {
  private static activeTabSessions: Map<string, InterviewWorkflowState> = new Map();
  private static userGlobalContexts: Map<string, any> = new Map();

  static async initializeSession(userId: string, tabId: string): Promise<InterviewWorkflowState> {
    const sessionKey = `${userId}_${tabId}`;
    
    // Load or create global context for user
    if (!this.userGlobalContexts.has(userId)) {
      const globalContext = await this.loadUserGlobalContext(userId);
      this.userGlobalContexts.set(userId, globalContext);
    }
    
    const globalContext = this.userGlobalContexts.get(userId)!;
    
    // Create new session state
    const sessionState: InterviewWorkflowState = {
      user_id: userId,
      session_id: crypto.randomUUID(),
      tab_id: tabId,
      global_context: globalContext.context || "",
      conversation_history: [],
      current_question: "",
      extracted_skills: globalContext.skills || [],
      identified_workflows: globalContext.workflows || [],
      threshold_metrics: {
        conversation_depth: 0,
        skill_diversity: 0,
        workflow_complexity: 0,
        context_richness: 0,
        overall_score: 0
      },
      generation_ready: false,
      generated_instances: [],
      next_node: "interview"
    };
    
    this.activeTabSessions.set(sessionKey, sessionState);
    
    // Create database session record
    await this.createDatabaseSession(sessionState);
    
    return sessionState;
  }

  static getSession(userId: string, tabId: string): InterviewWorkflowState | null {
    const sessionKey = `${userId}_${tabId}`;
    return this.activeTabSessions.get(sessionKey) || null;
  }

  static updateSession(userId: string, tabId: string, updates: Partial<InterviewWorkflowState>) {
    const sessionKey = `${userId}_${tabId}`;
    const currentSession = this.activeTabSessions.get(sessionKey);
    
    if (currentSession) {
      const updatedSession = { ...currentSession, ...updates };
      this.activeTabSessions.set(sessionKey, updatedSession);
      
      // Update global context if skills or workflows changed
      if (updates.extracted_skills || updates.identified_workflows || updates.global_context) {
        this.syncGlobalContext(userId, updatedSession);
      }
    }
  }

  static async closeSession(userId: string, tabId: string) {
    const sessionKey = `${userId}_${tabId}`;
    const session = this.activeTabSessions.get(sessionKey);
    
    if (session) {
      // Save final state to database
      await this.saveSessionToDatabase(session);
      
      // Update global context
      await this.syncGlobalContext(userId, session);
      
      // Remove from active sessions
      this.activeTabSessions.delete(sessionKey);
    }
  }

  static getAllUserSessions(userId: string): InterviewWorkflowState[] {
    const userSessions: InterviewWorkflowState[] = [];
    
    for (const [key, session] of this.activeTabSessions.entries()) {
      if (key.startsWith(`${userId}_`)) {
        userSessions.push(session);
      }
    }
    
    return userSessions;
  }

  private static async loadUserGlobalContext(userId: string) {
    const userData = await db
      .select({
        globalContext: user.globalContext,
        extractedSkills: user.extractedSkills,
        identifiedWorkflows: user.identifiedWorkflows
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    if (userData.length === 0) {
      return { context: "", skills: [], workflows: [] };
    }
    
    return {
      context: userData[0].globalContext || "",
      skills: userData[0].extractedSkills || [],
      workflows: userData[0].identifiedWorkflows || []
    };
  }

  private static syncGlobalContext(userId: string, session: InterviewWorkflowState) {
    const globalContext = {
      context: session.global_context,
      skills: session.extracted_skills,
      workflows: session.identified_workflows
    };
    
    this.userGlobalContexts.set(userId, globalContext);
  }

  private static async createDatabaseSession(session: InterviewWorkflowState) {
    await db.insert(interviewSession).values({
      id: session.session_id,
      userId: session.user_id,
      status: "active",
      thresholdScore: 0,
      sessionData: {
        tab_id: session.tab_id,
        created_at: new Date().toISOString()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private static async saveSessionToDatabase(session: InterviewWorkflowState) {
    await db
      .update(interviewSession)
      .set({
        sessionData: {
          tab_id: session.tab_id,
          conversation_history: session.conversation_history,
          extracted_skills: session.extracted_skills,
          identified_workflows: session.identified_workflows,
          threshold_metrics: session.threshold_metrics,
          generated_instances_count: session.generated_instances.length
        },
        thresholdScore: session.threshold_metrics.overall_score,
        updatedAt: new Date()
      })
      .where(eq(interviewSession.id, session.session_id));
  }
}

// Helper functions for workflow nodes
async function getUserProfile(userId: string): Promise<string> {
  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  
  if (!userData[0]) return "New user profile";
  
  return `Name: ${userData[0].name || 'Unknown'}
Email: ${userData[0].email}
Skills: ${userData[0].extractedSkills?.join(', ') || 'None identified'}
LinkedIn: ${userData[0].linkedinProfile ? 'Connected' : 'Not connected'}`;
}

function calculateSessionProgress(state: InterviewWorkflowState): string {
  return `Questions: ${state.conversation_history.length}
Skills Found: ${state.extracted_skills.length}
Workflows: ${state.identified_workflows.length}
Context Length: ${state.global_context.length} chars`;
}

function formatRecentConversation(history: InterviewWorkflowState["conversation_history"], count: number): string {
  return history
    .slice(-count)
    .map(exchange => `Q: ${exchange.question}\nA: ${exchange.answer}`)
    .join('\n\n');
}

function identifyFocusAreas(state: InterviewWorkflowState): string {
  const areas = [];
  
  if (state.extracted_skills.length < 3) areas.push("Technical skills and tools");
  if (state.identified_workflows.length < 2) areas.push("Step-by-step processes");
  if (state.conversation_history.length < 3) areas.push("Concrete examples and scenarios");
  
  return areas.length > 0 ? areas.join(', ') : "Deep dive into existing topics";
}

async function calculateAdvancedThresholds(state: InterviewWorkflowState) {
  const history = state.conversation_history;
  
  // Conversation depth (0-30 points)
  const avgAnswerLength = history.reduce((sum, h) => sum + h.answer.length, 0) / Math.max(history.length, 1);
  const conversationDepth = Math.min((avgAnswerLength / 200) * 30, 30);
  
  // Skill diversity (0-25 points) 
  const skillDiversity = Math.min((state.extracted_skills.length / 5) * 25, 25);
  
  // Workflow complexity (0-25 points)
  const workflowComplexity = Math.min((state.identified_workflows.length / 3) * 25, 25);
  
  // Context richness (0-20 points)
  const contextRichness = Math.min((state.global_context.length / 3000) * 20, 20);
  
  const overallScore = conversationDepth + skillDiversity + workflowComplexity + contextRichness;
  
  return {
    conversation_depth: Math.round(conversationDepth),
    skill_diversity: Math.round(skillDiversity),
    workflow_complexity: Math.round(workflowComplexity),
    context_richness: Math.round(contextRichness),
    overall_score: Math.round(overallScore)
  };
}

async function getLLMThresholdAnalysis(state: InterviewWorkflowState) {
  const analysisPrompt = PROMPTS.THRESHOLD_ANALYSIS
    .replace('{conversation_history}', formatRecentConversation(state.conversation_history, 5))
    .replace('{questions_count}', state.conversation_history.length.toString())
    .replace('{skills_count}', state.extracted_skills.length.toString())
    .replace('{workflows_count}', state.identified_workflows.length.toString())
    .replace('{context_length}', state.global_context.length.toString());

  const response = await WORKFLOW_CONFIG.model.invoke([
    new SystemMessage(analysisPrompt)
  ]);
  
  // Simple parsing for recommendation
  const content = response.content as string;
  const recommendation = content.toLowerCase().includes('ready') || content.toLowerCase().includes('generate') 
    ? 'generate' : 'continue';
    
  return { recommendation, analysis: content };
}

function extractKeyTopics(conversation: InterviewWorkflowState["conversation_history"]): string[] {
  const topics = new Set<string>();
  
  conversation.forEach(exchange => {
    // Simple topic extraction - in production, use more sophisticated NLP
    const text = `${exchange.question} ${exchange.answer}`.toLowerCase();
    
    // Extract technical terms
    const techTerms = text.match(/\b(?:react|python|javascript|typescript|sql|aws|docker|kubernetes|node\.js|express|mongodb|postgresql|api|frontend|backend|database|microservices|devops|ci\/cd|testing|agile|scrum)\b/gi) || [];
    techTerms.forEach(term => topics.add(term));
    
    // Extract business terms
    const businessTerms = text.match(/\b(?:project|management|leadership|strategy|planning|analysis|optimization|performance|security|scalability|architecture|design|implementation)\b/gi) || [];
    businessTerms.forEach(term => topics.add(term));
  });
  
  return Array.from(topics);
}

async function validateAndEnhanceInstances(instances: any[], state: InterviewWorkflowState): Promise<any[]> {
  return instances
    .filter(instance => {
      // Quality validation
      return instance.question && 
             instance.answer && 
             instance.question.length > 20 && 
             instance.answer.length > 100 &&
             instance.tags && 
             Array.isArray(instance.tags);
    })
    .map(instance => ({
      ...instance,
      quality_score: calculateInstanceQuality(instance),
      session_id: state.session_id,
      generated_at: new Date().toISOString(),
      extraction_context: {
        skills_referenced: state.extracted_skills.filter(skill => 
          instance.answer.toLowerCase().includes(skill.toLowerCase())
        ),
        workflow_elements: state.identified_workflows.filter(workflow =>
          instance.answer.toLowerCase().includes(workflow.toLowerCase())
        )
      }
    }));
}

function calculateInstanceQuality(instance: any): number {
  let score = 0;
  
  // Length scoring
  if (instance.question.length > 20) score += 20;
  if (instance.answer.length > 150) score += 30;
  
  // Tag scoring
  if (instance.tags.length >= 3) score += 20;
  
  // Difficulty appropriate
  if (instance.difficulty) score += 10;
  
  // Category appropriate
  if (instance.category) score += 10;
  
  // Confidence score if provided
  if (instance.confidence_score) score += Math.min(instance.confidence_score / 10, 10);
  
  return Math.min(score, 100);
}

async function createDatasetFromSession(state: InterviewWorkflowState): Promise<string> {
  const datasetId = crypto.randomUUID();
  
  await db.insert(dataset).values({
    id: datasetId,
    name: `Interview Dataset - ${new Date().toLocaleDateString()}`,
    description: `Generated from LangGraph interview session ${state.session_id}`,
    userId: state.user_id,
    instanceCount: WORKFLOW_CONFIG.generation.instances_per_session,
    averageQualityScore: 0, // Will be calculated after instances are stored
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return datasetId;
}

async function storeGeneratedInstances(instances: any[], datasetId: string, userId: string) {
  const instanceRecords = instances.map(inst => ({
    id: crypto.randomUUID(),
    question: inst.question,
    answer: inst.answer,
    tags: inst.tags,
    qualityScore: inst.quality_score || 70,
    editCount: 0,
    datasetId,
    lastEditedBy: userId,
    sessionId: inst.session_id,
    generationMethod: "langgraph" as const,
    category: inst.category,
    difficulty: inst.difficulty,
    anonymizationStatus: "pending" as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await db.insert(instance).values(instanceRecords);
  
  // Auto-embed instances in Pinecone after creation
  try {
    const { batchEmbedInstances } = await import("@/lib/pinecone/vector-service");
    
    const embeddingData = instances.map(inst => ({
      id: instanceRecords.find(r => r.question === inst.question)?.id || crypto.randomUUID(),
      question: inst.question,
      answer: inst.answer,
      tags: inst.tags || [],
      category: inst.category || "general",
      difficulty: inst.difficulty || "intermediate",
      qualityScore: inst.quality_score || 70,
      datasetId,
      userId
    }));
    
    await batchEmbedInstances(embeddingData);
    console.log(`[LangGraph Hook] Auto-embedded ${instances.length} instances in Pinecone`);
    
  } catch (embeddingError) {
    console.error("[LangGraph Hook] Failed to auto-embed instances:", embeddingError);
    // Don't fail the workflow if embedding fails
  }
  
  // Update dataset average quality score
  const avgQuality = instances.reduce((sum, inst) => sum + (inst.quality_score || 70), 0) / instances.length;
  await db
    .update(dataset)
    .set({ 
      averageQualityScore: Math.round(avgQuality),
      updatedAt: new Date()
    })
    .where(eq(dataset.id, datasetId));
}

async function updateUserGlobalContext(userId: string, contextData: any) {
  await db
    .update(user)
    .set({
      globalContext: contextData.global_context,
      extractedSkills: contextData.extracted_skills,
      identifiedWorkflows: contextData.identified_workflows,
      lastContextUpdate: new Date(),
      updatedAt: new Date()
    })
    .where(eq(user.id, userId));
}

async function markSessionCompleted(sessionId: string, finalScore: number) {
  await db
    .update(interviewSession)
    .set({
      status: "completed",
      thresholdScore: finalScore,
      completedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(interviewSession.id, sessionId));
}

async function logWorkflowExecution(userId: string, sessionId: string, nodeName: string, data: any) {
  try {
    await db.insert(langGraphExecution).values({
      id: crypto.randomUUID(),
      userId,
      sessionId,
      workflowName: "interview_workflow",
      nodeName,
      executionTimeMs: data.execution_time ? Date.now() - data.execution_time : 0,
      inputData: data.input || {},
      outputData: data.output || {},
      errorMessage: data.error || null,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log workflow execution:', error);
  }
}

async function logContextCompaction(userId: string, metrics: any) {
  try {
    await db.insert(contextCompaction).values({
      id: crypto.randomUUID(),
      userId,
      originalLength: metrics.original_length,
      compactedLength: metrics.compacted_length,
      compressionRatio: metrics.compacted_length / metrics.original_length,
      skillsPreserved: metrics.skills_preserved,
      workflowsPreserved: metrics.workflows_preserved,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log context compaction:', error);
  }
}

export default createInterviewWorkflow;