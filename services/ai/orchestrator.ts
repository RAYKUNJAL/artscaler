/**
 * PulseOrchestrator - AI Pipeline Orchestrator (V2)
 * 
 * Orchestrates the full AI pipeline for eBay Art Pulse Pro:
 * 1. Data Cleaning (ebay_sold_listings -> sold_listings_clean)
 * 2. Feature Extraction (ParserAgent)
 * 3. Topic Discovery (ClusteringAgent)
 * 4. Pulse Scoring (WVSAgent - Pulse Velocity)
 * 5. Smart Listing Generation (ListingGeneratorAgent)
 * 6. Opportunity Publishing (PublisherAgent)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getParserAgent } from './parser-agent';
import { getClusteringAgent } from './clustering-agent';
import { getWVSAgent } from './wvs-agent';
import { getListingGeneratorAgent } from './listing-generator-agent';
import { getPublisherAgent } from './publisher-agent';
import { getVisualAgent } from './visual-agent';

export class PulseOrchestrator {
    /**
     * Run the full Pulse pipeline for a user
     */
    async runPulsePipeline(supabase: SupabaseClient, userId: string, keyword?: string) {
        console.log(`🚀 Starting eBay Art Pulse Pro Pipeline for user: ${userId}`);

        const date = new Date().toISOString().split('T')[0];

        try {
            // 1. Create Scrape Run
            const { data: run, error: runError } = await supabase
                .from('scrape_runs')
                .insert({
                    status: 'running',
                    runner: 'manual',
                    app_version: '2.0.0' // eBay Art Pulse Pro V2
                })
                .select()
                .single();

            if (runError) throw runError;
            const runId = run.id;
            console.log(`✓ Created Pulse Run: ${runId}`);

            // 2. Data Cleaning / Bridge
            const itemsCleaned = await this.bridgeData(supabase, runId, userId, keyword);
            console.log(`✓ Cleaned ${itemsCleaned} listings`);

            if (itemsCleaned === 0) {
                await this.updateRunStatus(supabase, runId, 'partial', 'No listings found to process');
                return { success: false, message: 'No data to process' };
            }

            // 3. Parsing (Feature Extraction)
            const parserAgent = getParserAgent();
            const itemsParsed = await parserAgent.parseListings(supabase, runId, userId);
            console.log(`✓ Parsed ${itemsParsed} signals`);

            // 4. Clustering (Topic Discovery)
            const clusteringAgent = getClusteringAgent();
            const clustersCreated = await clusteringAgent.clusterListings(supabase, runId, userId);
            console.log(`✓ Discovered ${clustersCreated} pulse topics`);

            // 5. Pulse Scoring (New WVS Logic)
            const wvsAgent = getWVSAgent();
            const report = await wvsAgent.processPipeline(supabase, userId, runId);
            console.log(`✓ Generated Pulse Velocity Report: ${report.totalListingsAnalyzed} analyzed`);

            // 6. Visual Analysis (New Visual Gallery Logic)
            try {
                const visualAgent = getVisualAgent();
                const processedImages = await visualAgent.processVisualIntelligence(supabase, userId, 25);
                console.log(`✓ Analyzed ${processedImages} artwork images visually`);
            } catch (vError) {
                console.error('⚠ Visual Intelligence step failed (non-critical):', vError);
            }

            // 7. Template Generation
            const generatorAgent = getListingGeneratorAgent();
            // In V2 we iterate over discovered clusters to build templates
            const { data: clusters } = await supabase
                .from('topic_clusters')
                .select('topic_label')
                .eq('run_id', runId);

            if (clusters) {
                for (const cluster of clusters) {
                    await generatorAgent.generatePulseListing(supabase, cluster.topic_label, 150, 5.0);
                }
            }
            console.log(`✓ Built smart listing templates`);

            // 7. Opportunity Publishing
            const publisherAgent = getPublisherAgent();
            const opportunitiesPublished = await publisherAgent.publishOpportunities(supabase, runId, userId, date);
            console.log(`✓ Published ${opportunitiesPublished} opportunities`);

            // 8. Final Status Update
            await this.updateRunStatus(supabase, runId, 'success', undefined, {
                records_inserted_clean: itemsCleaned,
                records_scored: clusters?.length || 0
            });

            console.log('✅ eBay Art Pulse Pro Pipeline completed successfully!');
            return {
                success: true,
                runId,
                stats: {
                    itemsCleaned,
                    itemsParsed,
                    opportunitiesPublished
                }
            };

        } catch (error: any) {
            console.error('❌ Pulse Pipeline critical failure:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Bridges data from ebay_sold_listings to sold_listings_clean
     */
    private async bridgeData(supabase: SupabaseClient, runId: string, userId: string, keyword?: string): Promise<number> {
        let query = supabase
            .from('ebay_sold_listings')
            .select('*')
            .eq('user_id', userId);

        if (keyword) {
            query = query.eq('search_keyword', keyword);
        }

        const { data: listings, error } = await query;

        if (error || !listings) {
            console.error('Bridge Error:', error);
            return 0;
        }

        const cleanListings = listings.map(l => ({
            run_id: runId,
            user_id: userId,
            search_keyword: l.search_keyword,
            item_url: l.item_url,
            title: l.title,
            currency: l.currency,
            sold_price: l.sold_price,
            shipping_price: l.shipping_price,
            is_auction: l.is_auction,
            bid_count: l.bid_count,
            sold_date: l.sold_date,
            dedupe_hash: Buffer.from(l.item_url).toString('base64').substring(0, 32)
        }));

        const { error: insertError } = await supabase
            .from('sold_listings_clean')
            .insert(cleanListings);

        if (insertError) {
            console.error('Bridge Insert Error:', insertError);
            return 0;
        }

        return cleanListings.length;
    }

    private async updateRunStatus(supabase: SupabaseClient, runId: string, status: string, error?: string, stats?: any) {
        await supabase
            .from('scrape_runs')
            .update({
                status,
                error_summary: error,
                ended_at: new Date().toISOString(),
                ...stats
            })
            .eq('id', runId);
    }
}

let pulseOrchestratorInstance: PulseOrchestrator | null = null;
export function getPulseOrchestrator(): PulseOrchestrator {
    if (!pulseOrchestratorInstance) pulseOrchestratorInstance = new PulseOrchestrator();
    return pulseOrchestratorInstance;
}
