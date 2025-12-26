'use client';

import { useState, useEffect } from 'react';
import Link from 'next/navigation';
import {
    ArrowLeft,
    Target,
    DollarSign,
    TrendingUp,
    Package,
    Calculator,
    RefreshCw,
    Lightbulb,
    ChevronDown,
    ChevronUp,
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    AlertCircle
} from 'lucide-react';
import { DEMO_PLANNER_RECS, getDemoBadge } from '@/lib/demo-data';

interface PlanBreakdown {
    style: string;
    size: string;
    count: number;
    targetPrice: number;
    expectedRevenue: number;
    demandScore: number;
}

interface RevenuePlan {
    targetMonthly: number;
    achievable: boolean;
    breakdown: PlanBreakdown[];
    summary: {
        totalPiecesNeeded: number;
        totalPiecesToList: number;
        weeklyOutput: number;
        avgPriceNeeded: number;
        estimatedRevenue: number;
        gap: number;
    };
    recommendations: string[];
    adjustments: {
        ifHigherPrice: { price: number; piecesNeeded: number };
        ifMoreOutput: { weekly: number; piecesNeeded: number };
        ifBetterSellThrough: { rate: number; piecesNeeded: number };
    };
}

interface Progress {
    target: number;
    achieved: number;
    percentComplete: number;
    daysRemaining: number;
}

export default function RevenuePlannerPage() {
    const [plan, setPlan] = useState<RevenuePlan | null>(null);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDemo, setIsDemo] = useState(false);

    // Form inputs
    const [targetMonthly, setTargetMonthly] = useState(20000);
    const [avgSalePrice, setAvgSalePrice] = useState(300);
    const [sellThroughRate, setSellThroughRate] = useState(0.5);
    const [weeklyCapacity, setWeeklyCapacity] = useState(5);

    const [showSimulator, setShowSimulator] = useState(false);
    const [simulation, setSimulation] = useState<any>(null);

    useEffect(() => {
        loadPlan();
    }, []);

    const loadPlan = async () => {
        setIsLoading(true);
        setIsDemo(false);
        try {
            const res = await fetch('/api/revenue-plan?progress=true');
            const data = await res.json();
            if (data.success && data.plan) {
                setPlan(data.plan);
                setProgress(data.progress);
                setIsDemo(false);
            } else {
                setPlan({
                    targetMonthly: 20000,
                    achievable: true,
                    breakdown: DEMO_PLANNER_RECS.map(r => ({
                        style: r.subject,
                        size: '16x20',
                        count: 10,
                        targetPrice: r.score * 40,
                        expectedRevenue: (r.score * 40) * 10 * 0.5,
                        demandScore: r.score * 10
                    })),
                    summary: {
                        totalPiecesNeeded: 35,
                        totalPiecesToList: 70,
                        weeklyOutput: 18,
                        avgPriceNeeded: 285,
                        estimatedRevenue: 20000,
                        gap: 0
                    },
                    recommendations: [
                        "🎯 Focus on 'High Demand' subjects (Abstract/Urban) to maximize turnover.",
                        "⚡ Increase production to 18 units per week to stay on track for $20k.",
                        "💎 Curate premium descriptions for higher WVS items to increase target price by 15%."
                    ],
                    adjustments: {
                        ifHigherPrice: { price: 350, piecesNeeded: 28 },
                        ifMoreOutput: { weekly: 22, piecesNeeded: 44 },
                        ifBetterSellThrough: { rate: 0.7, piecesNeeded: 25 }
                    }
                });
                setProgress({
                    target: 20000,
                    achieved: 8450,
                    percentComplete: 42,
                    daysRemaining: 18
                });
                setIsDemo(true);
            }
        } catch (err) {
            setIsDemo(true);
        } finally {
            setIsLoading(false);
        }
    };

    const generatePlan = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/revenue-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate',
                    targetMonthly,
                    avgSalePrice,
                    sellThroughRate,
                    weeklyCapacity,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setPlan(data.plan);
                await loadPlan();
            }
        } catch (err) {
        } finally {
            setIsGenerating(false);
        }
    };

    const runSimulation = async () => {
        try {
            const res = await fetch('/api/revenue-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'simulate',
                    targetMonthly,
                    avgPrice: avgSalePrice,
                    weeklyCapacity,
                    sellThrough: sellThroughRate,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSimulation(data.simulation);
            }
        } catch (err) {
        }
    };

    const presetTargets = [5000, 10000, 20000, 30000, 50000];

    return (
        <div className="min-h-screen bg-gray-950 selection:bg-green-500 selection:text-white">
            <header className="border-b border-white/5 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <a href="/dashboard" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all" title="Back to Dashboard">
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-600/20">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Growth Engine</h1>
                                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">Goal: ${targetMonthly.toLocaleString()} Revenue</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12">
                {/* V6 Title Row */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Revenue Command Center</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
                            Scale To <span className="text-green-500">${(targetMonthly / 1000)}K</span> <br />
                            <span className="text-gray-700">Monthly Revenue</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={generatePlan}
                            disabled={isGenerating}
                            className="bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-[0.2em] px-8 py-4 rounded-2xl shadow-xl shadow-green-600/20 transition-all hover:scale-105 disabled:opacity-50"
                        >
                            {isGenerating ? 'Analyzing...' : 'Refresh Strategy'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Configuration Card */}
                    <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                                <Calculator className="h-5 w-5 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Goal Parameters</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Target Monthly Revenue</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        id="target_monthly_input"
                                        title="Target Monthly Revenue"
                                        type="number"
                                        value={targetMonthly}
                                        onChange={(e) => setTargetMonthly(parseInt(e.target.value) || 0)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-2xl pl-12 pr-4 py-4 text-xl font-black text-white focus:outline-none focus:border-green-500 transition-all"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {presetTargets.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTargetMonthly(t)}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${targetMonthly === t ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-white'}`}
                                        >
                                            ${(t / 1000)}K
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Average Sale Price</label>
                                <input
                                    id="avg_sale_price_input"
                                    title="Average Sale Price"
                                    type="number"
                                    value={avgSalePrice}
                                    onChange={(e) => setAvgSalePrice(parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-4 text-xl font-black text-white focus:outline-none focus:border-green-500 transition-all"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Sell-Through</label>
                                    <span className="text-sm font-black text-green-500 uppercase">{Math.round(sellThroughRate * 100)}%</span>
                                </div>
                                <input
                                    id="sell_through_rate_input"
                                    title="Target Sell-Through Rate"
                                    type="range"
                                    min="0.1"
                                    max="0.9"
                                    step="0.1"
                                    value={sellThroughRate}
                                    onChange={(e) => setSellThroughRate(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Progress & Summary */}
                    <div className="lg:col-span-2 space-y-8">
                        {progress && (
                            <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-green-600/5 blur-[80px] rounded-full"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Current Velocity</h3>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{progress.daysRemaining} Days Left in Cycle</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-4xl font-black text-white">${progress.achieved.toLocaleString()}</p>
                                            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">Achieved So Far</p>
                                        </div>
                                    </div>

                                    <div className="h-6 bg-gray-800 rounded-full overflow-hidden p-1.5 mb-4">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                            style={{ width: `${progress.percentComplete}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">{progress.percentComplete}% Completion Rate</p>
                                </div>
                            </div>
                        )}

                        {plan && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Pieces Needed', value: plan.summary.totalPiecesToList, icon: Package, color: 'blue' },
                                    { label: 'Weekly Target', value: plan.summary.weeklyOutput, icon: TrendingUp, color: 'purple' },
                                    { label: 'Min. Avg Price', value: `$${plan.summary.avgPriceNeeded}`, icon: DollarSign, color: 'green' },
                                    { label: 'Projected Rev.', value: `$${plan.summary.estimatedRevenue.toLocaleString()}`, icon: Target, color: 'amber' }
                                ].map(s => (
                                    <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                                        <div className={`w-8 h-8 bg-${s.color}-600/10 rounded-lg flex items-center justify-center mb-4`}>
                                            <s.icon className={`h-4 w-4 text-${s.color}-500`} />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
                                        <p className="text-2xl font-black text-white">{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {plan && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Breakdown Table */}
                        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-[32px] overflow-hidden">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Production Blueprint</h3>
                                <button className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all" title="Export Plan">
                                    <ArrowLeft className="h-4 w-4 rotate-180" />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/[0.02] border-b border-white/5">
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Asset Category</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Volume</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Unit Price</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Potential</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {plan.breakdown.map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">{item.style}</p>
                                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">Size: {item.size}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-black text-white">{item.count} Units</p>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-black text-white">${item.targetPrice}</td>
                                                <td className="px-8 py-6 text-right">
                                                    <p className="text-sm font-black text-green-500 uppercase tracking-widest">${item.expectedRevenue.toLocaleString()}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* AI Insights & What-If */}
                        <div className="space-y-8">
                            <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-[32px] p-8 text-white relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h4 className="text-xl font-black uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5" /> AI Recommendations
                                    </h4>
                                    <div className="space-y-4">
                                        {plan.recommendations.map((rec, i) => (
                                            <div key={i} className="flex items-start gap-4">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-white/50" />
                                                <p className="text-xs font-bold leading-relaxed">{rec.slice(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Lightbulb className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5 transition-transform group-hover:scale-110" />
                            </div>

                            <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6">Simulation Models</h4>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Elite Pricing Strategy</p>
                                        <p className="text-sm font-black text-white">${plan.adjustments.ifHigherPrice.price} Avg</p>
                                        <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mt-1">Reduces volume by {Math.round((1 - plan.adjustments.ifHigherPrice.piecesNeeded / plan.summary.totalPiecesNeeded) * 100)}%</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Max Output Strategy</p>
                                        <p className="text-sm font-black text-white">{plan.adjustments.ifMoreOutput.weekly}/week</p>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Yields ${(plan.adjustments.ifMoreOutput.weekly * 4 * avgSalePrice * sellThroughRate).toLocaleString()} Revenue</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
