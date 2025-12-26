'use client';

import Link from 'next/link';

export default function FinalCTA() {
    return (
        <section className="py-32 bg-gray-950 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/10 blur-[150px] rounded-full"></div>

            <div className="container mx-auto px-4 text-center relative z-10">
                <h2 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase italic">
                    Stop guessing. <br />
                    <span className="text-blue-500">Start scaling.</span>
                </h2>
                <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
                    Join artists who use data to decide what to paint, how to price, and when to list.
                </p>

                <div className="flex flex-col items-center gap-8">
                    <Link
                        href="/auth/signup"
                        className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-6 rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-[0_0_50px_-10px_rgba(79,70,229,0.5)]"
                    >
                        Start Free Scout Trial
                    </Link>

                    <div className="flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">90-day money-back guarantee</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
