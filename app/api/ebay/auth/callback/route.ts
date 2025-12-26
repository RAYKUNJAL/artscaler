
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForUserToken } from '@/lib/ebay/oauth';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        console.error('[eBay OAuth Callback] Error from eBay:', error);
        return NextResponse.redirect(new URL('/settings?error=ebay_auth_failed', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/settings?error=no_code', request.url));
    }

    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Exchange code for tokens
        const tokens = await exchangeCodeForUserToken(code);

        // Store tokens in Supabase
        const { error: dbError } = await supabase
            .from('seller_accounts')
            .upsert({
                user_id: user.id,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                refresh_token_expires_at: tokens.refresh_token_expires_in
                    ? new Date(Date.now() + tokens.refresh_token_expires_in * 1000).toISOString()
                    : null,
                status: 'connected'
            }, { onConflict: 'user_id' });

        if (dbError) {
            console.error('[eBay OAuth Callback] DB Error:', dbError);
            return NextResponse.redirect(new URL('/settings?error=db_error', request.url));
        }

        return NextResponse.redirect(new URL('/settings?success=ebay_connected', request.url));
    } catch (err: any) {
        console.error('[eBay OAuth Callback] Critical Error:', err);
        return NextResponse.redirect(new URL('/settings?error=server_error', request.url));
    }
}
