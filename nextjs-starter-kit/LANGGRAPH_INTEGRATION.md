import { OpenAI } from "@langchain/openai";
import { StateGraph, END } from "@langchain/langgraph";

// LangGraph configuration
export const LANGGRAPH_CONFIG = {
  model: new OpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
    maxTokens: 2000,
  }),
  
  // Interview thresholds - flexible scoring system
  thresholds: {
    minimum_instances: 5,      // Minimum for basic completion
    saturation_score: 85,      // Quality saturation threshold
    max_questions: 25,         // Safety limit
    context_tokens: 8000,      // Context size limit
  },
  
  // Context management
  context: {
    max_size: 16000,           // Max tokens before compaction
    compact_ratio: 0.6,        // Target size after compaction
    preserve_skills: true,     // Always preserve skill data
    preserve_workflows: true,  // Always preserve workflow data
  }
};

// Interview session state interface
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

export type InterviewGraphState = {
  state: InterviewState;
  next_action: string;
  error?: string;
};