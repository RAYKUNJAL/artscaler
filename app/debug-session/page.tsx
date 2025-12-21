'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function SessionDebugPage() {
    const [sessionInfo, setSessionInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const checkSession = async () => {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();

        setSessionInfo({
            hasSession: !!data.session,
            user: data.session?.user,
            error: error,
            timestamp: new Date().toISOString(),
        });
        setLoading(false);
    };

    useEffect(() => {
        checkSession();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8">
                    🔍 Session Debug Page
                </h1>

                <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-white">Session Status</h2>
                        <button
                            onClick={checkSession}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-400 mt-4">Checking session...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Session Status */}
                            <div className={`p-6 rounded-lg border ${sessionInfo?.hasSession
                                    ? 'bg-green-900/20 border-green-700/50'
                                    : 'bg-red-900/20 border-red-700/50'
                                }`}>
                                <div className="flex items-center gap-3 mb-4">
                                    {sessionInfo?.hasSession ? (
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                    ) : (
                                        <XCircle className="h-8 w-8 text-red-500" />
                                    )}
                                    <div>
                                        <h3 className={`text-xl font-semibold ${sessionInfo?.hasSession ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {sessionInfo?.hasSession ? 'Logged In ✅' : 'Not Logged In ❌'}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {sessionInfo?.timestamp}
                                        </p>
                                    </div>
                                </div>

                                {sessionInfo?.user && (
                                    <div className="space-y-2 text-sm">
                                        <p className="text-gray-300">
                                            <span className="font-semibold">Email:</span> {sessionInfo.user.email}
                                        </p>
                                        <p className="text-gray-300">
                                            <span className="font-semibold">User ID:</span> {sessionInfo.user.id}
                                        </p>
                                        <p className="text-gray-300">
                                            <span className="font-semibold">Created:</span> {new Date(sessionInfo.user.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Full Session Data */}
                            <div className="bg-black/30 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-3">Full Session Data:</h3>
                                <pre className="text-xs text-gray-300 overflow-auto max-h-96">
                                    {JSON.stringify(sessionInfo, null, 2)}
                                </pre>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                {sessionInfo?.hasSession ? (
                                    <>
                                        <a
                                            href="/dashboard"
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center px-6 py-3 rounded-lg font-semibold transition-all"
                                        >
                                            Go to Dashboard →
                                        </a>
                                        <button
                                            onClick={async () => {
                                                await supabase.auth.signOut();
                                                checkSession();
                                            }}
                                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                                        >
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <a
                                            href="/auth/login"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center px-6 py-3 rounded-lg font-semibold transition-all"
                                        >
                                            Go to Login →
                                        </a>
                                        <a
                                            href="/auth/signup"
                                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-center px-6 py-3 rounded-lg font-semibold transition-all"
                                        >
                                            Sign Up →
                                        </a>
                                    </>
                                )}
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 text-sm text-gray-300">
                                <p className="font-semibold text-blue-400 mb-2">💡 What to do:</p>
                                <ul className="space-y-1 list-disc list-inside">
                                    {sessionInfo?.hasSession ? (
                                        <>
                                            <li>You're logged in! Click "Go to Dashboard" above</li>
                                            <li>If dashboard shows "Not logged in", refresh this page and check again</li>
                                            <li>Try clearing browser cache and cookies if issues persist</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>You need to log in first</li>
                                            <li>Click "Go to Login" or "Sign Up" above</li>
                                            <li>After logging in, come back to this page to verify</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
