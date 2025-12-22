import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isSummary = searchParams.get('summary') === 'true'

    try {
        if (isSummary) {
            const { data: items, error } = await supabase
                .from('paint_queue')
                .select('*')
                .eq('user_id', user.id)

            if (error) throw error

            const summary = {
                totalItems: items.length,
                byStatus: {
                    queued: items.filter(i => i.status === 'queued').length,
                    inProgress: items.filter(i => i.status === 'in_progress').length,
                    completed: items.filter(i => i.status === 'completed').length,
                    skipped: items.filter(i => i.status === 'skipped').length,
                },
                estimatedRevenue: items
                    .filter(i => i.status === 'queued' || i.status === 'in_progress')
                    .reduce((acc, i) => acc + (Number(i.target_price) || 0), 0),
                avgDemandScore: items.length
                    ? items.reduce((acc, i) => acc + (Number(i.est_demand_score) || 0), 0) / items.length
                    : 0,
                topStyle: items.length ? items[0].style : 'None' // Just a placeholder
            }

            return NextResponse.json({ success: true, summary })
        }

        const { data: queue, error } = await supabase
            .from('paint_queue')
            .select('*')
            .eq('user_id', user.id)
            .order('priority', { ascending: true })
            .order('created_at', { ascending: false })

        if (error) throw error

        // Transform snake_case to camelCase for the frontend
        const transformedQueue = queue.map(item => ({
            id: item.id,
            style: item.style,
            size: item.size,
            medium: item.medium,
            subject: item.subject,
            listingType: item.listing_type || 'Both',
            targetPrice: item.target_price,
            priceRangeLow: item.price_range_low,
            priceRangeHigh: item.price_range_high,
            estDemandScore: item.est_demand_score,
            estWvs: item.est_wvs,
            competitionLevel: item.competition_level,
            priority: item.priority,
            status: item.status,
            notes: item.notes,
            createdAt: item.created_at
        }))

        return NextResponse.json({ success: true, queue: transformedQueue })
    } catch (err: any) {
        console.error('Paint Queue API Error (GET):', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, item, weeklyCapacity } = body

    try {
        if (action === 'add') {
            const { error } = await supabase
                .from('paint_queue')
                .insert({
                    user_id: user.id,
                    style: item.style,
                    size: item.size,
                    medium: item.medium,
                    target_price: item.targetPrice,
                    notes: item.notes,
                    status: 'queued',
                    est_demand_score: 50, // Default for manual entries
                    est_wvs: 1.0,
                    competition_level: 'Medium',
                    listing_type: 'Both'
                })

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'generate') {
            // Fetch top styles and sizes to generate high-demand items
            const { data: styles } = await supabase
                .from('styles')
                .select('*')
                .order('demand_score', { ascending: false })
                .limit(5)

            const { data: sizes } = await supabase
                .from('sizes')
                .select('*')
                .order('demand_score', { ascending: false })
                .limit(5)

            if (!styles || styles.length === 0) {
                return NextResponse.json({ success: false, error: 'No demand data available' })
            }

            const itemsToAdd = []
            const capacity = weeklyCapacity || 4

            for (let i = 0; i < capacity; i++) {
                const style = styles[i % styles.length]
                const size = sizes ? sizes[i % sizes.length] : null

                itemsToAdd.push({
                    user_id: user.id,
                    style: style.style_term,
                    size: size?.size_cluster || '16x20',
                    medium: 'Acrylic', // Default medium
                    listing_type: 'Auction',
                    target_price: size?.avg_price || 250,
                    est_demand_score: style.demand_score || 80,
                    est_wvs: style.avg_wvs || 2.5,
                    competition_level: 'Low',
                    priority: i + 1,
                    status: 'queued'
                })
            }

            const { error } = await supabase
                .from('paint_queue')
                .insert(itemsToAdd)

            if (error) throw error
            return NextResponse.json({ success: true, count: itemsToAdd.length })
        }

        if (action === 'clear-completed') {
            const { error } = await supabase
                .from('paint_queue')
                .delete()
                .eq('user_id', user.id)
                .eq('status', 'completed')

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    } catch (err: any) {
        console.error('Paint Queue API Error (POST):', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, status, ...updates } = body

    try {
        const { error } = await supabase
            .from('paint_queue')
            .update({
                status: status,
                ...updates,
                updated_at: new Date().toISOString(),
                completed_at: status === 'completed' ? new Date().toISOString() : null
            })
            .eq('id', itemId)
            .eq('user_id', user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Paint Queue API Error (PUT):', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
        return NextResponse.json({ success: false, error: 'Missing itemId' }, { status: 400 })
    }

    try {
        const { error } = await supabase
            .from('paint_queue')
            .delete()
            .eq('id', itemId)
            .eq('user_id', user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Paint Queue API Error (DELETE):', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
