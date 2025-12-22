-- Market Snapshots for Historical Tracking
CREATE TABLE IF NOT EXISTS market_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    global_pulse NUMERIC(5, 2), -- 0-100
    avg_wvs NUMERIC(5, 2),
    active_listings_count INTEGER,
    sold_listings_30d INTEGER,
    sell_through_rate NUMERIC(5, 2),
    total_market_value NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(snapshot_date)
);

-- User Dashboard Cache
CREATE TABLE IF NOT EXISTS user_dashboard_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    stats_json JSONB,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market snapshots" ON market_snapshots FOR SELECT USING (true);
CREATE POLICY "Users view own dashboard cache" ON user_dashboard_cache FOR SELECT USING (auth.uid() = user_id);

-- Create styles and sizes helper views/tables if they don't exist
-- Based on the dashboard page queries
CREATE TABLE IF NOT EXISTS styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    style_term TEXT UNIQUE NOT NULL,
    avg_wvs NUMERIC(5, 2) DEFAULT 0,
    listing_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    size_cluster TEXT UNIQUE NOT NULL,
    avg_price NUMERIC(10, 2) DEFAULT 0,
    avg_wvs NUMERIC(5, 2) DEFAULT 0,
    listing_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
