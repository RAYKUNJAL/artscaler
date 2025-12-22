-- =====================================================
-- ArtPulse Pulse V2: The Final WVS Protocol
-- =====================================================
-- Renames all legacy Nolan Score columns to WVS Score 
-- to ensure platform-wide consistency.

-- 1. Update topic_scores_daily
DO $$ 
BEGIN 
  -- Check if nolan_score exists and wvs_score does not
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='topic_scores_daily' AND column_name='nolan_score') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='topic_scores_daily' AND column_name='wvs_score') THEN
    ALTER TABLE topic_scores_daily RENAME COLUMN nolan_score TO wvs_score;
  END IF;

  -- Ensure wvs_score exists if not already present from COMPLETE_SETUP
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='topic_scores_daily' AND column_name='wvs_score') THEN
    ALTER TABLE topic_scores_daily ADD COLUMN wvs_score numeric(5,2);
  END IF;

  -- Drop nolan_score if it exists as a duplicate
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='topic_scores_daily' AND column_name='nolan_score') THEN
    ALTER TABLE topic_scores_daily DROP COLUMN nolan_score;
  END IF;
END $$;

-- 2. Update opportunity_feed
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunity_feed' AND column_name='nolan_score') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunity_feed' AND column_name='wvs_score') THEN
    ALTER TABLE opportunity_feed RENAME COLUMN nolan_score TO wvs_score;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunity_feed' AND column_name='wvs_score') THEN
    ALTER TABLE opportunity_feed ADD COLUMN wvs_score numeric(5,2);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='opportunity_feed' AND column_name='nolan_score') THEN
    ALTER TABLE opportunity_feed DROP COLUMN nolan_score;
  END IF;
END $$;

-- 4. Standardize Indexes
DO $$
BEGIN
  -- topic_scores_daily
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_topic_scores_nolan') THEN
    ALTER INDEX idx_topic_scores_nolan RENAME TO idx_topic_scores_wvs;
  END IF;

  -- opportunity_feed
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_opportunity_feed_nolan') THEN
    ALTER INDEX idx_opportunity_feed_nolan RENAME TO idx_opportunity_feed_wvs;
  END IF;
END $$;

-- 3. Update user_saved_opportunities
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_saved_opportunities' AND column_name='nolan_score') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_saved_opportunities' AND column_name='wvs_score') THEN
    ALTER TABLE user_saved_opportunities RENAME COLUMN nolan_score TO wvs_score;
  END IF;
END $$;
