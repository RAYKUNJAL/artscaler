import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);
        const style = searchParams.get('style');
        const size = searchParams.get('size');

        // Fetch historical sold data for this segment
        let query = supabase
            .from('ebay_sold_listings')
            .select('sold_price, bid_count, sold_date')
            .order('sold_date', { ascending: false });

        if (style) {
            query = query.ilike('title', `%${style}%`);
        }
        if (size) {
            // Filter by keyword for now until width_in/height_in are reliably populated in sold_listings
            query = query.ilike('title', `%${size}%`);
        }

        const { data: listings, error } = await query.limit(100);

        if (error) throw error;

        // Calculate metrics
        const prices = listings.map(l => l.sold_price).sort((a, b) => a - b);
        const count = prices.length;

        if (count === 0) {
            return NextResponse.json({
                success: true,
                analysis: {
                    bands: { safe: 0, aggressive: 0, floor: 0 },
                    sample: { count: 0, avgPrice: 0, minPrice: 0, maxPrice: 0 }
                }
            });
        }

        const avgPrice = prices.reduce((a, b) => a + b, 0) / count;
        const medianPrice = prices[Math.floor(count / 2)];
        const minPrice = prices[0];
        const maxPrice = prices[count - 1];

        // "Pulse" Logic: Recommend slightly above median if demand is high
        const safePrice = Math.round(medianPrice * 0.95);
        const premiumPrice = Math.round(medianPrice * 1.2);
        const floorPrice = Math.round(minPrice * 1.1);

        return NextResponse.json({
            success: true,
            analysis: {
                bands: {
                    safe: safePrice,
                    aggressive: premiumPrice,
                    floor: floorPrice
                },
                sample: {
                    count,
                    avgPrice: Math.round(avgPrice),
                    minPrice: Math.round(minPrice),
                    maxPrice: Math.round(maxPrice)
                },
                history: listings.map(l => ({
                    date: l.sold_date,
                    price: l.sold_price
                }))
            }
        });

    } catch (error: any) {
        console.error('Pricing API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
