-- Create blog_posts table for SEO and Market Insights
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL, -- Markdown content
    featured_image_url TEXT,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT DEFAULT 'ArtIntel AI',
    keywords TEXT[],
    meta_description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    wvs_topic_id UUID REFERENCES topic_clusters(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Index for published status and date
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at) WHERE is_published = TRUE;

-- Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for published posts
CREATE POLICY "Public read for published blog posts"
ON blog_posts FOR SELECT
TO public
USING (is_published = TRUE);

-- Policy: Admin can manage all posts (using service role or specific admin check)
-- For now, allow authenticated users with a specific email or role if defined,
-- but typically we'd use a service role for the AI agent.
CREATE POLICY "Admins can manage blog posts"
ON blog_posts FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'admin@artintel.ai'); -- Placeholder for admin check

-- Function to handle indexing/pinging (Schema for future use)
-- This could trigger a webhook to a sitemap generator or indexing service
