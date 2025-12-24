import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createServerClient();
        const { error, data } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data?.user) {
            // Check if onboarding is completed
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('onboarding_completed')
                .eq('id', data.user.id)
                .single();

            if (!profile?.onboarding_completed) {
                return NextResponse.redirect(`${origin}/onboarding`);
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
