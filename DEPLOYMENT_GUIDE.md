# Vercel Deployment Guide

## 1. Project Setup
This project is configured for Vercel with Next.js.
The configuration file `vercel.json` is already present to handle Cron Jobs.

## 2. Environment Variables
You MUST set the following Environment Variables in your Vercel Project Settings (Settings -> Environment Variables).

| Variable Name | Description | Example / Note |
|--------------|-------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key | (Public Key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key | (Secret - Needed for Cron Jobs) |
| `GOOGLE_GEMINI_API_KEY` | API Key for Gemini 1.5 Flash | (Secret) |
| `EBAY_APP_ID` | eBay App ID (Client ID) | (From eBay Developer Portal) |
| `EBAY_CLIENT_ID` | eBay Client ID | (Same as App ID) |
| `EBAY_CLIENT_SECRET` | eBay Client Secret | (From eBay Developer Portal) |
| `EBAY_ENVIRONMENT` | eBay Environment | `PRODUCTION` or `SANDBOX` |
| `PAYPAL_CLIENT_ID` | PayPal Client ID | (Optional - for Checkout) |
| `PAYPAL_CLIENT_SECRET` | PayPal Client Secret | (Optional - for Checkout) |
| `CRON_SECRET` | Secret to secure Cron Routes | (Generate a random string) |
| `NEXT_PUBLIC_APP_URL` | The URL of your deployed app | `https://artscaler.vercel.app` |

## 3. Cron Jobs
The following Cron Jobs are configured in `vercel.json` and will start automatically once deployed:
- **Daily Pipeline** (`/api/cron/daily-pipeline`): Runs at 03:00 UTC daily.
- **Scrape Queue Processor** (`/api/cron/scrape-queue`): Runs every 15 minutes.

## 4. Deployment Steps
1. Push the latest code to GitHub:
   ```bash
   git push
   ```
2. Connect your GitHub repository to Vercel.
3. Add the Environment Variables listed above.
4. Click **Deploy**.

## 5. Troubleshooting
- If the build fails with "Failed to collect page data", check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly in Vercel.
- If Cron Jobs don't trigger, verify the `CRON_SECRET` matches between Vercel Env Vars and your request headers (if testing manually).
