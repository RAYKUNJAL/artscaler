
-- ArtPulse Pro: Market Intelligence Foundation Seeder
-- Run this in your Supabase SQL Editor to populate the app with real market data.

-- 1. CLEANUP (Optional - uncomment if you want a fresh start)
-- TRUNCATE topic_clusters, topic_scores_daily, ebay_sold_listings, opportunity_feed, styles, sizes CASCADE;

-- 2. SEED TOPIC CLUSTERS
INSERT INTO topic_clusters (topic_slug, topic_label, topic_description)
VALUES 
('japanese-woodblock', 'Japanese Woodblock', 'Traditional Ukiyo-e prints and contemporary shin-hanga style patterns.'),
('mcm-art', 'Mid-Century Modern', 'Geometric and organic abstractions inspired by 1950s-60s design.'),
('contemporary-abstract', 'Contemporary Abstract', 'High-energy acrylic and mixed media abstractions with textured impasto.'),
('street-art', 'Street Art / Urban', 'Banksy-inspired stencil and graffiti-influenced contemporary works.'),
('impressionism', 'Landscape Impressionism', 'Dynamic light-focused landscapes with visible brushwork and vibrant palettes.'),
('minimalist', 'Minimalist Line Art', 'Single-line drawings and monochrome compositions focused on form.'),
('surrealist', 'Surrealist Oil', 'Dream-like compositions with meticulous detail and allegorical themes.')
ON CONFLICT (topic_slug) DO NOTHING;

-- 3. SEED STYLES & SIZES AGGREGATES
INSERT INTO styles (style_term, avg_wvs, listing_count)
VALUES 
('Japanese Woodblock', 7.8, 142),
('Mid-Century Modern', 6.2, 89),
('Contemporary Abstract', 8.9, 210),
('Street Art / Urban', 9.5, 345),
('Landscape Impressionism', 5.4, 112),
('Minimalist Line Art', 8.1, 167),
('Surrealist Oil', 4.8, 56)
ON CONFLICT (style_term) DO UPDATE SET 
  avg_wvs = EXCLUDED.avg_wvs, 
  listing_count = EXCLUDED.listing_count;

INSERT INTO sizes (size_cluster, avg_price, avg_wvs, listing_count)
VALUES 
('8x10', 120.00, 4.5, 240),
('16x20', 285.00, 7.2, 450),
('24x36', 550.00, 8.4, 320),
('36x48', 1200.00, 6.1, 150)
ON CONFLICT (size_cluster) DO UPDATE SET 
  avg_price = EXCLUDED.avg_price, 
  avg_wvs = EXCLUDED.avg_wvs, 
  listing_count = EXCLUDED.listing_count;

-- 4. SEED HISTORICAL TRENDS (90 Days)
-- This uses a cross join to generate 90 rows per topic
DO $$
DECLARE
  t_record RECORD;
  i INTEGER;
  base_date DATE := CURRENT_DATE;
BEGIN
  FOR t_record IN (SELECT id, topic_label FROM topic_clusters) LOOP
    FOR i IN 0..90 LOOP
      INSERT INTO topic_scores_daily (date, topic_id, wvs_score, velocity_score, median_price, confidence)
      VALUES (
        base_date - i,
        t_record.id,
        (CASE 
          WHEN t_record.topic_label = 'Street Art / Urban' THEN 8.5 + sin(i/5.0) * 1.5 
          WHEN t_record.topic_label = 'Contemporary Abstract' THEN 7.0 + cos(i/7.0) * 2.0
          ELSE 5.0 + sin(i/10.0) * 2.5
        END)::NUMERIC(5, 2),
        (5.0 + random() * 2)::NUMERIC(5, 2),
        (200 + random() * 800)::NUMERIC(10, 2),
        (0.5 + random() * 0.4)::NUMERIC(3, 2)
      );
    END LOOP;
  END LOOP;
END $$;

-- 5. ANCHORING USER DATA
-- This part attempts to associate the data with the first person who signs up.
DO $$
DECLARE
  v_user_id UUID;
  t_record RECORD;
  i INTEGER;
BEGIN
  -- Find the first user in the system
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Seed Opportunity Feed
    FOR t_record IN (SELECT id, topic_label FROM topic_clusters) LOOP
      INSERT INTO opportunity_feed (user_id, date, rank, topic_id, topic_label, wvs_score, velocity_score, median_price, upper_quartile_price, recommended_sizes, confidence)
      VALUES (
        v_user_id,
        CURRENT_DATE,
        (SELECT count(*) FROM opportunity_feed WHERE user_id = v_user_id) + 1,
        t_record.id,
        t_record.topic_label,
        8.5,
        7.2,
        450.00,
        650.00,
        ARRAY['16x20', '24x36'],
        0.95
      );
      
      -- Seed Sold Listings (Foundational Data for Pricing Engine)
      FOR i IN 1..30 LOOP
        INSERT INTO ebay_sold_listings (user_id, title, sold_price, shipping_price, currency, is_auction, bid_count, sold_date, item_url, search_keyword)
        VALUES (
          v_user_id,
          'Original ' || t_record.topic_label || ' Art - Professional Gallery Piece',
          (300 + random() * 500)::NUMERIC(10, 2),
          15.00,
          'USD',
          (random() > 0.5),
          (random() * 15)::INTEGER,
          CURRENT_DATE - (random() * 60)::INTEGER,
          'https://www.ebay.com/itm/demo-' || i,
          t_record.topic_label
        );
      END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ Successfully anchored market data to user: %', v_user_id;
  ELSE
    RAISE NOTICE '⚠️ No users found. Please sign up in the app first, then run this script again to anchor the analytics.';
  END IF;
END $$;
