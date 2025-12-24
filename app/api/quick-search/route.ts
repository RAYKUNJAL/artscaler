import { NextRequest, NextResponse } from 'next/server';
import { getUniversalSampleEbayData } from '@/services/ebay/universal-sample-data';

export const dynamic = 'force-dynamic';

/**
 * Quick Search API - Returns immediate results
 * Use this for fast, instant search results while real API runs in background
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { keyword } = body;

        if (!keyword) {
            return NextResponse.json({ error: 'Keyword required' }, { status: 400 });
        }

        console.log(`[Quick Search] Generating instant results for: "${keyword}"`);

        // Generate instant sample data
        const sampleData = getUniversalSampleEbayData(keyword, 20);

        // Convert to format expected by frontend
        const listings = sampleData.listings.map((item: any) => ({
            id: item.itemId,
            title: item.title,
            current_price: item.price,
            sold_price: item.price,
            watcher_count: Math.floor(Math.random() * 50),
            bid_count: item.bids,
            listing_id: item.itemId,
            item_url: item.link,
            listing_type: item.bids > 0 ? 'Auction' : 'FixedPrice',
            width_in: parseInt(item.title.match(/(\d+)x\d+/)?.[1] || '9'),
            height_in: parseInt(item.title.match(/\d+x(\d+)/)?.[1] || '12'),
            material: item.condition,
            category: 'Art',
            watcher_velocity: Math.random() * 5,
            demand_score: Math.floor(Math.random() * 100),
            created_at: new Date().toISOString(),
            first_seen_at: item.soldDate,
            image_url: item.image,
            currency: item.currency,
            shipping_price: item.shipping,
            sold_date: item.soldDate
        }));

        return NextResponse.json({
            success: true,
            count: listings.length,
            listings,
            source: 'instant-sample',
            message: `Found ${listings.length} results instantly`
        });

    } catch (error: any) {
        console.error('[Quick Search] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
