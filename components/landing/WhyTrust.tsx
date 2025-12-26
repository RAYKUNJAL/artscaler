'use client';

import { Palette, Activity, ShieldCheck } from 'lucide-react';

const trustCards = [
    {
        icon: Palette,
        title: "Built for art sellers only",
        description: "Generic eBay tools treat art like any other product. ArtScaler is tuned to originals, prints, and collectibles, so your research reflects how art actually sells.",
        color: "blue"
    },
    {
        icon: Activity,
        title: "Real-time market pulse",
        description: "Track sold listings, bid heatmaps, and watcher counts across live auctions so you always know which subjects, styles, and formats are heating up.",
        color: "purple"
    },
    {
        icon: ShieldCheck,
        title: "Zero-risk 90-day guarantee",
        description: "Try ArtScaler on your next few series. If it doesn't help you feel more confident about what to list and how to price, get a full refund within 90 days.",
        color: "green"
    }
];

export default function WhyTrust() {
    return (
        <section className="py-24 bg-gray-950/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter italic">
                        Why artists trust <span className="text-blue-500">ArtScaler</span>
                    </h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                        Even if you're just starting your eBay journey
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {trustCards.map((card, idx) => (
                        <div key={idx} className="group relative bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-10 hover:border-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                            {/* Accent Glow */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-${card.color}-500/10 blur-[60px] rounded-full group-hover:bg-${card.color}-500/20 transition-all`}></div>

                            <div className={`w-16 h-16 bg-${card.color}-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-${card.color}-500/40 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                <card.icon className={`h-8 w-8 text-${card.color}-400`} />
                            </div>

                            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">
                                {card.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed font-medium">
                                {card.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
