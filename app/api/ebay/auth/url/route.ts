
import { NextResponse } from 'next/server';
import { getUserAuthUrl } from '@/lib/ebay/oauth';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = getUserAuthUrl();
        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('[eBay Auth URL] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
