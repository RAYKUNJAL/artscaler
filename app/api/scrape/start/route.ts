import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getEbayApi } from '@/services/scraper/ebay-api';
import { EbayListing } from '@/services/scraper/ebay-scraper';

export async function POST(request: NextRequest) {
    try {
        // Initialize Supabase
        const supabase = await createServerClient();

        // Get user session the robust way
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

        console.log(`🎯 Starting eBay ${mode} scrape for user:`, user.id, 'keyword:', keyword);

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

        if (jobError) {
            console.error('Job creation error in /api/scrape/start:', jobError);
            return NextResponse.json(
                { error: `Database Error: Failed to create scrape job. Details: ${jobError.message}` },
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
    const supabase = await createServerClient();

    try {
        console.log(`🤖 Starting scrape (mode: ${mode}) for job ${jobId}...`);

        if (mode === 'active') {
            const { getArtdemandScraper } = await import('@/services/scraper/artdemand-scraper');
            const scraper = getArtdemandScraper();
            await scraper.initialize();

            try {
                // Scrape active listings
                const listings = await scraper.scrapeActive(keyword, 2);
                console.log(`✓ Scraped ${listings.length} active listings for ${keyword}`);

                // Process and save with AI
                await scraper.processAndSave(listings, userId);
                console.log(`✓ Processed and saved active listings for ${keyword}`);

                // Update job status
                await supabase
                    .from('scrape_jobs')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        pages_scraped: 2,
                        items_found: listings.length,
                    })
                    .eq('id', jobId);

            } finally {
                await scraper.close();
            }
        } else {
            // Updated Sold Listing Flow using Enhanced EbayScraper with Playwright/Headless Fallback
            const { getEbayScraper } = await import('@/services/scraper/ebay-scraper');
            const scraper = getEbayScraper();
            await scraper.initialize();

            try {
                const listings = await scraper.scrape({
                    keyword,
                    maxPages: 2,
                    delayMs: 3000
                });

                console.log(`✓ Scraped ${listings.length} sold listings for ${keyword}`);

                if (listings.length > 0) {
                    // 1. Save to raw table
                    const records = listings.map((listing: EbayListing) => ({
                        user_id: userId,
                        title: listing.title,
                        sold_price: listing.soldPrice,
                        shipping_price: listing.shippingPrice,
                        currency: listing.currency,
                        is_auction: listing.isAuction,
                        bid_count: listing.bidCount,
                        sold_date: listing.soldDate,
                        item_url: listing.itemUrl,
                        search_keyword: listing.searchKeyword,
                    }));

                    const { error: insertError } = await supabase
                        .from('ebay_sold_listings')
                        .insert(records);

                    if (insertError) throw insertError;

                    // 2. Also save to the "clean" pipeline table for WVS Analysis
                    const cleanRecords = listings.map((listing: EbayListing) => ({
                        user_id: userId,
                        title: listing.title,
                        sold_price: listing.soldPrice,
                        shipping_price: listing.shippingPrice,
                        currency: listing.currency,
                        is_auction: listing.isAuction,
                        bid_count: listing.bidCount,
                        sold_date: listing.soldDate?.toISOString().split('T')[0],
                        item_url: listing.itemUrl,
                        search_keyword: listing.searchKeyword,
                    }));

                    await supabase.from('sold_listings_clean').insert(cleanRecords);

                    // 3. Run Parser on new listings
                    const { getParserAgent } = await import('@/services/ai/parser-agent');
                    const parser = getParserAgent();
                    await parser.parseListings(supabase, 'manual-run', userId);
                }

                // Update job status
                await supabase
                    .from('scrape_jobs')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        pages_scraped: 2,
                        items_found: listings.length,
                    })
                    .eq('id', jobId);

                // 4. Trigger WVS Pipeline for this user
                try {
                    const { getWVSAgent } = await import('@/services/ai/wvs-agent');
                    const wvsAgent = getWVSAgent();
                    await wvsAgent.processPipeline(userId);
                    console.log(`✅ WVS Analysis completed for user: ${userId}`);
                } catch (wvsError) {
                    console.error('❌ WVS Pipeline failed:', wvsError);
                }

            } finally {
                await scraper.close();
            }
        }

        console.log(`✅ Scrape job ${jobId} completed successfully`);

    } catch (error: any) {
        console.error(`❌ Scraper error for job ${jobId}:`, error);

        // Update job with error
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
