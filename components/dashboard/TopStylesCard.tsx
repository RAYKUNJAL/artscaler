'use client';

import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface Style {
    style: string;
    avgWvs: number;
}

interface TopStylesCardProps {
    styles: Style[];
}

export default function TopStylesCard({ styles }: TopStylesCardProps) {
    if (styles.length === 0) return null;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8 h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Velocity Trends</h3>
                </div>
                <Link href="/trends" className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest">
                    Full Data Review
                </Link>
            </div>

            <div className="space-y-6">
                {styles.map((item, index) => (
                    <div key={item.style} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-gray-700">0{index + 1}</span>
                                <span className="text-sm font-black text-white uppercase tracking-wider">{item.style}</span>
                            </div>
                            <span className="text-sm font-black text-blue-400">
                                {item.avgWvs.toFixed(2)} WVS
                            </span>
                        </div>
                        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden p-[2px]">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min((item.avgWvs / 10) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
