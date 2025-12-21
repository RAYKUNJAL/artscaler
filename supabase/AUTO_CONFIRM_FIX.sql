-- AUTO-CONFIRM USERS SQL FIX
-- Run this in Supabase SQL Editor to bypass email confirmation

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically confirm the user's email
  UPDATE auth.users 
  SET email_confirmed_at = NOW(), 
      confirmed_at = NOW(),
      last_sign_in_at = NOW()
  WHERE id = NEW.id;

  -- Create profile
  INSERT INTO user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Create initial usage tracking record
  INSERT INTO user_usage_tracking (
    user_id,
    period_start,
    period_end,
    scrapes_limit,
    keywords_limit,
    api_calls_limit
  ) VALUES (
    NEW.id,
    DATE_TRUNC('month', NOW()),
    DATE_TRUNC('month', NOW() + INTERVAL '1 month') - INTERVAL '1 day',
    100, -- free tier limits
    5,
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger just in case
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
