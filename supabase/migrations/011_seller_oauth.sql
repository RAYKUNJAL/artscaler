
-- ArtScaler Seller OAuth Migration
-- Migration: 011_seller_oauth.sql

CREATE TABLE IF NOT EXISTS seller_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ebay_user_id TEXT UNIQUE,
  ebay_username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'connected', -- 'connected', 'expired', 'disconnected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for lookup
CREATE INDEX idx_seller_accounts_user ON seller_accounts(user_id);

-- RLS
ALTER TABLE seller_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own seller account" 
  ON seller_accounts FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_seller_accounts_updated_at
    BEFORE UPDATE ON seller_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
