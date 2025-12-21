'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TestScraper from '@/components/TestScraper';
import RecentScrapes from '@/components/RecentScrapes';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
    TrendingUp,
    DollarSign,
    Package,
    Activity,
    FileText,
    Calculator,
    Eye,
    Zap,
    ChevronRight,
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

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Load styles with WVS (Pulse Velocity)
            const { data: styles } = await supabase
                .from('styles')
                .select('style_term, avg_wvs, listing_count')
                .order('avg_wvs', { ascending: false })
                .limit(5);

            // Load sizes with WVS
            const { data: sizes } = await supabase
                .from('sizes')
                .select('size_cluster, avg_price, avg_wvs')
                .order('avg_wvs', { ascending: false })
                .limit(5);

            // Load active listings count
            const { count: activeListings } = await supabase
                .from('active_listings')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // Load Pulse Alerts (High WVS opportunities)
            const { count: pulseAlerts } = await supabase
                .from('opportunity_feed')
                .select('*', { count: 'exact', head: true })
                .gte('wvs_score', 4);

            const topStyles = (styles || []).map(s => ({
                style: s.style_term,
                avgWvs: s.avg_wvs || 0,
                count: s.listing_count || 0,
            }));

            const topSizes = (sizes || []).map(s => ({
                size: s.size_cluster,
                avgPrice: s.avg_price || 0,
                avgWvs: s.avg_wvs || 0,
            }));

            const avgWvs = topStyles.length > 0
                ? topStyles.reduce((sum, s) => sum + s.avgWvs, 0) / topStyles.length
                : 0;

            const avgPrice = topSizes.length > 0
                ? topSizes.reduce((sum, s) => sum + s.avgPrice, 0) / topSizes.length
                : 0;

            setStats({
                topStyles,
                topSizes,
                activeListings: activeListings || 0,
                avgWvs,
                avgPrice,
                pulseAlerts: pulseAlerts || 0,
                estimatedMarketCap: (activeListings || 0) * avgPrice,
            });
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
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Pulse Control Center</h1>
                        <p className="text-gray-400 font-medium">Real-time eBay Art Intelligence & Demand Tracking.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Live Market Feed</span>
                        </div>
                    </div>
                </div>

                {/* Core Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Pulse</h3>
                            <Activity className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-black text-white">{stats.avgWvs.toFixed(2)}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                +2.4% from yesterday
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tracked Volume</h3>
                            <Package className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-black text-white">{stats.activeListings.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 font-medium">Active Art Listings</p>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Alerts</h3>
                            <Zap className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-black text-white">{stats.pulseAlerts}</p>
                            <p className="text-xs text-amber-400 font-bold">High Demand Signals</p>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Market Value</h3>
                            <DollarSign className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-black text-white">${(stats.estimatedMarketCap / 1000).toFixed(1)}k</p>
                            <p className="text-xs text-gray-400 font-medium">Under Monitoring</p>
                        </div>
                    </div>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 flex items-center justify-between overflow-hidden relative group">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-2">Profit Calculator</h2>
                            <p className="text-blue-100 mb-6 max-w-xs">Analyze eBay fees and shipping to find your highest margin niches.</p>
                            <Link href="/profit-calculator" className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all">
                                Open Calculator
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <Calculator className="h-32 w-32 text-white/10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform rotate-12" />
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-purple-500/20 flex items-center justify-between overflow-hidden relative group">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-2">Listing Builder</h2>
                            <p className="text-purple-100 mb-6 max-w-xs">Generate titles and price advice based on current Pulse Velocity.</p>
                            <Link href="/listing-builder" className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all">
                                Build Smart Listing
                                <Sparkles className="h-4 w-4" />
                            </Link>
                        </div>
                        <FileText className="h-32 w-32 text-white/10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform -rotate-12" />
                    </div>
                </div>

                {/* Market Feed Components */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <BarChart3 className="h-6 w-6 text-blue-500" />
                                    Top Styles by Velocity
                                </h2>
                                <Link href="/trends" className="text-sm font-bold text-blue-400 hover:text-blue-300">View Trends</Link>
                            </div>
                            <div className="space-y-6">
                                {stats.topStyles.length === 0 ? (
                                    <p className="text-gray-500 text-center py-12 italic">Waiting for market data...</p>
                                ) : (
                                    stats.topStyles.map((item, index) => (
                                        <div key={item.style} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-black text-gray-600">0{index + 1}</span>
                                                    <span className="text-sm font-bold text-white uppercase tracking-wider">{item.style}</span>
                                                </div>
                                                <span className={`text-sm font-black ${getWvsColor(item.avgWvs)}`}>
                                                    {item.avgWvs.toFixed(2)} WVS
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                                                    style={{ width: `${(item.avgWvs / 4) * 100}%` } as any}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <TestScraper />
                    </div>

                    <div className="space-y-8">
                        <RecentScrapes />

                        {/* Premium Advice Card */}
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6">
                            <div className="h-10 w-10 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center mb-4">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Pulse Strategy</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Market velocity for <strong>Stencils</strong> is up 12% this week. We recommend updating your listing titles to include "Original Signed" to capture the current high-intent search volume.
                            </p>
                            <Link href="/trends" className="block w-full mt-6">
                                <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all">
                                    view full report
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
