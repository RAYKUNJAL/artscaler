'use client';

import { Sparkles, TrendingUp, Search, ArrowRight } from 'lucide-react';

interface KeywordOpportunity {
    keyword: string;
    searches: string;
    competition: string;
    avgPrice: string;
    score: number;
}

export default function KeywordIntelligence() {
    const keywords: KeywordOpportunity[] = [
        { keyword: 'original oil abstract', searches: '2.4k', competition: 'Mid', avgPrice: '$185', score: 92 },
        { keyword: 'modern wall art original', searches: '1.2k', competition: 'Low', avgPrice: '$245', score: 88 },
        { keyword: 'acrylic pour ocean', searches: '4.8k', competition: 'High', avgPrice: '$45', score: 54 },
    ];

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-400 bg-green-400/10';
        if (score >= 70) return 'text-blue-400 bg-blue-400/10';
        if (score >= 50) return 'text-yellow-400 bg-yellow-400/10';
        return 'text-red-400 bg-red-400/10';
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-[32px] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                        <Search className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Keyword Intelligence</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-black text-amber-500 uppercase">AI Suggestions Active</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Niche Keyword</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Est. Interest</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Competition</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Avg Price</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Opportunity Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {keywords.map((kw) => (
                            <tr key={kw.keyword} className="group hover:bg-white/[0.02] transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-white uppercase tracking-wider">{kw.keyword}</span>
                                        <ArrowRight className="h-3 w-3 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-sm font-bold text-gray-400">{kw.searches}/mo</td>
                                <td className="px-8 py-6">
                                    <span className="text-xs font-black text-white uppercase">{kw.competition}</span>
                                </td>
                                <td className="px-8 py-6 text-sm font-black text-white">{kw.avgPrice}</td>
                                <td className="px-8 py-6 text-right">
                                    <span className={`inline-block px-4 py-1 rounded-full text-xs font-black ${getScoreColor(kw.score)}`}>
                                        {kw.score}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
