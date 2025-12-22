/**
 * WVS Agent - Watch Velocity Score Calculator
 * 
 * The core demand intelligence engine for eBay Art Pulse Pro.
 * Replaces the Nolan Score with a watch-count based demand metric.
 */

import { SupabaseClient } from '@supabase/supabase-js';

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

// Supabase table types (simplified for this context)
interface SoldListing {
    id: string;
    title: string;
    bid_count: number | null;
    sold_price: number | null;
    created_at: string;
    parsed_signals: Array<{ size_bucket: string; style: string }> | null;
}

interface ActiveListing {
    id: string;
    title: string;
    watcher_count: number | null;
    bid_count: number | null;
    current_price: number | null;
    first_seen_at: string | null;
    created_at: string;
    width_in: number | null;
    height_in: number | null;
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
// WVS Agent Class
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

interface StyleClusterData {
    totalWvs: number;
    count: number;
    prices: number[];
    items: ListingWVS[];
}

interface SizeClusterData {
    totalWvs: number;
    count: number;
    prices: number[];
}

export class WVSAgent {
    private categoryMedians: Map<string, number> = new Map();
    private defaultMedianPrice = 150;
    private initialized = false;

    private async ensureInitialized(supabase: SupabaseClient): Promise<void> {
        if (this.initialized) return;

        try {
            const { data, error } = await supabase
                .from('pricing_analysis')
                .select('size_bucket, median_price');

            if (!error && data) {
                data.forEach((row) => {
                    this.categoryMedians.set(row.size_bucket, row.median_price);
                });
            }
            this.initialized = true;
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

    public async processPipeline(supabase: SupabaseClient, userId: string, runId?: string): Promise<WVSReport> {
        console.log(`🚀 WVS Agent: Starting Pipeline Processing for user ${userId}...`);
        await this.ensureInitialized(supabase);

        // 1. Fetch Sold Listings (Historical Demand)
        let soldQuery = supabase
            .from('sold_listings_clean')
            .select(`*, parsed_signals (*)`)
            .eq('user_id', userId);

        if (runId) soldQuery = soldQuery.eq('run_id', runId);
        const { data: soldListings } = await soldQuery.limit(500);

        // 2. Fetch Active Listings (Real-time Demand)
        const { data: activeListings } = await supabase
            .from('active_listings')
            .select(`*`)
            .eq('user_id', userId)
            .eq('is_active', true)
            .limit(500);

        const totalToProcess = (soldListings?.length || 0) + (activeListings?.length || 0);
        if (totalToProcess === 0) {
            console.log('⚠️ WVS Agent: No listings found to process.');
            return this.emptyReport();
        }

        console.log(`📊 WVS Agent: Processing ${totalToProcess} listings (${soldListings?.length || 0} sold, ${activeListings?.length || 0} active)`);

        const styleClusters = new Map<string, StyleClusterData>();
        const sizeClusters = new Map<string, SizeClusterData>();

        // 3. Process Sold Listings
        for (const listing of soldListings || []) {
            const daysActive = this.calculateDaysActive(listing.created_at);
            const signals = listing.parsed_signals?.[0];

            const score = this.calculateWVS({
                watcherCount: listing.bid_count || 0,
                bidCount: listing.bid_count || 0,
                daysActive,
                itemPrice: listing.sold_price || 0,
                categoryMedianPrice: this.categoryMedians.get(signals?.size_bucket || '') || 150
            });

            this.addToClusters(listing, score, signals?.style || 'Abstract', signals?.size_bucket || 'medium', styleClusters, sizeClusters);
        }

        // 4. Process Active Listings
        for (const listing of activeListings || []) {
            const daysActive = this.calculateDaysActive(listing.first_seen_at || listing.created_at);

            const score = this.calculateWVS({
                watcherCount: listing.watcher_count || 0,
                bidCount: listing.bid_count || 0,
                daysActive,
                itemPrice: listing.current_price || 0,
                categoryMedianPrice: this.categoryMedians.get(this.categorizeSize(listing.width_in, listing.height_in)) || 150
            });

            // Update active_listing with demand_score and wvs
            await supabase
                .from('active_listings')
                .update({
                    demand_score: Math.min(score.wvs * 10, 100),
                    watcher_velocity: score.components.pulseVelocity
                })
                .eq('id', listing.id);

            this.addToClusters(listing, score, 'Abstract', this.categorizeSize(listing.width_in, listing.height_in), styleClusters, sizeClusters);
        }

        // 5. Format outcomes
        const topStyles = this.finalizeStyleClusters(styleClusters);
        const topSizes = this.finalizeSizeClusters(sizeClusters);

        // 6. Sync to Global Metrics Tables (styles, sizes)
        await this.syncGlobalMetrics(supabase, topStyles, topSizes);

        // 7. Persist to Opportunities
        await this.saveAnalysis(supabase, userId, topStyles, runId);

        return {
            generatedAt: new Date().toISOString(),
            totalListingsAnalyzed: totalToProcess,
            topStyles,
            topSizes,
            recommendations: this.generateRecommendations(topStyles)
        };
    }

    private addToClusters(listing: SoldListing | ActiveListing, score: WVSScore, style: string, size: string, styleClusters: Map<string, StyleClusterData>, sizeClusters: Map<string, SizeClusterData>) {
        const listingWvs: ListingWVS = {
            listingId: listing.id,
            title: listing.title,
            wvs: score,
            watcherCount: 'watcher_count' in listing ? (listing.watcher_count || 0) : (listing.bid_count || 0), // Use watcher_count for active, bid_count for sold as a proxy
            bidCount: listing.bid_count || 0,
            price: 'sold_price' in listing ? (listing.sold_price || 0) : (listing.current_price || 0),
            daysActive: score.confidence > 0.5 ? 7 : 1, // This seems like a placeholder, consider using actual daysActive from input
        };

        const currentStyle = styleClusters.get(style) || { totalWvs: 0, count: 0, prices: [], items: [] };
        currentStyle.totalWvs += score.wvs;
        currentStyle.count += 1;
        currentStyle.prices.push(listingWvs.price);
        currentStyle.items.push(listingWvs);
        styleClusters.set(style, currentStyle);

        const currentSize = sizeClusters.get(size) || { totalWvs: 0, count: 0, prices: [] };
        currentSize.totalWvs += score.wvs;
        currentSize.count += 1;
        currentSize.prices.push(listingWvs.price);
        sizeClusters.set(size, currentSize);
    }

    private finalizeStyleClusters(styleClusters: Map<string, StyleClusterData>): StyleWVS[] {
        return Array.from(styleClusters.entries())
            .map(([style, data]) => ({
                styleTerm: style,
                avgWvs: data.totalWvs / data.count,
                listingCount: data.count,
                demandScore: Math.min((data.totalWvs / data.count) * 10, 10),
                topListings: data.items.sort((a: ListingWVS, b: ListingWVS) => b.wvs.wvs - a.wvs.wvs).slice(0, 5)
            }))
            .sort((a, b) => b.avgWvs - a.avgWvs);
    }

    private finalizeSizeClusters(sizeClusters: Map<string, SizeClusterData>): SizeWVS[] {
        return Array.from(sizeClusters.entries())
            .map(([size, data]) => ({
                sizeCluster: size,
                avgWvs: data.totalWvs / data.count,
                avgPrice: data.prices.reduce((a: number, b: number) => a + b, 0) / data.count,
                listingCount: data.count,
                demandScore: Math.min((data.totalWvs / data.count) * 10, 10)
            }))
            .sort((a, b) => b.avgWvs - a.avgWvs);
    }

    private async syncGlobalMetrics(supabase: SupabaseClient, styles: StyleWVS[], sizes: SizeWVS[]) {
        console.log('🌐 WVS Agent: Syncing global metrics...');

        for (const style of styles) {
            await supabase.from('styles').upsert({
                style_term: style.styleTerm,
                avg_wvs: style.avgWvs,
                demand_score: style.demandScore,
                listing_count: style.listingCount,
                updated_at: new Date().toISOString()
            }, { onConflict: 'style_term' });
        }

        for (const size of sizes) {
            await supabase.from('sizes').upsert({
                size_cluster: size.sizeCluster,
                avg_wvs: size.avgWvs,
                avg_price: size.avgPrice,
                demand_score: size.demandScore,
                listing_count: size.listingCount,
                updated_at: new Date().toISOString()
            }, { onConflict: 'size_cluster' });
        }
    }

    private categorizeSize(width: number | null, height: number | null): string {
        if (!width || !height) return 'medium';
        const area = width * height;
        if (area < 200) return 'small';
        if (area < 600) return 'medium';
        if (area < 1200) return 'large';
        return 'extra-large';
    }

    private async saveAnalysis(supabase: SupabaseClient, userId: string, styles: StyleWVS[], runId?: string) {
        console.log('💾 WVS Agent: Saving analysis to opportunity feed...');

        for (let i = 0; i < Math.min(styles.length, 5); i++) {
            const style = styles[i];
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
                await supabase.from('topic_scores_daily').insert({
                    run_id: runId,
                    topic_id: topic.id,
                    date: new Date().toISOString().split('T')[0],
                    wvs_score: style.avgWvs,
                    velocity_score: style.avgWvs,
                    median_price: style.topListings[0]?.price || 150
                });

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
