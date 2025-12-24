-- Add eBay OAuth and user tracking fields to users table
-- Required for marketplace account deletion notifications

-- Add eBay OAuth token fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS ebay_user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ebay_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ebay_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ebay_token_expires_at TIMESTAMPTZ;

-- Create index for faster lookups during account deletion notifications
CREATE INDEX IF NOT EXISTS idx_users_ebay_user_id ON users(ebay_user_id);

-- Add audit_logs table if it doesn't exist (for compliance tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Add RLS policies for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
    ON audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
    ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Add comment for documentation
COMMENT ON COLUMN users.ebay_user_id IS 'eBay user ID for marketplace account deletion notifications';
COMMENT ON COLUMN users.ebay_access_token IS 'eBay OAuth access token (encrypted)';
COMMENT ON COLUMN users.ebay_refresh_token IS 'eBay OAuth refresh token (encrypted)';
COMMENT ON COLUMN users.ebay_token_expires_at IS 'eBay OAuth token expiration timestamp';
COMMENT ON TABLE audit_logs IS 'Audit log for compliance tracking (GDPR/CCPA)';
