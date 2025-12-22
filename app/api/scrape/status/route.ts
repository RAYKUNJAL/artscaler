import { NextRequest, NextResponse } from 'next/server';
import { getScrapeJobById } from '@/services/scraper/scrape-queue';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        // Get user from session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json(
                { error: 'Job ID is required' },
                { status: 400 }
            );
        }

        const job = await getScrapeJobById(jobId, supabase);

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            );
        }

        // Verify job belongs to user
        if (job.user_id !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            job: {
                id: job.id,
                keyword: job.keyword,
                status: job.status,
                pages_scraped: job.pages_scraped,
                items_found: job.items_found,
                error_message: job.error_message,
                started_at: job.started_at,
                completed_at: job.completed_at,
                created_at: job.created_at,
            },
        });
    } catch (error) {
        console.error('Get scrape status error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
