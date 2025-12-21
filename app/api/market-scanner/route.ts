/**
 * Market Scanner API - eBay Pulse Scraper Integration
 * 
 * Handles scraping requests and stores results in Supabase.
 * Uses the new EbayPulseScraper for HTML-based scraping.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { EbayPulseScraper } from '@/services/scraper/ebay-pulse-scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { keyword, maxPages = 2 } = body;

        if (!keyword) {
            return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
        }

        console.log(`[Market Scanner] Starting scrape for "${keyword}" (${maxPages} pages)`);

        // Create scrape job
        const { data: job, error: jobError } = await supabase
            .from('scrape_jobs')
            .insert({
                user_id: user.id,
                keyword,
                status: 'running',
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (jobError || !job) {
            console.error('[Market Scanner] Job creation error:', jobError);
            return NextResponse.json({ error: 'Failed to create scrape job' }, { status: 500 });
        }

        // Scrape listings
        const listings = await EbayPulseScraper.scrapeSoldListings(keyword, maxPages);

        if (listings.length === 0) {
            await supabase
                .from('scrape_jobs')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    items_found: 0,
                    error_message: 'No listings found'
                })
                .eq('id', job.id);

            return NextResponse.json({
                success: true,
                message: 'No listings found',
                jobId: job.id,
                itemsFound: 0
            });
        }

        // Store listings in database
        const listingsToInsert = listings.map(listing => ({
            user_id: user.id,
            title: listing.title,
            sold_price: listing.soldPrice,
            shipping_price: listing.shippingPrice,
            currency: listing.currency,
            is_auction: listing.isAuction,
            bid_count: listing.bidCount,
            sold_date: listing.soldDate,
            item_url: listing.itemUrl,
            search_keyword: keyword
        }));

        const { error: insertError } = await supabase
            .from('ebay_sold_listings')
            .insert(listingsToInsert);

        if (insertError) {
            console.error('[Market Scanner] Insert error:', insertError);

            await supabase
                .from('scrape_jobs')
                .update({
                    status: 'failed',
                    completed_at: new Date().toISOString(),
                    error_message: insertError.message
                })
                .eq('id', job.id);

            return NextResponse.json({ error: 'Failed to store listings' }, { status: 500 });
        }

        // Update job status
        await supabase
            .from('scrape_jobs')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                items_found: listings.length,
                pages_scraped: maxPages
            })
            .eq('id', job.id);

        console.log(`[Market Scanner] Successfully scraped ${listings.length} listings for "${keyword}"`);

        return NextResponse.json({
            success: true,
            message: `Scraped ${listings.length} sold listings`,
            jobId: job.id,
            itemsFound: listings.length,
            listings: listings.slice(0, 10) // Return first 10 for preview
        });

    } catch (error: any) {
        console.error('[Market Scanner] Critical error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get recent scrape jobs
        const { data: jobs, error } = await supabase
            .from('scrape_jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, jobs });

    } catch (error: any) {
        console.error('[Market Scanner] GET error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
