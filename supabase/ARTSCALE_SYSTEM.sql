-- ============================================
-- ARTSCALE 20K & TRIAL SYSTEM
-- ============================================

-- Update user_profiles with trial and roadmap tracking
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS roadmap_tier TEXT DEFAULT 'tier_1', -- 'tier_1', 'tier_2', 'tier_3'
ADD COLUMN IF NOT EXISTS ebay_feedback_score INTEGER DEFAULT 0;

-- ARTSCALE PROGRESS TRACKING
CREATE TABLE IF NOT EXISTS artscaler_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  goal_type TEXT NOT NULL, -- 'sales', 'revenue', 'feedback', 'production'
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_artscaler_goals_user ON artscaler_goals(user_id);

-- RLS
ALTER TABLE artscaler_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own artscaler goals" 
  ON artscaler_goals FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to check if user is in trial
CREATE OR REPLACE FUNCTION is_in_trial(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_start TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT trial_started_at INTO trial_start FROM user_profiles WHERE id = user_id;
  RETURN trial_start > NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
