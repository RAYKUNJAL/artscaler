
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getTrendEngine } from '@/services/ai/trend-engine';

export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const trendEngine = getTrendEngine();
        const trends = await trendEngine.discoverTrends(supabase);

        return NextResponse.json({
            trends,
            generated_at: new Date().toISOString(),
            data_sources: ['ebay_active', 'ebay_sold', 'social_intelligence']
        });
    } catch (error: any) {
        console.error('[Trends API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
