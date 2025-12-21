# ArtScaler - AI-Powered Art Market Intelligence

**Turn eBay sold data into profitable art decisions.**

ArtScaler is a commercial SaaS platform that scrapes eBay sold listings, analyzes them with AI, and provides data-driven insights to help artists scale to $20,000+/month in art sales.

## 🚀 Features

### For Artists
- **Real-time Market Intelligence**: Scrape and analyze eBay sold listings
- **AI-Powered Insights**: 7 specialized AI agents analyze trends, pricing, and keywords
- **Opportunity Feed**: Daily ranked list of what to create and sell
- **Keyword Research**: Automatic extraction of winning keywords from sold listings
- **Pricing Engine**: Data-driven pricing recommendations by size and topic
- **Listing Builder**: Generate eBay-ready titles and descriptions
- **Art Pulse Coach**: AI business advisor with real-time market context
- **ArtScaler Roadmap**: Structured growth plan from $0 to $20K/month

### For Business
- **Multi-Tenant Architecture**: Each user's data is isolated with Row Level Security
- **Subscription Tiers**: Scout (Free), Artist ($20/mo), Studio ($50/mo), Empire ($120/mo)
- **Usage Tracking**: Enforce limits based on subscription tier
- **PayPal Integration**: Automated billing and subscription management
- **Admin Dashboard**: Monitor users, revenue, and system health

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (Postgres, Auth, RLS, Storage)
- **AI**: Google Gemini 1.5 Flash + pgvector for embeddings
- **Scraping**: Playwright (headless browser)
- **Payments**: PayPal Subscriptions API
- **Deployment**: Vercel
- **PDF Generation**: jsPDF (for COAs and Thank You Cards)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works for development)
- Google Gemini API key
- PayPal Business account (for payments)

## 🏁 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd artintel
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:
   - `supabase/COMPLETE_SETUP.sql`
3. Enable **pgvector** extension:
   - Go to **Database** → **Extensions**
   - Search for "vector" and enable it
4. Get your credentials:
   - Go to **Settings** → **API**
   - Copy **Project URL** and **service_role** key

### 3. Configure Environment Variables

Copy `env.example` to `.env.local`:

```bash
cp env.example .env.local
```

Fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET_KEY=your-paypal-secret-key
PAYPAL_WEBHOOK_ID=your-webhook-id

# AI
GEMINI_API_KEY=your-gemini-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
artintel/
├── app/                          # Next.js app router pages
│   ├── auth/                     # Authentication pages (login, signup, callback)
│   ├── onboarding/               # User onboarding wizard
│   ├── dashboard/                # Main dashboard
│   ├── opportunities/            # Today's opportunities
│   ├── trends/                   # Trends analysis
│   ├── market-scanner/           # Live eBay scanner
│   ├── pricing-engine/           # Smart pricing calculator
│   ├── art-planner/              # Weekly painting planner
│   ├── paint-queue/              # Inventory tracker
│   ├── revenue-planner/          # Financial planning
│   ├── artscaler/                # ArtScaler 20K Roadmap
│   ├── studio/                   # Artist tools
│   │   ├── art-coach/            # AI business coach
│   │   ├── brand-generator/      # AI brand identity
│   │   ├── coa-generator/        # Certificate of Authenticity
│   │   └── thank-you-cards/      # Thank you card generator
│   ├── data-logs/                # System activity logs
│   ├── settings/                 # Account settings
│   ├── pricing/                  # Subscription plans (PayPal)
│   ├── legal/                    # Terms, Privacy, Refunds
│   └── api/                      # API routes
│       ├── scrape/               # Scraping endpoints
│       ├── webhook/paypal/       # PayPal webhooks
│       ├── art-coach/            # AI Coach API
│       ├── pricing/              # Pricing engine API
│       └── cron/                 # Cron jobs
├── components/                   # React components
│   ├── auth/                     # Auth components (AuthProvider, ProtectedRoute)
│   ├── layout/                   # Layout components (Sidebar, DashboardLayout)
│   └── providers/                # Context providers (PayPalProvider)
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase client
│   └── payments/                 # PayPal payment service
├── services/                     # Business logic
│   ├── scraper/                  # eBay scraper (Playwright)
│   ├── ai/                       # AI agents
│   │   ├── parser-agent.ts       # Extract art attributes
│   │   ├── pattern-miner.ts      # Cluster and analyze
│   │   ├── publisher-agent.ts    # Publish opportunities
│   │   ├── gemini-service.ts     # Gemini AI wrapper
│   │   └── art-coach-service.ts  # AI business coach
│   ├── pricing-service.ts        # Usage tier enforcement
│   └── notifications/            # Email service
└── supabase/                     # Supabase schema
    └── COMPLETE_SETUP.sql
```

## 🗄️ Database Schema

### User Management
- `user_profiles` - Extended user data (subscription tier, preferences)
- `user_subscriptions` - PayPal subscription tracking
- `user_usage_tracking` - Monthly usage limits
- `user_keywords` - User's saved keywords
- `user_saved_opportunities` - Favorited opportunities

### Scraping & Data
- `scrape_jobs` - Audit trail for scrape jobs
- `sold_listings_raw` - Raw scraped data (never altered)
- `sold_listings_clean` - Normalized data
- `parsed_signals` - AI-extracted features (size, medium, subject, style)

### AI Pipeline
- `topic_clusters` - Topic groupings with embeddings
- `topic_memberships` - Listings → topics mapping
- `topic_scores_daily` - Nolan Score and metrics per topic
- `keyword_metrics_daily` - Keyword trends and price lift
- `opportunity_feed` - Published opportunities for users

### ArtScaler System
- `artscaler_goals` - User's revenue goals and tracking
- `art_coach_sessions` - AI Coach conversation sessions
- `art_coach_messages` - Chat message history

## 🤖 AI Pipeline

The AI pipeline runs daily (3 AM ET) and processes scraped data through specialized agents:

1. **ParserAgent**: Extracts size, medium, subject, style using Gemini 1.5 Flash
2. **PatternMiner**: Groups listings into topics using pgvector embeddings
3. **PublisherAgent**: Publishes opportunities with evidence links and email alerts

## 💳 Subscription Tiers

| Feature | Scout (Free) | Artist ($20/mo) | Studio ($50/mo) | Empire ($120/mo) |
|---------|--------------|-----------------|-----------------|------------------|
| Daily Scrapes | 5 | 100 | 500 | 5,000 |
| Keywords | 3 | 25 | 100 | 500 |
| Historical Data | 7 days | 30 days | 180 days | Unlimited |
| AI Predictions | ❌ | ✅ | ✅ | ✅ |
| Auto Listing | ❌ | ❌ | ✅ | ✅ |
| Alerts | ❌ | ✅ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |

## 🚢 Deployment

### Vercel

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Configure cron jobs in `vercel.json`:
   - Daily pipeline: `0 3 * * *`
   - Scrape queue: `*/15 * * * *`
5. Deploy!

### Supabase

1. Run `COMPLETE_SETUP.sql` in production project
2. Enable pgvector extension
3. Set up RLS policies (already in migration)
4. Update Auth redirect URLs to include your production domain

### PayPal

1. Create subscription plans for each tier (Artist, Studio, Empire) × 2 billing cycles
2. Set up webhook endpoint: `https://your-domain.com/api/webhook/paypal`
3. Add webhook ID to environment variables
4. Update Plan IDs in `lib/payments/payment-service.ts`

## 🔒 Security

- **Row Level Security (RLS)**: All user data is isolated
- **API Authentication**: JWT tokens for API access
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Webhook Verification**: PayPal webhook signature verification
- **Environment Variables**: Secrets stored securely in Vercel

## 📝 Legal

- **Terms of Service**: User responsibilities for eBay scraping compliance
- **Privacy Policy**: GDPR-compliant data handling
- **Refund Policy**: 30-day money-back guarantee
- **Data Ownership**: Users own their scraped data

## 🤝 Contributing

This is a commercial project. For feature requests or bug reports, please contact the maintainer.

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For support, email support@artscaler.com or open an issue in the repository.

---

**Built with ❤️ for artists who want to make data-driven decisions.**
