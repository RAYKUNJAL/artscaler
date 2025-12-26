'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Trophy, Star, MousePointer2 } from 'lucide-react';

interface ActionItem {
    id: string;
    task: string;
    xp: number;
    completed: boolean;
    benefit: string;
}

export default function ActionPlan() {
    const [items, setItems] = useState<ActionItem[]>([
        { id: '1', task: 'Scan Trending Keyword', xp: 50, completed: false, benefit: 'Spot new demand peaks' },
        { id: '2', task: 'Relist Expired Item', xp: 30, completed: true, benefit: 'Boost SEO visibility' },
        { id: '3', task: 'Adjust Underpriced Listing', xp: 40, completed: false, benefit: 'Capture +15% revenue gap' },
        { id: '4', task: 'Set Weekly Revenue Goal', xp: 20, completed: false, benefit: 'Define your $10k path' },
    ]);

    const toggleItem = (id: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const completedXp = items.filter(i => i.completed).reduce((sum, i) => sum + i.xp, 0);
    const totalXp = items.reduce((sum, i) => sum + i.xp, 0);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8 flex flex-col group">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-1">Daily Action Plan</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Gamified Seller Tasks</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 px-4 py-2 rounded-2xl">
                    <Trophy className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-black text-blue-500">{completedXp} XP</span>
                </div>
            </div>

            <div className="h-2 bg-gray-800 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                    style={{ width: `${(completedXp / totalXp) * 100}%` }}
                ></div>
            </div>

            <div className="space-y-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`group/item flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${item.completed
                                ? 'bg-green-500/5 border-green-500/20 opacity-60'
                                : 'bg-white/5 border-white/5 hover:border-white/10'
                            }`}
                    >
                        <div className="shrink-0">
                            {item.completed ? (
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            ) : (
                                <Circle className="h-6 w-6 text-gray-700 group-hover/item:text-blue-500 transition-colors" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-black uppercase tracking-wider ${item.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                                {item.task}
                            </p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                {item.benefit}
                            </p>
                        </div>
                        <div className="bg-white/5 px-2 py-1 rounded-lg text-[10px] font-black text-blue-400">
                            +{item.xp} XP
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex items-center gap-2 text-amber-500/50">
                <Star className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Rank: Novice Scout</span>
            </div>
        </div>
    );
}
