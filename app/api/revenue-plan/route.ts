import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeProgress = searchParams.get('progress') === 'true'

    try {
        // Fetch active plan
        const { data: plan, error: planError } = await supabase
            .from('revenue_plans')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (planError && planError.code !== 'PGRST116') {
            console.error('Error fetching plan:', planError)
        }

        let progress = null
        if (includeProgress && plan) {
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

            // Calculate achieved revenue from active_listings that were sold this month
            const { data: sales } = await supabase
                .from('active_listings')
                .select('current_price')
                .eq('user_id', user.id)
                .eq('is_active', false)
                .not('sold_at', 'is', null)
                .gte('sold_at', startOfMonth)

            const achieved = sales?.reduce((acc, sale) => acc + (Number(sale.current_price) || 0), 0) || 0

            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
            const daysRemaining = daysInMonth - now.getDate()

            progress = {
                target: plan.target_monthly,
                achieved,
                percentComplete: Math.round((achieved / plan.target_monthly) * 100),
                daysRemaining: Math.max(daysRemaining, 0)
            }
        }

        return NextResponse.json({
            success: true,
            plan: plan ? {
                ...plan.generated_plan,
                id: plan.id,
                targetMonthly: plan.target_monthly,
                createdAt: plan.created_at
            } : null,
            progress
        })
    } catch (err: any) {
        console.error('Revenue Plan API Error (GET):', err)
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
    const { action, targetMonthly, avgSalePrice, sellThroughRate, weeklyCapacity, target_monthly, avgPrice, sellThrough } = body

    // Handle both camelCase from UI and possible simulator inputs
    const finalTargetMonthly = targetMonthly || target_monthly || 20000
    const finalAvgPrice = avgSalePrice || avgPrice || 300
    const finalSellThrough = sellThroughRate || sellThrough || 0.5
    const finalCapacity = weeklyCapacity || 5

    if (action === 'generate' || action === 'simulate') {
        // Calculate the plan
        const piecesNeededToSell = Math.ceil(finalTargetMonthly / finalAvgPrice)
        const piecesToList = Math.ceil(piecesNeededToSell / finalSellThrough)
        const weeklyOutputNeeded = Math.ceil(piecesToList / 4)
        const achievable = weeklyOutputNeeded <= finalCapacity

        // Fetch some high demand styles/sizes to make it "smart"
        const { data: topStyles } = await supabase
            .from('styles')
            .select('style_term, demand_score')
            .order('demand_score', { ascending: false })
            .limit(3)

        const { data: topSizes } = await supabase
            .from('sizes')
            .select('size_cluster, demand_score, avg_price')
            .order('demand_score', { ascending: false })
            .limit(3)

        const breakdown = []
        let remainingToSell = piecesNeededToSell

        const styleTerms = topStyles?.length ? topStyles.map(s => s.style_term) : ['abstract', 'landscape', 'minimalist']
        const sizeTerms = topSizes?.length ? topSizes.map(s => s.size_cluster) : ['24x36', '16x20', '12x12']

        for (let i = 0; i < styleTerms.length && remainingToSell > 0; i++) {
            const count = Math.ceil(remainingToSell / (styleTerms.length - i))
            const size = sizeTerms[i % sizeTerms.length]
            const sizeData = topSizes?.find(s => s.size_cluster === size)

            breakdown.push({
                style: styleTerms[i],
                size: size,
                count: count,
                targetPrice: sizeData?.avg_price ? Number(sizeData.avg_price) : finalAvgPrice,
                expectedRevenue: count * (sizeData?.avg_price ? Number(sizeData.avg_price) : finalAvgPrice),
                demandScore: topStyles?.[i]?.demand_score ? Number(topStyles[i].demand_score) : 75
            })
            remainingToSell -= count
        }

        const estimatedRevenue = breakdown.reduce((acc, b) => acc + b.expectedRevenue, 0)

        const planData = {
            targetMonthly: finalTargetMonthly,
            achievable,
            breakdown,
            summary: {
                totalPiecesNeeded: piecesNeededToSell,
                totalPiecesToList: piecesToList,
                weeklyOutput: weeklyOutputNeeded,
                avgPriceNeeded: finalAvgPrice,
                estimatedRevenue,
                gap: finalTargetMonthly - estimatedRevenue
            },
            recommendations: [
                achievable ? "You're on track! Focus on high-demand styles to maintain velocity." : "Your target is ambitious. Consider increasing output or focusing on higher-value pieces.",
                `${styleTerms[0]} paintings in ${sizeTerms[0]} sizes are currently showing the highest Pulse Velocity.`,
                "Schedule your listings to end on Sunday evenings between 7 PM and 9 PM EST for maximum bid intensity."
            ],
            adjustments: {
                ifHigherPrice: { price: Math.round(finalAvgPrice * 1.25), piecesNeeded: Math.ceil(finalTargetMonthly / (finalAvgPrice * 1.25)) },
                ifMoreOutput: { weekly: weeklyOutputNeeded + 1, piecesNeeded: (weeklyOutputNeeded + 1) * 4 },
                ifBetterSellThrough: { rate: Math.min(finalSellThrough + 0.2, 0.9), piecesNeeded: Math.ceil(piecesNeededToSell / Math.min(finalSellThrough + 0.2, 0.9)) }
            }
        }

        if (action === 'generate') {
            try {
                // Deactivate old plans
                await supabase
                    .from('revenue_plans')
                    .update({ is_active: false })
                    .eq('user_id', user.id)

                // Save new plan
                const { error: saveError } = await supabase
                    .from('revenue_plans')
                    .insert({
                        user_id: user.id,
                        target_monthly: finalTargetMonthly,
                        avg_sale_price: finalAvgPrice,
                        sell_through_rate: finalSellThrough,
                        weekly_capacity: finalCapacity,
                        generated_plan: planData,
                        is_active: true,
                        last_generated_at: new Date().toISOString()
                    })

                if (saveError) throw saveError
            } catch (err) {
                console.error('Error saving revenue plan:', err)
            }
        }

        if (action === 'simulate') {
            return NextResponse.json({
                success: true,
                simulation: {
                    piecesToList,
                    estimatedRevenue,
                    achievable
                }
            })
        }

        return NextResponse.json({ success: true, plan: planData })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
}
