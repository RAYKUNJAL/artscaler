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
                name: 'Free Scout',
                price_monthly: 0,
                price_yearly: 0,
                daily_scrapes_limit: 5,
                keywords_limit: 3,
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
                tier_id: 'artist',
                name: 'Artist',
                price_monthly: 20,
                price_yearly: 200,
                paypal_plan_id_monthly: 'P-93R941369E791822TNFDPZOY',
                paypal_plan_id_yearly: 'P-1WH57033YC383741JNFDP4BY',
                daily_scrapes_limit: 100,
                keywords_limit: 25,
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
                price_monthly: 50,
                price_yearly: 500,
                paypal_plan_id_monthly: 'P-0UH88477E2468231XNFDP76I',
                paypal_plan_id_yearly: 'P-7MC590887C4107522NFDREUA',
                daily_scrapes_limit: 500,
                keywords_limit: 100,
                historical_data_days: 180,
                features: {
                    predictions: true,
                    auto_listing: true,
                    alerts: true,
                    competitor_tracker: true,
                    api_access: false
                }
            },
            {
                tier_id: 'empire',
                name: 'Empire',
                price_monthly: 120,
                price_yearly: 1200,
                paypal_plan_id_monthly: 'P-1A391899RE784140BNFDRJ2Q',
                paypal_plan_id_yearly: 'P-86L79354K19034538NFDROJY',
                daily_scrapes_limit: 5000,
                keywords_limit: 500,
                historical_data_days: -1, // Unlimited
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
        return process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AXWSkiaiL5j8-1ajeK91hk_xjlWXX2wYLVbeT0DyJvW3EHccOQ-fHUVB2Z4yxp8_Mye9nWWbKcZUKZZ0';
    }

    /**
     * Get pricing for a specific tier
     */
    static getPricing(tierId: string, billingCycle: BillingCycle): number {
        const plans: Record<string, { monthly: number; yearly: number }> = {
            free: { monthly: 0, yearly: 0 },
            artist: { monthly: 20, yearly: 200 },
            studio: { monthly: 50, yearly: 500 },
            empire: { monthly: 120, yearly: 1200 }
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
            artist: { monthly: 20, yearly: 200 },
            studio: { monthly: 50, yearly: 500 },
            empire: { monthly: 120, yearly: 1200 }
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

    /**
     * Create PayPal subscription
     * 
     * NOTE: This is a skeleton implementation. You'll need to:
     * 1. Install PayPal SDK: npm install @paypal/checkout-server-sdk
     * 2. Get PayPal credentials from https://developer.paypal.com/
     * 3. Set environment variables: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
     * 4. Create subscription plans in PayPal dashboard
     */
    static async createPayPalSubscription(params: CreateSubscriptionParams): Promise<string> {
        console.log('[Payment] Creating PayPal subscription:', params);

        // TODO: Implement PayPal Subscriptions API
        // const paypal = require('@paypal/checkout-server-sdk');
        // const environment = new paypal.core.LiveEnvironment(
        //     process.env.PAYPAL_CLIENT_ID,
        //     process.env.PAYPAL_CLIENT_SECRET
        // );
        // const client = new paypal.core.PayPalHttpClient(environment);

        // Example PayPal subscription creation:
        // const request = new paypal.subscriptions.SubscriptionsCreateRequest();
        // request.requestBody({
        //     plan_id: `pulse-${params.tierId}-${params.billingCycle}`,
        //     subscriber: {
        //         email_address: userEmail
        //     }
        // });

        // const response = await client.execute(request);
        // return response.result.id;

        throw new Error('PayPal integration not yet implemented. Please configure PayPal SDK.');
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
