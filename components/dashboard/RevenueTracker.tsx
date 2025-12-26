'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DollarSign, ArrowUpRight, Target } from 'lucide-react';

interface RevenueTrackerProps {
    current: number;
    goal: number;
    isConnected: boolean;
}

export default function RevenueTracker({ current, goal, isConnected }: RevenueTrackerProps) {
    const percent = Math.min((current / goal) * 100, 100);
    const data = [
        { name: 'Progress', value: percent },
        { name: 'Remaining', value: 100 - percent },
    ];

    if (!isConnected) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] rounded-full"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6">
                        <DollarSign className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">Connect eBay Store</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-[200px]">
                        See exactly which listings make you money and track your $20k goal.
                    </p>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20">
                        Connect Store
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] rounded-full"></div>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Monthly Revenue</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">${current.toLocaleString()}</span>
                        <span className="text-xs font-bold text-gray-500">/ ${goal.toLocaleString()}</span>
                    </div>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-500" />
                </div>
            </div>

            <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell fill="url(#colorRevenue)" />
                            <Cell fill="rgba(255,255,255,0.05)" />
                        </Pie>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#2563eb" />
                                <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                        </defs>
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                    <span className="text-4xl font-black text-white">{percent.toFixed(0)}%</span>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">to goal</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Daily Avg</p>
                    <p className="text-lg font-black text-white">${(current / 30).toFixed(0)}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-xs font-bold text-green-400">On Track</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
