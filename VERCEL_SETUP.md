# ArtScaler - Vercel Deployment Guide

## 🔧 Environment Variables for Vercel

Add these environment variables in your Vercel dashboard:

### Required for Market Scanner
```
EBAY_APP_ID=<your_ebay_production_app_id>
EBAY_ENVIRONMENT=PRODUCTION
```

### Required for Supabase
```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

### Required for AI Features
```
GOOGLE_GEMINI_API_KEY=<your_gemini_api_key>
```

---

## 🌐 Getting eBay API Credentials

1. Go to [eBay Developer Program](https://developer.ebay.com/)
2. Create a **Production** application (not Sandbox)
3. Get your **App ID** from the Production credentials
4. Use this App ID for `EBAY_APP_ID`

---

## ✅ Changes Made

| File | Change |
|------|--------|
| `app/api/market-scanner/route.ts` | Switched from Playwright to eBay Finding API |
| `env.example` | Added `EBAY_ENVIRONMENT=PRODUCTION` |

---

## 🚀 Deploy to Vercel

```bash
vercel --prod
```

Or push to your connected GitHub repo for automatic deployment.
