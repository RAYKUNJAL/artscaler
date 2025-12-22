import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPulseOrchestrator } from '@/services/ai/orchestrator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    // 1. Guard against build-time execution
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: 'Environment variables not configured' }, { status: 500 });
    }

    // 2. Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Create admin Supabase client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Get all active users with saved keywords
        const { data: users, error } = await supabase
            .from('user_profiles')
            .select('id, subscription_tier')
            .neq('subscription_tier', 'free'); // Only process paid users

        if (error) throw error;

        const orchestrator = getPulseOrchestrator();
        const results = [];

        for (const user of users || []) {
            try {
                console.log(`[Cron] Processing user: ${user.id}`);

                // Run pipeline for this user
                const result = await orchestrator.runPulsePipeline(supabase, user.id);

                results.push({
                    userId: user.id,
                    success: result.success,
                    stats: result.stats
                });

                // Rate limit between users
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (userError) {
                console.error(`[Cron] Error processing user ${user.id}:`, userError);
                results.push({
                    userId: user.id,
                    success: false,
                    error: userError instanceof Error ? userError.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Daily pipeline completed for ${results.length} users`,
            results
        });

    } catch (error: any) {
        console.error('[Cron] Daily pipeline error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
