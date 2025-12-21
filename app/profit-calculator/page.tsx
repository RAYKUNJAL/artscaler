'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DollarSign, Calculator, TrendingUp, Info, AlertCircle, Save } from 'lucide-react';
import { ProfitCalculator, ProfitCalculation } from '@/services/ai/profit-calculator';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ProfitCalculatorPage() {
    const { session } = useAuth();
    const [inputs, setInputs] = useState({
        salePrice: 250,
        shippingCharged: 20,
        shippingCost: 18,
        itemCost: 50,
        otherCosts: 5,
    });

    const [result, setResult] = useState<ProfitCalculation | null>(null);
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        // In a real app, check user subscription tier here
        const calc = ProfitCalculator.calculate(
            inputs.salePrice,
            inputs.shippingCharged,
            inputs.shippingCost,
            inputs.itemCost,
            inputs.otherCosts,
            isPro
        );
        setResult(calc);
    }, [inputs, isPro]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-5xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Calculator className="h-8 w-8 text-blue-500" />
                        Profit Margin Calculator
                    </h1>
                    <p className="text-gray-400">Calculate exact eBay fee deductions and net margins for your art sales.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                            <h2 className="text-xl font-bold text-white mb-4">Sale Details</h2>

                            <div className="space-y-2">
                                <label htmlFor="salePrice" className="text-sm font-medium text-gray-400">Sale Price ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        id="salePrice"
                                        type="number"
                                        name="salePrice"
                                        value={inputs.salePrice}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="shippingCharged" className="text-sm font-medium text-gray-400">Shipping Charged to Buyer ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        id="shippingCharged"
                                        type="number"
                                        name="shippingCharged"
                                        value={inputs.shippingCharged}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="shippingCost" className="text-sm font-medium text-gray-400">Shipping Label Cost ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        id="shippingCost"
                                        type="number"
                                        name="shippingCost"
                                        value={inputs.shippingCost}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="itemCost" className="text-sm font-medium text-gray-400">Material/Item Cost ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        id="itemCost"
                                        type="number"
                                        name="itemCost"
                                        value={inputs.itemCost}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="otherCosts" className="text-sm font-medium text-gray-400">Other Costs (Ads, Pkgs) ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        id="otherCosts"
                                        type="number"
                                        name="otherCosts"
                                        value={inputs.otherCosts}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => setIsPro(!isPro)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all ${isPro ? 'bg-blue-600' : 'bg-gray-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-all ${isPro ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Apply Store/Pro Discount (10%)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Result Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {result && (
                            <div className="space-y-6">
                                {/* Main Profit Card */}
                                <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
                                    <div className="relative z-10">
                                        <p className="text-blue-100 font-medium mb-1">Estimated Net Profit</p>
                                        <h3 className="text-6xl font-bold mb-6">${result.netProfit.toLocaleString()}</h3>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                                <p className="text-xs text-blue-100 uppercase font-bold mb-1">Margin</p>
                                                <p className="text-xl font-bold">{result.margin}%</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                                <p className="text-xs text-blue-100 uppercase font-bold mb-1">ROI</p>
                                                <p className="text-xl font-bold">{result.roi}%</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                                <p className="text-xs text-blue-100 uppercase font-bold mb-1">eBay Fees</p>
                                                <p className="text-xl font-bold">${result.ebayFees}</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                                <p className="text-xs text-blue-100 uppercase font-bold mb-1">Break Even</p>
                                                <p className="text-xl font-bold">${ProfitCalculator.calculateBreakEven(inputs.itemCost, inputs.shippingCost, inputs.shippingCharged, inputs.otherCosts, isPro)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Abstract background elements */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -ml-32 -mb-32" />
                                </div>

                                {/* Fee Breakdown */}
                                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                                    <h3 className="text-xl font-bold text-white mb-6">Detailed Breakdown</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                            <span className="text-gray-400">Total Revenue (Listing + Ship)</span>
                                            <span className="text-white font-semibold">${inputs.salePrice + inputs.shippingCharged}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                            <span className="text-gray-400 text-sm pl-4">Sale Price</span>
                                            <span className="text-gray-300 text-sm">${inputs.salePrice}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                            <span className="text-gray-400 text-sm pl-4">Shipping Collected</span>
                                            <span className="text-gray-300 text-sm">${inputs.shippingCharged}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                            <span className="text-red-400 font-medium">eBay Final Value Fees</span>
                                            <span className="text-red-400 font-bold">-${result.ebayFees}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                            <span className="text-gray-400">Fulfillment Costs (Shipping Label)</span>
                                            <span className="text-gray-300">-${inputs.shippingCost}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                            <span className="text-gray-400">Production Costs (Art Supplies)</span>
                                            <span className="text-gray-300">-${inputs.itemCost}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-4">
                                            <span className="text-xl font-bold text-white">Net Take Home</span>
                                            <span className="text-2xl font-bold text-green-500">${result.netProfit}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Advice Box */}
                                <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl p-6 flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold mb-1">Pulse Recommendation</h4>
                                        <p className="text-sm text-blue-200/80 leading-relaxed">
                                            {result.margin < 20
                                                ? "Your margins are tight. Consider moving from Auction to Fixed Price (BIN) with a slightly higher price point or using a 'Studio Empire' tier to lower your fee base."
                                                : result.margin > 50
                                                    ? "Excellent margins! You have room to run 'Promoted Listings' at 5-8% to significantly increase velocity while staying profitable."
                                                    : "Healthy margins. This niche is sustainable for standard operations. Focus on minimizing shipping costs to squeeze an extra 2-3% profit."
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
