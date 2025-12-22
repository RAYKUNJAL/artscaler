-- =====================================================
-- Visual Intelligence & Gallery Feature Migration
-- =====================================================

-- 1. Ensure ebay_sold_listings has image support and visual metadata
DO $$
BEGIN
  -- Add image_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ebay_sold_listings' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE ebay_sold_listings ADD COLUMN image_url TEXT;
  END IF;

  -- Add visual_metadata (dominant colors, focal point, composition, style tags)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ebay_sold_listings' AND column_name = 'visual_metadata'
  ) THEN
    ALTER TABLE ebay_sold_listings ADD COLUMN visual_metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add watcher_count and bid_count if missing (sometimes only in sold_listings_clean)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ebay_sold_listings' AND column_name = 'watcher_count'
  ) THEN
    ALTER TABLE ebay_sold_listings ADD COLUMN watcher_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 2. Inspiration Boards (Pinterest-style)
CREATE TABLE IF NOT EXISTS inspiration_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Saved Inspiration Junction
CREATE TABLE IF NOT EXISTS saved_inspiration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES inspiration_boards(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES ebay_sold_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, listing_id)
);

-- 4. Visual Trends (Historical snapshots)
CREATE TABLE IF NOT EXISTS visual_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  style_slug TEXT NOT NULL,
  dominant_colors JSONB, -- Array of hex codes
  thumbnail_urls TEXT[], -- Example images for this trend
  wvs_score NUMERIC(5,2),
  trend_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Policies
ALTER TABLE inspiration_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_inspiration ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own boards" ON inspiration_boards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage their own saved inspiration" ON saved_inspiration
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Visual trends are viewable by all" ON visual_trends
  FOR SELECT USING (true);

-- 6. Indexes
CREATE INDEX idx_ebay_sold_listings_visual ON ebay_sold_listings USING gin (visual_metadata);
CREATE INDEX idx_inspiration_boards_user ON inspiration_boards(user_id);
CREATE INDEX idx_saved_inspiration_board ON saved_inspiration(board_id);
CREATE INDEX idx_visual_trends_date ON visual_trends(trend_date DESC);
CREATE INDEX idx_visual_trends_style ON visual_trends(style_slug);
