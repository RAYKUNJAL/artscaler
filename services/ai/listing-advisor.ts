/**
 * Listing Strategy Advisor
 * 
 * Recommends whether to list art as Auction or Buy It Now (BIN)
 * based on demand signals, competition, and historical data.
 * 
 * Rules:
 * - Auction: High WVS, low competition, unique pieces
 * - BIN: Clear price bands, reproducible styles, steady demand
 */

import { supabase } from '@/lib/supabase/client';
import { getWVSAgent, WVSScore } from './wvs-agent';

// ============================================
// Types
// ============================================

export type ListingType = 'Auction' | 'BuyItNow' | 'Both';

export interface ListingStrategy {
    recommendedType: ListingType;
    confidence: number;
    reasoning: string[];
    priceRecommendation: {
        startingPrice?: number;  // For auction
        binPrice?: number;       // For Buy It Now
        reservePrice?: number;   // Optional reserve
        priceRange: {
            low: number;   // 25th percentile
            mid: number;   // Median
            high: number;  // 75th percentile
        };
    };
    timing: {
        bestDay: string;
        bestDuration: number; // days
        reason: string;
    };
}

export interface StrategyInput {
    style?: string;
    size?: string;
    medium?: string;
    estimatedPrice?: number;
    isUnique?: boolean;       // One-of-a-kind piece
    hasMultiples?: boolean;   // Artist can reproduce
}

// ============================================
// Listing Strategy Advisor Class
// ============================================

export class ListingStrategyAdvisor {
    private wvsAgent = getWVSAgent();

    /**
     * Get listing strategy recommendation
     */
    async getStrategy(input: StrategyInput): Promise<ListingStrategy> {
        const reasoning: string[] = [];
        let auctionScore = 0;
        let binScore = 0;

        // ----------------------------------------
        // 1. Check WVS for the style
        // ----------------------------------------
        if (input.style) {
            const styleWvs = await this.getStyleWVS(input.style);
            if (styleWvs > 5) {
                auctionScore += 30;
                reasoning.push(`"${input.style}" style has high demand (WVS ${styleWvs.toFixed(2)}) - auction could drive bidding war`);
            } else if (styleWvs > 2) {
                binScore += 20;
                reasoning.push(`"${input.style}" has steady demand (WVS ${styleWvs.toFixed(2)}) - BIN ensures quick sale`);
            } else {
                binScore += 10;
                reasoning.push(`"${input.style}" has moderate demand - BIN with competitive price recommended`);
            }
        }

        // ----------------------------------------
        // 2. Check competition level
        // ----------------------------------------
        const competition = await this.getCompetition(input.style, input.size);
        if (competition.level === 'low') {
            auctionScore += 25;
            reasoning.push(`Low competition (${competition.count} similar listings) - auction can capture premium`);
        } else if (competition.level === 'high') {
            binScore += 25;
            reasoning.push(`High competition (${competition.count} similar listings) - BIN helps stand out with clear price`);
        } else {
            binScore += 10;
            auctionScore += 10;
        }

        // ----------------------------------------
        // 3. Unique vs. Reproducible
        // ----------------------------------------
        if (input.isUnique) {
            auctionScore += 20;
            reasoning.push('One-of-a-kind piece favors auction format - scarcity drives bidding');
        }

        if (input.hasMultiples) {
            binScore += 20;
            reasoning.push('Reproducible style favors BIN - consistent pricing for multiple pieces');
        }

        // ----------------------------------------
        // 4. Price analysis
        // ----------------------------------------
        const priceData = await this.getPriceBands(input.style, input.size);

        if (input.estimatedPrice) {
            if (input.estimatedPrice > priceData.high) {
                auctionScore += 15;
                reasoning.push(`Premium pricing ($${input.estimatedPrice}) - auction lets market determine value`);
            } else if (input.estimatedPrice < priceData.low) {
                binScore += 15;
                reasoning.push(`Competitive pricing ($${input.estimatedPrice}) - BIN for quick turnover`);
            }
        }

        // ----------------------------------------
        // 5. Determine recommendation
        // ----------------------------------------
        let recommendedType: ListingType;
        if (auctionScore > binScore + 15) {
            recommendedType = 'Auction';
        } else if (binScore > auctionScore + 15) {
            recommendedType = 'BuyItNow';
        } else {
            recommendedType = 'Both';
            reasoning.push('Consider hybrid: Auction with Buy It Now option');
        }

        const totalScore = auctionScore + binScore;
        const confidence = Math.min((Math.abs(auctionScore - binScore) / 50 + 0.5), 1.0);

        // ----------------------------------------
        // 6. Price recommendations
        // ----------------------------------------
        const priceRecommendation = this.calculatePriceRecommendation(
            recommendedType,
            priceData,
            input.estimatedPrice
        );

        // ----------------------------------------
        // 7. Timing recommendations
        // ----------------------------------------
        const timing = this.getTimingRecommendation(recommendedType);

        return {
            recommendedType,
            confidence: Math.round(confidence * 100) / 100,
            reasoning,
            priceRecommendation,
            timing,
        };
    }

    /**
     * Get WVS for a style
     */
    private async getStyleWVS(style: string): Promise<number> {
        const { data } = await supabase
            .from('styles')
            .select('avg_wvs')
            .eq('style_term', style.toLowerCase())
            .single();

        return data?.avg_wvs || 0;
    }

    /**
     * Get competition level
     */
    private async getCompetition(
        style?: string,
        size?: string
    ): Promise<{ level: 'low' | 'medium' | 'high'; count: number }> {
        let query = supabase
            .from('active_listings')
            .select('id', { count: 'exact' })
            .eq('is_active', true);

        // This is a simplified version - real implementation would use
        // listing_styles junction table and size matching

        const { count } = await query;
        const total = count || 0;

        if (total < 20) return { level: 'low', count: total };
        if (total > 100) return { level: 'high', count: total };
        return { level: 'medium', count: total };
    }

    /**
     * Get price bands for style/size combo
     */
    private async getPriceBands(
        style?: string,
        size?: string
    ): Promise<{ low: number; mid: number; high: number }> {
        // Try to get from sizes table first
        if (size) {
            const { data: sizeData } = await supabase
                .from('sizes')
                .select('avg_price')
                .eq('size_cluster', size)
                .single();

            if (sizeData?.avg_price) {
                const avg = sizeData.avg_price;
                return {
                    low: Math.round(avg * 0.75),
                    mid: Math.round(avg),
                    high: Math.round(avg * 1.25),
                };
            }
        }

        // Get from active listings
        const { data: listings } = await supabase
            .from('active_listings')
            .select('current_price')
            .eq('is_active', true)
            .not('current_price', 'is', null)
            .order('current_price', { ascending: true });

        if (!listings || listings.length === 0) {
            return { low: 100, mid: 200, high: 400 };
        }

        const prices = listings.map((l) => l.current_price).filter(Boolean) as number[];
        const sorted = prices.sort((a, b) => a - b);

        const q1Index = Math.floor(sorted.length * 0.25);
        const midIndex = Math.floor(sorted.length * 0.5);
        const q3Index = Math.floor(sorted.length * 0.75);

        return {
            low: sorted[q1Index] || 100,
            mid: sorted[midIndex] || 200,
            high: sorted[q3Index] || 400,
        };
    }

    /**
     * Calculate specific price recommendation
     */
    private calculatePriceRecommendation(
        type: ListingType,
        priceBands: { low: number; mid: number; high: number },
        estimatedPrice?: number
    ): ListingStrategy['priceRecommendation'] {
        const base: ListingStrategy['priceRecommendation'] = {
            priceRange: priceBands,
        };

        const targetPrice = estimatedPrice || priceBands.mid;

        switch (type) {
            case 'Auction':
                // Start low to attract bidders
                base.startingPrice = Math.round(targetPrice * 0.5);
                base.reservePrice = Math.round(targetPrice * 0.85);
                break;

            case 'BuyItNow':
                // Competitive but not lowest
                base.binPrice = Math.round(targetPrice * 1.1);
                break;

            case 'Both':
                // Auction with BIN option
                base.startingPrice = Math.round(targetPrice * 0.6);
                base.binPrice = Math.round(targetPrice * 1.15);
                break;
        }

        return base;
    }

    /**
     * Get timing recommendation
     */
    private getTimingRecommendation(type: ListingType): ListingStrategy['timing'] {
        switch (type) {
            case 'Auction':
                return {
                    bestDay: 'Sunday',
                    bestDuration: 7,
                    reason: 'End auctions on Sunday evening for peak traffic. 7-day duration builds momentum.',
                };

            case 'BuyItNow':
                return {
                    bestDay: 'Thursday',
                    bestDuration: 30,
                    reason: 'List on Thursday for weekend shoppers. 30-day Good Til Cancelled for visibility.',
                };

            case 'Both':
                return {
                    bestDay: 'Sunday',
                    bestDuration: 7,
                    reason: '7-day auction with BIN ends on Sunday. Quick sale option if someone loves it.',
                };
        }
    }

    /**
     * Batch analyze multiple strategies
     */
    async analyzeMultiple(inputs: StrategyInput[]): Promise<ListingStrategy[]> {
        const results: ListingStrategy[] = [];
        for (const input of inputs) {
            results.push(await this.getStrategy(input));
        }
        return results;
    }
}

// ============================================
// Singleton Instance
// ============================================

let advisorInstance: ListingStrategyAdvisor | null = null;

export function getListingAdvisor(): ListingStrategyAdvisor {
    if (!advisorInstance) {
        advisorInstance = new ListingStrategyAdvisor();
    }
    return advisorInstance;
}
