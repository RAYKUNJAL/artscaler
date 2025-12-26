'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const steps = [
    {
        step_number: 1,
        title: "Discover what is already selling",
        description: "Use the Market Scanner and keyword tracker to see which subjects, sizes, and styles are getting bids and watchers right now.",
        image: "/images/market_scanner_placeholder.png",
        features: ["Real-time eBay data", "Visual thumbnail gallery", "Filter by style, size, price range"]
    },
    {
        step_number: 2,
        title: "Price with confidence",
        description: "Our Pricing Engine uses up to 90 days of eBay sales data so you can choose a smart price range for each piece, instead of guessing.",
        image: "/images/pricing_engine_mockup.png",
        features: ["Recommended, Aggressive, and Floor pricing", "Market liquidity stats", "Confidence scores based on recent sales"]
    },
    {
        step_number: 3,
        title: "Launch high-converting listings",
        description: "Generate SEO-optimized eBay listing templates in one click, based on trending art keywords and real buyer behavior.",
        image: "/images/listing_builder_placeholder.png",
        features: ["AI-generated titles and descriptions", "Price recommendations", "One-click copy to eBay"]
    }
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-gray-950">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter italic">
                        The <span className="text-blue-500">3-Step</span> Growth System
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
                        How ArtScaler helps you plan, price, and list your art with consistent revenue targets.
                    </p>
                </div>

                <div className="space-y-32 max-w-6xl mx-auto">
                    {steps.map((step, idx) => (
                        <div key={idx} className={`flex flex-col ${idx % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16`}>
                            {/* Text Content */}
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl text-white font-black text-xl shadow-lg shadow-blue-600/20">
                                    {step.step_number}
                                </div>
                                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                    {step.title}
                                </h3>
                                <p className="text-gray-400 text-lg leading-relaxed font-medium">
                                    {step.description}
                                </p>
                                <ul className="space-y-3 pt-4">
                                    {step.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-center gap-3 text-gray-300 font-bold">
                                            <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Image Placeholder / Screenshot */}
                            <div className="flex-1 w-full aspect-video bg-gray-900 rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative group">
                                {step.image.includes('placeholder') ? (
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-8">
                                        <div className="text-center">
                                            <div className="text-6xl mb-4 opacity-50">🖼️</div>
                                            <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Screenshot: {step.title}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={step.image}
                                        alt={step.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                )}
                                {/* Glass Overlay on hover */}
                                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors duration-500"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-20">
                    <Link
                        href="/auth/signup"
                        className="inline-flex items-center gap-3 text-blue-400 font-black text-lg uppercase tracking-widest hover:text-blue-300 transition-colors group"
                    >
                        See the live market pulse
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
