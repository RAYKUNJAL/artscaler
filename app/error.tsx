'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="h-20 w-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Something went wrong</h1>
                    <p className="text-gray-400">
                        We encountered an unexpected error. Please try again or return to the dashboard.
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={reset}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                        <RefreshCw className="h-5 w-5" />
                        Try Again
                    </button>
                    <Link
                        href="/dashboard"
                        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all border border-gray-700"
                    >
                        <Home className="h-5 w-5" />
                        Go to Dashboard
                    </Link>
                </div>

                {error.digest && (
                    <p className="mt-8 text-xs text-gray-600">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
