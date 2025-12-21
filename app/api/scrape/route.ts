/**
 * @deprecated Use /api/scrape/start for the unified eBay API job system.
 * This legacy route uses Playwright which is slower and more resource intensive.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const { keyword, maxPages = 5 } = await request.json();

        if (!keyword) {
            return NextResponse.json(
                { error: 'Keyword is required' },
                { status: 400 }
            );
        }

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        const userId = user.id;

        // Create scrape job
        const { data: job, error: jobError } = await supabase
            .from('scrape_jobs')
            .insert({
                user_id: userId,
                keyword,
                status: 'running',
                started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (jobError) {
            console.error('Error creating job in legacy scraper:', jobError);
            return NextResponse.json(
                { error: `Failed to create scrape job: ${jobError.message}` },
                { status: 500 }
            );
        }

        // Initialize scraper
        const { EbayScraper } = await import('@/services/scraper/ebay-scraper');
        const scraper = new EbayScraper();
        await scraper.initialize();

        try {
            // Scrape listings
            const listings = await scraper.scrape({ keyword, maxPages });

            // Save listings to database
            const listingsToInsert = listings.map(listing => ({
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

            const { error: insertError } = await supabase
                .from('ebay_sold_listings')
                .insert(listingsToInsert);

            if (insertError) {
                console.error('Error inserting listings:', insertError);
            }

            // Update job status
            await supabase
                .from('scrape_jobs')
                .update({
                    status: 'completed',
                    pages_scraped: maxPages,
                    items_found: listings.length,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', job.id);

            return NextResponse.json({
                success: true,
                jobId: job.id,
                itemsFound: listings.length,
                listings: listings.slice(0, 10), // Return first 10 for preview
            });

        } catch (scrapeError: any) {
            // Update job with error
            await supabase
                .from('scrape_jobs')
                .update({
                    status: 'failed',
                    error_message: scrapeError.message,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', job.id);

            throw scrapeError;
        } finally {
            await scraper.close();
        }

    } catch (error: any) {
        console.error('Scrape API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
