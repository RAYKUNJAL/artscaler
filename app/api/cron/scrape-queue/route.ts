/**
 * Scrape Queue Cron Job
 * 
 * Runs every 15 minutes to process pending scrape jobs
 * from the queue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EbayPulseScraper } from '@/services/scraper/ebay-pulse-scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Guard against build-time execution
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ message: 'Build mode' });
    }

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get pending scrape jobs
        const { data: jobs, error } = await supabase
            .from('scrape_jobs')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(5); // Process 5 jobs per run

        if (error) throw error;

        const results = [];

        for (const job of jobs || []) {
            try {
                // Update status to processing
                await supabase
                    .from('scrape_jobs')
                    .update({ status: 'processing' })
                    .eq('id', job.id);

                // Run scraper
                const listings = await EbayPulseScraper.scrapeSoldListings(
                    job.keyword,
                    job.max_pages || 3
                );

                // Store results
                const listingsToInsert = listings.map(listing => ({
                    user_id: job.user_id,
                    search_keyword: job.keyword,
                    ...listing
                }));

                await supabase
                    .from('ebay_sold_listings')
                    .insert(listingsToInsert);

                // Update job status
                await supabase
                    .from('scrape_jobs')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        results_count: listings.length
                    })
                    .eq('id', job.id);

                results.push({
                    jobId: job.id,
                    keyword: job.keyword,
                    success: true,
                    count: listings.length
                });

            } catch (jobError) {
                console.error(`[Cron] Error processing job ${job.id}:`, jobError);

                await supabase
                    .from('scrape_jobs')
                    .update({
                        status: 'failed',
                        error_message: jobError instanceof Error ? jobError.message : 'Unknown error'
                    })
                    .eq('id', job.id);

                results.push({
                    jobId: job.id,
                    keyword: job.keyword,
                    success: false,
                    error: jobError instanceof Error ? jobError.message : 'Unknown error'
                });
            }

            // Rate limit between jobs
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${results.length} scrape jobs`,
            results
        });

    } catch (error: any) {
        console.error('[Cron] Scrape queue error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
