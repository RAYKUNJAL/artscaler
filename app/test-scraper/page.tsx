'use client';

import { useState } from 'react';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';

export default function TestScraperPage() {
    const [keyword, setKeyword] = useState('abstract painting');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        details?: any;
    } | null>(null);

    const handleTest = async () => {
        setLoading(true);
        setResult(null);

        try {
            console.log('Testing scraper with keyword:', keyword);

            const response = await fetch('/api/scrape/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ keyword: keyword.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    message: 'Scrape started successfully!',
                    details: data,
                });
            } else {
                setResult({
                    success: false,
                    message: data.error || 'Failed to start scrape',
                    details: data,
                });
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: error.message || 'Network error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8">
                    🧪 Scraper Test Page
                </h1>

                <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Keyword to Scrape
                        </label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="e.g., abstract painting"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                    </div>

                    <button
                        onClick={handleTest}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <Search className="h-5 w-5" />
                                Test Scraper
                            </>
                        )}
                    </button>

                    {result && (
                        <div
                            className={`p-6 rounded-lg border ${result.success
                                ? 'bg-green-900/20 border-green-700/50'
                                : 'bg-red-900/20 border-red-700/50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {result.success ? (
                                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                                )}
                                <div className="flex-1">
                                    <p className={`text-lg font-semibold mb-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                                        {result.message}
                                    </p>
                                    {result.details && (
                                        <pre className="bg-black/30 p-4 rounded text-xs text-gray-300 overflow-auto">
                                            {JSON.stringify(result.details, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 text-sm text-gray-300">
                        <p className="font-semibold text-blue-400 mb-2">📋 What this tests:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>API endpoint connectivity</li>
                            <li>Session authentication</li>
                            <li>Scraper initialization</li>
                            <li>Database connection</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <a
                            href="/auth/login"
                            className="text-blue-400 hover:text-blue-300 underline"
                        >
                            ← Back to Login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
