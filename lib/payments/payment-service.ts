/**
 * Payment Service - Square & PayPal Integration
 * 
 * Handles subscription management for eBay Art Pulse Pro
 * Supports both Square and PayPal payment gateways
 */

export type PaymentGateway = 'paypal' | 'square';
export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionPlan {
    tier_id: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    paypal_plan_id_monthly?: string;
    paypal_plan_id_yearly?: string;
    daily_scrapes_limit: number;
    keywords_limit: number;
    historical_data_days: number;
    features: {
        predictions: boolean;
        auto_listing: boolean;
        alerts: boolean;
        competitor_tracker: boolean;
        api_access: boolean;
    };
}

export interface CreateSubscriptionParams {
    userId: string;
    tierId: string;
    gateway: PaymentGateway;
    billingCycle: BillingCycle;
    email?: string;
}

export interface SubscriptionStatus {
    isActive: boolean;
    tier: string;
    gateway: PaymentGateway;
    nextBillingDate?: string;
    cancelAtPeriodEnd: boolean;
}

export class PaymentService {
    /**
     * Get all available subscription plans
     */
    static async getPlans(): Promise<SubscriptionPlan[]> {
        return [
            {
                tier_id: 'free',
                name: 'Free',
                price_monthly: 0,
                price_yearly: 0,
                daily_scrapes_limit: 10,
                keywords_limit: 5,
                historical_data_days: 7,
                features: {
                    predictions: false,
                    auto_listing: false,
                    alerts: false,
                    competitor_tracker: false,
                    api_access: false
                }
            },
            {
                tier_id: 'pro',
                name: 'Pro',
                price_monthly: 29,
                price_yearly: 290,
                paypal_plan_id_monthly: 'P-93R941369E791822TNFDPZOY', // Existing plan ID (needs update eventually)
                paypal_plan_id_yearly: 'P-1WH57033YC383741JNFDP4BY',
                daily_scrapes_limit: 100,
                keywords_limit: 50,
                historical_data_days: 30,
                features: {
                    predictions: true,
                    auto_listing: false,
                    alerts: true,
                    competitor_tracker: false,
                    api_access: false
                }
            },
            {
                tier_id: 'studio',
                name: 'Studio',
                price_monthly: 79,
                price_yearly: 790,
                paypal_plan_id_monthly: 'P-0UH88477E2468231XNFDP76I',
                paypal_plan_id_yearly: 'P-7MC590887C4107522NFDREUA',
                daily_scrapes_limit: 1000,
                keywords_limit: 500,
                historical_data_days: -1,
                features: {
                    predictions: true,
                    auto_listing: true,
                    alerts: true,
                    competitor_tracker: true,
                    api_access: true
                }
            }
        ];
    }

    /**
     * Get PayPal Client ID
     */
    static getPayPalClientId(): string {
        return process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
    }

    /**
     * Get pricing for a specific tier
     */
    static getPricing(tierId: string, billingCycle: BillingCycle): number {
        const plans: Record<string, { monthly: number; yearly: number }> = {
            free: { monthly: 0, yearly: 0 },
            pro: { monthly: 29, yearly: 290 },
            studio: { monthly: 79, yearly: 790 }
        };

        const plan = plans[tierId];
        if (!plan) throw new Error('Invalid tier ID');

        return billingCycle === 'monthly' ? plan.monthly : plan.yearly;
    }

    /**
     * Calculate savings for yearly billing
     */
    static calculateYearlySavings(tierId: string): number {
        const plans: Record<string, { monthly: number; yearly: number }> = {
            pro: { monthly: 29, yearly: 290 },
            studio: { monthly: 79, yearly: 790 }
        };

        const plan = plans[tierId];
        if (!plan) return 0;

        const yearlyAsMonthly = plan.monthly * 12;
        return yearlyAsMonthly - plan.yearly;
    }

    /**
     * Create Square subscription
     * 
     * NOTE: This is a skeleton implementation. You'll need to:
     * 1. Install Square SDK: npm install square
     * 2. Get Square credentials from https://developer.squareup.com/
     * 3. Set environment variables: SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID
     */
    static async createSquareSubscription(params: CreateSubscriptionParams): Promise<string> {
        console.log('[Payment] Creating Square subscription:', params);

        // TODO: Implement Square Subscriptions API
        // const { Client, Environment } = require('square');
        // const client = new Client({
        //     accessToken: process.env.SQUARE_ACCESS_TOKEN,
        //     environment: Environment.Production
        // });

        // Example Square subscription creation:
        // const response = await client.subscriptionsApi.createSubscription({
        //     locationId: process.env.SQUARE_LOCATION_ID,
        //     planId: `pulse-${params.tierId}-${params.billingCycle}`,
        //     customerId: params.userId,
        //     cardId: params.paymentMethodToken
        // });

        // return response.result.subscription.id;

        throw new Error('Square integration not yet implemented. Please configure Square SDK.');
    }

    static async createPayPalSubscription(params: CreateSubscriptionParams): Promise<string> {
        console.log('[Payment] Creating PayPal subscription:', params);

        const plans = await this.getPlans();
        const selectedPlan = plans.find(p => p.tier_id === params.tierId);

        if (!selectedPlan) {
            throw new Error(`Invalid plan for tier: ${params.tierId}`);
        }

        const paypalPlanId = params.billingCycle === 'monthly'
            ? selectedPlan.paypal_plan_id_monthly
            : selectedPlan.paypal_plan_id_yearly;

        if (!paypalPlanId) {
            throw new Error(`No PayPal Plan ID found for ${params.tierId} (${params.billingCycle})`);
        }

        // Return the Plan ID that the frontend PayPal Button will uses to 'createSubscription'
        // In a client-side integration, we pass the Plan ID to the button.
        // If this was a server-side creation (e.g. via email), we would call PayPal API here.
        // For ArtScaler, we act as a helper to resolve the correct Plan ID.
        return paypalPlanId;
    }

    /**
     * Check if user has access to a feature based on their tier
     */
    static async checkFeatureAccess(
        userId: string,
        feature: 'predictions' | 'auto_listing' | 'alerts' | 'competitor_tracker' | 'api_access'
    ): Promise<boolean> {
        // This would query the user's subscription from Supabase
        // For now, return a placeholder
        console.log(`[Payment] Checking ${feature} access for user ${userId}`);
        return false;
    }

    /**
     * Check if user has reached their daily scrape limit
     */
    static async checkScrapeLimit(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
        // This would:
        // 1. Get user's tier from Supabase
        // 2. Get their scrape count for today
        // 3. Compare against tier limit

        console.log(`[Payment] Checking scrape limit for user ${userId}`);

        return {
            allowed: true,
            remaining: 5,
            limit: 5
        };
    }

    /**
     * Get user's current subscription status
     */
    static async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
        // This would query Supabase for the user's subscription
        console.log(`[Payment] Getting subscription status for user ${userId}`);

        return {
            isActive: true,
            tier: 'free',
            gateway: 'square',
            cancelAtPeriodEnd: false
        };
    }
}
