-- Grant Premium Access for Testing
-- User: raykunjal@gmail.com
-- Tier: Empire (highest tier - all features unlocked)

-- Step 1: Find the user ID
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = 'raykunjal@gmail.com';

    IF user_uuid IS NULL THEN
        RAISE NOTICE 'User not found. Please sign up first at /auth/signup';
    ELSE
        RAISE NOTICE 'Found user: %', user_uuid;

        -- Step 2: Update or insert user profile with Empire tier
        INSERT INTO public.user_profiles (
            id,
            email,
            subscription_tier,
            subscription_status,
            subscription_start_date,
            subscription_end_date,
            scrapes_this_month,
            scrapes_limit,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            'raykunjal@gmail.com',
            'empire',                           -- Highest tier
            'active',                           -- Active subscription
            NOW(),                              -- Started now
            NOW() + INTERVAL '1 year',          -- Valid for 1 year
            0,                                  -- Reset scrape count
            999999,                             -- Unlimited scrapes
            NOW(),
            NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET
            subscription_tier = 'empire',
            subscription_status = 'active',
            subscription_start_date = NOW(),
            subscription_end_date = NOW() + INTERVAL '1 year',
            scrapes_this_month = 0,
            scrapes_limit = 999999,
            updated_at = NOW();

        RAISE NOTICE '✅ Premium access granted!';
        RAISE NOTICE '   Tier: Empire (All Features)';
        RAISE NOTICE '   Status: Active';
        RAISE NOTICE '   Scrapes: Unlimited';
        RAISE NOTICE '   Valid Until: %', NOW() + INTERVAL '1 year';
    END IF;
END $$;

-- Step 3: Verify the update
SELECT 
    id,
    email,
    subscription_tier,
    subscription_status,
    scrapes_limit,
    subscription_end_date
FROM public.user_profiles
WHERE email = 'raykunjal@gmail.com';

-- Expected Output:
-- subscription_tier: empire
-- subscription_status: active
-- scrapes_limit: 999999
-- subscription_end_date: [1 year from now]
