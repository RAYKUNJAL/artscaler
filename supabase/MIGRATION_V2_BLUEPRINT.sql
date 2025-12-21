-- ============================================
-- eBay Art Pulse Pro - V2 Migration
-- Based on Master Blueprint
-- ============================================

-- 1. Update Membership Tiers in Profiles
-- Ensure subscription_tier can handle 'free', 'pro', 'studio'
-- (Existing table user_profiles already has subscription_tier TEXT DEFAULT 'free')

-- 2. Enhance Usage Tracking for New Limits
-- The existing model handles specific limits per user, which is good.
-- We can update the defaults for the tiers.

-- 3. Add Payment Gateway Fields to user_subscriptions
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS square_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_gateway TEXT CHECK (payment_gateway IN ('stripe', 'paypal', 'square'));

-- 4. Create Settings Table for App Constants (Optional, but good for tier config)
CREATE TABLE IF NOT EXISTS membership_config (
  tier_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly NUMERIC(10, 2),
  price_yearly NUMERIC(10, 2),
  daily_scrapes_limit INTEGER,
  keywords_limit INTEGER,
  historical_data_days INTEGER, -- -1 for unlimited
  has_predictions BOOLEAN DEFAULT false,
  has_auto_listing BOOLEAN DEFAULT false,
  has_alerts BOOLEAN DEFAULT false,
  has_competitor_tracker BOOLEAN DEFAULT false,
  has_api_access BOOLEAN DEFAULT false
);

INSERT INTO membership_config (tier_id, name, price_monthly, price_yearly, daily_scrapes_limit, keywords_limit, historical_data_days, has_predictions, has_auto_listing, has_alerts, has_competitor_tracker, has_api_access)
VALUES 
('free', 'Free Scout', 0, 0, 10, 5, 7, false, false, false, false, false),
('pro', 'Pro Painter', 29.99, 299, 500, 150, 365, true, true, true, true, false),
('studio', 'Studio Empire', 99.99, 999, 5000, 1000, -1, true, true, true, true, true)
ON CONFLICT (tier_id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  daily_scrapes_limit = EXCLUDED.daily_scrapes_limit,
  keywords_limit = EXCLUDED.keywords_limit,
  historical_data_days = EXCLUDED.historical_data_days,
  has_predictions = EXCLUDED.has_predictions,
  has_auto_listing = EXCLUDED.has_auto_listing,
  has_alerts = EXCLUDED.has_alerts,
  has_competitor_tracker = EXCLUDED.has_competitor_tracker,
  has_api_access = EXCLUDED.has_api_access;

-- 5. Update the handle_new_user function to use the 'free' tier limits from the config
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  free_scrapes INTEGER;
  free_keywords INTEGER;
BEGIN
  -- Get defaults from config
  SELECT daily_scrapes_limit, keywords_limit INTO free_scrapes, free_keywords 
  FROM membership_config WHERE tier_id = 'free';

  INSERT INTO user_profiles (id, full_name, subscription_tier)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'free');
  
  INSERT INTO user_usage_tracking (
    user_id, period_start, period_end,
    scrapes_limit, keywords_limit, api_calls_limit
  ) VALUES (
    NEW.id,
    DATE_TRUNC('month', NOW()),
    DATE_TRUNC('month', NOW() + INTERVAL '1 month') - INTERVAL '1 day',
    free_scrapes, free_keywords, 0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add indexes for new payment IDs
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paypal ON user_subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_square ON user_subscriptions(square_subscription_id);
