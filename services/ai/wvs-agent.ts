/**
 * WVS Agent - Watch Velocity Score Calculator
 * 
 * The core demand intelligence engine for eBay Art Pulse Pro.
 * Replaces the Nolan Score with a watch-count based demand metric.
 * 
 * Formula:
 * WVS = ((watchCount + (bidCount * 2)) / daysActive) * (1 / normalizedPriceFactor) * competitionAdjustment
 * 
 * Components:
 * - daysActive: Current date - listing start date + 1
 * - normalizedPriceFactor: itemPrice / categoryMedianPrice (penalize >2x median)
 * - competitionAdjustment: 1 / (1 + similarListingsCount)
 * - Bid Weight: Bids are weighted 2x relative to watches as they represent harder intent.
 */

import { supabase } from '@/lib/supabase/client';

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// Types
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

export interface WVSInput {
    watcherCount: number;
    bidCount: number;
    daysActive: number;
    itemPrice: number;
    categoryMedianPrice?: number;
    similarListingsCount?: number;
}

export interface WVSScore {
    wvs: number;
    label: 'High Demand' | 'Solid Demand' | 'Moderate Demand' | 'Low Demand';
    components: {
        pulseVelocity: number;
        normalizedPriceFactor: number;
        competitionAdjustment: number;
    };
    confidence: number;
}

export interface ListingWVS {
    listingId: string;
    title: string;
    wvs: WVSScore;
    watcherCount: number;
    bidCount: number;
    price: number;
    daysActive: number;
}

export interface StyleWVS {
    styleTerm: string;
    avgWvs: number;
    listingCount: number;
    demandScore: number;
    topListings: ListingWVS[];
}

export interface SizeWVS {
    sizeCluster: string;
    avgWvs: number;
    avgPrice: number;
    listingCount: number;
    demandScore: number;
}

export interface WVSReport {
    generatedAt: string;
    totalListingsAnalyzed: number;
    topStyles: StyleWVS[];
    topSizes: SizeWVS[];
    recommendations: string[];
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// WVS Agent Class
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

export class WVSAgent {
    private categoryMedians: Map<string, number> = new Map();
    private defaultMedianPrice = 150;

    constructor() {
        this.loadCategoryMedians();
    }

    private async loadCategoryMedians(): Promise<void> {
        try {
            const { data, error } = await supabase
                .from('pricing_analysis')
                .select('size_bucket, median_price');

            if (!error && data) {
                data.forEach((row) => {
                    this.categoryMedians.set(row.size_bucket, row.median_price);
                });
            }
        } catch (err) {
            console.warn('WVSAgent: Could not load category medians');
        }
    }

    public calculateWVS(input: WVSInput): WVSScore {
        const {
            watcherCount,
            bidCount = 0,
            daysActive,
            itemPrice,
            categoryMedianPrice = this.defaultMedianPrice,
            similarListingsCount = 0,
        } = input;

        const safeDaysActive = Math.max(daysActive, 1);
        const safeMedianPrice = Math.max(categoryMedianPrice, 1);
        const safeSimilar = Math.max(similarListingsCount, 0);

        // Pulse Velocity = watchers + weighted bids per day
        const pulseVelocity = (watcherCount + (bidCount * 2)) / safeDaysActive;

        let normalizedPriceFactor = itemPrice / safeMedianPrice;
        if (normalizedPriceFactor > 2) {
            normalizedPriceFactor *= 1.5;
        }
        normalizedPriceFactor = Math.max(normalizedPriceFactor, 0.1);

        const competitionAdjustment = 1 / (1 + safeSimilar);

        const wvs = (pulseVelocity * (1 / normalizedPriceFactor)) * competitionAdjustment;

        let label: WVSScore['label'];
        if (wvs > 5) label = 'High Demand';
        else if (wvs > 2) label = 'Solid Demand';
        else if (wvs > 1) label = 'Moderate Demand';
        else label = 'Low Demand';

        const confidence = this.calculateConfidence(watcherCount, bidCount, daysActive);

        return {
            wvs: Math.round(wvs * 10000) / 10000,
            label,
            components: {
                pulseVelocity: Math.round(pulseVelocity * 100) / 100,
                normalizedPriceFactor: Math.round(normalizedPriceFactor * 100) / 100,
                competitionAdjustment: Math.round(competitionAdjustment * 100) / 100,
            },
            confidence: Math.round(confidence * 100) / 100,
        };
    }

    private calculateConfidence(watcherCount: number, bidCount: number, daysActive: number): number {
        let confidence = 0.5;
        if (watcherCount + bidCount >= 10) confidence += 0.2;
        if (daysActive >= 7) confidence += 0.2;
        return Math.min(confidence, 1.0);
    }

    /**
     * Calculate WVS for all listings in the database and save results.
     * This is the heart of the AI pipeline.
     */
    public async processPipeline(userId: string, runId?: string): Promise<WVSReport> {
        console.log('🚀 WVS Agent: Starting Pipeline Processing...');

        // 1. Fetch clean sold listings
        let query = supabase
            .from('sold_listings_clean')
            .select(`
                *,
                parsed_signals (*)
            `)
            .eq('user_id', userId);

        if (runId) {
            query = query.eq('run_id', runId);
        }

        const { data: listings, error } = await query.limit(500);

        if (error || !listings) {
            console.error('❌ WVS Agent: Error fetching listings:', error);
            return this.emptyReport();
        }

        console.log(`📊 WVS Agent: Processing ${listings.length} listings`);

        const results: ListingWVS[] = [];
        const styleClusters = new Map<string, { totalWvs: number; count: number; prices: number[]; items: ListingWVS[] }>();
        const sizeClusters = new Map<string, { totalWvs: number; count: number; prices: number[] }>();

        for (const listing of listings) {
            const daysActive = this.calculateDaysActive(listing.created_at);
            const signals = listing.parsed_signals?.[0];

            const score = this.calculateWVS({
                watcherCount: listing.bid_count || 0, // Fallback bids to watchers if watchers unknown
                bidCount: listing.bid_count || 0,
                daysActive,
                itemPrice: listing.sold_price || 0,
                categoryMedianPrice: this.categoryMedians.get(signals?.size_bucket || '') || 150
            });

            const listingWvs: ListingWVS = {
                listingId: listing.id,
                title: listing.title,
                wvs: score,
                watcherCount: 0,
                bidCount: listing.bid_count || 0,
                price: listing.sold_price || 0,
                daysActive,
            };

            results.push(listingWvs);

            // Cluster by style
            const style = signals?.style || 'Abstract';
            const currentStyle = styleClusters.get(style) || { totalWvs: 0, count: 0, prices: [], items: [] };
            currentStyle.totalWvs += score.wvs;
            currentStyle.count += 1;
            currentStyle.prices.push(listing.sold_price || 0);
            currentStyle.items.push(listingWvs);
            styleClusters.set(style, currentStyle);

            // Cluster by size
            const size = signals?.size_bucket || 'medium';
            const currentSize = sizeClusters.get(size) || { totalWvs: 0, count: 0, prices: [] };
            currentSize.totalWvs += score.wvs;
            currentSize.count += 1;
            currentSize.prices.push(listing.sold_price || 0);
            sizeClusters.set(size, currentSize);
        }

        // 2. Format outcomes
        const topStyles: StyleWVS[] = Array.from(styleClusters.entries())
            .map(([style, data]) => ({
                styleTerm: style,
                avgWvs: data.totalWvs / data.count,
                listingCount: data.count,
                demandScore: Math.min((data.totalWvs / data.count) * 10, 10),
                topListings: data.items.sort((a, b) => b.wvs.wvs - a.wvs.wvs).slice(0, 5)
            }))
            .sort((a, b) => b.avgWvs - a.avgWvs);

        const topSizes: SizeWVS[] = Array.from(sizeClusters.entries())
            .map(([size, data]) => ({
                sizeCluster: size,
                avgWvs: data.totalWvs / data.count,
                avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.count,
                listingCount: data.count,
                demandScore: Math.min((data.totalWvs / data.count) * 10, 10)
            }))
            .sort((a, b) => b.avgWvs - a.avgWvs);

        // 3. Persist to Opportunities
        await this.saveAnalysis(userId, topStyles, runId);

        return {
            generatedAt: new Date().toISOString(),
            totalListingsAnalyzed: listings.length,
            topStyles,
            topSizes,
            recommendations: this.generateRecommendations(topStyles)
        };
    }

    private async saveAnalysis(userId: string, styles: StyleWVS[], runId?: string) {
        console.log('💾 WVS Agent: Saving analysis to opportunity feed...');

        for (let i = 0; i < Math.min(styles.length, 5); i++) {
            const style = styles[i];

            // Upsert topic cluster
            const slug = style.styleTerm.toLowerCase().replace(/\s+/g, '-');
            const { data: topic } = await supabase
                .from('topic_clusters')
                .upsert({
                    topic_slug: slug,
                    topic_label: style.styleTerm,
                    topic_description: `High demand style: ${style.styleTerm}`
                }, { onConflict: 'topic_slug' })
                .select()
                .single();

            if (topic) {
                // Save daily score
                await supabase.from('topic_scores_daily').insert({
                    run_id: runId,
                    topic_id: topic.id,
                    date: new Date().toISOString().split('T')[0],
                    nolan_score: style.demandScore * 10, // Scale to 0-100
                    velocity_score: style.avgWvs,
                    median_price: style.topListings[0]?.price || 150
                });

                // Save opportunity
                await supabase.from('opportunity_feed').upsert({
                    user_id: userId,
                    run_id: runId,
                    date: new Date().toISOString().split('T')[0],
                    rank: i + 1,
                    topic_id: topic.id,
                    topic_label: style.styleTerm,
                    wvs_score: style.avgWvs,
                    velocity_score: style.avgWvs,
                    recommended_price_band: {
                        median: style.topListings[0]?.price || 150,
                        min: Math.round((style.topListings[0]?.price || 150) * 0.7),
                        max: Math.round((style.topListings[0]?.price || 150) * 1.5)
                    },
                    recommended_sizes: ['16x20', '24x36'],
                    keyword_stack: [style.styleTerm, 'original art', 'painting'],
                    evidence_urls: style.topListings.map(l => `https://www.ebay.com/itm/${l.listingId}`)
                }, { onConflict: 'user_id,date,rank' });
            }
        }
    }

    private generateRecommendations(styles: StyleWVS[]): string[] {
        if (styles.length === 0) return ['Insufficient data for recommendations. Scan more subjects.'];
        const top = styles[0];
        return [
            `Focus on '${top.styleTerm}' which shows ${top.avgWvs.toFixed(1)}x higher demand than average.`,
            `The target price band for high-velocity liquidations is $${Math.round(top.topListings[0]?.price * 0.8 || 120)}-$${Math.round(top.topListings[0]?.price * 1.2 || 200)}.`,
            `Optimize titles with keywords: ${top.styleTerm}, original, canvas.`
        ];
    }

    private calculateDaysActive(firstSeenAt: string | null): number {
        if (!firstSeenAt) return 1;
        const start = new Date(firstSeenAt);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1, 1);
    }

    private emptyReport(): WVSReport {
        return {
            generatedAt: new Date().toISOString(),
            totalListingsAnalyzed: 0,
            topStyles: [],
            topSizes: [],
            recommendations: []
        };
    }
}

let wvsAgentInstance: WVSAgent | null = null;
export function getWVSAgent(): WVSAgent {
    if (!wvsAgentInstance) wvsAgentInstance = new WVSAgent();
    return wvsAgentInstance;
}
