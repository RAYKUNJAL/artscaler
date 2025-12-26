'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Loader2, Info, ArrowUpRight, ArrowDownRight, Zap, Target, Activity, Lock, AlertCircle } from 'lucide-react';
import { PricingService } from '@/services/pricing-service';
import PremiumPaywall from '@/components/ui/PremiumPaywall';
import { DEMO_PLANNER_RECS, getDemoBadge } from '@/lib/demo-data';

interface TrendData {
    term: string;
    type: string;
    momentumScore: number;
    velocityChange: number;
    socialSignal: number;
    status: string;
}

export default function Trends() {
    const { session, loading: authLoading } = useAuth();
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        if (!authLoading && session) {
            fetchTrends();
            checkAccess();
        }
    }, [session, authLoading]);

    const checkAccess = async () => {
        if (session?.user) {
            const { limits } = await PricingService.getUserUsage(supabase, session.user.id);
            setHasAccess(limits.hasGlobalIntel);
        }
    };

    const fetchTrends = async () => {
        setLoading(true);
        setIsDemo(false);
        try {
            const response = await fetch('/api/trends', { cache: 'no-store' });
            const data = await response.json();

            if (data.trends && data.trends.length > 0) {
                setTrends(data.trends);
                setIsDemo(false);
            } else {
                setTrends(DEMO_PLANNER_RECS.map(r => ({
                    term: r.subject,
                    type: 'Subject',
                    momentumScore: r.score * 10,
                    velocityChange: (Math.random() * 20) + 5,
                    socialSignal: 60 + (Math.random() * 30),
                    status: r.trend === 'Up' ? 'exploding' : 'rising'
                })));
                setIsDemo(true);
            }
        } catch (error) {
            console.error('Error fetching trends:', error);
            setIsDemo(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading || authLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const topTrends = trends.slice(0, 10);
    const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#d97706', '#059669', '#4f46e5', '#e11d48'];

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
                            <Activity className="h-10 w-10 text-blue-500" />
                            Demand Pulse Analysis
                        </h1>
                        <p className="text-gray-400 font-medium">Tracking high-velocity patterns and heatmaps in the eBay art market.</p>
                        {isDemo && (
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{getDemoBadge('Market Trends')}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-400" />
                            <span className="text-sm font-bold text-white">Confidence: High</span>
                        </div>
                    </div>
                </div>

                {trends.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-16 text-center shadow-2xl">
                        <Zap className="h-20 w-20 text-blue-600 mx-auto mb-6 animate-pulse" />
                        <h2 className="text-3xl font-bold text-white mb-4">Initializing Pulse Engine</h2>
                        <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                            The Pulse AI is currently aggregating 30-day historical data and calculating initial velocity scores.
                            Scan a few more subjects in the <strong>Market Scanner</strong> to accelerate discovery.
                        </p>
                    </div>
                ) : hasAccess === false ? (
                    <div className="py-20">
                        <PremiumPaywall
                            title="Global Market Intelligence"
                            description="Unlock platform-wide demand heatmaps, predictive velocity scores, and sector-wide bid momentum tracking."
                            icon="trends"
                        />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Pulse Velocity Distribution */}
                            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
                                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                    Pulse Velocity Heatmap (WVS)
                                </h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={topTrends}>
                                            <defs>
                                                <linearGradient id="colorWvs" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                            <XAxis
                                                dataKey="term"
                                                stroke="#4b5563"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                interval={0}
                                            />
                                            <YAxis
                                                stroke="#4b5563"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                                            />
                                            <Area type="monotone" dataKey="momentumScore" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorWvs)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Key Stats Sidebar */}
                            <div className="bg-gradient-to-br from-gray-900 to-blue-900/20 border border-blue-500/10 rounded-2xl p-8">
                                <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-widest text-center">Top Segment</h3>

                                <div className="space-y-6">
                                    <div className="text-center">
                                        <p className="text-5xl font-black text-blue-500 mb-2">{(topTrends[0]?.momentumScore ?? 0).toFixed(1)}</p>
                                        <p className="text-white font-bold uppercase tracking-tighter text-lg">{topTrends[0]?.term ?? 'N/A'}</p>
                                        <p className="text-gray-400 text-sm">Highest Momentum Score</p>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Social Signal</span>
                                            <span className="text-white font-bold">{topTrends[0]?.socialSignal ?? 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Velocity Change</span>
                                            <span className="text-green-500 font-bold">+{(topTrends[0]?.velocityChange ?? 0).toFixed(1)}%</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 bg-black/40 rounded-xl p-4 border border-white/5">
                                        <p className="text-xs text-blue-200 leading-relaxed italic">
                                            "Subject '{topTrends[0]?.term ?? 'Unknown'}' is showing significant momentum. We recommend focusing on this niche for immediate growth."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Table */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-gray-800 bg-gray-900/50">
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Multi-Source Trend Analytics</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-800/80 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <tr>
                                            <th className="px-8 py-5">Pattern / Term</th>
                                            <th className="px-8 py-5 text-center">Momentum</th>
                                            <th className="px-8 py-5 text-center">Velocity %</th>
                                            <th className="px-8 py-5 text-center">Social</th>
                                            <th className="px-8 py-5 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {trends.map((trend, i) => (
                                            <tr key={i} className="group hover:bg-blue-600/5 transition-all">
                                                <td className="px-8 py-6 text-white font-bold capitalize text-lg">
                                                    {trend.term}
                                                    <span className="ml-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-0.5 bg-gray-800 rounded">{trend.type}</span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`text-xl font-black ${trend.momentumScore > 70 ? 'text-green-400' : trend.momentumScore > 40 ? 'text-blue-400' : 'text-gray-600'}`}>
                                                        {trend.momentumScore.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-center text-gray-400 font-medium font-mono">
                                                    {trend.velocityChange > 0 ? '+' : ''}{trend.velocityChange.toFixed(1)}%
                                                </td>
                                                <td className="px-8 py-6 text-center text-white font-black">
                                                    {trend.socialSignal}%
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {trend.status === 'exploding' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-950/30 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                            <Zap className="h-3 w-3" /> Exploding
                                                        </span>
                                                    ) : trend.status === 'rising' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-950/30 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                            <ArrowUpRight className="h-3 w-3" /> Rising
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950/30 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                            <TrendingUp className="h-3 w-3" /> Growth
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
