
import { SupabaseClient } from '@supabase/supabase-js';
import { getPatternMiner, PatternStats } from './pattern-miner';

export interface TrendMomentum {
    term: string;
    type: 'style' | 'size' | 'medium' | 'subject';
    momentumScore: number; // 0-100
    velocityChange: number; // percentage change
    priceChange: number; // percentage change
    socialSignal: number; // 0-100
    overallRank: number;
    status: 'exploding' | 'rising' | 'stable' | 'fading';
}

export class TrendEngine {
    private miner = getPatternMiner();

    /**
     * Calculate momentum for all identified art patterns
     */
    async discoverTrends(supabase: SupabaseClient): Promise<TrendMomentum[]> {
        console.log('[TrendEngine] Analyzing multi-source signals...');

        // 1. Get current market stats from PatternMiner
        const styles = await this.miner.getTopStyles(supabase, 50);
        const sizes = await this.miner.getTopSizes(supabase, 20);

        // 2. Synthesize trends
        const trends: TrendMomentum[] = [];

        for (const style of styles) {
            trends.push(this.calculateMomentum(style, 'style'));
        }

        for (const size of sizes) {
            trends.push(this.calculateMomentum(size, 'size'));
        }

        return trends.sort((a, b) => b.momentumScore - a.momentumScore);
    }

    /**
     * Calculate momentum for a single term
     */
    private calculateMomentum(stats: PatternStats, type: TrendMomentum['type']): TrendMomentum {
        // Simulate historical comparison (Real app would use a trend_snapshots table)
        const historicalWvs = stats.avgWvs * (0.8 + Math.random() * 0.4); // +/- 20%
        const velocityChange = stats.avgWvs > 0
            ? ((stats.avgWvs - historicalWvs) / historicalWvs) * 100
            : 0;

        // Social Signal Simulation
        const socialSignal = this.getSocialSignal(stats.term);

        // Momentum Score Formula:
        const momentumScore = Math.min(
            (stats.avgWvs * 4) + (velocityChange * 0.5) + (socialSignal * 0.3),
            100
        );

        let status: TrendMomentum['status'] = 'stable';
        if (momentumScore > 80 || velocityChange > 30) status = 'exploding';
        else if (momentumScore > 60 || velocityChange > 10) status = 'rising';
        else if (momentumScore < 30 || velocityChange < -20) status = 'fading';

        return {
            term: stats.term,
            type,
            momentumScore: Math.round(momentumScore * 10) / 10,
            velocityChange: Math.round(velocityChange * 10) / 10,
            priceChange: 0,
            socialSignal,
            overallRank: 0,
            status
        };
    }

    /**
     * Simulate social signals for art terms
     */
    private getSocialSignal(term: string): number {
        const highValueTerms = [
            'abstract', 'mid-century', 'boho', 'minimalist',
            'large scale', 'textured', 'neutral', 'gold leaf',
            'contemporary', 'street art'
        ];

        const isTrending = highValueTerms.some(t => term.toLowerCase().includes(t));
        return isTrending ? 70 + Math.random() * 30 : 20 + Math.random() * 40;
    }
}

let trendEngineInstance: TrendEngine | null = null;
export function getTrendEngine(): TrendEngine {
    if (!trendEngineInstance) {
        trendEngineInstance = new TrendEngine();
    }
    return trendEngineInstance;
}
