-- RLS Policy Fixes for ArtDemand Intelligence

-- Seller Profiles: Allow authenticated users to upsert
CREATE POLICY "Allow authenticated users to insert seller profiles" 
ON seller_profiles FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update seller profiles" 
ON seller_profiles FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Art Patterns: Allow users to insert patterns for their own listings
CREATE POLICY "Users can insert patterns for their own listings" 
ON art_patterns FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM active_listings 
    WHERE id = art_patterns.listing_id AND user_id = auth.uid()
  )
);

-- Price History: Allow users to insert history for their own listings
CREATE POLICY "Users can insert price history for their own listings" 
ON price_history FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM active_listings 
    WHERE id = price_history.listing_id AND user_id = auth.uid()
  )
);

-- Ensure art_patterns is 1:1 with active_listings
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'art_patterns_listing_id_key') THEN
    ALTER TABLE art_patterns ADD CONSTRAINT art_patterns_listing_id_key UNIQUE (listing_id);
  END IF;
END $$;
