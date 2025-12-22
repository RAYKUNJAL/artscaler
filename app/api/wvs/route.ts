/**
 * WVS API Endpoint
 * 
 * Calculates and returns Watch Velocity Scores.
 * POST: Calculate WVS for listings
 * GET: Get calculated WVS data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getWVSAgent } from '@/services/ai/wvs-agent';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'styles';
        const limit = parseInt(searchParams.get('limit') || '10');

        let data;

        if (type === 'styles') {
            const { data: styles } = await supabase
                .from('styles')
                .select('*')
                .order('avg_wvs', { ascending: false })
                .limit(limit);
            data = styles;
        } else if (type === 'sizes') {
            const { data: sizes } = await supabase
                .from('sizes')
                .select('*')
                .order('avg_wvs', { ascending: false })
                .limit(limit);
            data = sizes;
        } else if (type === 'daily') {
            const days = parseInt(searchParams.get('days') || '7');
            const { data: daily } = await supabase
                .from('wvs_scores_daily')
                .select('*')
                .gte('score_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                .order('score_date', { ascending: true });
            data = daily;
        } else {
            data = [];
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('WVS API error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body;

        const wvsAgent = getWVSAgent();

        if (action === 'calculate-single') {
            const { watcherCount, daysActive, itemPrice, categoryMedianPrice, similarListingsCount, bidCount = 0 } = body;

            const score = wvsAgent.calculateWVS({
                watcherCount,
                daysActive,
                itemPrice,
                categoryMedianPrice,
                similarListingsCount,
                bidCount,
            });

            return NextResponse.json({ success: true, score });
        }

        if (action === 'calculate-all') {
            const report = await wvsAgent.processPipeline(supabase, user.id);
            return NextResponse.json({
                success: true,
                count: report.totalListingsAnalyzed,
                topListings: report.topStyles.flatMap(s => s.topListings).slice(0, 10)
            });
        }

        if (action === 'generate-report') {
            const report = await wvsAgent.processPipeline(supabase, user.id);
            return NextResponse.json({ success: true, report });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('WVS API error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
