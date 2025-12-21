# 🚀 ArtScaler Deployment Guide

## Pre-Deployment Checklist

### ✅ Critical (Must Complete Before Launch)

1. **PayPal Plan IDs**
   - [ ] Log into PayPal Developer Dashboard
   - [ ] Create 6 subscription plans:
     - Artist Monthly ($20/mo)
     - Artist Yearly ($200/yr)
     - Studio Monthly ($50/mo)
     - Studio Yearly ($500/yr)
     - Empire Monthly ($120/mo)
     - Empire Yearly ($1200/yr)
   - [ ] Copy Plan IDs and update `lib/payments/payment-service.ts`
   - [ ] Replace placeholders: `P-ARTIST_MO`, `P-ARTIST_YR`, etc.

2. **PayPal Webhook**
   - [ ] Create webhook in PayPal Dashboard
   - [ ] Set URL: `https://artscaler.com/api/webhook/paypal`
   - [ ] Subscribe to events:
     - BILLING.SUBSCRIPTION.ACTIVATED
     - BILLING.SUBSCRIPTION.CANCELLED
     - BILLING.SUBSCRIPTION.SUSPENDED
     - BILLING.SUBSCRIPTION.EXPIRED
     - PAYMENT.SALE.COMPLETED
   - [ ] Copy Webhook ID to environment variables

3. **Vercel Deployment**
   - [ ] Push code to GitHub
   - [ ] Import project to Vercel
   - [ ] Add environment variables (see below)
   - [ ] Add custom domain: `artscaler.com`
   - [ ] Verify SSL certificate is generated

4. **Supabase Configuration**
   - [ ] Update Auth redirect URLs:
     - `https://artscaler.com/auth/callback`
     - `http://localhost:3000/auth/callback` (for dev)
   - [ ] Update Site URL: `https://artscaler.com`
   - [ ] Verify RLS policies are enabled

5. **DNS Configuration**
   - [ ] A Record: `artscaler.com` → `76.76.21.21`
   - [ ] CNAME: `www` → `cname.vercel-dns.com`
   - [ ] Wait for propagation (5-30 minutes)

---

## Environment Variables (Vercel)

Add these in Vercel Project Settings → Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AXWSkiaiL5j8-1ajeK91hk_xjlWXX2wYLVbeT0DyJvW3EHccOQ-fHUVB2Z4yxp8_Mye9nWWbKcZUKZZ0
PAYPAL_SECRET_KEY=EDYdOskEvYfYTJV2THh7Bej_2u41LWbWSAIjZBvoS8DxrJJHFgbKJQoyk1bFjo7AT35UVskmS0jOcsrV
PAYPAL_WEBHOOK_ID=your-webhook-id-from-paypal

# AI
GEMINI_API_KEY=your-gemini-api-key

# App
NEXT_PUBLIC_APP_URL=https://artscaler.com
```

---

## Deployment Steps

### 1. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy to production
vercel --prod
```

### 2. Add Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add `artscaler.com`
3. Add `www.artscaler.com`
4. Vercel will provide DNS instructions
5. Wait for SSL certificate generation (automatic)

### 3. Test Subscription Flow

1. Visit `https://artscaler.com/pricing`
2. Click "Subscribe" on Artist tier
3. Complete PayPal checkout (use sandbox for testing)
4. Verify:
   - User is redirected back to dashboard
   - Tier is updated in Supabase
   - Subscription appears in `user_subscriptions` table

### 4. Test Webhook Events

1. In PayPal Dashboard, go to Webhooks
2. Click "Simulate Event"
3. Test:
   - BILLING.SUBSCRIPTION.ACTIVATED
   - BILLING.SUBSCRIPTION.CANCELLED
4. Check Vercel logs to verify events are received

---

## Post-Launch Tasks

### High Priority (Week 1)

- [ ] Set up error monitoring (Sentry)
- [ ] Configure email notifications (SendGrid/Resend)
- [ ] Test payment failure scenarios
- [ ] Monitor webhook logs for errors
- [ ] Add analytics (PostHog/Google Analytics)

### Medium Priority (Month 1)

- [ ] Implement eBay OAuth for auto-posting
- [ ] Add customer support chat (Intercom/Crisp)
- [ ] Create onboarding email sequence
- [ ] Build admin dashboard for monitoring

### Low Priority (Quarter 1)

- [ ] Add team accounts feature
- [ ] Implement referral program
- [ ] Build mobile app (React Native)
- [ ] Add more AI agents

---

## Monitoring & Maintenance

### Daily Checks
- Vercel deployment status
- PayPal webhook delivery rate
- Supabase database size
- Error rate in logs

### Weekly Checks
- User growth metrics
- Subscription churn rate
- API usage patterns
- Customer support tickets

### Monthly Checks
- Security audit
- Dependency updates
- Performance optimization
- Cost analysis

---

## Troubleshooting

### Issue: PayPal subscription not activating

**Solution**:
1. Check Vercel logs for webhook errors
2. Verify webhook URL is correct
3. Ensure `PAYPAL_WEBHOOK_ID` is set
4. Test webhook manually in PayPal Dashboard

### Issue: User stuck on "Processing payment"

**Solution**:
1. Check if webhook was received
2. Verify Supabase connection
3. Check `user_subscriptions` table for entry
4. Manually update tier if needed

### Issue: DNS not resolving

**Solution**:
1. Verify A record points to `76.76.21.21`
2. Check CNAME for www subdomain
3. Wait 24 hours for full propagation
4. Use `nslookup artscaler.com` to verify

---

## Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **PayPal Developer Support**: https://developer.paypal.com/support
- **Domain Registrar**: GoDaddy support

---

**Last Updated**: 2025-12-20
**Version**: 4.0 FINAL
