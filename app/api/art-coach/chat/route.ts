import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ArtCoachService } from '@/services/ai/art-coach-service'

export async function GET(request: Request) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    try {
        if (sessionId) {
            const messages = await ArtCoachService.getSessionMessages(sessionId)
            return NextResponse.json({ success: true, messages })
        } else {
            const sessions = await ArtCoachService.getSessions(user.id)
            return NextResponse.json({ success: true, sessions })
        }
    } catch (err: any) {
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
        const body = await request.json()
        const { message, sessionId } = body

        if (!message) {
            return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })
        }

        // --- PRICING TIER ENFORCEMENT ---
        if (sessionId) {
            const { PricingService } = await import('@/services/pricing-service')
            const check = await PricingService.canUseAICoach(supabase, user.id, sessionId)

            if (!check.allowed) {
                return NextResponse.json({ success: false, error: check.reason }, { status: 403 })
            }
        }

        const result = await ArtCoachService.getCoachAdvice({
            userId: user.id,
            sessionId,
            message
        })

        return NextResponse.json({ success: true, ...result })
    } catch (err: any) {
        console.error('Art Coach API Error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
