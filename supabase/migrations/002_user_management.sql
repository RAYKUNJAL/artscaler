-- ArtIntel User Management & Subscription Tables
-- Extends the base schema with user profiles, subscriptions, and usage tracking

-- ========================================
-- USER PROFILES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile info
  full_name TEXT,
  avatar_url TEXT,
  
  -- Subscription tier
  subscription_tier TEXT DEFAULT 'free', -- free, pro, enterprise
  subscription_status TEXT DEFAULT 'active', -- active, canceled, past_due
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  
  -- Preferences
  email_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  opportunity_alerts BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_profiles_tier ON user_profiles(subscription_tier);

-- ========================================
-- USER SUBSCRIPTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe details
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- Subscription info
  status TEXT DEFAULT 'active', -- active, canceled, past_due, trialing
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);

-- ========================================
-- USER USAGE TRACKING TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Usage period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Usage metrics
  scrapes_used INTEGER DEFAULT 0,
  keywords_used INTEGER DEFAULT 0,
  api_calls_used INTEGER DEFAULT 0,
  
  -- Limits based on tier
  scrapes_limit INTEGER DEFAULT 100, -- free: 100, pro: 1000, enterprise: 10000
  keywords_limit INTEGER DEFAULT 5, -- free: 5, pro: 50, enterprise: unlimited (999)
  api_calls_limit INTEGER DEFAULT 0, -- free: 0, pro: 1000, enterprise: 10000
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint per user per period
  UNIQUE(user_id, period_start)
);

-- Indexes
CREATE INDEX idx_usage_tracking_user ON user_usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON user_usage_tracking(period_start DESC);

-- ========================================
-- USER SAVED OPPORTUNITIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_saved_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Opportunity reference (we'll create opportunity_feed table next)
  topic_label TEXT NOT NULL,
  nolan_score NUMERIC,
  
  -- User notes
  notes TEXT,
  status TEXT DEFAULT 'saved', -- saved, in_progress, completed
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_saved_opportunities_user ON user_saved_opportunities(user_id);
CREATE INDEX idx_saved_opportunities_status ON user_saved_opportunities(status);

-- ========================================
-- USER NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL, -- opportunity_alert, scrape_complete, usage_warning, system
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Metadata
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON user_notifications(user_id);
CREATE INDEX idx_notifications_read ON user_notifications(is_read);
CREATE INDEX idx_notifications_created ON user_notifications(created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User Subscriptions Policies
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Usage Tracking Policies
CREATE POLICY "Users can view their own usage"
  ON user_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON user_usage_tracking FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Saved Opportunities Policies
CREATE POLICY "Users can view their saved opportunities"
  ON user_saved_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert saved opportunities"
  ON user_saved_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved opportunities"
  ON user_saved_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved opportunities"
  ON user_saved_opportunities FOR DELETE
  USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
  ON user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can create notifications"
  ON user_notifications FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically confirm the user's email
  UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE id = NEW.id;

  INSERT INTO user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Create initial usage tracking record
  INSERT INTO user_usage_tracking (
    user_id,
    period_start,
    period_end,
    scrapes_limit,
    keywords_limit,
    api_calls_limit
  ) VALUES (
    NEW.id,
    DATE_TRUNC('month', NOW()),
    DATE_TRUNC('month', NOW() + INTERVAL '1 month') - INTERVAL '1 day',
    100, -- free tier limits
    5,
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  limit_type TEXT, -- 'scrapes', 'keywords', 'api_calls'
  increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  usage_limit INTEGER;
  current_period_start DATE;
BEGIN
  -- Get current period start
  current_period_start := DATE_TRUNC('month', NOW());
  
  -- Get or create usage record for current period
  INSERT INTO user_usage_tracking (
    user_id,
    period_start,
    period_end
  ) VALUES (
    auth.uid(),
    current_period_start,
    DATE_TRUNC('month', NOW() + INTERVAL '1 month') - INTERVAL '1 day'
  ) ON CONFLICT (user_id, period_start) DO NOTHING;
  
  -- Get current usage and limit
  IF limit_type = 'scrapes' THEN
    SELECT scrapes_used, scrapes_limit INTO current_usage, usage_limit
    FROM user_usage_tracking
    WHERE user_id = auth.uid() AND period_start = current_period_start;
  ELSIF limit_type = 'keywords' THEN
    SELECT keywords_used, keywords_limit INTO current_usage, usage_limit
    FROM user_usage_tracking
    WHERE user_id = auth.uid() AND period_start = current_period_start;
  ELSIF limit_type = 'api_calls' THEN
    SELECT api_calls_used, api_calls_limit INTO current_usage, usage_limit
    FROM user_usage_tracking
    WHERE user_id = auth.uid() AND period_start = current_period_start;
  END IF;
  
  -- Check if adding increment would exceed limit
  RETURN (current_usage + increment) <= usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  limit_type TEXT,
  increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  current_period_start DATE;
BEGIN
  current_period_start := DATE_TRUNC('month', NOW());
  
  IF limit_type = 'scrapes' THEN
    UPDATE user_usage_tracking
    SET scrapes_used = scrapes_used + increment,
        updated_at = NOW()
    WHERE user_id = auth.uid() AND period_start = current_period_start;
  ELSIF limit_type = 'keywords' THEN
    UPDATE user_usage_tracking
    SET keywords_used = keywords_used + increment,
        updated_at = NOW()
    WHERE user_id = auth.uid() AND period_start = current_period_start;
  ELSIF limit_type = 'api_calls' THEN
    UPDATE user_usage_tracking
    SET api_calls_used = api_calls_used + increment,
        updated_at = NOW()
    WHERE user_id = auth.uid() AND period_start = current_period_start;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update subscription tier limits
CREATE OR REPLACE FUNCTION update_tier_limits(
  p_user_id UUID,
  p_tier TEXT
)
RETURNS VOID AS $$
DECLARE
  scrapes_limit_val INTEGER;
  keywords_limit_val INTEGER;
  api_calls_limit_val INTEGER;
BEGIN
  -- Set limits based on tier
  IF p_tier = 'free' THEN
    scrapes_limit_val := 100;
    keywords_limit_val := 5;
    api_calls_limit_val := 0;
  ELSIF p_tier = 'pro' THEN
    scrapes_limit_val := 1000;
    keywords_limit_val := 50;
    api_calls_limit_val := 1000;
  ELSIF p_tier = 'enterprise' THEN
    scrapes_limit_val := 10000;
    keywords_limit_val := 999;
    api_calls_limit_val := 10000;
  END IF;
  
  -- Update user profile
  UPDATE user_profiles
  SET subscription_tier = p_tier,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Update current period limits
  UPDATE user_usage_tracking
  SET scrapes_limit = scrapes_limit_val,
      keywords_limit = keywords_limit_val,
      api_calls_limit = api_calls_limit_val,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND period_start = DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
