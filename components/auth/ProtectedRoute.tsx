'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireOnboarding?: boolean;
}

export default function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (user) {
                // User is authenticated
                setChecking(false);
            } else {
                // Try to fetch session directly as fallback
                supabase.auth.getSession().then(({ data, error }) => {
                    if (data.session) {
                        console.log('🔁 Fallback session retrieved, updating user');
                        // AuthProvider listener will update user state, triggering this effect again
                    } else {
                        console.warn('🔁 No session found, redirecting to login');
                        router.push('/auth/login');
                    }
                });
            }
        }
    }, [loading, user, router]);

    if (loading || checking) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Optionally handle onboarding requirement here
    return <>{children}</>;
}
