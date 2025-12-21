-- =====================================================
-- 007_global_intelligence.sql
-- Global aggregated art market data and history
-- =====================================================

-- 1. GLOBAL MARKET BENCHMARKS
-- Current "Market Truth" for styles and sizes across all accounts
CREATE TABLE IF NOT EXISTS global_market_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- 'style', 'size', 'medium'
    term TEXT NOT NULL,
    
    -- Aggregated Metrics
    avg_sold_price NUMERIC(10, 2) DEFAULT 0,
    median_sold_price NUMERIC(10, 2) DEFAULT 0,
    avg_wvs NUMERIC(8, 4) DEFAULT 0,
    demand_score NUMERIC(5, 2) DEFAULT 0,
    listing_count INTEGER DEFAULT 0,
    
    -- Snapshot Metadata
    month_year TEXT NOT NULL, -- e.g., '2023-12'
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(category, term, month_year)
);

-- 2. GLOBAL MARKET HISTORY
-- Snapshots of the benchmarks for trend analysis
CREATE TABLE IF NOT EXISTS global_market_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    term TEXT NOT NULL,
    month_year TEXT NOT NULL,
    
    avg_sold_price NUMERIC(10, 2),
    avg_wvs NUMERIC(8, 4),
    listing_count INTEGER,
    
    growth_rate_wvs NUMERIC(5, 2), -- Month over month change
    growth_rate_price NUMERIC(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS POLICIES
-- Benchmarks and history are viewable by all users
ALTER TABLE global_market_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_market_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global benchmarks are viewable by all" 
ON global_market_benchmarks FOR SELECT 
USING (true);

CREATE POLICY "Global history is viewable by all" 
ON global_market_history FOR SELECT 
USING (true);

-- 4. REFRESH FUNCTION (ADMIN USE)
-- This function aggregates data from across all user accounts
-- to populate the global benchmarks for the current month.
CREATE OR REPLACE FUNCTION refresh_global_benchmarks()
RETURNS void AS $$
DECLARE
    current_month TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
BEGIN
    -- Style Aggregation
    INSERT INTO global_market_benchmarks (category, term, avg_sold_price, median_sold_price, listing_count, month_year, last_updated_at)
    SELECT 
        'style' as category,
        style as term,
        AVG(sold_price) as avg_sold_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sold_price) as median_sold_price,
        COUNT(*) as listing_count,
        current_month,
        NOW()
    FROM sold_listings_clean
    WHERE style IS NOT NULL
    GROUP BY style
    ON CONFLICT (category, term, month_year) 
    DO UPDATE SET 
        avg_sold_price = EXCLUDED.avg_sold_price,
        median_sold_price = EXCLUDED.median_sold_price,
        listing_count = EXCLUDED.listing_count,
        last_updated_at = NOW();

    -- Size Aggregation
    INSERT INTO global_market_benchmarks (category, term, avg_sold_price, median_sold_price, listing_count, month_year, last_updated_at)
    SELECT 
        'size' as category,
        ps.size_bucket as term,
        AVG(slc.sold_price) as avg_sold_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY slc.sold_price) as median_sold_price,
        COUNT(*) as listing_count,
        current_month,
        NOW()
    FROM sold_listings_clean slc
    JOIN parsed_signals ps ON slc.id = ps.listing_id
    WHERE ps.size_bucket IS NOT NULL
    GROUP BY ps.size_bucket
    ON CONFLICT (category, term, month_year) 
    DO UPDATE SET 
        avg_sold_price = EXCLUDED.avg_sold_price,
        median_sold_price = EXCLUDED.median_sold_price,
        listing_count = EXCLUDED.listing_count,
        last_updated_at = NOW();

    -- Snapshot to History
    INSERT INTO global_market_history (category, term, month_year, avg_sold_price, listing_count)
    SELECT category, term, month_year, avg_sold_price, listing_count
    FROM global_market_benchmarks
    WHERE month_year = current_month
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. INDEXES
CREATE INDEX idx_global_benchmarks_cat ON global_market_benchmarks(category);
CREATE INDEX idx_global_benchmarks_term ON global_market_benchmarks(term);
CREATE INDEX idx_global_history_month ON global_market_history(month_year);
