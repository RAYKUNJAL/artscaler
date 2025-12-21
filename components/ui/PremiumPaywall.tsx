'use client';

import Link from 'next/link';
import { Lock, Sparkles, TrendingUp, Zap } from 'lucide-react';

interface PremiumPaywallProps {
    title: string;
    description: string;
    icon?: 'advisor' | 'trends';
}

export default function PremiumPaywall({ title, description, icon = 'advisor' }: PremiumPaywallProps) {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gray-900/40 backdrop-blur-md p-8 text-center animate-in fade-in zoom-in duration-500">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="mb-6 relative">
                    <div className="h-20 w-20 bg-gray-800 rounded-3xl flex items-center justify-center shadow-2xl">
                        {icon === 'advisor' ? (
                            <Sparkles className="h-10 w-10 text-blue-500" />
                        ) : (
                            <TrendingUp className="h-10 w-10 text-purple-500" />
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-amber-500 rounded-xl flex items-center justify-center border-4 border-gray-900 shadow-lg">
                        <Lock className="h-4 w-4 text-white" />
                    </div>
                </div>

                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                    {title}
                </h3>
                <p className="text-gray-400 text-sm max-w-sm mb-8 leading-relaxed">
                    {description}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <Link href="/pricing" className="flex-1">
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                            <Zap className="h-4 w-4" />
                            Upgrade Now
                        </button>
                    </Link>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-4 rounded-2xl text-sm transition-all"
                    >
                        Try Again
                    </button>
                </div>

                <p className="mt-6 text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">
                    Unlock full market intelligence
                </p>
            </div>
        </div>
    );
}
