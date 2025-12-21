import { SupabaseClient } from '@supabase/supabase-js';

export type TierId = 'free' | 'artist' | 'studio' | 'empire';

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
        dailyScrapes: 5,
        keywords: 3,
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
    artist: {
        dailyScrapes: 100,
        keywords: 25,
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
        dailyScrapes: 500,
        keywords: 100,
        historicalDays: 180,
        hasPredictions: true,
        hasAutoListing: true,
        hasAlerts: true,
        hasCompetitorTracker: true,
        hasApiAccess: false,
        hasGlobalIntel: true,
        hasAIAdvisor: true,
        aiCoachMessagesPerSession: 100
    },
    empire: {
        dailyScrapes: 5000,
        keywords: 500,
        historicalDays: -1,
        hasPredictions: true,
        hasAutoListing: true,
        hasAlerts: true,
        hasCompetitorTracker: true,
        hasApiAccess: true,
        hasGlobalIntel: true,
        hasAIAdvisor: true,
        aiCoachMessagesPerSession: 1000 // Effectively unlimited
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
            .single();

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
            .single();

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
     * Check if a user can perform a scrape
     */
    static async canScrape(supabase: SupabaseClient, userId: string): Promise<{ allowed: boolean; reason?: string }> {
        const { tier, limits, usage } = await this.getUserUsage(supabase, userId);

        if (usage.scrapes_used >= limits.dailyScrapes) {
            return {
                allowed: false,
                reason: `You have reached your daily scrape limit for the ${tier} tier. Please upgrade for more.`
            };
        }

        return { allowed: true };
    }

    /**
     * Increment scrape usage
     */
    static async recordScrape(supabase: SupabaseClient, userId: string) {
        const periodStart = new Date();
        periodStart.setHours(0, 0, 0, 0);
        const dateStr = periodStart.toISOString().split('T')[0];

        // Use upsert with increment logic (or a function)
        // Since we don't have an increment RPC easily, we'll do an update
        const { data: usage } = await supabase
            .from('user_usage_tracking')
            .select('scrapes_used')
            .eq('user_id', userId)
            .eq('period_start', dateStr)
            .single();

        if (usage) {
            await supabase
                .from('user_usage_tracking')
                .update({
                    scrapes_used: usage.scrapes_used + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('period_start', dateStr);
        } else {
            // Create new period entry
            await supabase
                .from('user_usage_tracking')
                .insert({
                    user_id: userId,
                    period_start: dateStr,
                    period_end: dateStr, // Daily tracking for now
                    scrapes_used: 1,
                    scrapes_limit: TIER_LIMITS['free'].dailyScrapes // Default
                });
        }
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
