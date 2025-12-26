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

import MarketSummaryCards from '@/components/scanner/MarketSummaryCards';
import KeywordIntelligence from '@/components/scanner/KeywordIntelligence';
import { Sparkles, Microscope, Copy, Wand2, Bookmark, BarChart3, Info } from 'lucide-react';

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
    const [mode, setMode] = useState<'active' | 'sold' | 'trending'>('active');
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

        const table = mode === 'sold' ? 'ebay_sold_listings' : 'active_listings';
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data && data.length > 0) {
            setListings(data);
            setIsDemo(false);
        } else {
            setListings(DEMO_MARKET_DATA as any);
            setIsDemo(true);
        }
        setLoading(false);
    }

    async function handleScrape() {
        if (!keyword.trim()) return;
        setScraping(true);
        setStatus('Initializing Scan...');

        try {
            const startRes = await fetch('/api/scrape/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: keyword.trim(), mode })
            });
            const startData = await startRes.json();

            if (!startRes.ok) throw new Error(startData.error || 'Failed to start scan');

            const jobId = startData.jobId;
            setStatus('Intercepting eBay Data Streams...');

            // Polling logic
            const pollInterval = setInterval(async () => {
                const jobRes = await fetch(`/api/scrape/status?jobId=${jobId}`);
                const jobData = await jobRes.json();

                if (jobData.status === 'completed') {
                    clearInterval(pollInterval);
                    setStatus('✓ Intelligence Verified. Updating Hub...');
                    setTimeout(() => {
                        setScraping(false);
                        loadData();
                    }, 1000);
                } else if (jobData.status === 'failed') {
                    clearInterval(pollInterval);
                    setStatus('❌ Intelligence Intercept Failed.');
                    setScraping(false);
                } else {
                    // Gradual status updates for cinematic effect
                    const statuses = [
                        'Normalizing Pulse Signals...',
                        'Extracting Subject Intelligence...',
                        'Calculating Velocity Scores (WVS)...',
                        'Decrypting Competitor Strategy...'
                    ];
                    setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
                }
            }, 3000);

        } catch (e: any) {
            console.error(e);
            setStatus(`Error: ${e.message}`);
            setTimeout(() => setScraping(false), 3000);
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
            <div className="space-y-12">
                {/* V6 High-Impact Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/20">
                                <Search className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs font-black text-purple-500 uppercase tracking-widest">Market Intelligence Hub</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase italic">
                            Market <span className="text-purple-500">Intelligence</span> Hub
                        </h1>
                        <p className="text-gray-500 font-bold text-lg max-w-2xl">
                            Advanced eBay research. Switch between Live Demand, Sold History, and AI Trends to find your next winning niche.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <UsageMeter used={usage.used} limit={usage.limit} />
                    </div>
                </div>

                {/* Search & Mode Controls */}
                <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8">
                    <div className="flex flex-col lg:flex-row items-center gap-8 mb-8">
                        {/* Mode Toggles */}
                        <div className="flex items-center p-1.5 bg-gray-800/50 border border-white/5 rounded-2xl w-full lg:w-auto">
                            {[
                                { id: 'active', label: 'Live Demand', icon: Target },
                                { id: 'sold', label: 'Sold History', icon: Clock },
                                { id: 'trending', label: 'Trending', icon: Sparkles }
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id as any)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex-1 lg:flex-none ${mode === m.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    <m.icon className="h-4 w-4" />
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="flex-1 w-full relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Scan a niche (e.g., abstract acrylic 16x20)..."
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl pl-16 pr-6 py-5 text-lg font-bold text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                disabled={scraping}
                            />
                        </div>

                        <button
                            onClick={handleScrape}
                            disabled={scraping || !keyword}
                            className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black uppercase tracking-[0.2em] px-10 py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
                        >
                            {scraping ? 'Scanning...' : 'Launch Intel'}
                        </button>
                    </div>

                    {status && (
                        <div className="flex items-center gap-3 px-6 py-3 bg-blue-600/10 border border-blue-600/20 rounded-xl">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{status}</span>
                        </div>
                    )}
                </div>

                {/* Market Overview Summary */}
                <MarketSummaryCards data={{
                    activeListings: listings.length > 50 ? 2847 : listings.length * 12,
                    avgPrice: 165.40,
                    competition: 'Medium',
                    sellThrough: '68%',
                    avgWatchers: 42,
                    trend: 'up'
                }} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Results Table */}
                        <div className="bg-gray-900 border border-gray-800 rounded-[32px] overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
                                    {mode === 'active' ? 'Live Demand Signals' : mode === 'sold' ? 'Sold Intel' : 'Trending Breakouts'}
                                </h3>
                                <button className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
                                    <Download className="h-4 w-4" /> Export CSV
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/[0.02] border-b border-white/5">
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Signal</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Price</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Demand</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {listings.map((item) => (
                                            <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="max-w-xs xl:max-w-md">
                                                        <p className="text-sm font-black text-white uppercase tracking-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
                                                            {item.title}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1.5 font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                                                            <span className="text-blue-400/80">ID: {item.listing_id}</span>
                                                            <span>{item.category || 'Fine Art'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-lg font-black text-white">${(item.current_price || (item as any).sold_price || 0).toFixed(2)}</p>
                                                    <p className="text-[10px] font-black text-gray-600 uppercase">USD</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className={`text-lg font-black ${getWvsColor(item.demand_score || (item as any).wvs_score || 0)}`}>
                                                                {(item.demand_score || (item as any).wvs_score || 0).toFixed(1)}
                                                            </p>
                                                            <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Score</p>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                                                <Eye className="h-3 w-3 text-blue-400" /> {item.watcher_count || 0}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                                                <TrendingUp className="h-3 w-3 text-red-400" /> {item.bid_count || 0}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all" title="Deep Analyze">
                                                            <Microscope className="h-4 w-4" />
                                                        </button>
                                                        <button className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all" title="Copy Strategy">
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                        <button className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all" title="Clone to Builder">
                                                            <Wand2 className="h-4 w-4" />
                                                        </button>
                                                        <a
                                                            href={item.item_url}
                                                            target="_blank"
                                                            className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all"
                                                            title="External Link"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                        <KeywordIntelligence />

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[32px] p-8 text-white relative overflow-hidden group">
                            <div className="relative z-10">
                                <h4 className="text-xl font-black uppercase italic tracking-tighter mb-4">Competitor Spy</h4>
                                <p className="text-blue-100 text-sm leading-relaxed mb-6 font-medium">
                                    Reverse engineer any seller's strategy. See their monthly revenue, best selling niches, and listing velocity.
                                </p>
                                <button className="w-full py-4 bg-white text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-105 transition-all">
                                    Launch Studio Spy
                                </button>
                            </div>
                            <BarChart3 className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5 transition-transform group-hover:scale-110" />
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" /> How to use Intel
                            </h4>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Price Gap</p>
                                    <p className="text-xs font-bold text-gray-300">Look for items with 20+ watchers priced 15% below market avg to flip.</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Velocity Signal</p>
                                    <p className="text-xs font-bold text-gray-300">WVS above 8.0 indicates high-buying intent. List similar items ASAP.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
