'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import { EbayApiListing } from '@/services/scraper/ebay-api';
import EbayResults from '@/components/EbayResults';

export default function TestScraper() {
    const { session, loading: authLoading } = useAuth();
    const [keyword, setKeyword] = useState('abstract painting');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        jobId?: string;
    } | null>(null);
    const [listings, setListings] = useState<EbayApiListing[]>([]);
    const [polling, setPolling] = useState(false);

    const fetchResults = async () => {
        try {
            if (!session) return;
            const res = await fetch('/api/scrape/results', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            const json = await res.json();
            if (res.ok && json.listings) {
                setListings(json.listings);
                if (json.listings.length > 0) {
                    setPolling(false);
                }
            }
        } catch (e) {
            console.error('Error fetching results:', e);
        }
    };

    const handleScrape = async () => {
        if (!keyword.trim()) {
            setResult({ success: false, message: 'Please enter a keyword' });
            return;
        }

        if (authLoading) {
            setResult({ success: false, message: 'Checking authentication, please wait...' });
            return;
        }

        if (!session) {
            setResult({ success: false, message: 'Unauthorized - Please log in' });
            return;
        }

        setLoading(true);
        setResult(null);
        setListings([]);

        try {
            console.log('Starting scrape for keyword:', keyword);
            const response = await fetch('/api/scrape/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ keyword: keyword.trim() }),
            });
            const data = await response.json();
            if (response.ok) {
                setResult({
                    success: true,
                    message: data.message || 'Scrape started successfully!',
                    jobId: data.job?.id,
                });
                console.log('✓ Scrape job created:', data.job);
                setPolling(true);
            } else {
                setResult({ success: false, message: data.error || 'Failed to start scrape' });
                console.error('✗ Scrape failed:', data.error);
            }
        } catch (error: any) {
            console.error('Scrape error:', error);
            setResult({ success: false, message: error.message || 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    // Polling effect
    useEffect(() => {
        if (!polling) return;
        const interval = setInterval(fetchResults, 5000);
        fetchResults();
        return () => clearInterval(interval);
    }, [polling, session]);

    return (
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-xl p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Search className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="text-base md:text-lg font-semibold text-white">Test eBay Scraper (API)</h3>
                    <p className="text-xs md:text-sm text-gray-400">Scrape sold listings using the official eBay Finding API.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Search Keyword</label>
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
                    onClick={handleScrape}
                    disabled={loading || authLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Scraping eBay...
                        </>
                    ) : (
                        <>
                            <Search className="h-5 w-5" />
                            Start Scrape
                        </>
                    )}
                </button>

                {result && (
                    <div
                        className={`p-4 rounded-lg border ${result.success ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'}`}
                    >
                        <div className="flex items-start gap-3">
                            {result.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p className={result.success ? 'text-green-400' : 'text-red-400'}>{result.message}</p>
                                {result.success && result.jobId && (
                                    <p className="text-sm text-gray-400 mt-2">Job ID: {result.jobId}</p>
                                )}
                                {result.success && (
                                    <p className="text-sm text-gray-400 mt-2">💡 Check the results below as they become available.</p>
                                )}
                                {!result.success && result.message.includes('Unauthorized') && (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="mt-3 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
                                    >
                                        Refresh Session
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Render listings when available */}
                {listings.length > 0 && (
                    <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Scraped Listings</h4>
                        <EbayResults listings={listings} />
                    </div>
                )}

                <div className="bg-gray-800/50 rounded-lg p-4 text-xs md:text-sm text-gray-400 mt-6">
                    <p className="font-semibold text-gray-300 mb-2">How it works:</p>
                    <ul className="space-y-1 list-disc list-inside">
                        <li>Uses the official eBay Finding API (sandbox keys).</li>
                        <li>Creates a scrape job, then polls for results.</li>
                        <li>Results are saved to your Supabase database.</li>
                        <li>Displayed here in a responsive grid.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
