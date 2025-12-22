import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const style = searchParams.get('style');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabase
            .from('ebay_sold_listings')
            .select(`
                id,
                title,
                sold_price,
                currency,
                sold_date,
                item_url,
                image_url,
                visual_metadata,
                search_keyword,
                parsed_signals (
                    style,
                    subject,
                    medium,
                    width_in,
                    height_in
                )
            `)
            .eq('user_id', user.id)
            .not('image_url', 'is', null)
            .order('sold_date', { ascending: false });

        if (style) {
            // Check in visual_metadata or parsed_signals
            query = query.or(`visual_metadata->>primary_style.eq.${style}`);
        }

        const { data: listings, error, count } = await query
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Gallery API Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            listings,
            count
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
