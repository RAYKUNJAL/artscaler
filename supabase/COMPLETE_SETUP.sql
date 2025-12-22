-- eBay Art Pulse Pro Complete Database Setup
-- Version: 2.1 (WVS Score Edition)
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- MIGRATION 001: INITIAL SCHEMA
-- ========================================

-- EBAY SOLD LISTINGS TABLE
CREATE TABLE IF NOT EXISTS ebay_sold_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sold_price NUMERIC(10, 2),
  shipping_price NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  is_auction BOOLEAN DEFAULT false,
  bid_count INTEGER DEFAULT 0,
  sold_date DATE,
  item_url TEXT,
  search_keyword TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sold_listings_user ON ebay_sold_listings(user_id);
CREATE INDEX idx_sold_listings_date ON ebay_sold_listings(sold_date DESC);
CREATE INDEX idx_sold_listings_keyword ON ebay_sold_listings(search_keyword);
CREATE INDEX idx_sold_listings_price ON ebay_sold_listings(sold_price);

-- PARSED SIGNALS TABLE
CREATE TABLE IF NOT EXISTS parsed_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES ebay_sold_listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  width_in NUMERIC(6, 2),
  height_in NUMERIC(6, 2),
  medium TEXT,
  subject TEXT,
  style TEXT,
  confidence_score NUMERIC(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_parsed_signals_listing ON parsed_signals(listing_id);
CREATE INDEX idx_parsed_signals_subject ON parsed_signals(subject);
CREATE INDEX idx_parsed_signals_medium ON parsed_signals(medium);

-- PRICING ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS pricing_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  size_bucket TEXT NOT NULL,
  median_price NUMERIC(10, 2),
  upper_quartile_price NUMERIC(10, 2),
  lower_quartile_price NUMERIC(10, 2),
  sell_through_rate NUMERIC(5, 2),
  avg_days_to_sell NUMERIC(6, 2),
  recommended_price NUMERIC(10, 2),
  recommended_auction_start NUMERIC(10, 2),
  sample_size INTEGER,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pricing_analysis_user ON pricing_analysis(user_id);
CREATE INDEX idx_pricing_analysis_size ON pricing_analysis(size_bucket);

-- SCRAPE JOBS TABLE
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  pages_scraped INTEGER DEFAULT 0,
  items_found INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scrape_jobs_user ON scrape_jobs(user_id);
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

-- USER KEYWORDS TABLE
CREATE TABLE IF NOT EXISTS user_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  total_scrapes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, keyword)
);

CREATE INDEX idx_user_keywords_user ON user_keywords(user_id);
CREATE INDEX idx_user_keywords_active ON user_keywords(is_active);

-- Enable RLS
ALTER TABLE ebay_sold_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keywords ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own listings" ON ebay_sold_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own listings" ON ebay_sold_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own listings" ON ebay_sold_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own listings" ON ebay_sold_listings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own signals" ON parsed_signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own signals" ON parsed_signals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own pricing" ON pricing_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pricing" ON pricing_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pricing" ON pricing_analysis FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own jobs" ON scrape_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own jobs" ON scrape_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs" ON scrape_jobs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own keywords" ON user_keywords FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own keywords" ON user_keywords FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own keywords" ON user_keywords FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own keywords" ON user_keywords FOR DELETE USING (auth.uid() = user_id);

-- Helper Functions
CREATE OR REPLACE FUNCTION categorize_size(width NUMERIC, height NUMERIC)
RETURNS TEXT AS $$
DECLARE
  area NUMERIC;
BEGIN
  area := width * height;
  IF area < 200 THEN RETURN 'small';
  ELSIF area < 600 THEN RETURN 'medium';
  ELSIF area < 1200 THEN RETURN 'large';
  ELSE RETURN 'extra-large';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- MIGRATION 002: USER MANAGEMENT
-- ========================================

-- MEMBERSHIP CONFIG TABLE
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
('free', 'Free Scout', 0, 0, 5, 3, 7, false, false, false, false, false),
('artist', 'Artist', 20, 200, 100, 25, 30, true, false, true, false, false),
('studio', 'Studio', 50, 500, 500, 100, 180, true, true, true, true, false),
('empire', 'Empire', 120, 1200, 5000, 500, -1, true, true, true, true, true)
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

-- USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  email_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  opportunity_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_tier ON user_profiles(subscription_tier);

-- USER SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  paypal_subscription_id TEXT UNIQUE,
  square_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  payment_gateway TEXT CHECK (payment_gateway IN ('stripe', 'paypal', 'square')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);

-- USER USAGE TRACKING TABLE
CREATE TABLE IF NOT EXISTS user_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  scrapes_used INTEGER DEFAULT 0,
  keywords_used INTEGER DEFAULT 0,
  api_calls_used INTEGER DEFAULT 0,
  scrapes_limit INTEGER DEFAULT 10,
  keywords_limit INTEGER DEFAULT 5,
  api_calls_limit INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

CREATE INDEX idx_usage_tracking_user ON user_usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON user_usage_tracking(period_start DESC);

-- USER SAVED OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS user_saved_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_label TEXT NOT NULL,
  wvs_score NUMERIC,
  notes TEXT,
  status TEXT DEFAULT 'saved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_opportunities_user ON user_saved_opportunities(user_id);

-- USER NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON user_notifications(user_id);
CREATE INDEX idx_notifications_read ON user_notifications(is_read);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their saved opportunities" ON user_saved_opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert saved opportunities" ON user_saved_opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their saved opportunities" ON user_saved_opportunities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their saved opportunities" ON user_saved_opportunities FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON user_notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view membership config" ON membership_config FOR SELECT USING (true);

-- Auto-create profile on signup
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
    COALESCE(free_scrapes, 10), COALESCE(free_keywords, 5), 0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========================================
-- MIGRATION 003: AI PIPELINE
-- ========================================

-- SCRAPE RUNS TABLE
CREATE TABLE IF NOT EXISTS scrape_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running',
  keywords_attempted INTEGER DEFAULT 0,
  pages_attempted INTEGER DEFAULT 0,
  records_inserted_raw INTEGER DEFAULT 0,
  records_inserted_clean INTEGER DEFAULT 0,
  records_scored INTEGER DEFAULT 0,
  error_summary TEXT,
  runner TEXT DEFAULT 'manual',
  app_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scrape_runs_status ON scrape_runs(status);
CREATE INDEX idx_scrape_runs_started ON scrape_runs(started_at DESC);

-- SOLD LISTINGS RAW TABLE
CREATE TABLE IF NOT EXISTS sold_listings_raw (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  search_keyword TEXT NOT NULL,
  item_url TEXT UNIQUE NOT NULL,
  title_raw TEXT NOT NULL,
  price_raw TEXT,
  shipping_raw TEXT,
  bids_raw TEXT,
  listing_type_hint TEXT,
  sold_date_raw TEXT,
  source TEXT DEFAULT 'ebay_sold_search',
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_payload_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_sold_listings_raw_url ON sold_listings_raw(item_url);
CREATE INDEX idx_sold_listings_raw_run ON sold_listings_raw(run_id);

-- SOLD LISTINGS CLEAN TABLE
CREATE TABLE IF NOT EXISTS sold_listings_clean (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_id UUID REFERENCES sold_listings_raw(id) ON DELETE CASCADE,
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_keyword TEXT NOT NULL,
  item_url TEXT NOT NULL,
  title TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  sold_price NUMERIC(10, 2),
  shipping_price NUMERIC(10, 2) DEFAULT 0,
  is_auction BOOLEAN DEFAULT false,
  bid_count INTEGER DEFAULT 0,
  sold_date DATE,
  dedupe_hash TEXT,
  normalized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sold_listings_clean_user ON sold_listings_clean(user_id);
CREATE INDEX idx_sold_listings_clean_run ON sold_listings_clean(run_id);
CREATE INDEX idx_sold_listings_clean_date ON sold_listings_clean(sold_date DESC);

-- TOPIC CLUSTERS TABLE
CREATE TABLE IF NOT EXISTS topic_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  topic_slug TEXT UNIQUE NOT NULL,
  topic_label TEXT NOT NULL,
  topic_description TEXT,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_topic_clusters_slug ON topic_clusters(topic_slug);

-- TOPIC MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS topic_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topic_clusters(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES sold_listings_clean(id) ON DELETE CASCADE,
  membership_score NUMERIC(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_topic_memberships_topic ON topic_memberships(topic_id);
CREATE INDEX idx_topic_memberships_listing ON topic_memberships(listing_id);

-- TOPIC SCORES DAILY TABLE
CREATE TABLE IF NOT EXISTS topic_scores_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  topic_id UUID REFERENCES topic_clusters(id) ON DELETE CASCADE,
  wvs_score NUMERIC(5, 2), -- Watch Velocity Score (Replaces Nolan Score)
  velocity_score NUMERIC(5, 2),
  recency_sales_7d INTEGER DEFAULT 0,
  sales_30d INTEGER DEFAULT 0,
  auction_intensity NUMERIC(5, 2),
  median_price NUMERIC(10, 2),
  upper_quartile_price NUMERIC(10, 2),
  demand_supply_ratio NUMERIC(5, 2),
  confidence NUMERIC(3, 2),
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_topic_scores_date ON topic_scores_daily(date DESC);
CREATE INDEX idx_topic_scores_wvs ON topic_scores_daily(wvs_score DESC);

-- KEYWORD METRICS DAILY TABLE
CREATE TABLE IF NOT EXISTS keyword_metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  keyword TEXT NOT NULL,
  occurrences_7d INTEGER DEFAULT 0,
  occurrences_30d INTEGER DEFAULT 0,
  trend_delta NUMERIC(5, 2),
  price_lift NUMERIC(10, 2),
  topic_association UUID REFERENCES topic_clusters(id) ON DELETE SET NULL,
  confidence NUMERIC(3, 2),
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_keyword_metrics_date ON keyword_metrics_daily(date DESC);
CREATE INDEX idx_keyword_metrics_keyword ON keyword_metrics_daily(keyword);

-- OPPORTUNITY FEED TABLE
-- OPPORTUNITY FEED TABLE
CREATE TABLE IF NOT EXISTS opportunity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  rank INTEGER NOT NULL,
  topic_id UUID REFERENCES topic_clusters(id) ON DELETE CASCADE,
  topic_label TEXT NOT NULL,
  wvs_score NUMERIC(5, 2), -- Watch Velocity Score
  velocity_score NUMERIC(5, 2),
  recommended_sizes TEXT[],
  median_price NUMERIC(10, 2),
  upper_quartile_price NUMERIC(10, 2),
  confidence NUMERIC(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_opportunity_feed_user_date ON opportunity_feed(user_id, date DESC);
CREATE INDEX idx_opportunity_feed_topic ON opportunity_feed(topic_id);
CREATE INDEX idx_opportunity_feed_rank ON opportunity_feed(date DESC, rank);

-- Enable RLS for opportunity_feed
ALTER TABLE opportunity_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opportunity_feed
CREATE POLICY "Users view own opportunities"
  ON opportunity_feed FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own opportunities"
  ON opportunity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own opportunities"
  ON opportunity_feed FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own opportunities"
  ON opportunity_feed FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS for other AI pipeline tables
ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sold_listings_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE sold_listings_clean ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_scores_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_metrics_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI pipeline tables
CREATE POLICY "Users can view scrape runs" ON scrape_runs FOR SELECT USING (true);
CREATE POLICY "Users can view their own clean listings" ON sold_listings_clean FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view topic clusters" ON topic_clusters FOR SELECT USING (true);
CREATE POLICY "Users can view topic memberships" ON topic_memberships FOR SELECT USING (true);
CREATE POLICY "Users can view topic scores" ON topic_scores_daily FOR SELECT USING (true);
CREATE POLICY "Users can view keyword metrics" ON keyword_metrics_daily FOR SELECT USING (true);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
