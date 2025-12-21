-- ArtIntel AI Pipeline Tables
-- Tables for topic clustering, Nolan scoring, keyword analysis, and opportunity feed

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- SCRAPE RUNS TABLE (audit trail)
-- ========================================
CREATE TABLE IF NOT EXISTS scrape_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Run metadata
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running', -- running, success, failed, partial
  
  -- Stats
  keywords_attempted INTEGER DEFAULT 0,
  pages_attempted INTEGER DEFAULT 0,
  records_inserted_raw INTEGER DEFAULT 0,
  records_inserted_clean INTEGER DEFAULT 0,
  records_scored INTEGER DEFAULT 0,
  
  -- Error tracking
  error_summary TEXT,
  
  -- Runner info
  runner TEXT DEFAULT 'manual', -- manual, vercel_cron
  app_version TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scrape_runs_status ON scrape_runs(status);
CREATE INDEX idx_scrape_runs_started ON scrape_runs(started_at DESC);

-- ========================================
-- SOLD LISTINGS RAW TABLE (never altered)
-- ========================================
CREATE TABLE IF NOT EXISTS sold_listings_raw (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  
  -- Search context
  search_keyword TEXT NOT NULL,
  
  -- Raw scraped data
  item_url TEXT UNIQUE NOT NULL,
  title_raw TEXT NOT NULL,
  price_raw TEXT,
  shipping_raw TEXT,
  bids_raw TEXT,
  listing_type_hint TEXT,
  sold_date_raw TEXT,
  
  -- Source
  source TEXT DEFAULT 'ebay_sold_search',
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Full payload
  raw_payload_json JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_sold_listings_raw_url ON sold_listings_raw(item_url);
CREATE INDEX idx_sold_listings_raw_run ON sold_listings_raw(run_id);
CREATE INDEX idx_sold_listings_raw_keyword ON sold_listings_raw(search_keyword);

-- ========================================
-- SOLD LISTINGS CLEAN TABLE (normalized)
-- ========================================
CREATE TABLE IF NOT EXISTS sold_listings_clean (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_id UUID REFERENCES sold_listings_raw(id) ON DELETE CASCADE,
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Normalized data
  search_keyword TEXT NOT NULL,
  item_url TEXT NOT NULL,
  title TEXT NOT NULL,
  
  -- Pricing
  currency TEXT DEFAULT 'USD',
  sold_price NUMERIC(10, 2),
  shipping_price NUMERIC(10, 2) DEFAULT 0,
  
  -- Listing type
  is_auction BOOLEAN DEFAULT false,
  bid_count INTEGER DEFAULT 0,
  
  -- Date
  sold_date DATE,
  
  -- Deduplication
  dedupe_hash TEXT,
  
  -- Timestamps
  normalized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sold_listings_clean_user ON sold_listings_clean(user_id);
CREATE INDEX idx_sold_listings_clean_run ON sold_listings_clean(run_id);
CREATE INDEX idx_sold_listings_clean_date ON sold_listings_clean(sold_date DESC);
CREATE INDEX idx_sold_listings_clean_keyword ON sold_listings_clean(search_keyword);
CREATE INDEX idx_sold_listings_clean_auction ON sold_listings_clean(is_auction);

-- ========================================
-- TOPIC CLUSTERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS topic_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  
  -- Topic info
  topic_slug TEXT UNIQUE NOT NULL,
  topic_label TEXT NOT NULL,
  topic_description TEXT,
  
  -- Embedding for similarity search
  embedding vector(1536), -- OpenAI ada-002 embedding size
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_topic_clusters_slug ON topic_clusters(topic_slug);
CREATE INDEX idx_topic_clusters_run ON topic_clusters(run_id);

-- ========================================
-- TOPIC MEMBERSHIPS TABLE (many-to-many)
-- ========================================
CREATE TABLE IF NOT EXISTS topic_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topic_clusters(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES sold_listings_clean(id) ON DELETE CASCADE,
  
  -- Membership score
  membership_score NUMERIC(3, 2), -- 0.00 to 1.00
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_topic_memberships_topic ON topic_memberships(topic_id);
CREATE INDEX idx_topic_memberships_listing ON topic_memberships(listing_id);
CREATE INDEX idx_topic_memberships_run ON topic_memberships(run_id);

-- ========================================
-- TOPIC SCORES DAILY TABLE (Nolan Score)
-- ========================================
CREATE TABLE IF NOT EXISTS topic_scores_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  topic_id UUID REFERENCES topic_clusters(id) ON DELETE CASCADE,
  
  -- Nolan Score components
  nolan_score NUMERIC(5, 2), -- 0.00 to 100.00
  velocity_score NUMERIC(5, 2),
  recency_sales_7d INTEGER DEFAULT 0,
  sales_30d INTEGER DEFAULT 0,
  auction_intensity NUMERIC(5, 2),
  
  -- Price metrics
  median_price NUMERIC(10, 2),
  upper_quartile_price NUMERIC(10, 2),
  
  -- Supply/demand
  demand_supply_ratio NUMERIC(5, 2),
  
  -- Confidence
  confidence NUMERIC(3, 2), -- 0.00 to 1.00
  
  -- Timestamps
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_topic_scores_date ON topic_scores_daily(date DESC);
CREATE INDEX idx_topic_scores_nolan ON topic_scores_daily(nolan_score DESC);
CREATE INDEX idx_topic_scores_topic ON topic_scores_daily(topic_id);
CREATE INDEX idx_topic_scores_run ON topic_scores_daily(run_id);

-- ========================================
-- KEYWORD METRICS DAILY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS keyword_metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Keyword
  keyword TEXT NOT NULL,
  
  -- Occurrence metrics
  occurrences_7d INTEGER DEFAULT 0,
  occurrences_30d INTEGER DEFAULT 0,
  trend_delta NUMERIC(5, 2), -- ratio of 7d vs 30d velocity
  
  -- Price impact
  price_lift NUMERIC(10, 2), -- price difference when keyword is present
  
  -- Topic association
  topic_association UUID REFERENCES topic_clusters(id) ON DELETE SET NULL,
  
  -- Confidence
  confidence NUMERIC(3, 2),
  
  -- Timestamps
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_keyword_metrics_date ON keyword_metrics_daily(date DESC);
CREATE INDEX idx_keyword_metrics_keyword ON keyword_metrics_daily(keyword);
CREATE INDEX idx_keyword_metrics_trend ON keyword_metrics_daily(trend_delta DESC);
CREATE INDEX idx_keyword_metrics_run ON keyword_metrics_daily(run_id);

-- ========================================
-- OPPORTUNITY FEED TABLE (what users see)
-- ========================================
CREATE TABLE IF NOT EXISTS opportunity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  rank INTEGER NOT NULL,
  
  -- Topic reference
  topic_id UUID REFERENCES topic_clusters(id) ON DELETE CASCADE,
  topic_label TEXT NOT NULL,
  
  -- Scores
  nolan_score NUMERIC(5, 2),
  velocity_score NUMERIC(5, 2),
  
  -- Recommendations
  recommended_sizes TEXT[],
  recommended_mediums TEXT[],
  recommended_price_band JSONB, -- {min: 100, max: 500, median: 300}
  format_recommendation TEXT, -- auction, bin, hybrid
  
  -- Keywords and titles
  keyword_stack TEXT[],
  title_variants TEXT[],
  
  -- Evidence
  evidence_urls TEXT[], -- must have >= 5
  
  -- Notes
  notes TEXT,
  
  -- Confidence
  confidence NUMERIC(3, 2),
  
  -- Timestamps
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(user_id, date, rank)
);

-- Indexes
CREATE INDEX idx_opportunity_feed_user ON opportunity_feed(user_id);
CREATE INDEX idx_opportunity_feed_date ON opportunity_feed(date DESC);
CREATE INDEX idx_opportunity_feed_rank ON opportunity_feed(rank);
CREATE INDEX idx_opportunity_feed_nolan ON opportunity_feed(nolan_score DESC);

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sold_listings_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE sold_listings_clean ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_scores_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_feed ENABLE ROW LEVEL SECURITY;

-- Scrape runs - service role only
CREATE POLICY "Service role can manage scrape runs"
  ON scrape_runs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view scrape runs"
  ON scrape_runs FOR SELECT
  USING (true); -- All authenticated users can see run status

-- Raw listings - service role only
CREATE POLICY "Service role can manage raw listings"
  ON sold_listings_raw FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Clean listings - users see their own
CREATE POLICY "Users can view their own clean listings"
  ON sold_listings_clean FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage clean listings"
  ON sold_listings_clean FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Topic clusters - all users can read
CREATE POLICY "Users can view topic clusters"
  ON topic_clusters FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage topic clusters"
  ON topic_clusters FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Topic memberships - all users can read
CREATE POLICY "Users can view topic memberships"
  ON topic_memberships FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage topic memberships"
  ON topic_memberships FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Topic scores - all users can read
CREATE POLICY "Users can view topic scores"
  ON topic_scores_daily FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage topic scores"
  ON topic_scores_daily FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Keyword metrics - all users can read
CREATE POLICY "Users can view keyword metrics"
  ON keyword_metrics_daily FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage keyword metrics"
  ON keyword_metrics_daily FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Opportunity feed - users see their own
CREATE POLICY "Users can view their own opportunities"
  ON opportunity_feed FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage opportunities"
  ON opportunity_feed FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
