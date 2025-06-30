/*
  # Database Schema Setup for RepoScope.AI

  1. Purpose
    - Creates all necessary tables for user profiles, analysis history, and artifacts
    - Sets up proper Row Level Security policies
    - Handles automatic profile creation and timestamp updates

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
    - Proper foreign key constraints and cascading deletes

  3. Features
    - User profile management
    - Repository analysis history
    - Conversation tracking
    - Test and documentation artifact storage
*/

-- First, check if we need to migrate from the old profiles table structure
DO $$
BEGIN
  -- If the old profiles table exists, we need to migrate data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    -- Create user_profiles table if it doesn't exist
    CREATE TABLE IF NOT EXISTS user_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL UNIQUE,
      username text NOT NULL,
      email text NOT NULL,
      avatar_url text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    );

    -- Migrate data from profiles to user_profiles if user_profiles is empty
    IF NOT EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN
      INSERT INTO user_profiles (user_id, username, email, avatar_url, created_at, updated_at)
      SELECT 
        id as user_id,
        COALESCE(full_name, split_part(email, '@', 1)) as username,
        email,
        avatar_url,
        created_at,
        updated_at
      FROM profiles
      ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- Drop the old profiles table and its dependencies
    DROP TABLE IF EXISTS user_sessions CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
  END IF;
END $$;

-- Create user_profiles table (main user data) if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  username text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create analysis_memories table (repository analysis history)
CREATE TABLE IF NOT EXISTS analysis_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  repo_url text NOT NULL,
  repo_name text NOT NULL,
  repo_owner text NOT NULL,
  description text,
  analyzed_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  is_favorite boolean DEFAULT false,
  tech_stack text[] DEFAULT '{}',
  tech_stack_detailed jsonb DEFAULT '{}',
  structure jsonb DEFAULT '{}',
  analysis jsonb DEFAULT '{}',
  architecture_diagram jsonb,
  tags text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_analysis_memories_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create conversations table (chat history)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('question', 'file_analysis', 'test_generation', 'architecture')),
  question text NOT NULL,
  answer text NOT NULL,
  context jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_conversations_memory_id FOREIGN KEY (memory_id) REFERENCES analysis_memories(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create test_artifacts table (generated tests)
CREATE TABLE IF NOT EXISTS test_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  function_name text NOT NULL,
  test_framework text NOT NULL,
  test_cases text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_test_artifacts_memory_id FOREIGN KEY (memory_id) REFERENCES analysis_memories(id) ON DELETE CASCADE,
  CONSTRAINT fk_test_artifacts_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create documentation_artifacts table (generated docs)
CREATE TABLE IF NOT EXISTS documentation_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('readme', 'onboarding', 'api')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_documentation_artifacts_memory_id FOREIGN KEY (memory_id) REFERENCES analysis_memories(id) ON DELETE CASCADE,
  CONSTRAINT fk_documentation_artifacts_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_artifacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- User profiles policies
  DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
  
  -- Analysis memories policies
  DROP POLICY IF EXISTS "Users can view own memories" ON analysis_memories;
  DROP POLICY IF EXISTS "Users can insert own memories" ON analysis_memories;
  DROP POLICY IF EXISTS "Users can update own memories" ON analysis_memories;
  DROP POLICY IF EXISTS "Users can delete own memories" ON analysis_memories;
  
  -- Conversations policies
  DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
  
  -- Test artifacts policies
  DROP POLICY IF EXISTS "Users can view own test artifacts" ON test_artifacts;
  DROP POLICY IF EXISTS "Users can insert own test artifacts" ON test_artifacts;
  DROP POLICY IF EXISTS "Users can delete own test artifacts" ON test_artifacts;
  
  -- Documentation artifacts policies
  DROP POLICY IF EXISTS "Users can view own documentation artifacts" ON documentation_artifacts;
  DROP POLICY IF EXISTS "Users can insert own documentation artifacts" ON documentation_artifacts;
  DROP POLICY IF EXISTS "Users can delete own documentation artifacts" ON documentation_artifacts;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- User profiles policies
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Analysis memories policies
CREATE POLICY "Users can view own memories"
  ON analysis_memories
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own memories"
  ON analysis_memories
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own memories"
  ON analysis_memories
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own memories"
  ON analysis_memories
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON conversations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Test artifacts policies
CREATE POLICY "Users can view own test artifacts"
  ON test_artifacts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own test artifacts"
  ON test_artifacts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own test artifacts"
  ON test_artifacts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Documentation artifacts policies
CREATE POLICY "Users can view own documentation artifacts"
  ON documentation_artifacts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documentation artifacts"
  ON documentation_artifacts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own documentation artifacts"
  ON documentation_artifacts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_profiles_updated ON user_profiles;
DROP TRIGGER IF EXISTS on_analysis_memories_updated ON analysis_memories;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (user_id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers to update updated_at timestamps
CREATE TRIGGER on_user_profiles_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_analysis_memories_updated
  BEFORE UPDATE ON analysis_memories
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_memories_user_id ON analysis_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_memories_repo_url ON analysis_memories(repo_url);
CREATE INDEX IF NOT EXISTS idx_analysis_memories_last_accessed ON analysis_memories(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_memory_id ON conversations(memory_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_test_artifacts_memory_id ON test_artifacts(memory_id);
CREATE INDEX IF NOT EXISTS idx_documentation_artifacts_memory_id ON documentation_artifacts(memory_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;