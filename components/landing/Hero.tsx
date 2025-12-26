'use client';

import Link from 'next/link';
import { TrendingUp, CheckCircle2, Zap } from 'lucide-react';

export default function Hero() {
    return (
        <section id="hero" className="relative pt-32 pb-20 overflow-hidden">
            {/* Animated Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
                <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] bg-pink-600/10 blur-[100px] rounded-full animate-pulse delay-1000"></div>
            </div>

            <div className="container mx-auto px-4 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 mb-8 animate-in fade-in slide-in-from-top duration-1000">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">v5.0 Pro Intelligence</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-tight tracking-tighter animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
                    Grow your eBay art sales <br className="hidden md:block" />
                    <span className="bg-gradient-to-r from-blue-300 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-sm">
                        with data, not guesses
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom duration-1000 delay-300 font-medium">
                    ArtScaler is built specifically for artists selling paintings, prints, and collectibles on eBay. See what's actually selling, how much it sells for, and when to list—before you create your next piece.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12 animate-in fade-in slide-in-from-bottom duration-1000 delay-400">
                    <Link
                        href="/auth/signup"
                        className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_0_50px_-5px_rgba(79,70,229,0.6)]"
                    >
                        Start Free Scout Trial
                        <TrendingUp className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                    <Link
                        href="/auth/login"
                        className="text-lg font-bold text-gray-300 hover:text-white transition-colors"
                    >
                        Already have an account? <span className="text-blue-400 ml-1">Sign In</span>
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-left max-w-5xl mx-auto animate-in fade-in duration-1000 delay-500">
                    <div className="flex items-start gap-3 flex-1">
                        <CheckCircle2 className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-400 font-medium leading-relaxed">
                            <strong className="text-gray-200">Built for art sellers only</strong> – Generic eBay tools treat art like any other product. ArtScaler is tuned to fine art specifics.
                        </p>
                    </div>
                    <div className="flex items-start gap-3 flex-1">
                        <CheckCircle2 className="h-6 w-6 text-purple-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-400 font-medium leading-relaxed">
                            <strong className="text-gray-200">Real-time market pulse</strong> – Analyze real sold listings, bid heatmaps, and watch counts from live eBay demand.
                        </p>
                    </div>
                    <div className="flex items-start gap-3 flex-1">
                        <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-400 font-medium leading-relaxed">
                            <strong className="text-gray-200">90-day money-back guarantee</strong> – Risk-free trial. If it doesn't help you make better art decisions, get a full refund.
                        </p>
                    </div>
                </div>

                <p className="mt-12 text-sm text-gray-600 font-black uppercase tracking-[0.2em] animate-in fade-in duration-1000 delay-600">
                    No credit card required • Upgrade anytime
                </p>
            </div>
        </section>
    );
}
