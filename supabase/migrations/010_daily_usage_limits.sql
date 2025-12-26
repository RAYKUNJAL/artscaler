
-- ArtScaler Daily Usage Limits Migration
-- Migration: 010_daily_usage_limits.sql

-- 1. Update user_profiles tier names and defaults
ALTER TABLE user_profiles 
ALTER COLUMN subscription_tier SET DEFAULT 'free';

-- 2. Create Daily Usage Table
CREATE TABLE IF NOT EXISTS user_daily_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE DEFAULT CURRENT_DATE,
  searches_count INTEGER DEFAULT 0,
  searches_limit INTEGER DEFAULT 10, -- Default free limit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- Index for performance
CREATE INDEX idx_daily_usage_user_date ON user_daily_usage(user_id, usage_date DESC);

-- 3. Update Helper Functions for Daily Limits

-- Function to check and increment daily limit
CREATE OR REPLACE FUNCTION check_and_increment_daily_limit(p_user_id UUID, p_increment INTEGER DEFAULT 1)
RETURNS TABLE (allowed BOOLEAN, current_usage INTEGER, current_limit INTEGER) AS $$
DECLARE
  v_tier TEXT;
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  -- 1. Get user tier
  SELECT subscription_tier INTO v_tier FROM user_profiles WHERE id = p_user_id;
  
  -- 2. Determine limit based on new tiers
  IF v_tier = 'studio' THEN
    v_limit := 1000;
  ELSIF v_tier = 'pro' THEN
    v_limit := 100;
  ELSE
    v_limit := 10;
  END IF;

  -- 3. Get or create daily record
  INSERT INTO user_daily_usage (user_id, usage_date, searches_limit)
  VALUES (p_user_id, CURRENT_DATE, v_limit)
  ON CONFLICT (user_id, usage_date) DO UPDATE
  SET searches_limit = v_limit
  RETURNING searches_count INTO v_count;

  -- 4. Check limit
  IF (v_count + p_increment) <= v_limit THEN
    UPDATE user_daily_usage
    SET searches_count = searches_count + p_increment,
        updated_at = NOW()
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    
    RETURN QUERY SELECT TRUE, v_count + p_increment, v_limit;
  ELSE
    RETURN QUERY SELECT FALSE, v_count, v_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Set RLS for Daily Usage
ALTER TABLE user_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily usage"
  ON user_daily_usage FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Update update_tier_limits to reflect new names
CREATE OR REPLACE FUNCTION update_tier_limits_v2(
  p_user_id UUID,
  p_tier TEXT
)
RETURNS VOID AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Set limits based on tier
  IF p_tier = 'studio' THEN
    v_limit := 1000;
  ELSIF p_tier = 'pro' THEN
    v_limit := 100;
  ELSE
    v_limit := 10;
  END IF;
  
  -- Update user profile
  UPDATE user_profiles
  SET subscription_tier = p_tier,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Update current daily record if exists
  UPDATE user_daily_usage
  SET searches_limit = v_limit,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND usage_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to initialize usage record for new users
CREATE OR REPLACE FUNCTION handle_new_user_daily()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_daily_usage (user_id, usage_date, searches_limit)
  VALUES (NEW.id, CURRENT_DATE, 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_daily ON auth.users;
CREATE TRIGGER on_auth_user_created_daily
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_daily();
