'use client';

import { Activity, TrendingUp } from 'lucide-react';

interface GlobalPulseCardProps {
    score: number;
    change: string;
}

export default function GlobalPulseCard({ score, change }: GlobalPulseCardProps) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all h-full flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] rounded-full"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Global Market Pulse</h3>
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-500" />
                </div>
            </div>

            <div className="relative z-10">
                <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-6xl font-black text-white">{score.toFixed(1)}</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-sm font-black text-green-400">{change}</span>
                    </div>
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                    Aggregate demand across <br /> all art categories
                </p>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-[10px] font-black text-gray-400">
                                {i}
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        2,847 analysts active
                    </span>
                </div>
            </div>
        </div>
    );
}
