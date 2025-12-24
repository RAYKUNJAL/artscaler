# 🔑 Grant Premium Access - Quick Guide

**User**: raykunjal@gmail.com  
**Tier**: Empire (All Features)  
**Purpose**: Testing all app features

---

## ✅ Quick Setup (3 Steps)

### Step 1: Run SQL in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your ArtIntel project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste this SQL:

```sql
-- Grant Empire Tier to raykunjal@gmail.com
UPDATE public.user_profiles
SET 
    subscription_tier = 'empire',
    subscription_status = 'active',
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + INTERVAL '1 year',
    scrapes_this_month = 0,
    scrapes_limit = 999999,
    updated_at = NOW()
WHERE email = 'raykunjal@gmail.com';

-- If no rows updated, insert new profile
INSERT INTO public.user_profiles (
    id,
    email,
    subscription_tier,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    scrapes_this_month,
    scrapes_limit
)
SELECT 
    id,
    'raykunjal@gmail.com',
    'empire',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    0,
    999999
FROM auth.users
WHERE email = 'raykunjal@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 
    email,
    subscription_tier,
    subscription_status,
    scrapes_limit,
    subscription_end_date
FROM public.user_profiles
WHERE email = 'raykunjal@gmail.com';
```

6. Click **Run** (or press Ctrl+Enter)
7. Check output - should show:
   - `subscription_tier`: empire
   - `subscription_status`: active
   - `scrapes_limit`: 999999

---

### Step 2: Verify in App

1. Log out if logged in
2. Log in with: `raykunjal@gmail.com`
3. Go to Settings page
4. Check subscription tier shows "Empire"

---

### Step 3: Test Features

Now you have access to ALL features:

#### ✅ Empire Tier Features
- **Unlimited** Market Scanner searches
- **Unlimited** AI analysis
- **Unlimited** scrape jobs
- **All** Studio tools
- **All** AI agents
- **Priority** support
- **Advanced** analytics

---

## 🎯 What Each Tier Includes

| Feature | Free | Artist | Studio | Empire |
|---------|------|--------|--------|--------|
| Market Scans | 5/mo | 50/mo | 200/mo | **Unlimited** |
| AI Analysis | ❌ | ✅ | ✅ | ✅ |
| Trends | ❌ | ✅ | ✅ | ✅ |
| Opportunities | ❌ | ✅ | ✅ | ✅ |
| Art Planner | ❌ | ✅ | ✅ | ✅ |
| Paint Queue | ❌ | ❌ | ✅ | ✅ |
| Revenue Planner | ❌ | ❌ | ✅ | ✅ |
| AI Art Coach | ❌ | ❌ | ✅ | ✅ |
| Brand Generator | ❌ | ❌ | ✅ | ✅ |
| COA Generator | ❌ | ❌ | ✅ | ✅ |
| Thank You Cards | ❌ | ❌ | ✅ | ✅ |
| eBay Integration | ❌ | ❌ | ❌ | ✅ |
| Advanced Analytics | ❌ | ❌ | ❌ | ✅ |

**You now have access to EVERYTHING!** ✅

---

## 🧪 Test Checklist

Test all premium features:

### Core Features
- [ ] Market Scanner (unlimited searches)
- [ ] Trends Analysis
- [ ] Opportunity Feed
- [ ] Pricing Engine

### Planning Tools
- [ ] Art Planner
- [ ] Paint Queue
- [ ] Revenue Planner

### Studio Tools
- [ ] AI Art Coach
- [ ] Brand Generator
- [ ] COA Generator
- [ ] Thank You Cards

### Advanced
- [ ] eBay Integration
- [ ] Advanced Analytics
- [ ] Data Export

---

## 🔧 Troubleshooting

### "Still showing Free tier"
1. Log out completely
2. Clear browser cache
3. Log back in
4. Check Settings page

### "Features still locked"
1. Verify SQL ran successfully
2. Check Supabase logs
3. Restart dev server
4. Try incognito mode

### "SQL Error"
- Make sure `user_profiles` table exists
- Check if user signed up first
- Verify email is correct

---

## 📊 Subscription Tiers Reference

```typescript
// In lib/payments/payment-service.ts

export const SUBSCRIPTION_TIERS = {
    free: {
        name: 'Free',
        scrapes_per_month: 5,
        features: ['basic_scanner']
    },
    artist: {
        name: 'Artist',
        price_monthly: 20,
        price_yearly: 200,
        scrapes_per_month: 50,
        features: ['scanner', 'trends', 'opportunities', 'art_planner']
    },
    studio: {
        name: 'Studio',
        price_monthly: 50,
        price_yearly: 500,
        scrapes_per_month: 200,
        features: ['all_artist', 'paint_queue', 'revenue_planner', 'studio_tools']
    },
    empire: {
        name: 'Empire',
        price_monthly: 120,
        price_yearly: 1200,
        scrapes_per_month: 999999, // Unlimited
        features: ['all_features', 'ebay_integration', 'advanced_analytics']
    }
};
```

---

## ✅ You're All Set!

**Your account now has:**
- ✅ Empire tier access
- ✅ Unlimited scrapes
- ✅ All features unlocked
- ✅ Valid for 1 year

**Start testing all the premium features!** 🚀

---

**Questions?** Check the SQL output or Settings page to verify tier.
