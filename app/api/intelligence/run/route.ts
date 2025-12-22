import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPulseOrchestrator } from '@/services/ai/orchestrator';
import { AutomationOrchestrator } from '@/services/scraper/automation-orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { keyword, sellerName } = body;

        if (sellerName) {
            // Handle seller-based intelligence (Active listings)
            const orchestrator = new AutomationOrchestrator();
            await orchestrator.processSeller(supabase, sellerName);

            return NextResponse.json({
                success: true,
                message: `Intelligence sequence completed for seller: ${sellerName}`
            });
        }

        // Handle keyword-based intelligence (Sold listings pipeline)
        const orchestrator = getPulseOrchestrator();
        const result = await orchestrator.runPulsePipeline(supabase, user.id, keyword);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `ArtIntel pipeline completed successfully`,
            data: result.stats
        });

    } catch (error: any) {
        console.error('Intelligence API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
