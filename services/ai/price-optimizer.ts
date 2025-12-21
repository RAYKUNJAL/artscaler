/**
 * Price Band Optimizer
 * 
 * Suggests pricing bands without simple averages.
 * Uses median, percentiles, and outlier trimming for accurate pricing.
 * 
 * Outputs:
 * - Safe price: median (50th percentile)
 * - Aggressive price: 75th percentile
 * - Fast-sale price: 25th percentile
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface PriceBand {
    fastSale: number;    // 25th percentile - quick turnover
    safe: number;        // 50th percentile (median) - reliable
    aggressive: number;  // 75th percentile - premium positioning
    premium: number;     // 90th percentile - top tier
}

export interface PriceAnalysis {
    bands: PriceBand;
    sample: {
        count: number;
        minPrice: number;
        maxPrice: number;
        outliersTrimmed: number;
    };
    confidence: 'high' | 'medium' | 'low';
    recommendation: string;
    perSquareInch?: number;  // Price per sq inch if size known
}

export interface PriceQuery {
    style?: string;
    size?: string;
    medium?: string;
    category?: string;
}

// ============================================
// Price Band Optimizer Class
// ============================================

export class PriceBandOptimizer {
    private stdDevMultiplier = 2.5; // Trim outliers beyond 2.5 std dev

    /**
     * Get optimized price bands
     */
    async getPriceBands(supabase: SupabaseClient, query: PriceQuery): Promise<PriceAnalysis> {
        const prices = await this.fetchRelevantPrices(supabase, query);

        if (prices.length === 0) {
            return this.noDataResponse();
        }

        // Trim outliers
        const { trimmed, outliersRemoved } = this.trimOutliers(prices);

        if (trimmed.length < 3) {
            return this.lowDataResponse(prices);
        }

        // Calculate percentiles
        const sorted = [...trimmed].sort((a, b) => a - b);
        const bands = this.calculateBands(sorted);

        // Calculate confidence based on sample size
        let confidence: PriceAnalysis['confidence'];
        if (trimmed.length >= 20) confidence = 'high';
        else if (trimmed.length >= 10) confidence = 'medium';
        else confidence = 'low';

        // Generate recommendation
        const recommendation = this.generateRecommendation(bands, confidence, query);

        // Calculate price per square inch if size provided
        let perSquareInch: number | undefined;
        if (query.size) {
            const match = query.size.match(/(\d+)x(\d+)/);
            if (match) {
                const area = parseInt(match[1]) * parseInt(match[2]);
                perSquareInch = Math.round((bands.safe / area) * 100) / 100;
            }
        }

        return {
            bands,
            sample: {
                count: trimmed.length,
                minPrice: sorted[0],
                maxPrice: sorted[sorted.length - 1],
                outliersTrimmed: outliersRemoved,
            },
            confidence,
            recommendation,
            perSquareInch,
        };
    }

    /**
     * Fetch relevant prices from database
     */
    private async fetchRelevantPrices(supabase: SupabaseClient, query: PriceQuery): Promise<number[]> {
        // Start with size-based prices (most specific)
        if (query.size) {
            const { data: sizeData } = await supabase
                .from('active_listings')
                .select('current_price')
                .eq('is_active', true)
                .not('current_price', 'is', null);

            // Filter by size in memory (matching cluster)
            if (sizeData && sizeData.length > 0) {
                const prices = sizeData
                    .map((l) => l.current_price)
                    .filter((p): p is number => p !== null && p > 0);

                if (prices.length >= 5) {
                    return prices;
                }
            }
        }

        // Fall back to all active listings
        const { data: allData } = await supabase
            .from('active_listings')
            .select('current_price')
            .eq('is_active', true)
            .not('current_price', 'is', null)
            .gt('current_price', 0)
            .limit(500);

        if (allData && allData.length > 0) {
            return allData.map((l) => l.current_price).filter((p): p is number => p !== null);
        }

        // Last resort: use category medians
        const { data: categories } = await supabase
            .from('category_medians')
            .select('median_price')
            .limit(10);

        if (categories && categories.length > 0) {
            return categories.map((c) => c.median_price);
        }

        return [];
    }

    /**
     * Trim outliers using standard deviation
     */
    private trimOutliers(prices: number[]): { trimmed: number[]; outliersRemoved: number } {
        if (prices.length < 5) {
            return { trimmed: prices, outliersRemoved: 0 };
        }

        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const stdDev = Math.sqrt(
            prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length
        );

        const lowerBound = mean - this.stdDevMultiplier * stdDev;
        const upperBound = mean + this.stdDevMultiplier * stdDev;

        const trimmed = prices.filter((p) => p >= lowerBound && p <= upperBound);

        return {
            trimmed,
            outliersRemoved: prices.length - trimmed.length,
        };
    }

    /**
     * Calculate price bands from sorted array
     */
    private calculateBands(sorted: number[]): PriceBand {
        const len = sorted.length;

        const getPercentile = (p: number): number => {
            const index = Math.floor(len * p);
            return sorted[Math.min(index, len - 1)];
        };

        return {
            fastSale: Math.round(getPercentile(0.25) * 100) / 100,
            safe: Math.round(getPercentile(0.5) * 100) / 100,
            aggressive: Math.round(getPercentile(0.75) * 100) / 100,
            premium: Math.round(getPercentile(0.9) * 100) / 100,
        };
    }

    /**
     * Generate pricing recommendation text
     */
    private generateRecommendation(
        bands: PriceBand,
        confidence: PriceAnalysis['confidence'],
        query: PriceQuery
    ): string {
        const parts: string[] = [];

        // Context
        if (query.style && query.size) {
            parts.push(`For ${query.style} ${query.size}:`);
        } else if (query.style) {
            parts.push(`For ${query.style} style:`);
        } else if (query.size) {
            parts.push(`For ${query.size} size:`);
        } else {
            parts.push('Based on market data:');
        }

        // Main recommendation
        parts.push(`List at $${bands.safe} for reliable sales.`);

        // Additional guidance
        if (bands.aggressive > bands.safe * 1.3) {
            parts.push(`Premium pieces can reach $${bands.aggressive}.`);
        }

        if (confidence === 'low') {
            parts.push('(Limited data - verify with additional research)');
        }

        return parts.join(' ');
    }

    /**
     * Response when no data available
     */
    private noDataResponse(): PriceAnalysis {
        return {
            bands: {
                fastSale: 75,
                safe: 150,
                aggressive: 300,
                premium: 500,
            },
            sample: {
                count: 0,
                minPrice: 0,
                maxPrice: 0,
                outliersTrimmed: 0,
            },
            confidence: 'low',
            recommendation: 'No market data available. Using general art market defaults.',
        };
    }

    /**
     * Response when very little data
     */
    private lowDataResponse(prices: number[]): PriceAnalysis {
        const sorted = [...prices].sort((a, b) => a - b);
        const mid = sorted[Math.floor(sorted.length / 2)] || 150;

        return {
            bands: {
                fastSale: Math.round(mid * 0.7),
                safe: mid,
                aggressive: Math.round(mid * 1.4),
                premium: Math.round(mid * 2),
            },
            sample: {
                count: prices.length,
                minPrice: sorted[0] || 0,
                maxPrice: sorted[sorted.length - 1] || 0,
                outliersTrimmed: 0,
            },
            confidence: 'low',
            recommendation: 'Limited data available. Consider researching comparable sales.',
        };
    }

    /**
     * Get price trends over time
     */
    async getPriceTrends(supabase: SupabaseClient, query: PriceQuery, days = 30): Promise<Array<{
        date: string;
        medianPrice: number;
        listingCount: number;
    }>> {
        // Get daily WVS scores which include median prices
        const { data } = await supabase
            .from('wvs_scores_daily')
            .select('score_date, median_price, listing_count, entity_name')
            .eq('entity_type', query.style ? 'style' : (query.size ? 'size' : 'category'))
            .order('score_date', { ascending: true })
            .limit(days);

        if (!data || data.length === 0) {
            return [];
        }

        return data.map((row) => ({
            date: row.score_date,
            medianPrice: row.median_price || 0,
            listingCount: row.listing_count || 0,
        }));
    }

    /**
     * Compare prices across styles
     */
    async compareStyles(supabase: SupabaseClient, styles: string[]): Promise<Map<string, PriceBand>> {
        const results = new Map<string, PriceBand>();

        for (const style of styles) {
            const analysis = await this.getPriceBands(supabase, { style });
            results.set(style, analysis.bands);
        }

        return results;
    }

    /**
     * Get price per square inch analysis
     */
    async getPricePerSquareInch(supabase: SupabaseClient): Promise<Array<{
        size: string;
        pricePerSqIn: number;
        avgPrice: number;
        count: number;
    }>> {
        const { data: sizes } = await supabase
            .from('sizes')
            .select('size_cluster, width_inches, height_inches, avg_price, listing_count')
            .gt('listing_count', 0)
            .order('avg_price', { ascending: false });

        if (!sizes) return [];

        return sizes
            .filter((s) => s.width_inches && s.height_inches && s.avg_price)
            .map((s) => {
                const area = s.width_inches! * s.height_inches!;
                return {
                    size: s.size_cluster,
                    pricePerSqIn: Math.round((s.avg_price! / area) * 100) / 100,
                    avgPrice: s.avg_price!,
                    count: s.listing_count || 0,
                };
            })
            .sort((a, b) => b.pricePerSqIn - a.pricePerSqIn);
    }
}

// ============================================
// Singleton Instance
// ============================================

let optimizerInstance: PriceBandOptimizer | null = null;

export function getPriceOptimizer(): PriceBandOptimizer {
    if (!optimizerInstance) {
        optimizerInstance = new PriceBandOptimizer();
    }
    return optimizerInstance;
}

// ============================================
// Quick helpers
// ============================================

export async function getQuickPriceBands(
    supabase: SupabaseClient,
    style?: string,
    size?: string
): Promise<PriceBand> {
    const optimizer = getPriceOptimizer();
    const analysis = await optimizer.getPriceBands(supabase, { style, size });
    return analysis.bands;
}
