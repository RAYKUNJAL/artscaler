/**
 * Market Aggregator Service
 * Computes aggregate market statistics from live eBay data.
 */

import { createServerClient } from '@/lib/supabase/server';
import { calculateGlobalPulse } from './global-pulse-calculator';

export interface MarketStats {
    globalPulse: number;
    activeListings: number;
    avgWvs: number;
    sellThroughRate: number;
    marketValue: number;
    activeAlerts: number;
    topStyles: any[];
    topSizes: any[];
    lastUpdated: string;
}

export class MarketAggregator {
    static async getGlobalStats(): Promise<MarketStats> {
        const supabase = await createServerClient();

        // 1. Get active listings count and value
        const { count: activeCount } = await supabase
            .from('active_listings')
            .select('*', { count: 'exact', head: true });

        const { data: activePriceData } = await supabase
            .from('active_listings')
            .select('price');

        const marketValue = activePriceData?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;

        // 2. Get sold listings count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: soldCount } = await supabase
            .from('ebay_sold_listings')
            .select('*', { count: 'exact', head: true })
            .gte('sold_date', thirtyDaysAgo.toISOString().split('T')[0]);

        // 3. Calculate Sell-Through Rate
        const sellThroughRate = (soldCount || 0) / ((soldCount || 0) + (activeCount || 0) || 1);

        // 4. Get average WVS from topic_scores_daily
        const { data: wvsData } = await supabase
            .from('topic_scores_daily')
            .select('wvs_score')
            .order('date', { ascending: false })
            .limit(10);

        const avgWvs = wvsData && wvsData.length > 0
            ? wvsData.reduce((sum, item) => sum + (item.wvs_score || 0), 0) / wvsData.length
            : 0;

        // 5. Calculate Global Pulse
        // Mock growth for now if we don't have historical data
        const activeListingsGrowth = 5.2; // %

        const globalPulse = calculateGlobalPulse({
            avgWvs,
            activeListingsGrowth,
            sellThroughRate: sellThroughRate * 100 // as %
        });

        // 6. Get Active Alerts (High WVS)
        const { count: activeAlerts } = await supabase
            .from('opportunity_feed')
            .select('*', { count: 'exact', head: true })
            .gte('wvs_score', 7.0);

        // 7. Get Top Styles (from database)
        const { data: topStyles } = await supabase
            .from('styles')
            .select('style_term, avg_wvs, listing_count')
            .order('avg_wvs', { ascending: false })
            .limit(5);

        // 8. Get Top Sizes
        const { data: topSizes } = await supabase
            .from('sizes')
            .select('size_cluster, avg_price, avg_wvs')
            .order('avg_wvs', { ascending: false })
            .limit(5);

        return {
            globalPulse,
            activeListings: activeCount || 0,
            avgWvs,
            sellThroughRate: sellThroughRate * 100,
            marketValue,
            activeAlerts: activeAlerts || 0,
            topStyles: topStyles || [],
            topSizes: topSizes || [],
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Update user dashboard cache
     */
    static async updateDashboardCache(userId: string): Promise<void> {
        const stats = await this.getGlobalStats();
        // Here we could add user-specific stats like "Your Scans"

        const supabase = await createServerClient();
        await supabase
            .from('user_dashboard_cache')
            .upsert({
                user_id: userId,
                stats_json: stats,
                last_updated_at: new Date().toISOString()
            });
    }
}
