import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Guard against build-time execution if somehow triggered
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            return NextResponse.json({ success: true, listings: [] });
        }

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const style = searchParams.get('style');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // First try with joined query, fall back to simple query if it fails
        let listings: any[] = [];
        let count = 0;

        try {
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
                query = query.or(`visual_metadata->primary_style.eq.${style}`);
            }

            const result = await query.range(offset, offset + limit - 1);

            if (result.error) {
                // If join fails (e.g., missing table/relationship), try simpler query
                console.warn('Gallery join query failed, trying simple query:', result.error.message);
                const simpleQuery = await supabase
                    .from('ebay_sold_listings')
                    .select('id, title, sold_price, currency, sold_date, item_url, image_url, visual_metadata, search_keyword')
                    .eq('user_id', user.id)
                    .not('image_url', 'is', null)
                    .order('sold_date', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (simpleQuery.error) {
                    console.error('Gallery simple query also failed:', simpleQuery.error);
                    // Return empty result instead of error to prevent page crashes
                    listings = [];
                } else {
                    listings = simpleQuery.data || [];
                }
            } else {
                listings = result.data || [];
                count = result.count || 0;
            }
        } catch (queryError: any) {
            console.error('Gallery query exception:', queryError);
            listings = [];
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
