import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Fetch recommendations from opportunity_feed
        // We take the latest date's opportunities
        const { data: recommendations, error } = await supabase
            .from('opportunity_feed')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .order('rank', { ascending: true })
            .limit(10)

        if (error) throw error

        const transformedRecommendations = (recommendations || []).map(rec => ({
            id: rec.id,
            subject: rec.topic_label,
            wvs: rec.wvs_score,
            velocity: rec.velocity_score,
            medianPrice: rec.median_price,
            targetPrice: rec.upper_quartile_price,
            recommendedSizes: rec.recommended_sizes || ['16x20', '24x36'],
            confidence: rec.confidence,
            date: rec.date
        }))

        return NextResponse.json({ success: true, recommendations: transformedRecommendations })
    } catch (err: any) {
        console.error('Art Planner API Error (GET):', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // In a real scenario, this would trigger the AI pipeline or a subset of it.
        // For now, we'll return a success message and assume the daily cron handles it.
        // Or we could manually trigger the orchestrator for this user if they are Pro.

        return NextResponse.json({
            success: true,
            message: 'Planner recommendations are updated daily at 3 AM. Manual refresh is available for Pro and Studio members.'
        })
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
