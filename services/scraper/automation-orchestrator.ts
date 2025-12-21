import { getEbayApi } from './ebay-api';
import { HeadlessExtractor } from './headless-extractor';
import { HeadlessScanner } from './headless-scanner';
import { PhysicalSpecsParser } from '../parser/specs-parser';
import { ArtPatternAnalyzer } from '../ai/pattern-analyzer';
import { DemandMetricsEngine } from '../ai/demand-engine';
import { SupabaseClient } from '@supabase/supabase-js';

export class AutomationOrchestrator {
    private patternAnalyzer = new ArtPatternAnalyzer();

    /**
     * Runs the complete Intelligence Sequence for a specific seller
     */
    async processSeller(supabase: SupabaseClient, sellerName: string) {
        console.log(`🚀 Starting intelligence sequence for: ${sellerName}`);

        try {
            const ebayApi = getEbayApi();

            // 1. Resolve Seller Profile using API (Upsert)
            const { data: sellerRecord } = await supabase
                .from('seller_profiles')
                .upsert({
                    seller_name: sellerName,
                    last_scanned_at: new Date().toISOString()
                })
                .select()
                .single();

            // 2. Fetch Active Listings via Headless Scanner (Primary)
            const rawHeadless = await HeadlessScanner.scanStore(sellerName);
            // Limit to 5 high-priority listings per run to survive Vercel timeouts
            let foundListings = rawHeadless.slice(0, 5).map(l => ({
                title: l.title,
                itemUrl: l.url,
                bidCount: 0,
                soldPrice: 0
            }));

            // Fallback to eBay API if headless scan found nothing (e.g. rate limit)
            if (foundListings.length === 0) {
                console.log('⚠️  Headless scan returned 0. Retrying with eBay API fallback...');
                try {
                    const apiResults = await ebayApi.searchSellerListings(sellerName);
                    foundListings = apiResults.map(l => ({
                        title: l.title,
                        itemUrl: l.itemUrl,
                        bidCount: l.bidCount,
                        soldPrice: l.soldPrice || 0
                    }));
                } catch (e) {
                    console.error('❌ eBay API fallback also failed:', e);
                }
            }

            for (const item of foundListings) {
                console.log(`  └─ Processing: ${item.title}`);

                // 3. Extract Pulse signals (Watchers/Bids) via Headless Fetch
                const pulse = await HeadlessExtractor.extract(item.itemUrl);

                // If headless fails, use API data as fallback
                const watcherCount = pulse?.watcherCount || 0;
                const bidCount = item.bidCount || pulse?.bidCount || 0;
                const currentPrice = item.soldPrice || pulse?.currentPrice || 0;

                // RULE: Global Minimum Watchers Threshold (from spec: 5)
                if (watcherCount < 5) {
                    console.log(`     ⏭️ Skipping: Only ${watcherCount} watchers (Threshold: 5)`);
                    continue;
                }

                // 5. Parse Physical Specs and Art Patterns (AI)
                const [specs, patterns] = await Promise.all([
                    PhysicalSpecsParser.parse(item.title),
                    this.patternAnalyzer.analyze(item.title, '')
                ]);

                // 6. Calculate Demand Score using AI Visual Complexity
                const metrics = DemandMetricsEngine.calculateScore({
                    watcherCount: watcherCount,
                    bidCount: bidCount,
                    timeSinceListedHours: 24,
                    currentPrice: currentPrice,
                    visualComplexity: patterns?.visualComplexityScore || 5
                });

                // 7. Persist to "Active Listings"
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    console.log(`     ⚠️ No user session found for: ${item.title}. Skipping persistence.`);
                    continue;
                }

                console.log(`     💾 Saving Listing: ${item.title}`);
                const { data: listingRecord, error: listingError } = await supabase
                    .from('active_listings')
                    .upsert({
                        user_id: user.id,
                        seller_id: sellerRecord?.id,
                        listing_id: item.itemUrl.split('/').pop()?.split('?')[0],
                        title: item.title,
                        item_url: item.itemUrl,
                        current_price: currentPrice,
                        watcher_count: watcherCount,
                        bid_count: bidCount,
                        demand_score: metrics.demandScore,
                        watcher_velocity: metrics.watcherVelocity,
                        width_in: specs.widthIn,
                        height_in: specs.heightIn,
                        orientation: specs.orientation,
                        material: specs.material,
                        canvas_type: specs.canvasType
                    }, { onConflict: 'listing_id' })
                    .select()
                    .single();

                if (listingError) {
                    console.error(`     ❌ Failed to save listing:`, listingError);
                    continue;
                }

                // 8. Save Art Patterns
                if (listingRecord && patterns) {
                    const { error: patternError } = await supabase
                        .from('art_patterns')
                        .upsert({
                            listing_id: listingRecord.id,
                            subject_type: patterns.subjectType,
                            theme: patterns.theme,
                            style: patterns.style,
                            dominant_colors: patterns.dominantColors,
                            secondary_colors: patterns.secondaryColors,
                            background_style: patterns.backgroundStyle,
                            composition_type: patterns.compositionType,
                            brushwork_style: patterns.brushworkStyle,
                            visual_complexity_score: patterns.visualComplexityScore,
                            mixed_media: patterns.mixedMedia,
                            signature_visible: patterns.signatureVisible
                        }, { onConflict: 'listing_id' }); // Note: listing_id is FK in art_patterns

                    if (patternError) {
                        console.error(`     ❌ Failed to save patterns:`, patternError);
                    }
                }

                console.log(`     ✨ Demand Intelligence saved. Score: ${metrics.demandScore}`);
            }

        } catch (error: any) {
            console.error('❌ Orchestration critical failure:', error);
            throw error;
        }
    }
}
