import { SupabaseClient } from '@supabase/supabase-js';

export interface ScrapeJob {
    id: string;
    user_id: string;
    keyword: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    pages_scraped: number;
    items_found: number;
    error_message?: string;
    started_at?: string;
    completed_at?: string;
    created_at: string;
}

export interface CreateScrapeJobParams {
    userId: string;
    keyword: string;
}

/**
 * Create a new scrape job in the queue
 */
export async function createScrapeJob(supabase: SupabaseClient, params: CreateScrapeJobParams): Promise<ScrapeJob | null> {
    const { userId, keyword } = params;

    // Check if user has reached their scrape limit
    const canScrape = await checkScrapeLimit(supabase, userId);
    if (!canScrape) {
        throw new Error('Monthly scrape limit reached. Please upgrade your plan.');
    }

    const { data, error } = await supabase
        .from('scrape_jobs')
        .insert({
            user_id: userId,
            keyword: keyword.trim().toLowerCase(),
            status: 'pending',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating scrape job:', error);
        return null;
    }

    return data as ScrapeJob;
}

/**
 * Get pending scrape jobs (for cron processor)
 */
export async function getPendingScrapeJobs(supabase: SupabaseClient, limit: number = 10): Promise<ScrapeJob[]> {
    const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching pending jobs:', error);
        return [];
    }

    return data as ScrapeJob[];
}

/**
 * Update scrape job status
 */
export async function updateScrapeJob(
    supabase: SupabaseClient,
    jobId: string,
    updates: Partial<ScrapeJob>
): Promise<void> {
    const { error } = await supabase
        .from('scrape_jobs')
        .update(updates)
        .eq('id', jobId);

    if (error) {
        console.error('Error updating scrape job:', error);
    }
}

/**
 * Get user's scrape jobs
 */
export async function getUserScrapeJobs(supabase: SupabaseClient, userId: string, limit: number = 20): Promise<ScrapeJob[]> {
    const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching user scrape jobs:', error);
        return [];
    }

    return data as ScrapeJob[];
}

/**
 * Check if user can scrape (within monthly limits)
 */
async function checkScrapeLimit(supabase: SupabaseClient, userId: string): Promise<boolean> {
    // Get current month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usage, error } = await supabase
        .from('user_usage_tracking')
        .select('scrapes_used, scrapes_limit')
        .eq('user_id', userId)
        .eq('period_start', startOfMonth.toISOString().split('T')[0])
        .single();

    if (error || !usage) {
        // If no usage record exists, allow scrape (will be created on first use)
        return true;
    }

    return usage.scrapes_used < usage.scrapes_limit;
}

/**
 * Increment user's scrape usage
 */
export async function incrementScrapeUsage(supabase: SupabaseClient, userId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_usage', {
        limit_type: 'scrapes',
        increment: 1,
    });

    if (error) {
        console.error('Error incrementing scrape usage:', error);
    }
}

/**
 * Get scrape job by ID
 */
export async function getScrapeJobById(jobId: string, supabase: SupabaseClient): Promise<ScrapeJob | null> {
    const { data, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    if (error) {
        console.error('Error fetching scrape job:', error);
        return null;
    }

    return data as ScrapeJob;
}
