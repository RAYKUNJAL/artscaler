-- ArtDemand Intelligence - Demand Metrics & Seller Analytics
-- Extension to support the v1.0.0 Specification

-- ========================================
-- SELLER TRUST PROFILES
-- ========================================
CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_name TEXT UNIQUE NOT NULL,
  store_url TEXT,
  feedback_score INTEGER,
  feedback_percentage NUMERIC(5, 2),
  total_sales INTEGER,
  return_policy TEXT,
  has_coa BOOLEAN DEFAULT false,
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ACTIVE LISTINGS TRACKING (DEMAND)
-- ========================================
CREATE TABLE IF NOT EXISTS active_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES seller_profiles(id) ON DELETE SET NULL,
  
  -- Item Details
  listing_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  item_url TEXT NOT NULL,
  category TEXT,
  listing_type TEXT, -- Auction, FixedPrice
  
  -- Price Points
  current_price NUMERIC(10, 2),
  starting_price NUMERIC(10, 2),
  buy_it_now_price NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  
  -- Demand Metrics (The "Pulse")
  watcher_count INTEGER DEFAULT 0,
  bid_count INTEGER DEFAULT 0,
  time_since_listed_hours NUMERIC(10, 2),
  time_remaining_hours NUMERIC(10, 2),
  
  -- Physical Specs (Parsed)
  width_in NUMERIC(6, 2),
  height_in NUMERIC(6, 2),
  orientation TEXT,
  material TEXT,
  canvas_type TEXT, -- Stretched, Panel, etc.
  
  -- AI Demand Score
  demand_score NUMERIC(5, 2),
  watcher_velocity NUMERIC(10, 4), -- watchers / hour
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_at TIMESTAMP WITH TIME ZONE,
  conversion_velocity_hours NUMERIC(10, 2),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ART PATTERN ANALYTICS
-- ========================================
CREATE TABLE IF NOT EXISTS art_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES active_listings(id) ON DELETE CASCADE,
  
  -- Visual Attributes
  subject_type TEXT,
  theme TEXT,
  style TEXT,
  dominant_colors TEXT[],
  secondary_colors TEXT[],
  background_style TEXT,
  composition_type TEXT,
  brushwork_style TEXT,
  visual_complexity_score INTEGER, -- 1-10
  
  -- Metadata
  mixed_media BOOLEAN DEFAULT false,
  signature_visible BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PRODUCTION RECOMMENDATIONS
-- ========================================
CREATE TABLE IF NOT EXISTS production_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Recommendations
  subject TEXT,
  size_recommended TEXT,
  color_palette_hex TEXT[],
  suggested_starting_price NUMERIC(10, 2),
  est_sale_velocity NUMERIC(5, 2),
  
  -- Planning
  weekly_target INTEGER,
  confidence_score NUMERIC(3, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PRICE HISTORY (VOLATILITY TRACKING)
-- ========================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES active_listings(id) ON DELETE CASCADE,
  price NUMERIC(10, 2),
  watcher_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- RLS POLICIES
-- ========================================
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE art_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Public Profiles (Shared)
CREATE POLICY "Public profiles are viewable by all" ON seller_profiles FOR SELECT USING (true);

-- User Specific Data
CREATE POLICY "Users can manage their tracked listings" ON active_listings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view patterns of tracked listings" ON art_patterns FOR SELECT 
  USING (EXISTS (SELECT 1 FROM active_listings WHERE id = art_patterns.listing_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their recommendations" ON production_recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their price history" ON price_history FOR ALL 
  USING (EXISTS (SELECT 1 FROM active_listings WHERE id = price_history.listing_id AND user_id = auth.uid()));

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to calculate demand score based on spec formula
CREATE OR REPLACE FUNCTION calculate_active_demand_score(
  velocity NUMERIC, 
  engagement NUMERIC, 
  complexity INTEGER
) RETURNS NUMERIC AS $$
BEGIN
  -- Formula: (Velocity * 0.4) + (Engagement * 0.4) + (Complexity * 0.2)
  -- Assumes normalized inputs 0-100
  RETURN (velocity * 0.4) + (engagement * 0.4) + (complexity * 2); -- complexity is 1-10
END;
$$ LANGUAGE plpgsql IMMUTABLE;
