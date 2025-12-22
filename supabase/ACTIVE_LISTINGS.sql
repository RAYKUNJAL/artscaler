-- Active Listings Table
-- For monitoring currently live eBay listings

CREATE TABLE IF NOT EXISTS active_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price NUMERIC(10, 2),
    shipping_price NUMERIC(10, 2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    is_auction BOOLEAN DEFAULT false,
    bid_count INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    item_url TEXT UNIQUE,
    image_url TEXT,
    search_keyword TEXT,
    location TEXT,
    condition TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE active_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own active listings" ON active_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own active listings" ON active_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own active listings" ON active_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own active listings" ON active_listings FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_active_listings_user ON active_listings(user_id);
CREATE INDEX idx_active_listings_keyword ON active_listings(search_keyword);
