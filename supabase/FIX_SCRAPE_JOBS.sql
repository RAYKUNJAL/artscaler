-- ============================================
-- ArtIntel: Fix Scrape Jobs Table
-- Run this in Supabase SQL Editor
-- ============================================

-- First, check if the table exists and drop it if needed to recreate fresh
DROP TABLE IF EXISTS scrape_jobs CASCADE;

-- Create scrape_jobs table with correct schema
CREATE TABLE scrape_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  pages_scraped INTEGER DEFAULT 0,
  items_found INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_scrape_jobs_user ON scrape_jobs(user_id);
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own jobs" ON scrape_jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON scrape_jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON scrape_jobs;

-- Create RLS policies
CREATE POLICY "Users can view their own jobs"
  ON scrape_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
  ON scrape_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON scrape_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Test the table by inserting a dummy record (will fail if user not logged in, which is expected)
-- You can comment this out if you want
-- INSERT INTO scrape_jobs (user_id, keyword, status) 
-- VALUES (auth.uid(), 'test', 'pending');

-- Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'scrape_jobs'
ORDER BY ordinal_position;
