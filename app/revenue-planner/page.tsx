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
} from 'lucide-react';

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
        try {
            const res = await fetch('/api/revenue-plan?progress=true');
            const data = await res.json();
            if (data.success && data.plan) {
                setPlan(data.plan);
                setProgress(data.progress);
            }
        } catch (err) {
            console.error('Error loading plan:', err);
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
                await loadPlan(); // Refresh progress
            }
        } catch (err) {
            console.error('Error generating plan:', err);
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
            console.error('Error running simulation:', err);
        }
    };

    const presetTargets = [5000, 10000, 20000, 30000, 50000];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-600 rounded-lg">
                                <Target className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Revenue Planner</h1>
                                <p className="text-sm text-gray-400">Plan your path to $20K/month</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Progress Bar (if plan exists) */}
                {progress && plan && (
                    <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Monthly Progress</h3>
                                <p className="text-sm text-gray-400">{progress.daysRemaining} days remaining</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-white">
                                    ${progress.achieved.toLocaleString()}
                                    <span className="text-gray-500 text-lg font-normal">
                                        /${progress.target.toLocaleString()}
                                    </span>
                                </p>
                                <p className="text-sm text-gray-400">{progress.percentComplete}% complete</p>
                            </div>
                        </div>
                        <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${progress.percentComplete >= 100
                                        ? 'bg-green-500'
                                        : progress.percentComplete >= 50
                                            ? 'bg-blue-500'
                                            : 'bg-purple-500'
                                    }`}
                                style={{ width: `${Math.min(progress.percentComplete, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Input Form */}
                <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-blue-400" />
                        Configure Your Goal
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Target Monthly */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Monthly Target ($)</label>
                            <input
                                type="number"
                                value={targetMonthly}
                                onChange={(e) => setTargetMonthly(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-blue-500"
                            />
                            <div className="flex gap-2 mt-2">
                                {presetTargets.map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => setTargetMonthly(preset)}
                                        className={`px-2 py-1 text-xs rounded ${targetMonthly === preset
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                            }`}
                                    >
                                        ${(preset / 1000)}K
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Avg Sale Price */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Avg Sale Price ($)</label>
                            <input
                                type="number"
                                value={avgSalePrice}
                                onChange={(e) => setAvgSalePrice(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-2">Based on your typical pricing</p>
                        </div>

                        {/* Sell-through Rate */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                Sell-through Rate: {Math.round(sellThroughRate * 100)}%
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.9"
                                step="0.1"
                                value={sellThroughRate}
                                onChange={(e) => setSellThroughRate(parseFloat(e.target.value))}
                                className="w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>10%</span>
                                <span>50%</span>
                                <span>90%</span>
                            </div>
                        </div>

                        {/* Weekly Capacity */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Weekly Capacity</label>
                            <input
                                type="number"
                                value={weeklyCapacity}
                                onChange={(e) => setWeeklyCapacity(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-2">Pieces you can create per week</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                        <button
                            onClick={generatePlan}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <Sparkles className="h-5 w-5" />
                            )}
                            Generate Plan
                        </button>

                        <button
                            onClick={() => {
                                setShowSimulator(!showSimulator);
                                if (!showSimulator) runSimulation();
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            <Calculator className="h-5 w-5" />
                            {showSimulator ? 'Hide' : 'Show'} Simulator
                            {showSimulator ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Simulator */}
                    {showSimulator && simulation && (
                        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <h4 className="text-sm font-semibold text-white mb-3">Quick Simulation</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Pieces to List</p>
                                    <p className="text-xl font-bold text-white">{simulation.piecesToList}/mo</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Est. Revenue</p>
                                    <p className="text-xl font-bold text-green-400">${simulation.estimatedRevenue.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Achievable?</p>
                                    <div className={`flex items-center gap-2 ${simulation.achievable ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {simulation.achievable ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5" />
                                        )}
                                        <span className="text-lg font-bold">{simulation.achievable ? 'Yes!' : 'Stretch'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Plan Results */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
                    </div>
                ) : plan ? (
                    <div className="space-y-8">
                        {/* Status Banner */}
                        <div className={`p-4 rounded-xl flex items-center gap-4 ${plan.achievable
                                ? 'bg-green-500/10 border border-green-500/30'
                                : 'bg-yellow-500/10 border border-yellow-500/30'
                            }`}>
                            {plan.achievable ? (
                                <>
                                    <CheckCircle2 className="h-8 w-8 text-green-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-green-400">Target is Achievable!</p>
                                        <p className="text-sm text-green-300/70">
                                            With your current capacity, you can reach ${plan.targetMonthly.toLocaleString()}/month
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-8 w-8 text-yellow-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-yellow-400">Target Requires Adjustments</p>
                                        <p className="text-sm text-yellow-300/70">
                                            Gap of ${Math.abs(plan.summary.gap).toLocaleString()} - see recommendations below
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Package className="h-5 w-5 text-purple-400" />
                                    <span className="text-gray-400 text-sm">Pieces to List</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{plan.summary.totalPiecesToList}</p>
                                <p className="text-sm text-gray-500 mt-1">{plan.summary.totalPiecesNeeded} need to sell</p>
                            </div>

                            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="h-5 w-5 text-blue-400" />
                                    <span className="text-gray-400 text-sm">Weekly Output</span>
                                </div>
                                <p className="text-3xl font-bold text-white">{plan.summary.weeklyOutput}</p>
                                <p className="text-sm text-gray-500 mt-1">pieces per week</p>
                            </div>

                            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="h-5 w-5 text-green-400" />
                                    <span className="text-gray-400 text-sm">Avg Price Needed</span>
                                </div>
                                <p className="text-3xl font-bold text-white">${plan.summary.avgPriceNeeded}</p>
                                <p className="text-sm text-gray-500 mt-1">per piece</p>
                            </div>

                            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="h-5 w-5 text-emerald-400" />
                                    <span className="text-gray-400 text-sm">Est. Revenue</span>
                                </div>
                                <p className="text-3xl font-bold text-white">${plan.summary.estimatedRevenue.toLocaleString()}</p>
                                {plan.summary.gap !== 0 && (
                                    <p className={`text-sm mt-1 ${plan.summary.gap > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {plan.summary.gap > 0 ? '-' : '+'}${Math.abs(plan.summary.gap).toLocaleString()} from target
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Production Breakdown */}
                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Production Breakdown</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                                            <th className="pb-3">Style</th>
                                            <th className="pb-3">Size</th>
                                            <th className="pb-3">Count</th>
                                            <th className="pb-3">Target Price</th>
                                            <th className="pb-3">Expected Revenue</th>
                                            <th className="pb-3">Demand</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-white">
                                        {plan.breakdown.map((item, index) => (
                                            <tr key={index} className="border-b border-gray-800/50">
                                                <td className="py-3 capitalize font-medium">{item.style}</td>
                                                <td className="py-3">{item.size}</td>
                                                <td className="py-3">{item.count} pcs</td>
                                                <td className="py-3">${item.targetPrice}</td>
                                                <td className="py-3 text-green-400">${item.expectedRevenue.toLocaleString()}</td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500"
                                                                style={{ width: `${item.demandScore}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-gray-400">{item.demandScore}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-400" />
                                Recommendations
                            </h3>
                            <ul className="space-y-3">
                                {plan.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-3 text-gray-300">
                                        <span className="text-xl leading-none">{rec.charAt(0)}</span>
                                        <span>{rec.slice(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* What-If Scenarios */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                                <h4 className="text-sm font-semibold text-gray-400 mb-3">If Higher Price</h4>
                                <p className="text-2xl font-bold text-white">${plan.adjustments.ifHigherPrice.price}/piece</p>
                                <p className="text-sm text-gray-500">Only need {plan.adjustments.ifHigherPrice.piecesNeeded} pieces</p>
                            </div>

                            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                                <h4 className="text-sm font-semibold text-gray-400 mb-3">If More Output</h4>
                                <p className="text-2xl font-bold text-white">{plan.adjustments.ifMoreOutput.weekly}/week</p>
                                <p className="text-sm text-gray-500">{plan.adjustments.ifMoreOutput.piecesNeeded} pieces/month</p>
                            </div>

                            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
                                <h4 className="text-sm font-semibold text-gray-400 mb-3">If Better Sell-through</h4>
                                <p className="text-2xl font-bold text-white">{Math.round(plan.adjustments.ifBetterSellThrough.rate * 100)}%</p>
                                <p className="text-sm text-gray-500">Only list {plan.adjustments.ifBetterSellThrough.piecesNeeded} pieces</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Target className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Plan Generated Yet</h3>
                        <p className="text-gray-400 mb-6">
                            Set your targets above and generate your first revenue plan
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
