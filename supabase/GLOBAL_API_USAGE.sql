-- Global API Usage Tracking
-- Used to respect eBay's 5,000 calls/day limit

CREATE TABLE IF NOT EXISTS global_api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL, -- e.g. 'ebay_finding_api'
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    call_count INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 5000,
    last_call_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_name, usage_date)
);

-- Enable RLS
ALTER TABLE global_api_usage ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view
CREATE POLICY "Anyone can view global usage" ON global_api_usage FOR SELECT USING (true);

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_global_api_usage(s_name TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO global_api_usage (service_name, usage_date, call_count)
    VALUES (s_name, CURRENT_DATE, 1)
    ON CONFLICT (service_name, usage_date)
    DO UPDATE SET 
        call_count = global_api_usage.call_count + 1,
        last_call_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
