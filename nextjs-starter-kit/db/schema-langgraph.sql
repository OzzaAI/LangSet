-- Additional schema for LangGraph integration
-- Add these tables to your existing schema

-- Interview sessions for LangGraph workflow
CREATE TABLE interview_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  threshold_score INTEGER DEFAULT 0,
  session_data JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User global context storage
ALTER TABLE users ADD COLUMN IF NOT EXISTS global_context TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS extracted_skills JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS identified_workflows JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_context_update TIMESTAMP;

-- Enhanced instance table for LangGraph integration
ALTER TABLE instances ADD COLUMN IF NOT EXISTS session_id TEXT REFERENCES interview_sessions(id);
ALTER TABLE instances ADD COLUMN IF NOT EXISTS generation_method TEXT DEFAULT 'manual' CHECK (generation_method IN ('manual', 'langgraph', 'import'));
ALTER TABLE instances ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE instances ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE instances ADD COLUMN IF NOT EXISTS anonymization_status TEXT DEFAULT 'pending' CHECK (anonymization_status IN ('pending', 'clean', 'flagged', 'anonymized'));

-- Workflow execution logs for debugging
CREATE TABLE langgraph_executions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES interview_sessions(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  node_name TEXT NOT NULL,
  execution_time_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Context compaction history
CREATE TABLE context_compactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_length INTEGER NOT NULL,
  compacted_length INTEGER NOT NULL,
  compression_ratio DECIMAL(4,3),
  skills_preserved INTEGER DEFAULT 0,
  workflows_preserved INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Quality scoring history with LLM evaluation
ALTER TABLE instances ADD COLUMN IF NOT EXISTS llm_quality_score INTEGER;
ALTER TABLE instances ADD COLUMN IF NOT EXISTS quality_breakdown JSONB;
ALTER TABLE instances ADD COLUMN IF NOT EXISTS quality_suggestions JSONB;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON interview_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_instances_session_id ON instances(session_id);
CREATE INDEX IF NOT EXISTS idx_instances_generation_method ON instances(generation_method);
CREATE INDEX IF NOT EXISTS idx_instances_quality_score ON instances(quality_score);
CREATE INDEX IF NOT EXISTS idx_instances_anonymization_status ON instances(anonymization_status);

CREATE INDEX IF NOT EXISTS idx_langgraph_executions_user_id ON langgraph_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_langgraph_executions_session_id ON langgraph_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_langgraph_executions_created_at ON langgraph_executions(created_at);

CREATE INDEX IF NOT EXISTS idx_users_global_context_gin ON users USING gin(to_tsvector('english', global_context));
CREATE INDEX IF NOT EXISTS idx_users_extracted_skills_gin ON users USING gin(extracted_skills);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interview_sessions_updated_at 
  BEFORE UPDATE ON interview_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO interview_sessions (id, user_id, status, session_data) VALUES 
('sample-session-1', 'user-1', 'active', '{"threshold_score": 0, "questions_asked": 0}')
ON CONFLICT (id) DO NOTHING;