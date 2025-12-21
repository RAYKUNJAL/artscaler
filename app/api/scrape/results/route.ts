import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'active';

        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const table = type === 'sold' ? 'ebay_sold_listings' : 'active_listings';

        const { data: listings, error } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching listings:', error);
            return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
        }

        return NextResponse.json({ listings }, { status: 200 });
    } catch (err: any) {
        console.error('Results route error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
