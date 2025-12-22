import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ebayApiClient } from '@/services/ebay/ebay-api-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
    // Guard against build-time execution if somehow triggered
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ error: 'Environment variables not configured' }, { status: 500 });
    }

    try {
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth error in /api/scrape/start:', authError);
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { keyword, mode = 'active' } = body;

        if (!keyword || typeof keyword !== 'string') {
            return NextResponse.json(
                { error: 'Keyword is required' },
                { status: 400 }
            );
        }

        // --- PRICING TIER ENFORCEMENT ---
        const { PricingService } = await import('@/services/pricing-service');
        const check = await PricingService.canScrape(supabase, user.id);

        if (!check.allowed) {
            return NextResponse.json(
                { error: check.reason },
                { status: 403 }
            );
        }

        console.log(`🎯 Starting eBay ${mode} API scrape for user: ${user.id} keyword: ${keyword}`);

        // Record usage
        await PricingService.recordScrape(supabase, user.id);

        // Create scrape job
        const { data: job, error: jobError } = await supabase
            .from('scrape_jobs')
            .insert({
                user_id: user.id,
                keyword: keyword.trim().toLowerCase(),
                status: 'running',
                started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (jobError || !job) {
            console.error('Job creation error in /api/scrape/start:', jobError);
            return NextResponse.json(
                { error: `Database Error: Failed to create scrape job. Details: ${jobError?.message || 'Unknown'}` },
                { status: 500 }
            );
        }

        console.log('✓ Scrape job created:', job.id);

        // Run eBay API scraper in background
        runEbayApiScraper(job.id, user.id, keyword, mode).catch(err => {
            console.error('Background scraper error:', err);
        });

        return NextResponse.json({
            success: true,
            message: 'Scrape started! Results will appear here shortly.',
            job: {
                id: job.id,
                keyword: job.keyword,
                status: job.status,
                created_at: job.created_at,
            },
        });
    } catch (error: any) {
        console.error('Start scrape error:', error);
        return NextResponse.json(
            { error: `Internal server error: ${error.message}` },
            { status: 500 }
        );
    }
}

// Background eBay API / Scraper function
async function runEbayApiScraper(jobId: string, userId: string, keyword: string, mode: 'sold' | 'active' = 'active') {
    // In background workers, we might need a different client if we want to bypass cookies
    // But since this is triggered by a request, we use the service role key for reliability
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        console.log(`🤖 Starting API scrape (mode: ${mode}) for job ${jobId}...`);

        const { PatternMiner } = await import('@/services/ai/pattern-miner');
        const miner = new PatternMiner();
        const { getWVSAgent } = await import('@/services/ai/wvs-agent');
        const wvsAgent = getWVSAgent();

        let listingsCount = 0;

        if (mode === 'active') {
            const listings = await ebayApiClient.findActiveItems(keyword, 100);
            listingsCount = listings.length;
            console.log(`✓ API found ${listings.length} active listings for ${keyword}`);

            if (listings.length > 0) {
                const listingsToUpsert = listings.map(l => {
                    const sizes = miner.extractSizes(l.title);
                    const mediums = miner.extractMediums(l.title);

                    return {
                        listing_id: l.itemId,
                        user_id: userId,
                        title: l.title,
                        item_url: l.itemUrl,
                        current_price: l.soldPrice, // Note: using soldPrice field from client for active price
                        bid_count: l.bidCount,
                        listing_type: l.listingType === 'Auction' ? 'Auction' : 'FixedPrice',
                        is_active: true,
                        last_updated_at: new Date().toISOString(),
                        width_in: sizes.length > 0 ? sizes[0].width : null,
                        height_in: sizes.length > 0 ? sizes[0].height : null,
                        material: mediums.length > 0 ? mediums[0] : (l.condition || null),
                        image_url: l.imageUrl
                    };
                });

                const { data: savedListings, error: batchError } = await supabase
                    .from('active_listings')
                    .upsert(listingsToUpsert, { onConflict: 'listing_id' })
                    .select('id, title, listing_id');

                if (batchError) {
                    console.error('Batch upsert error:', batchError);
                } else if (savedListings) {
                    console.log(`✓ Saved ${savedListings.length} active listings`);

                    // Style extraction logic
                    const styleJunctions: any[] = [];
                    const allPossibleStyles = new Set<string>();

                    listings.forEach(l => {
                        const styles = miner.extractStyles(l.title);
                        styles.forEach(s => allPossibleStyles.add(s));
                    });

                    if (allPossibleStyles.size > 0) {
                        const { data: styleMap } = await supabase
                            .from('styles')
                            .select('id, style_term')
                            .in('style_term', Array.from(allPossibleStyles));

                        if (styleMap && styleMap.length > 0) {
                            const nameToId = Object.fromEntries(styleMap.map(s => [s.style_term, s.id]));
                            savedListings.forEach(saved => {
                                const styles = miner.extractStyles(saved.title);
                                styles.forEach(styleTerm => {
                                    const styleId = nameToId[styleTerm];
                                    if (styleId) {
                                        styleJunctions.push({
                                            listing_id: saved.id,
                                            style_id: styleId,
                                            confidence: 1.0
                                        });
                                    }
                                });
                            });

                            if (styleJunctions.length > 0) {
                                await supabase
                                    .from('listing_styles')
                                    .upsert(styleJunctions, { onConflict: 'listing_id,style_id' });
                            }
                        }
                    }
                }
            }
        } else {
            const listings = await ebayApiClient.findCompletedItems(keyword, 100);
            listingsCount = listings.length;

            console.log(`✓ API found ${listings.length} sold listings for ${keyword}`);

            if (listings.length > 0) {
                const records = listings.map(l => ({
                    user_id: userId,
                    title: l.title,
                    sold_price: l.soldPrice,
                    shipping_price: l.shippingPrice || 0,
                    currency: l.currency || 'USD',
                    is_auction: l.listingType === 'Auction',
                    bid_count: l.bidCount || 0,
                    sold_date: l.soldDate,
                    item_url: l.itemUrl,
                    search_keyword: keyword,
                    image_url: l.imageUrl
                }));

                const { error: insertError } = await supabase
                    .from('ebay_sold_listings')
                    .insert(records);

                if (insertError) throw insertError;

                const cleanRecords = records.map(r => ({
                    ...r,
                    sold_date: r.sold_date ? new Date(r.sold_date).toISOString().split('T')[0] : null
                }));

                await supabase.from('sold_listings_clean').insert(cleanRecords);

                const { getParserAgent } = await import('@/services/ai/parser-agent');
                const parser = getParserAgent();
                await parser.parseListings(supabase, 'manual-run', userId);
            }
        }

        // Update job status
        await supabase
            .from('scrape_jobs')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                items_found: listingsCount,
            })
            .eq('id', jobId);

        // Always trigger WVS Pipeline
        try {
            const { getWVSAgent } = await import('@/services/ai/wvs-agent');
            const wvsAgent = getWVSAgent();
            await wvsAgent.processPipeline(supabase, userId);
            console.log(`✅ WVS Analysis completed for user: ${userId}`);
        } catch (wvsError) {
            console.error('❌ WVS Pipeline failed:', wvsError);
        }

    } catch (error: any) {
        console.error(`❌ Scraper error for job ${jobId}:`, error);

        await supabase
            .from('scrape_jobs')
            .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: error.message,
            })
            .eq('id', jobId);
    }
}
