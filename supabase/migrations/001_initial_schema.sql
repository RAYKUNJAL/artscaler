-- ArtIntel Database Schema
-- Tables for eBay sold listings, AI-parsed signals, and pricing analysis

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- EBAY SOLD LISTINGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS ebay_sold_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Listing details
  title TEXT NOT NULL,
  sold_price NUMERIC(10, 2),
  shipping_price NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  
  -- Listing type
  is_auction BOOLEAN DEFAULT false,
  bid_count INTEGER DEFAULT 0,
  
  -- Metadata
  sold_date DATE,
  item_url TEXT,
  search_keyword TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sold_listings_user ON ebay_sold_listings(user_id);
CREATE INDEX idx_sold_listings_date ON ebay_sold_listings(sold_date DESC);
CREATE INDEX idx_sold_listings_keyword ON ebay_sold_listings(search_keyword);
CREATE INDEX idx_sold_listings_price ON ebay_sold_listings(sold_price);

-- ========================================
-- PARSED SIGNALS TABLE (AI-extracted attributes)
-- ========================================
CREATE TABLE IF NOT EXISTS parsed_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES ebay_sold_listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dimensions
  width_in NUMERIC(6, 2),
  height_in NUMERIC(6, 2),
  
  -- Attributes
  medium TEXT, -- acrylic, oil, watercolor, etc.
  subject TEXT, -- abstract, portrait, landscape, etc.
  style TEXT, -- contemporary, traditional, modern, etc.
  
  -- AI confidence
  confidence_score NUMERIC(3, 2), -- 0.00 to 1.00
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_parsed_signals_listing ON parsed_signals(listing_id);
CREATE INDEX idx_parsed_signals_subject ON parsed_signals(subject);
CREATE INDEX idx_parsed_signals_medium ON parsed_signals(medium);
CREATE INDEX idx_parsed_signals_confidence ON parsed_signals(confidence_score);

-- ========================================
-- PRICING ANALYSIS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS pricing_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Size categorization
  size_bucket TEXT NOT NULL, -- small, medium, large, extra-large
  
  -- Price statistics
  median_price NUMERIC(10, 2),
  upper_quartile_price NUMERIC(10, 2),
  lower_quartile_price NUMERIC(10, 2),
  
  -- Performance metrics
  sell_through_rate NUMERIC(5, 2), -- percentage
  avg_days_to_sell NUMERIC(6, 2),
  
  -- Recommendations
  recommended_price NUMERIC(10, 2),
  recommended_auction_start NUMERIC(10, 2),
  
  -- Metadata
  sample_size INTEGER,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pricing_analysis_user ON pricing_analysis(user_id);
CREATE INDEX idx_pricing_analysis_size ON pricing_analysis(size_bucket);

-- ========================================
-- SCRAPE JOBS TABLE (track scraping history)
-- ========================================
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job details
  keyword TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  
  -- Results
  pages_scraped INTEGER DEFAULT 0,
  items_found INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scrape_jobs_user ON scrape_jobs(user_id);
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

-- ========================================
-- USER KEYWORDS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Keyword details
  keyword TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  total_scrapes INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(user_id, keyword)
);

-- Indexes
CREATE INDEX idx_user_keywords_user ON user_keywords(user_id);
CREATE INDEX idx_user_keywords_active ON user_keywords(is_active);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE ebay_sold_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keywords ENABLE ROW LEVEL SECURITY;

-- Policies for ebay_sold_listings
CREATE POLICY "Users can view their own listings"
  ON ebay_sold_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listings"
  ON ebay_sold_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON ebay_sold_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
  ON ebay_sold_listings FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for parsed_signals
CREATE POLICY "Users can view their own signals"
  ON parsed_signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own signals"
  ON parsed_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for pricing_analysis
CREATE POLICY "Users can view their own pricing"
  ON pricing_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pricing"
  ON pricing_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pricing"
  ON pricing_analysis FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for scrape_jobs
CREATE POLICY "Users can view their own jobs"
  ON scrape_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
  ON scrape_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON scrape_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for user_keywords
CREATE POLICY "Users can view their own keywords"
  ON user_keywords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keywords"
  ON user_keywords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keywords"
  ON user_keywords FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords"
  ON user_keywords FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to calculate sell-through velocity
CREATE OR REPLACE FUNCTION calculate_sell_through_velocity(days INTEGER DEFAULT 7)
RETURNS NUMERIC AS $$
DECLARE
  total_count INTEGER;
  sold_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM ebay_sold_listings
  WHERE sold_date >= CURRENT_DATE - days
    AND user_id = auth.uid();
  
  SELECT COUNT(*) INTO sold_count
  FROM ebay_sold_listings
  WHERE sold_date >= CURRENT_DATE - days
    AND sold_price IS NOT NULL
    AND user_id = auth.uid();
  
  IF total_count = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((sold_count::NUMERIC / total_count::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top subjects
CREATE OR REPLACE FUNCTION get_top_subjects(days INTEGER DEFAULT 7, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(subject TEXT, count BIGINT, avg_price NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.subject,
    COUNT(*) as count,
    ROUND(AVG(esl.sold_price), 2) as avg_price
  FROM parsed_signals ps
  JOIN ebay_sold_listings esl ON ps.listing_id = esl.id
  WHERE esl.sold_date >= CURRENT_DATE - days
    AND esl.user_id = auth.uid()
    AND ps.subject IS NOT NULL
  GROUP BY ps.subject
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to categorize size
CREATE OR REPLACE FUNCTION categorize_size(width NUMERIC, height NUMERIC)
RETURNS TEXT AS $$
DECLARE
  area NUMERIC;
BEGIN
  area := width * height;
  
  IF area < 200 THEN
    RETURN 'small';
  ELSIF area < 600 THEN
    RETURN 'medium';
  ELSIF area < 1200 THEN
    RETURN 'large';
  ELSE
    RETURN 'extra-large';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
