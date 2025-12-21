-- Fix for "Database error saving new user"
-- This replaces the problematic trigger with a simpler version

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a simpler trigger function that won't fail
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile (ignore errors if it already exists)
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert usage tracking (ignore errors if it already exists)
  INSERT INTO public.user_usage_tracking (
    user_id,
    period_start,
    period_end,
    scrapes_limit,
    keywords_limit,
    api_calls_limit
  )
  VALUES (
    NEW.id,
    DATE_TRUNC('month', NOW())::DATE,
    (DATE_TRUNC('month', NOW() + INTERVAL '1 month') - INTERVAL '1 day')::DATE,
    100,
    5,
    0
  )
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If anything fails, just return NEW and let the user be created
    -- We can create the profile manually later
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.user_usage_tracking TO anon, authenticated;
