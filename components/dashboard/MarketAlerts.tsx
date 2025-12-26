'use client';

import { TrendingUp, ArrowUpRight, Sparkles, Filter } from 'lucide-react';
import Link from 'next/link';

interface Opportunity {
    id: string;
    keyword: string;
    score: number;
    growth: string;
    category: string;
}

export default function MarketAlerts() {
    const opportunities: Opportunity[] = [
        { id: '1', keyword: 'Abstract Acrylic 16x20', score: 92, growth: '+24%', category: 'Paintings' },
        { id: '2', keyword: 'Modern Street Art Prints', score: 88, growth: '+18%', category: 'Prints' },
        { id: '3', keyword: 'Surrealist Oil Original', score: 75, growth: '+12%', category: 'Paintings' },
    ];

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                        <Zap className="h-5 w-5 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Market Alerts</h3>
                </div>
                <button className="text-gray-500 hover:text-white transition-colors" title="Filter Opportunities">
                    <Filter className="h-5 w-5" />
                </button>
            </div>

            <div className="space-y-4 flex-1">
                {opportunities.map((opt) => (
                    <Link
                        key={opt.id}
                        href={`/market-scanner?q=${encodeURIComponent(opt.keyword)}`}
                        className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white uppercase tracking-wider">{opt.keyword}</span>
                                <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full uppercase">
                                    {opt.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                {opt.growth} demand growth
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-black text-green-400">{opt.score}</div>
                            <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Opp. Score</div>
                        </div>
                    </Link>
                ))}
            </div>

            <button className="mt-8 w-full py-4 bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                See All Opportunities
            </button>
        </div>
    );
}

import { Zap } from 'lucide-react';
