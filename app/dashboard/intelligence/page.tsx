'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
    Zap,
    TrendingUp,
    Target,
    BarChart3,
    RefreshCcw,
    ChevronRight,
    AlertCircle,
    Copy,
    CheckCircle2,
    Search
} from 'lucide-react';

export default function DemandIntelligencePage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [sellerName, setSellerName] = useState('');
    const [running, setRunning] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        // Simulate loading data from the fresh backend services
        setTimeout(() => {
            setData({
                overview: {
                    total_active_tracked: 142,
                    high_demand_clusters: 4,
                    top_subject: 'Abstract Expressionism'
                },
                clusters: [
                    {
                        subjectType: 'Abstract Expressionism',
                        sizeBucket: 'Medium (16x20)',
                        style: 'Impasto / Heavy Texture',
                        avgDemandScore: 88.5,
                        listingCount: 12,
                        topColors: ['#3b82f6', '#1e3a8a', '#ffffff']
                    },
                    {
                        subjectType: 'Minimalist Landscape',
                        sizeBucket: 'Large (24x36)',
                        style: 'Modern / Flat',
                        avgDemandScore: 74.2,
                        listingCount: 8,
                        topColors: ['#065f46', '#fef3c7', '#d97706']
                    }
                ],
                roadmap: [
                    {
                        subject: 'Abstract Expressionism',
                        sizeGoal: '16" x 20"',
                        palette: ['Blue', 'Navy', 'White'],
                        targetPrice: 185,
                        estimatedVelocity: 'Very High',
                        weeklyTarget: 5,
                        rationale: 'High watcher velocity (0.42/hr) indicates immediate buyer intent for textured blue abstracts.'
                    },
                    {
                        subject: 'Minimalist Landscape',
                        sizeGoal: '24" x 36"',
                        palette: ['Green', 'Beige', 'Amber'],
                        targetPrice: 345,
                        estimatedVelocity: 'High',
                        weeklyTarget: 3,
                        rationale: 'Low inventory in Large format for this style allows for higher price points and lower competition.'
                    }
                ]
            });
            setLoading(false);
        }, 1500);
    }, []);

    async function handleTrackSeller() {
        if (!sellerName.trim()) return;
        setRunning(true);
        setStatus('Initializing Orchestrator...');

        try {
            const res = await fetch('/api/intelligence/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerName: sellerName.trim() })
            });

            if (res.ok) {
                setStatus('✅ Intelligence Gathered!');
                setSellerName('');
            } else {
                setStatus('❌ Error running orchestrator');
            }
        } catch (e) {
            setStatus('❌ Network error');
        } finally {
            setRunning(false);
        }
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Header Container */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex-1">
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                            Demand Intelligence
                        </h1>
                        <p className="text-gray-400 text-lg">AI-powered analysis of active market sentiment and production targets.</p>

                        {/* New: Seller Tracking Input */}
                        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={sellerName}
                                    onChange={(e) => setSellerName(e.target.value)}
                                    placeholder="Enter competitive seller name to analyze..."
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                            <button
                                onClick={handleTrackSeller}
                                disabled={running}
                                className="w-full sm:w-auto bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {running ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Target className="h-5 w-5" />}
                                Track Portfolio
                            </button>
                        </div>
                        {status && (
                            <p className={`mt-2 text-sm font-semibold ${status.includes('✅') ? 'text-green-400' : 'text-blue-400'}`}>
                                {status}
                            </p>
                        )}
                    </div>

                    <button className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 px-6 py-3 rounded-xl font-semibold transition-all group h-fit">
                        <RefreshCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                        Refresh Intelligence
                    </button>
                </div>

                {/* Top Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="Live Pulse Tracked"
                        value={data?.overview.total_active_tracked || '0'}
                        icon={<RefreshCcw className="h-6 w-6 text-blue-400" />}
                        trend="+12% from yesterday"
                    />
                    <MetricCard
                        title="High Demand Clusters"
                        value={data?.overview.high_demand_clusters || '0'}
                        icon={<Zap className="h-6 w-6 text-yellow-400" />}
                        color="yellow"
                    />
                    <MetricCard
                        title="Dominant Subject"
                        value={data?.overview.top_subject || 'Loading...'}
                        icon={<Target className="h-6 w-6 text-purple-400" />}
                        color="purple"
                    />
                </div>

                {/* Main Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Market Clusters (Left Side - 2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-6 w-6 text-blue-400" />
                            <h2 className="text-2xl font-bold text-white">Market Sentiment Clusters</h2>
                        </div>

                        {loading ? (
                            <SkeletonLoader count={2} />
                        ) : (
                            data?.clusters.map((cluster: any, idx: number) => (
                                <ClusterCard key={idx} cluster={cluster} />
                            ))
                        )}
                    </div>

                    {/* Production Roadmap (Right Side - 1/3) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="h-6 w-6 text-purple-400" />
                            <h2 className="text-2xl font-bold text-white">Production Roadmap</h2>
                        </div>

                        {loading ? (
                            <SkeletonLoader count={3} />
                        ) : (
                            data?.roadmap.map((item: any, idx: number) => (
                                <RoadmapCard key={idx} item={item} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function MetricCard({ title, value, icon, trend, color = 'blue' }: any) {
    return (
        <div className={`bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-${color}-500/30 transition-all duration-300 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform`}>
                {icon}
            </div>
            <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl bg-${color}-500/10`}>
                    {icon}
                </div>
                <h3 className="text-gray-400 font-medium">{title}</h3>
            </div>
            <div className="space-y-1">
                <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
                {trend && <div className="text-xs text-green-400 font-medium">{trend}</div>}
            </div>
        </div>
    );
}

function ClusterCard({ cluster }: any) {
    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/10 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 group overflow-hidden relative">
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold uppercase tracking-wider mb-1">
                            <BarChart3 className="h-4 w-4" />
                            High Demand Signal detected
                        </div>
                        <h3 className="text-2xl font-bold text-white">{cluster.subjectType}</h3>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black text-blue-500 group-hover:text-blue-400 transition-colors">
                            {cluster.avgDemandScore}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Demand Score</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                        <div className="text-xs text-gray-500 font-bold mb-1">SIZE BUCKET</div>
                        <div className="text-white font-semibold">{cluster.sizeBucket}</div>
                    </div>
                    <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                        <div className="text-xs text-gray-500 font-bold mb-1">STYLE</div>
                        <div className="text-white font-semibold">{cluster.style}</div>
                    </div>
                    <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                        <div className="text-xs text-gray-500 font-bold mb-1">COLOR PALETTE</div>
                        <div className="flex gap-2">
                            {cluster.topColors.map((color: string, i: number) => (
                                <div key={i} className="h-5 w-5 rounded-full border border-gray-700" style={{ backgroundColor: color }} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-400">
                        Based on <span className="text-white font-bold">{cluster.listingCount}</span> tracked competitor listings
                    </div>
                    <button className="flex items-center gap-1 text-blue-400 font-bold hover:text-blue-300 transition-colors">
                        View Details <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Background Accent */}
            <div className="absolute -bottom-12 -right-12 h-48 w-48 bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-colors duration-700" />
        </div>
    );
}

function RoadmapCard({ item }: any) {
    return (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 hover:border-purple-500/50 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs text-purple-400 font-bold uppercase tracking-widest leading-none">Intelligence Target</span>
            </div>

            <h4 className="text-lg font-bold text-white mb-2">{item.subject}</h4>

            <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Target Size</span>
                    <span className="text-gray-300 font-medium">{item.sizeGoal}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Est. Price</span>
                    <span className="text-white font-bold">${item.targetPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Weekly Target</span>
                    <span className="text-green-400 font-bold">{item.weeklyTarget} Units</span>
                </div>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-xl mb-4 border border-gray-700/30">
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-400 italic">"{item.rationale}"</p>
                </div>
            </div>

            <button className="w-full py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                Copy Specs <Copy className="h-3 w-3" />
            </button>
        </div>
    );
}

function SkeletonLoader({ count }: any) {
    return (
        <>
            {Array(count).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-2xl h-48 animate-pulse mb-4" />
            ))}
        </>
    );
}
