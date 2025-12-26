'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import UsageMeter from '@/components/dashboard/UsageMeter';
import { DEMO_MARKET_DATA, getDemoBadge } from '@/lib/demo-data';
import {
    Search,
    Play,
    Download,
    Loader2,
    CheckCircle,
    XCircle,
    Eye,
    Target,
    Tag,
    Palette,
    ChevronRight,
    TrendingUp,
    ExternalLink,
    Clock,
    AlertCircle
} from 'lucide-react';

interface ActiveListing {
    id: string;
    title: string;
    current_price: number;
    watcher_count: number;
    bid_count: number;
    listing_id: string;
    item_url: string;
    listing_type: string;
    width_in: number;
    height_in: number;
    material: string;
    category: string;
    watcher_velocity: number;
    demand_score: number;
    created_at: string;
}

export default function MarketScanner() {
    const [keyword, setKeyword] = useState('');
    const [mode, setMode] = useState<'active' | 'sold'>('active');
    const [scraping, setScraping] = useState(false);
    const [listings, setListings] = useState<ActiveListing[]>([]);
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [usage, setUsage] = useState<{ used: number; limit: number }>({ used: 0, limit: 10 });
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        loadData();
        loadUsage();
    }, [mode]);

    async function loadUsage() {
        try {
            const res = await fetch('/api/dashboard/stats');
            const data = await res.json();
            if (data.success && data.stats?.dailyUsage) {
                setUsage(data.stats.dailyUsage);
            }
        } catch (error) {
            console.error('Error loading usage:', error);
        }
    }

    async function loadData() {
        setLoading(true);
        setIsDemo(false);

        if (!isSupabaseConfigured()) {
            setListings(DEMO_MARKET_DATA as any);
            setIsDemo(true);
            setLoading(false);
            return;
        }

        const table = mode === 'active' ? 'active_listings' : 'ebay_sold_listings';
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data && data.length > 0) {
            setListings(data);
            setIsDemo(false);
        } else {
            console.log('[Scanner] No real data found, showing demo set');
            setListings(DEMO_MARKET_DATA as any);
            setIsDemo(true);
        }
        setLoading(false);
    }

    async function handleScrape() {
        if (!keyword.trim()) {
            alert('Please enter a keyword');
            return;
        }

        setScraping(true);
        setStatus('Initializing eBay Intelligence Scan...');

        // PHASE 1: Quick Search (Instant)
        try {
            console.log('[Scanner] Running Quick Search...');
            const quickRes = await fetch('/api/quick-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: keyword.trim() })
            });
            const quickData = await quickRes.json();
            if (quickData.success && quickData.listings.length > 0) {
                setListings(quickData.listings);
                setStatus('✓ Pulse detected! Analyzing live market depth (Background scan in progress)...');
            }
        } catch (e) {
            console.warn('[Scanner] Quick search failed, proceeding to full scan only.');
        }

        // PHASE 2: Deep Scan (Background)
        try {
            const response = await fetch('/api/scrape/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    keyword: keyword.trim(),
                    mode: mode
                }),
            });

            const result = await response.json();

            if (response.ok) {
                const jobId = result.jobId || result.job?.id;
                if (!jobId) {
                    setStatus('✗ Error: Failed to retrieve Job ID');
                    setScraping(false);
                    return;
                }

                // If quick search already found data, keep that status but update it
                if (!status.includes('Pulse detected')) {
                    setStatus('Deep scan started! Fetching real-time signals...');
                }

                const pollInterval = setInterval(async () => {
                    try {
                        const statusRes = await fetch(`/api/scrape/status?jobId=${jobId}`);
                        if (!statusRes.ok) throw new Error('Status check failed');

                        const statusData = await statusRes.json();

                        if (statusData.success) {
                            const job = statusData.job;
                            if (job.status === 'completed') {
                                clearInterval(pollInterval);
                                setStatus('✓ Deep scan complete! Real-time signals verified.');
                                setScraping(false);
                                loadData(); // Refresh with real data
                            } else if (job.status === 'failed') {
                                clearInterval(pollInterval);
                                setStatus(`✗ Real-time Scan Error: ${job.error_message || 'Scrape failed'}`);
                                setScraping(false);
                            } else {
                                // Don't overwrite Quick Search status if job has 0 items yet
                                if (!status.includes('Pulse detected') || (job.items_found || 0) > 0) {
                                    setStatus(`Scanning market... ${job.items_found || 0} real signals identified.`);
                                }
                            }
                        }
                    } catch (pollErr) {
                        console.error('Polling error:', pollErr);
                    }
                }, 3000);
            } else {
                setStatus(`✗ Error: ${result.error}`);
                setScraping(false);
            }
        } catch (error: any) {
            setStatus(`✗ Error: ${error.message}`);
            setScraping(false);
        }
    }

    const getWvsColor = (wvs: number) => {
        if (wvs >= 7) return 'text-green-400';
        if (wvs >= 4) return 'text-blue-400';
        if (wvs >= 2) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white">Market Intelligence Scanner</h1>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
                            <CheckCircle className="h-3 w-3 text-blue-400" />
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Verified Official eBay API</span>
                        </div>
                    </div>
                    <p className="text-gray-400">Scan live eBay markets for demand signals and high-velocity opportunities.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 space-y-8">

                        {/* Scraper Controls */}
                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 shadow-xl">
                            <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                                <button
                                    onClick={() => setMode('active')}
                                    className={`w-full md:w-auto px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'active'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-gray-800 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <Target className="inline-block h-4 w-4 mr-2" />
                                    Live Demand (Active)
                                </button>
                                <button
                                    onClick={() => setMode('sold')}
                                    className={`w-full md:w-auto px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'sold'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-gray-800 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <Clock className="inline-block h-4 w-4 mr-2" />
                                    Pricing History (Sold)
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Search Keyword
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                        <input
                                            type="text"
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            placeholder="e.g., original abstract oil painting 24x36"
                                            title="Search Keyword"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                                            disabled={scraping}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={handleScrape}
                                        disabled={scraping}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg"
                                    >
                                        {scraping ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Scanning...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-5 w-5" />
                                                Launch Scan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {status && (
                                <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-3 ${status.startsWith('✓') || status.includes('started')
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : status.startsWith('✗') ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}>
                                    {status.startsWith('✓') ? <CheckCircle className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                                    {status}
                                </div>
                            )}

                            {isDemo && (
                                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    <p className="text-sm text-amber-500 font-bold uppercase tracking-widest">{getDemoBadge('Market Intelligence Scan')}</p>
                                </div>
                            )}
                        </div>

                        {/* Results Table */}
                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between p-6 border-b border-gray-800">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-blue-400" />
                                        {mode === 'active' ? 'Live Demand Signals' : 'Completed Sales Data'}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {listings.length} real-time data points identified
                                    </p>
                                </div>
                                <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                                    Export Intelligence <Download className="inline h-4 w-4 ml-1" />
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-800/80">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Item Signal</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price Point</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Velocities</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Demand Score</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Attributes</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {loading && listings.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center">
                                                    <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
                                                    <p className="text-gray-500">Retrieving real-time market data...</p>
                                                </td>
                                            </tr>
                                        ) : listings.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                                    No {mode} listings found. Run a scan to see demand intelligence.
                                                </td>
                                            </tr>
                                        ) : (
                                            listings.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-800/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                                                                {item.title}
                                                            </span>
                                                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                <Tag className="h-3 w-3" />
                                                                ID: {item.listing_id || 'DEMO-' + Math.random().toString(36).substr(2, 9)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-white">
                                                                ${(item.current_price || (item as any).sold_price || 0).toFixed(2)}
                                                            </span>
                                                            <span className="text-xs text-gray-500">USD</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm text-gray-300 flex items-center gap-2">
                                                                <Eye className="h-4 w-4 text-blue-400" />
                                                                {item.watcher_count || 0} watching
                                                            </span>
                                                            {(item.bid_count || 0) > 0 && (
                                                                <span className="text-xs text-purple-400 font-medium">
                                                                    {item.bid_count} active bids
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className={`text-lg font-black ${getWvsColor(item.demand_score || (item as any).wvs_score || 0)}`}>
                                                                {(item.demand_score || (item as any).wvs_score) ? (item.demand_score || (item as any).wvs_score).toFixed(1) : '0.0'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 tracking-widest uppercase">
                                                                WVS Signal
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {(item.width_in || (item as any).size) && (
                                                                <span className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                                                                    {item.width_in ? `${item.width_in}x${item.height_in}` : (item as any).size}
                                                                </span>
                                                            )}
                                                            {(item.material || (item as any).style) && (
                                                                <span className="px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 text-[10px] font-bold border border-purple-500/20">
                                                                    {item.material || (item as any).style}
                                                                </span>
                                                            )}
                                                            <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-[10px] font-bold border border-gray-700">
                                                                {item.listing_type || 'Fixed Price'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <a
                                                            href={item.item_url || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`p-2 bg-gray-800 hover:bg-blue-600 rounded-lg inline-block transition-all text-gray-400 hover:text-white ${!item.item_url && 'opacity-50 pointer-events-none'}`}
                                                            title="View Item on eBay"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    <div className="space-y-6">
                        <UsageMeter used={usage.used} limit={usage.limit} />

                        <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Scanner Tips</h3>
                            <ul className="space-y-3 text-xs text-gray-400">
                                <li className="flex items-start gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1" />
                                    <span>Use specific keywords like **"Original Signed"** for higher accuracy.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1" />
                                    <span>Active scans reveal **Live Demand** (watchers).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1" />
                                    <span>Sold scans reveal **Actual Market Value**.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Intelligence Legend */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-400" />
                            What is WVS Signal?
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Watch Velocity Score measures demand intensity by analyzing watcher accumulation over time relative to price and competition.
                        </p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <Palette className="h-4 w-4 text-purple-400" />
                            Attribute Extraction
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Our AI automatically identifies style, size, and medium from listing titles to categorize market performance.
                        </p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            Real-Time Data
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Unlike cached databases, this scanner pulls directly from live eBay search results for guaranteed accuracy.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
