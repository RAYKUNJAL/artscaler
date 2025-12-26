import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getArtAdvisorAgent } from '@/services/ai/advisor-agent';
import { PricingService } from '@/services/pricing-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        // Development fallback – use a fixed test user ID when no auth
        let { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('[advisor API] No auth – using dev test user');
            const testUserId = '00000000-0000-0000-0000-000000000001';
            user = { id: testUserId } as any;
        }

        // 2. Premium Check
        if (!user || !user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { limits } = await PricingService.getUserUsage(supabase, user.id);
        if (!limits.hasAIAdvisor) {
            return NextResponse.json({ error: 'Upgrade required to use the AI Market Advisor.' }, { status: 403 });
        }

        const { message, history } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const agent = getArtAdvisorAgent();
        const response = await agent.chat(message, user.id, history);

        return NextResponse.json({ response });

    } catch (error: any) {
        console.error('AI Advisor API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
