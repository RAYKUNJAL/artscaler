import { createServerClient } from '@/lib/supabase/server';

export interface DemandMetrics {
    watcherVelocity: number;
    bidEngagementRatio: number;
    priceToWatchRatio: number;
    demandScore: number;
}

export class DemandMetricsEngine {
    /**
     * Calculates metrics for a specific listing based on the v1.0.0 formula.
     * Formula: (Watcher Velocity * 0.4) + (Bid Engagement * 0.4) + (Complexity * 2 [normalized])
     */
    static calculateScore(data: {
        watcherCount: number;
        bidCount: number;
        timeSinceListedHours: number;
        currentPrice: number;
        visualComplexity: number; // 1-10
    }): DemandMetrics {
        const { watcherCount, bidCount, timeSinceListedHours, currentPrice, visualComplexity } = data;

        // 1. Watcher Velocity (Watchers per Hour)
        // Normalize: 1 watcher/hour = 100 points (cap at 100)
        const velocity = timeSinceListedHours > 0 ? (watcherCount / timeSinceListedHours) : 0;
        const normalizedVelocity = Math.min(velocity * 100, 100);

        // 2. Bid Engagement Ratio (Bids per Watcher)
        // High engagement means watchers are converting to buyers
        const engagement = watcherCount > 0 ? (bidCount / watcherCount) : 0;
        const normalizedEngagement = Math.min(engagement * 100, 100);

        // 3. Price to Watch Ratio
        const priceToWatchRatio = watcherCount > 0 ? (currentPrice / watcherCount) : currentPrice;

        // 4. Final Demand Score (0-100)
        // Formula weights: 0.4, 0.4, 0.2
        const demandScore =
            (normalizedVelocity * 0.4) +
            (normalizedEngagement * 0.4) +
            (visualComplexity * 2); // visualComplexity (1-10) * 2 = 20 max

        return {
            watcherVelocity: velocity,
            bidEngagementRatio: engagement,
            priceToWatchRatio,
            demandScore: parseFloat(demandScore.toFixed(2))
        };
    }

    /**
     * Batch process all active listings to refresh their demand scores
     */
    async refreshAllScores() {
        const supabase = await createServerClient();

        // Fetch active listings that need update
        const { data: listings } = await supabase
            .from('active_listings')
            .select(`
                id, 
                watcher_count, 
                bid_count, 
                time_since_listed_hours, 
                current_price,
                art_patterns (visual_complexity_score)
            `)
            .eq('is_active', true);

        if (!listings) return;

        for (const listing of listings) {
            const complexity = listing.art_patterns?.[0]?.visual_complexity_score || 5; // Default to mid

            const metrics = DemandMetricsEngine.calculateScore({
                watcherCount: listing.watcher_count || 0,
                bidCount: listing.bid_count || 0,
                timeSinceListedHours: listing.time_since_listed_hours || 1,
                currentPrice: listing.current_price || 0,
                visualComplexity: complexity
            });

            await supabase
                .from('active_listings')
                .update({
                    demand_score: metrics.demandScore,
                    watcher_velocity: metrics.watcherVelocity,
                    last_updated_at: new Date().toISOString()
                })
                .eq('id', listing.id);
        }
    }
}
