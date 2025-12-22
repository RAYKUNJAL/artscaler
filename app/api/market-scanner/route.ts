/**
 * Market Scanner API - eBay Finding API Integration
 * 
 * Handles search requests and stores results in Supabase.
 * Uses official eBay Finding API for Vercel serverless compatibility.
 * 
 * @updated 2025-12-22 - Switched from Playwright to Finding API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ebayApiClient } from '@/services/ebay/ebay-api-client';

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

        // Search listings using eBay Finding API (serverless compatible)
        let listings: any[] = [];
        let apiError: string | null = null;
        const maxResults = 100;

        try {
            listings = await ebayApiClient.findCompletedItems(keyword, maxResults);
        } catch (err: any) {
            console.error('[Market Scanner] eBay API error:', err.message);
            apiError = err.message;

            // Update job with API error but don't fail completely
            await supabase
                .from('scrape_jobs')
                .update({
                    status: 'failed',
                    completed_at: new Date().toISOString(),
                    error_message: `eBay API Error: ${err.message}. Check EBAY_APP_ID and EBAY_ENVIRONMENT.`
                })
                .eq('id', job.id);

            return NextResponse.json({
                success: false,
                error: 'eBay API error',
                details: err.message,
                hint: 'Ensure EBAY_APP_ID is set and EBAY_ENVIRONMENT=PRODUCTION'
            }, { status: 500 });
        }

        if (listings.length === 0) {
            await supabase
                .from('scrape_jobs')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    items_found: 0,
                    error_message: 'No listings found for this keyword'
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
        const listingsToInsert = listings.map((listing: any) => ({
            user_id: user.id,
            title: listing.title,
            sold_price: listing.soldPrice,
            shipping_price: listing.shippingPrice || 0,
            currency: listing.currency || 'USD',
            is_auction: listing.isAuction || false,
            bid_count: listing.bidCount || 0,
            sold_date: listing.soldDate?.toISOString?.() || listing.soldDate || new Date().toISOString(),
            item_url: listing.itemUrl,
            search_keyword: keyword,
            image_url: listing.imageUrl
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

        // TRIGGER AI PIPELINE (WVS Analysis)
        try {
            const { getWVSAgent } = await import('@/services/ai/wvs-agent');
            const wvsAgent = getWVSAgent();
            await wvsAgent.processPipeline(supabase, user.id);
            console.log(`[Market Scanner] ✅ WVS Analysis completed for user: ${user.id}`);
        } catch (wvsError) {
            console.error('[Market Scanner] ❌ WVS Pipeline failed:', wvsError);
        }

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
