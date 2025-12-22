/**
 * Global Rate Limiter for eBay API
 * Respects the 5,000 calls/day limit
 */

import { createServerClient } from '@/lib/supabase/server';

export interface RateLimitStatus {
    current: number;
    limit: number;
    remaining: number;
    isBlocked: boolean;
}

export async function checkRateLimit(serviceName: string = 'ebay_finding_api'): Promise<RateLimitStatus> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('global_api_usage')
        .select('call_count, daily_limit')
        .eq('service_name', serviceName)
        .eq('usage_date', new Date().toISOString().split('T')[0])
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows'
        console.error('[Rate Limiter] Error checking limit:', error);
        // Default to safe if DB errors? Or block? Let's assume safe for now but log.
    }

    const current = data?.call_count || 0;
    const limit = data?.daily_limit || 5000;
    const remaining = limit - current;

    // Alert if we hit 80% (as per roadmap acceptance criteria)
    if (current >= limit * 0.8) {
        console.warn(`[Rate Limiter] ${serviceName} is at ${Math.round((current / limit) * 100)}% of daily limit!`);
    }

    return {
        current,
        limit,
        remaining,
        isBlocked: remaining <= 0
    };
}

export async function incrementApiUsage(serviceName: string = 'ebay_finding_api'): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase.rpc('increment_global_api_usage', {
        s_name: serviceName
    });

    if (error) {
        console.error('[Rate Limiter] Error incrementing usage:', error);
    }
}
