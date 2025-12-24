'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { Suspense } from 'react';

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    const getErrorMessage = () => {
        switch (error) {
            case 'auth_callback_failed':
                return {
                    title: 'Authentication Failed',
                    description: 'We couldn\'t complete the sign-in process. This can happen if the link expired or was already used.',
                    suggestion: 'Please try signing in again.',
                };
            case 'access_denied':
                return {
                    title: 'Access Denied',
                    description: 'You do not have permission to access this resource.',
                    suggestion: 'Please contact support if you believe this is an error.',
                };
            case 'server_error':
                return {
                    title: 'Server Error',
                    description: 'Something went wrong on our end.',
                    suggestion: 'Please try again in a few moments.',
                };
            case 'email_not_confirmed':
                return {
                    title: 'Email Not Confirmed',
                    description: 'Please check your email and click the confirmation link.',
                    suggestion: 'Check your spam folder if you don\'t see the email.',
                };
            default:
                return {
                    title: 'Authentication Error',
                    description: errorDescription || 'An unexpected error occurred during authentication.',
                    suggestion: 'Please try signing in again.',
                };
        }
    };

    const errorInfo = getErrorMessage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                {/* Error Icon */}
                <div className="mb-8">
                    <div className="h-20 w-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-700/50">
                        <AlertTriangle className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{errorInfo.title}</h1>
                    <p className="text-gray-400 mb-2">{errorInfo.description}</p>
                    <p className="text-blue-400 text-sm">{errorInfo.suggestion}</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                    <Link
                        href="/auth/login"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                        <RefreshCw className="h-5 w-5" />
                        Try Again
                    </Link>

                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all border border-gray-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Back to Home
                    </Link>
                </div>

                {/* Support Link */}
                <div className="mt-8 pt-6 border-t border-gray-800">
                    <p className="text-gray-500 text-sm">
                        Need help?{' '}
                        <a
                            href="mailto:support@artscaler.com"
                            className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                        >
                            <Mail className="h-4 w-4" />
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        }>
            <AuthErrorContent />
        </Suspense>
    );
}
