'use client';

import { Check, Zap } from 'lucide-react';
import Link from 'next/link';

const plans = [
    {
        id: "free_scout",
        name: "Starter",
        tagline: "Trying eBay",
        ideal_for: "Artists exploring eBay or listing 1-5 pieces per month",
        price: "$0",
        billing: "Forever free",
        cta: "Start Free",
        highlight: false,
        features: [
            "3 market scans per day",
            "Basic listing builder",
            "Profit calculator",
            "7-day pricing history",
            "Community support"
        ]
    },
    {
        id: "pro_painter",
        name: "Pro Artist",
        tagline: "Growing to $5-15k/month",
        ideal_for: "Solo artists scaling to consistent monthly income",
        price: "$29",
        billing: "/month",
        cta: "Start Pro Trial",
        highlight: true,
        badge: "Most Popular",
        features: [
            "Unlimited market scans",
            "AI pricing engine (90-day data)",
            "Weekly Art Planner",
            "Market heatmap & alerts",
            "Art Pulse Coach (AI)",
            "My Listings performance tracker",
            "Priority email support",
            "Export data to CSV"
        ]
    },
    {
        id: "studio_empire",
        name: "Studio",
        tagline: "Scaling to $10-20k+/month",
        ideal_for: "Teams and high-volume art operations",
        price: "$79",
        billing: "/month",
        cta: "Start Studio Trial",
        highlight: false,
        features: [
            "Everything in Pro, plus:",
            "Custom niche tracking (50 keywords)",
            "Advanced analytics & forecasting",
            "Batch listing builder (10 at once)",
            "API access for automation",
            "White-label reports",
            "Priority phone + chat support",
            "Quarterly strategy session"
        ]
    }
];

export default function Pricing() {
    return (
        <section className="py-24 bg-gray-950" id="pricing">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter italic">
                        Choose your <span className="text-blue-500">growth track</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
                        All plans include our 90-day money-back guarantee.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan, idx) => (
                        <div key={idx} className={`relative group bg-gray-900/40 backdrop-blur-xl border ${plan.highlight ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-white/5'} rounded-[40px] p-10 transition-all duration-500 hover:-translate-y-2 flex flex-col`}>
                            {plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-xl">
                                    {plan.badge}
                                </div>
                            )}

                            <div className="mb-8">
                                <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">{plan.tagline}</p>
                                <h3 className="text-3xl font-black text-white mb-4">{plan.name}</h3>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed">{plan.ideal_for}</p>
                            </div>

                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-6xl font-black text-white">{plan.price}</span>
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">{plan.billing}</span>
                            </div>

                            <div className="space-y-4 mb-10 flex-1">
                                {plan.features.map((feature, fIdx) => (
                                    <div key={fIdx} className="flex items-center gap-4 group/item">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'}`}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span className="text-gray-300 font-medium text-sm group-hover/item:text-white transition-colors">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/auth/signup"
                                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all text-center ${plan.highlight
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 hover:scale-105'
                                    : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white'}`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-20 max-w-2xl mx-auto text-center">
                    <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl">
                        <p className="text-xs text-blue-300 font-medium leading-relaxed">
                            <span className="font-black uppercase tracking-widest mr-2">The Guarantee:</span>
                            Try any paid plan risk-free. If ArtScaler doesn't increase your confidence in pricing and listing decisions within 90 days, get a full refund.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
