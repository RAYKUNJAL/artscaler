'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UsageMeter from '@/components/dashboard/UsageMeter';
import RevenueTracker from '@/components/dashboard/RevenueTracker';
import GlobalPulseCard from '@/components/dashboard/GlobalPulseCard';
import MarketAlerts from '@/components/dashboard/MarketAlerts';
import ActionPlan from '@/components/dashboard/ActionPlan';
import QuickTools from '@/components/dashboard/QuickTools';
import ActiveListingsControl from '@/components/dashboard/ActiveListingsControl';
import RecentScrapes from '@/components/RecentScrapes';
import ArtGalleryGrid from '@/components/gallery/ArtGalleryGrid';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Sparkles } from 'lucide-react';

interface DashboardStats {
    topStyles: Array<{ style: string; avgWvs: number; count: number }>;
    topSizes: Array<{ size: string; avgPrice: number; avgWvs: number }>;
    activeListings: number;
    avgWvs: number;
    avgPrice: number;
    pulseAlerts: number;
    estimatedMarketCap: number;
    dailyUsage?: { used: number; limit: number };
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
                    dailyUsage: data.stats.dailyUsage,
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

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center animate-pulse">
                            <Sparkles className="h-8 w-8 text-blue-500" />
                        </div>
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Initializing Control Center...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-12 md:space-y-16 pb-24">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Version 6.0 Active</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase italic">
                            Revenue <span className="text-blue-500">Command</span> Center
                        </h1>
                        <p className="text-gray-500 font-bold text-lg max-w-2xl">
                            Intelligence-driven control for your eBay art business. Set goals, track demand, and list what sells.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <UsageMeter
                            used={stats.dailyUsage?.used || 0}
                            limit={stats.dailyUsage?.limit || 10}
                        />
                    </div>
                </div>

                {/* Primary Intelligence Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <RevenueTracker
                            current={12450}
                            goal={20000}
                            isConnected={true}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <GlobalPulseCard
                            score={stats.avgWvs || 8.4}
                            change="+2.4% vs prev"
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <MarketAlerts />
                    </div>
                </div>

                {/* Second Row: Actions & Tools */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="space-y-8 h-full flex flex-col justify-between">
                            <QuickTools />
                            <ActiveListingsControl />
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <ActionPlan />
                    </div>
                </div>

                {/* Visual Intelligence Grid */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Visual Intelligence Feed</h2>
                        <Link href="/gallery" className="text-xs font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest">
                            Explore Full Gallery
                        </Link>
                    </div>
                    <ArtGalleryGrid limit={8} />
                </div>

                {/* Historical Log */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <RecentScrapes />
                    </div>
                    <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-[32px] p-8">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">Pulse Intelligence</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">
                            Based on your goal of $20k/month, the most efficient path is increasing your average item price to $185.
                            Abstract Acrylics currently show a +12% price gap compared to your last 3 sales.
                        </p>
                        <button className="w-full py-4 bg-white text-gray-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:bg-gray-100">
                            Download Growth Report
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
