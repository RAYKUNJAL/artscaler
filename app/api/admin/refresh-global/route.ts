import { NextRequest, NextResponse } from 'next/server';
import { getGlobalIntelligenceService } from '@/services/ai/global-intelligence-service';

export const dynamic = 'force-dynamic';

/**
 * Endpoint to trigger global data aggregation across all user accounts.
 * This should be hit by a scheduled Cron job (e.g., Vercel Cron).
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Security Check: Verify Cron Secret
        const authHeader = request.headers.get('Authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized: Missing or invalid Cron Secret' }, { status: 401 });
        }

        const service = getGlobalIntelligenceService();
        const success = await service.refreshGlobalBenchmarks();

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'Global Intelligence Database refreshed successfully.',
                timestamp: new Date().toISOString()
            });
        } else {
            return NextResponse.json({ error: 'Refresh failed. Check server logs.' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Refresh Global API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
