import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        try {
            const supabase = await createServerClient();
            const { error, data } = await supabase.auth.exchangeCodeForSession(code);

            if (!error && data?.user) {
                // Try to check if onboarding is completed, but don't crash if it fails
                try {
                    const { data: profile, error: profileError } = await supabase
                        .from('user_profiles')
                        .select('onboarding_completed')
                        .eq('id', data.user.id)
                        .single();

                    if (profileError) {
                        console.warn('Profile check failed (may be new user):', profileError.message);
                        // If profile doesn't exist or query fails, send to onboarding
                        return NextResponse.redirect(`${origin}/onboarding`);
                    }

                    if (!profile?.onboarding_completed) {
                        return NextResponse.redirect(`${origin}/onboarding`);
                    }
                } catch (profileCheckError) {
                    console.error('Error checking profile:', profileCheckError);
                    // Default to onboarding if profile check fails
                    return NextResponse.redirect(`${origin}/onboarding`);
                }

                return NextResponse.redirect(`${origin}${next}`);
            }

            // Log auth error for debugging
            if (error) {
                console.error('Auth exchange error:', error.message);
            }
        } catch (authError) {
            console.error('Auth callback exception:', authError);
            return NextResponse.redirect(`${origin}/auth/error?error=server_error`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/error?error=auth_callback_failed`);
}
