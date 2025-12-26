import { SupabaseClient } from '@supabase/supabase-js';

export type TierId = 'free' | 'pro' | 'studio';

export interface TierLimits {
    dailyScrapes: number;
    keywords: number;
    historicalDays: number;
    hasPredictions: boolean;
    hasAutoListing: boolean;
    hasAlerts: boolean;
    hasCompetitorTracker: boolean;
    hasApiAccess: boolean;
    hasGlobalIntel: boolean;
    hasAIAdvisor: boolean;
    aiCoachMessagesPerSession: number;
}

export const TIER_LIMITS: Record<TierId, TierLimits> = {
    free: {
        dailyScrapes: 10,
        keywords: 5,
        historicalDays: 7,
        hasPredictions: false,
        hasAutoListing: false,
        hasAlerts: false,
        hasCompetitorTracker: false,
        hasApiAccess: false,
        hasGlobalIntel: false,
        hasAIAdvisor: false,
        aiCoachMessagesPerSession: 3
    },
    pro: {
        dailyScrapes: 100,
        keywords: 50,
        historicalDays: 30,
        hasPredictions: true,
        hasAutoListing: false,
        hasAlerts: true,
        hasCompetitorTracker: false,
        hasApiAccess: false,
        hasGlobalIntel: true,
        hasAIAdvisor: true,
        aiCoachMessagesPerSession: 20
    },
    studio: {
        dailyScrapes: 1000,
        keywords: 500,
        historicalDays: -1,
        hasPredictions: true,
        hasAutoListing: true,
        hasAlerts: true,
        hasCompetitorTracker: true,
        hasApiAccess: true,
        hasGlobalIntel: true,
        hasAIAdvisor: true,
        aiCoachMessagesPerSession: 100
    }
};

export class PricingService {
    /**
     * Get a user's current tier and usage
     */
    static async getUserUsage(supabase: SupabaseClient, userId: string) {
        // Get user profile for tier
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .maybeSingle();

        const tier = (profile?.subscription_tier || 'free') as TierId;
        const limits = TIER_LIMITS[tier];

        // Get usage for current period
        const periodStart = new Date();
        periodStart.setHours(0, 0, 0, 0);

        const { data: usage } = await supabase
            .from('user_usage_tracking')
            .select('*')
            .eq('user_id', userId)
            .eq('period_start', periodStart.toISOString().split('T')[0])
            .maybeSingle();

        return {
            tier,
            limits,
            usage: usage || {
                scrapes_used: 0,
                keywords_used: 0,
                api_calls_used: 0
            }
        };
    }

    /**
     * Check if a user can perform a search/scrape
     */
    static async canScrape(supabase: SupabaseClient, userId: string): Promise<{ allowed: boolean; reason?: string }> {
        const { data, error } = await supabase.rpc('check_and_increment_daily_limit', {
            p_user_id: userId,
            p_increment: 0 // Just check, don't increment yet
        });

        if (error) return { allowed: true }; // Fallback

        const result = data[0];
        if (result && !result.allowed) {
            return {
                allowed: false,
                reason: `You have reached your daily search limit (${result.current_limit}). Please upgrade your plan for more searches.`
            };
        }

        return { allowed: true };
    }

    /**
     * Increment search/scrape usage
     */
    static async recordScrape(supabase: SupabaseClient, userId: string) {
        await supabase.rpc('check_and_increment_daily_limit', {
            p_user_id: userId,
            p_increment: 1
        });
    }

    /**
     * Check if a user can use the AI Coach
     */
    static async canUseAICoach(supabase: SupabaseClient, userId: string, sessionId: string): Promise<{ allowed: boolean; reason?: string }> {
        const { tier, limits } = await this.getUserUsage(supabase, userId);

        // Count messages in this session
        const { count, error } = await supabase
            .from('coach_messages')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId)
            .eq('role', 'user');

        if (error) return { allowed: true }; // Fallback

        if ((count || 0) >= limits.aiCoachMessagesPerSession) {
            return {
                allowed: false,
                reason: `You have reached the ${limits.aiCoachMessagesPerSession} message limit for this AI Coach session on the ${tier} tier. Upgrade for deeper insights.`
            };
        }

        return { allowed: true };
    }
}
