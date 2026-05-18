-- Create the vocabulary table for WordVault
CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  telugu_meaning TEXT NOT NULL,
  example_sentence TEXT,
  category TEXT,
  memory_strength TEXT NOT NULL DEFAULT 'weak' CHECK (memory_strength IN ('strong', 'medium', 'weak')),
  revision_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_revision_date TIMESTAMPTZ,
  favorite BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

-- Users can only see their own words
CREATE POLICY "Users can view their own vocabulary"
  ON vocabulary FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own words
CREATE POLICY "Users can insert their own vocabulary"
  ON vocabulary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own words
CREATE POLICY "Users can update their own vocabulary"
  ON vocabulary FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own words
CREATE POLICY "Users can delete their own vocabulary"
  ON vocabulary FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_vocabulary_user_id ON vocabulary(user_id);
CREATE INDEX idx_vocabulary_created_at ON vocabulary(created_at DESC);
CREATE INDEX idx_vocabulary_memory_strength ON vocabulary(memory_strength);
CREATE INDEX idx_vocabulary_favorite ON vocabulary(favorite) WHERE favorite = true;
