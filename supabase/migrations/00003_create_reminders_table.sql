-- Create the reminders table for the Memory Assistance Companion
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  reminder_date DATE NOT NULL,
  reminder_time TIME NOT NULL,
  notification_enabled BOOLEAN NOT NULL DEFAULT true,
  repeat_type TEXT NOT NULL DEFAULT 'none' CHECK (repeat_type IN ('none', 'daily', 'weekly', 'monthly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'snoozed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reminders
CREATE POLICY "Users can view their own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reminders
CREATE POLICY "Users can insert their own reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reminders
CREATE POLICY "Users can update their own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reminders
CREATE POLICY "Users can delete their own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for search, chronological querying, and status filtering
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_date_time ON reminders(reminder_date, reminder_time);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminders_priority ON reminders(priority);
