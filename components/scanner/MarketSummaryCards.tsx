'use client';

import { Layers, DollarSign, TrendingUp, Percent, Eye, ArrowUp, Activity } from 'lucide-react';

interface MarketSummaryProps {
    data: {
        activeListings: number;
        avgPrice: number;
        competition: 'Low' | 'Medium' | 'High';
        sellThrough: string;
        avgWatchers: number;
        trend: 'up' | 'down' | 'stable';
    };
}

export default function MarketSummaryCards({ data }: MarketSummaryProps) {
    const cards = [
        { label: 'Active Listings', value: data.activeListings.toLocaleString(), icon: Layers, color: 'blue' },
        { label: 'Avg Price', value: `$${data.avgPrice.toFixed(0)}`, icon: DollarSign, color: 'green' },
        { label: 'Competition', value: data.competition, icon: Activity, color: 'yellow' },
        { label: 'Sell-Through', value: data.sellThrough, icon: Percent, color: 'purple' },
        { label: 'Avg Watchers', value: data.avgWatchers, icon: Eye, color: 'orange' },
        { label: 'Trend', value: data.trend === 'up' ? 'Rising' : 'Stable', icon: ArrowUp, color: 'red' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cards.map((card) => (
                <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-white/10 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 bg-${card.color}-600/10 rounded-lg group-hover:scale-110 transition-transform`}>
                            <card.icon className={`h-4 w-4 text-${card.color}-500`} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{card.label}</p>
                    <p className="text-xl font-black text-white">{card.value}</p>
                </div>
            ))}
        </div>
    );
}
