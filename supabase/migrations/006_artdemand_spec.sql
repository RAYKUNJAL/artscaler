-- =====================================================
-- ArtDemand Advisor v2.0 - Full Spec Migration
-- =====================================================
-- This migration adds all tables needed for the WVS-based
-- demand tracking system per the ArtDemand Advisor spec.
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. STYLES TABLE - Track art styles and their demand
-- =====================================================
CREATE TABLE IF NOT EXISTS styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  style_term TEXT UNIQUE NOT NULL,
  demand_score NUMERIC(5,2) DEFAULT 0,
  avg_wvs NUMERIC(8,4) DEFAULT 0,
  listing_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common art styles
INSERT INTO styles (style_term) VALUES
  ('abstract'),
  ('impressionist'),
  ('modern'),
  ('contemporary'),
  ('minimalist'),
  ('expressionist'),
  ('pop art'),
  ('realism'),
  ('surrealist'),
  ('folk art'),
  ('naive'),
  ('impasto'),
  ('palette knife'),
  ('photorealism'),
  ('cubist')
ON CONFLICT (style_term) DO NOTHING;

-- =====================================================
-- 2. SIZES TABLE - Track art sizes and their demand
-- =====================================================
CREATE TABLE IF NOT EXISTS sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  size_cluster TEXT NOT NULL, -- e.g., "16x20", "24x36"
  width_inches NUMERIC(6,2),
  height_inches NUMERIC(6,2),
  demand_score NUMERIC(5,2) DEFAULT 0,
  avg_wvs NUMERIC(8,4) DEFAULT 0,
  avg_price NUMERIC(10,2) DEFAULT 0,
  listing_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(size_cluster)
);

-- Seed common art sizes
INSERT INTO sizes (size_cluster, width_inches, height_inches) VALUES
  ('8x10', 8, 10),
  ('9x12', 9, 12),
  ('11x14', 11, 14),
  ('12x16', 12, 16),
  ('16x20', 16, 20),
  ('18x24', 18, 24),
  ('20x24', 20, 24),
  ('24x30', 24, 30),
  ('24x36', 24, 36),
  ('30x40', 30, 40),
  ('36x48', 36, 48)
ON CONFLICT (size_cluster) DO NOTHING;

-- =====================================================
-- 3. MEDIUMS TABLE - Track art mediums
-- =====================================================
CREATE TABLE IF NOT EXISTS mediums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medium_name TEXT UNIQUE NOT NULL,
  demand_score NUMERIC(5,2) DEFAULT 0,
  avg_wvs NUMERIC(8,4) DEFAULT 0,
  avg_price NUMERIC(10,2) DEFAULT 0,
  listing_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common art mediums
INSERT INTO mediums (medium_name) VALUES
  ('oil'),
  ('acrylic'),
  ('watercolor'),
  ('mixed media'),
  ('pastel'),
  ('gouache'),
  ('encaustic'),
  ('tempera'),
  ('ink'),
  ('charcoal'),
  ('graphite'),
  ('spray paint')
ON CONFLICT (medium_name) DO NOTHING;

-- =====================================================
-- 4. LISTING_STYLES - Many-to-many junction table
-- =====================================================
CREATE TABLE IF NOT EXISTS listing_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL,
  style_id UUID REFERENCES styles(id) ON DELETE CASCADE,
  confidence NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, style_id)
);

-- =====================================================
-- 5. PAINT QUEUE - User's actionable painting list
-- =====================================================
CREATE TABLE IF NOT EXISTS paint_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- What to paint
  style TEXT NOT NULL,
  size TEXT,
  medium TEXT,
  subject TEXT,
  color_palette TEXT[], -- Array of hex colors or color names
  
  -- Listing strategy
  listing_type TEXT CHECK (listing_type IN ('Auction', 'BuyItNow', 'Both')),
  target_price NUMERIC(10,2),
  price_range_low NUMERIC(10,2),
  price_range_high NUMERIC(10,2),
  
  -- Demand metrics
  est_demand_score NUMERIC(5,2),
  est_wvs NUMERIC(8,4),
  competition_level TEXT CHECK (competition_level IN ('Low', 'Medium', 'High')),
  
  -- Status tracking
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'completed', 'skipped')),
  notes TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. REVENUE PLANS - User's income planning
-- =====================================================
CREATE TABLE IF NOT EXISTS revenue_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Inputs
  target_monthly NUMERIC(12,2) DEFAULT 20000,
  avg_sale_price NUMERIC(10,2) DEFAULT 300,
  sell_through_rate NUMERIC(3,2) DEFAULT 0.50, -- 0.00 to 1.00
  weekly_capacity INTEGER DEFAULT 5,
  
  -- Generated plan (JSONB for flexibility)
  generated_plan JSONB,
  -- Example: {
  --   "pieces_needed": 10,
  --   "breakdown": [
  --     {"style": "abstract", "size": "24x36", "count": 4, "target_price": 500},
  --     {"style": "landscape", "size": "16x20", "count": 6, "target_price": 300}
  --   ]
  -- }
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. WVS SCORES DAILY - Track WVS over time
-- =====================================================
CREATE TABLE IF NOT EXISTS wvs_scores_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- What we're scoring
  entity_type TEXT NOT NULL CHECK (entity_type IN ('style', 'size', 'medium', 'category')),
  entity_id UUID,
  entity_name TEXT NOT NULL,
  
  -- WVS Components
  wvs_score NUMERIC(8,4) NOT NULL,
  avg_watcher_count NUMERIC(10,2),
  avg_days_active NUMERIC(10,2),
  normalized_price_factor NUMERIC(8,4),
  competition_adjustment NUMERIC(8,4),
  
  -- Supporting metrics
  listing_count INTEGER DEFAULT 0,
  total_watchers INTEGER DEFAULT 0,
  median_price NUMERIC(10,2),
  
  -- Date tracking
  score_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_name, score_date)
);

-- =====================================================
-- 8. SUBSCRIPTION TIERS UPDATE
-- =====================================================
-- Add subscription fields to user_profiles if not exists
DO $$
BEGIN
  -- Add subscription_tier column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_tier TEXT DEFAULT 'hobby';
  END IF;
  
  -- Add payment_method column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN payment_method TEXT;
  END IF;
  
  -- Add payment_customer_id column (for Square/PayPal)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'payment_customer_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN payment_customer_id TEXT;
  END IF;
  
  -- Add subscription_expires_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- =====================================================
-- 9. CATEGORY PRICE MEDIANS - For WVS calculation
-- =====================================================
CREATE TABLE IF NOT EXISTS category_medians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_name TEXT UNIQUE NOT NULL,
  median_price NUMERIC(10,2) DEFAULT 0,
  avg_price NUMERIC(10,2) DEFAULT 0,
  listing_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed art categories with estimated medians
INSERT INTO category_medians (category_name, median_price) VALUES
  ('paintings', 150.00),
  ('drawings', 75.00),
  ('prints', 45.00),
  ('mixed_media', 120.00),
  ('sculpture', 200.00),
  ('photography', 80.00)
ON CONFLICT (category_name) DO NOTHING;

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

-- Styles: Public read, admin write
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Styles are viewable by all" ON styles FOR SELECT USING (true);

-- Sizes: Public read, admin write
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sizes are viewable by all" ON sizes FOR SELECT USING (true);

-- Mediums: Public read, admin write
ALTER TABLE mediums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mediums are viewable by all" ON mediums FOR SELECT USING (true);

-- Paint Queue: User-specific
ALTER TABLE paint_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own paint queue" ON paint_queue 
  FOR ALL USING (auth.uid() = user_id);

-- Revenue Plans: User-specific
ALTER TABLE revenue_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own revenue plans" ON revenue_plans 
  FOR ALL USING (auth.uid() = user_id);

-- WVS Scores: Public read
ALTER TABLE wvs_scores_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "WVS scores are viewable by all" ON wvs_scores_daily FOR SELECT USING (true);

-- Category Medians: Public read
ALTER TABLE category_medians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Category medians are viewable by all" ON category_medians FOR SELECT USING (true);

-- =====================================================
-- 11. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_paint_queue_user ON paint_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_paint_queue_status ON paint_queue(status);
CREATE INDEX IF NOT EXISTS idx_revenue_plans_user ON revenue_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_wvs_scores_date ON wvs_scores_daily(score_date);
CREATE INDEX IF NOT EXISTS idx_wvs_scores_entity ON wvs_scores_daily(entity_type, entity_name);
CREATE INDEX IF NOT EXISTS idx_listing_styles_listing ON listing_styles(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_styles_style ON listing_styles(style_id);

-- =====================================================
-- 12. HELPFUL FUNCTIONS
-- =====================================================

-- Function to calculate WVS score
CREATE OR REPLACE FUNCTION calculate_wvs(
  watcher_count INTEGER,
  days_active NUMERIC,
  item_price NUMERIC,
  category_median_price NUMERIC,
  similar_listings_count INTEGER
) RETURNS NUMERIC AS $$
DECLARE
  normalized_price_factor NUMERIC;
  competition_adjustment NUMERIC;
  wvs NUMERIC;
BEGIN
  -- Avoid division by zero
  IF days_active <= 0 THEN days_active := 1; END IF;
  IF category_median_price <= 0 THEN category_median_price := 100; END IF;
  IF similar_listings_count < 0 THEN similar_listings_count := 0; END IF;
  
  -- Normalize price (penalize items > 2x median)
  normalized_price_factor := item_price / category_median_price;
  IF normalized_price_factor > 2 THEN
    normalized_price_factor := normalized_price_factor * 1.5; -- Extra penalty
  END IF;
  IF normalized_price_factor < 0.1 THEN normalized_price_factor := 0.1; END IF;
  
  -- Competition adjustment
  competition_adjustment := 1.0 / (1 + similar_listings_count);
  
  -- WVS Formula
  wvs := (watcher_count::NUMERIC / days_active) * (1.0 / normalized_price_factor) * competition_adjustment;
  
  RETURN ROUND(wvs, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get WVS threshold label
CREATE OR REPLACE FUNCTION get_wvs_label(wvs NUMERIC) RETURNS TEXT AS $$
BEGIN
  IF wvs > 5 THEN RETURN 'High Demand';
  ELSIF wvs > 2 THEN RETURN 'Solid Demand';
  ELSIF wvs > 1 THEN RETURN 'Moderate Demand';
  ELSE RETURN 'Low Demand';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- DONE! Migration complete.
-- =====================================================
