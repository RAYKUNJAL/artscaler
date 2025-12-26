import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { MarketAggregator } from '@/services/analytics/market-aggregator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try to get from cache first
        const { data: cache } = await supabase
            .from('user_dashboard_cache')
            .select('stats_json, last_updated_at')
            .eq('user_id', user.id)
            .single();

        // If cache is older than 5 minutes, refresh it in the background
        const cacheAge = cache ? (Date.now() - new Date(cache.last_updated_at).getTime()) : Infinity;

        if (cache && cacheAge < 300000) { // 5 minutes
            return NextResponse.json({
                success: true,
                stats: cache.stats_json,
                fromCache: true
            });
        }

        // Fetch fresh stats
        const stats = await MarketAggregator.getGlobalStats();
        const usage = await MarketAggregator.getUserUsage(user.id);

        const statsWithUsage = {
            ...stats,
            dailyUsage: usage
        };

        // Update cache (async)
        MarketAggregator.updateDashboardCache(user.id).catch(err => {
            console.error('[Dashboard API] Cache update error:', err);
        });

        return NextResponse.json({
            success: true,
            stats: statsWithUsage,
            fromCache: false
        });

    } catch (error: any) {
        console.error('[Dashboard API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
