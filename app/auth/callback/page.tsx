'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Auth callback error:', error);
                router.push('/auth/login?error=callback_failed');
                return;
            }

            if (data.session) {
                // Check if user has completed onboarding
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('onboarding_completed')
                    .eq('id', data.session.user.id)
                    .single();

                if (profile?.onboarding_completed) {
                    router.push('/dashboard');
                } else {
                    router.push('/onboarding');
                }
            } else {
                router.push('/auth/login');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">Completing sign in...</p>
            </div>
        </div>
    );
}
