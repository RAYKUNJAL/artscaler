'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RecentScrapes from '@/components/RecentScrapes';
import ArtGalleryGrid from '@/components/gallery/ArtGalleryGrid';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
    TrendingUp,
    DollarSign,
    Package,
    Activity,
    FileText,
    Calculator,
    Zap,
    Sparkles,
    BarChart3,
    ArrowUpRight,
} from 'lucide-react';

interface DashboardStats {
    topStyles: Array<{ style: string; avgWvs: number; count: number }>;
    topSizes: Array<{ size: string; avgPrice: number; avgWvs: number }>;
    activeListings: number;
    avgWvs: number;
    avgPrice: number;
    pulseAlerts: number;
    estimatedMarketCap: number;
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        topStyles: [],
        topSizes: [],
        activeListings: 0,
        avgWvs: 0,
        avgPrice: 0,
        pulseAlerts: 0,
        estimatedMarketCap: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            if (!isSupabaseConfigured()) {
                setLoading(false);
                return;
            }

            const res = await fetch('/api/dashboard/stats');
            const data = await res.json();

            if (res.ok && data.stats) {
                setStats({
                    topStyles: data.stats.topStyles || [],
                    topSizes: data.stats.topSizes || [],
                    activeListings: data.stats.activeListings || 0,
                    avgWvs: data.stats.globalPulse || 0,
                    avgPrice: data.stats.marketValue / (data.stats.activeListings || 1),
                    pulseAlerts: data.stats.activeAlerts || 0,
                    estimatedMarketCap: data.stats.marketValue || 0,
                });
            } else {
                console.error('Failed to load stats:', data.error);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    const getWvsColor = (wvs: number) => {
        if (wvs > 5) return 'text-green-400';
        if (wvs > 2) return 'text-blue-400';
        if (wvs > 1) return 'text-yellow-400';
        return 'text-red-400';
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 md:space-y-8 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Pulse Control Center</h1>
                        <p className="text-gray-400 font-medium text-sm md:text-base">Real-time eBay Art Intelligence & Demand Tracking.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] md:text-xs font-bold text-green-400 uppercase tracking-wider">Live Market Feed</span>
                        </div>
                    </div>
                </div>

                {/* Core Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 md:p-6 hover:border-blue-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Global Pulse</h3>
                            <Activity className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl md:text-4xl font-black text-white">{stats.avgWvs.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                +2.4% from yesterday
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 md:p-6 hover:border-purple-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Tracked Volume</h3>
                            <Package className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl md:text-4xl font-black text-white">{stats.activeListings.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 font-medium">Active Art Listings</p>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 md:p-6 hover:border-amber-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Active Alerts</h3>
                            <Zap className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl md:text-4xl font-black text-white">{stats.pulseAlerts}</p>
                            <p className="text-xs text-amber-400 font-bold">High Demand Signals</p>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 md:p-6 hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Market Value</h3>
                            <DollarSign className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl md:text-4xl font-black text-white">${(stats.estimatedMarketCap / 1000).toFixed(1)}k</p>
                            <p className="text-xs text-gray-400 font-medium">Under Monitoring</p>
                        </div>
                    </div>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between overflow-hidden relative group">
                        <div className="relative z-10 w-full">
                            <h2 className="text-xl md:text-2xl font-bold mb-2">Profit Calculator</h2>
                            <p className="text-blue-100 mb-6 max-w-xs text-sm md:text-base">Analyze eBay fees and shipping to find your highest margin niches.</p>
                            <Link href="/profit-calculator" className="inline-flex items-center justify-center w-full md:w-auto gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all">
                                Open Calculator
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <Calculator className="h-24 w-24 md:h-32 md:w-32 text-white/10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform rotate-12" />
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between overflow-hidden relative group">
                        <div className="relative z-10 w-full">
                            <h2 className="text-xl md:text-2xl font-bold mb-2">Listing Builder</h2>
                            <p className="text-purple-100 mb-6 max-w-xs text-sm md:text-base">Generate titles and price advice based on current Pulse Velocity.</p>
                            <Link href="/listing-builder" className="inline-flex items-center justify-center w-full md:w-auto gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all">
                                Build Smart Listing
                                <Sparkles className="h-4 w-4" />
                            </Link>
                        </div>
                        <FileText className="h-24 w-24 md:h-32 md:w-32 text-white/10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform -rotate-12" />
                    </div>
                </div>

                {/* Market Feed Components */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="lg:col-span-2 space-y-6 md:space-y-8">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 md:p-8">
                            <div className="flex items-center justify-between mb-6 md:mb-8">
                                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                                    Top Styles by Velocity
                                </h2>
                                <Link href="/trends" className="text-xs md:text-sm font-bold text-blue-400 hover:text-blue-300">View Trends</Link>
                            </div>
                            <div className="space-y-4 md:space-y-6">
                                {stats.topStyles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 md:py-12 space-y-4">
                                        <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                                            <Activity className="h-8 w-8 text-blue-500/50" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white font-bold">Waiting for market data...</p>
                                            <p className="text-gray-500 text-sm mt-1">Run a scan in the Market Scanner to see trends.</p>
                                        </div>
                                        <Link href="/market-scanner" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all uppercase tracking-widest">
                                            Go to Scanner
                                        </Link>
                                    </div>
                                ) : (
                                    stats.topStyles.map((item, index) => (
                                        <div key={item.style} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs md:text-sm font-black text-gray-600">0{index + 1}</span>
                                                    <span className="text-xs md:text-sm font-bold text-white uppercase tracking-wider">{item.style}</span>
                                                </div>
                                                <span className={`text-xs md:text-sm font-black ${getWvsColor(item.avgWvs)}`}>
                                                    {item.avgWvs.toFixed(2)} WVS
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                                                    style={{ '--bar-width': `${Math.min((item.avgWvs / 10) * 100, 100)}%` } as React.CSSProperties}
                                                >
                                                    <div className="h-full w-[var(--bar-width)]" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 md:space-y-8">
                        <RecentScrapes />

                        {/* Dynamic Strategy Card */}
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 md:p-6">
                            <div className="h-10 w-10 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center mb-4">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Pulse Strategy</h3>
                            <div className="text-sm text-gray-400 leading-relaxed">
                                {stats.topStyles.length > 0 ? (
                                    <>
                                        Market velocity for <strong>{stats.topStyles[0].style}</strong> is currently at <strong>{stats.topStyles[0].avgWvs.toFixed(1)} WVS</strong>.
                                        We recommend optimizing your listings with "Original Signed" tags to capture this momentum.
                                    </>
                                ) : (
                                    "Aggregating market intelligence... Run a scan to receive tailored strategy advice."
                                )}
                            </div>
                            <Link href="/dashboard/intelligence" className="block w-full mt-6">
                                <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all">
                                    view full report
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* VISUAL INTELLIGENCE GALLERY (FEATURE-VISUAL-001) */}
                <div className="pt-8 md:pt-12">
                    <ArtGalleryGrid limit={8} />
                </div>
            </div>
        </DashboardLayout>
    );
}
