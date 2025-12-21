-- ============================================
-- ARTIST BRANDING SUITE - Database Schema
-- Add to existing COMPLETE_SETUP.sql
-- ============================================

-- ARTWORK REGISTRY TABLE (for COA tracking)
CREATE TABLE IF NOT EXISTS artwork_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Artwork Details
  title TEXT NOT NULL,
  description TEXT,
  medium TEXT,
  width_inches NUMERIC(6, 2),
  height_inches NUMERIC(6, 2),
  creation_date DATE,
  
  -- Edition Information
  edition_type TEXT DEFAULT 'original', -- 'original', 'limited', 'open', 'print'
  edition_number INTEGER,
  total_editions INTEGER,
  
  -- COA Information
  coa_number TEXT UNIQUE, -- e.g., "ARTIST-2024-001"
  coa_template TEXT DEFAULT 'classic', -- Template style
  coa_generated_at TIMESTAMP,
  qr_code_url TEXT,
  verification_url TEXT,
  
  -- Pricing & Sales
  material_cost NUMERIC(10, 2),
  asking_price NUMERIC(10, 2),
  sold_price NUMERIC(10, 2),
  sold_date DATE,
  ebay_listing_url TEXT,
  buyer_name TEXT,
  buyer_email TEXT,
  
  -- Inventory Status
  status TEXT DEFAULT 'available', -- 'available', 'sold', 'in_progress', 'archived'
  location TEXT, -- Physical storage location
  
  -- Media
  image_url TEXT,
  image_urls TEXT[], -- Multiple images
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_artwork_registry_user ON artwork_registry(user_id);
CREATE INDEX idx_artwork_registry_coa ON artwork_registry(coa_number);
CREATE INDEX idx_artwork_registry_status ON artwork_registry(status);
CREATE UNIQUE INDEX idx_artwork_registry_coa_unique ON artwork_registry(coa_number) WHERE coa_number IS NOT NULL;

-- ARTIST BRANDING TABLE
CREATE TABLE IF NOT EXISTS artist_branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Brand Identity
  artist_name TEXT,
  brand_name TEXT,
  tagline TEXT,
  bio TEXT,
  
  -- Visual Identity
  logo_url TEXT,
  primary_color TEXT, -- Hex color
  secondary_color TEXT,
  accent_color TEXT,
  font_primary TEXT,
  font_secondary TEXT,
  
  -- Contact & Social
  website_url TEXT,
  instagram_handle TEXT,
  facebook_url TEXT,
  pinterest_url TEXT,
  email TEXT,
  phone TEXT,
  
  -- Signature
  signature_image_url TEXT,
  signature_text TEXT,
  
  -- Settings
  coa_template_preference TEXT DEFAULT 'classic',
  card_template_preference TEXT DEFAULT 'minimal',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_artist_branding_user ON artist_branding(user_id);

-- BUYER CRM TABLE
CREATE TABLE IF NOT EXISTS buyer_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contact Info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  
  -- Collector Status
  tier TEXT DEFAULT 'regular', -- 'vip', 'regular', 'one_time'
  total_purchases INTEGER DEFAULT 0,
  total_spent NUMERIC(10, 2) DEFAULT 0,
  first_purchase_date DATE,
  last_purchase_date DATE,
  
  -- Preferences
  favorite_styles TEXT[],
  favorite_mediums TEXT[],
  preferred_sizes TEXT[],
  
  -- Communication
  email_opt_in BOOLEAN DEFAULT true,
  birthday DATE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_buyer_contacts_user ON buyer_contacts(user_id);
CREATE INDEX idx_buyer_contacts_email ON buyer_contacts(email);
CREATE INDEX idx_buyer_contacts_tier ON buyer_contacts(tier);

-- PURCHASE HISTORY TABLE
CREATE TABLE IF NOT EXISTS purchase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyer_contacts(id) ON DELETE CASCADE,
  artwork_id UUID REFERENCES artwork_registry(id) ON DELETE SET NULL,
  
  -- Purchase Details
  purchase_date DATE NOT NULL,
  sale_price NUMERIC(10, 2) NOT NULL,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  platform TEXT DEFAULT 'ebay', -- 'ebay', 'direct', 'gallery', 'other'
  
  -- Fulfillment
  shipped_date DATE,
  tracking_number TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchase_history_user ON purchase_history(user_id);
CREATE INDEX idx_purchase_history_buyer ON purchase_history(buyer_id);
CREATE INDEX idx_purchase_history_date ON purchase_history(purchase_date DESC);

-- Enable RLS
ALTER TABLE artwork_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own artwork registry"
  ON artwork_registry FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own branding"
  ON artist_branding FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own buyer contacts"
  ON buyer_contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own purchase history"
  ON purchase_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to auto-generate COA number
CREATE OR REPLACE FUNCTION generate_coa_number()
RETURNS TRIGGER AS $$
DECLARE
  artist_code TEXT;
  year_code TEXT;
  sequence_num INTEGER;
  new_coa_number TEXT;
BEGIN
  -- Get artist code (first 3 letters of email or 'ART')
  SELECT COALESCE(UPPER(SUBSTRING(email FROM 1 FOR 3)), 'ART')
  INTO artist_code
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Get current year
  year_code := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number for this user/year
  SELECT COALESCE(MAX(CAST(SUBSTRING(coa_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM artwork_registry
  WHERE user_id = NEW.user_id
    AND coa_number LIKE artist_code || '-' || year_code || '-%';
  
  -- Generate COA number: ARTIST-2024-001
  new_coa_number := artist_code || '-' || year_code || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  NEW.coa_number := new_coa_number;
  NEW.verification_url := 'https://ebayartpulse.com/verify/' || new_coa_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate COA number on insert
CREATE TRIGGER trigger_generate_coa_number
  BEFORE INSERT ON artwork_registry
  FOR EACH ROW
  WHEN (NEW.coa_number IS NULL)
  EXECUTE FUNCTION generate_coa_number();

-- ============================================
-- ARTIST BRANDING SUITE SETUP COMPLETE!
-- ============================================
