'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PenTool, Sparkles, Copy, Check, Info, Layout, Scissors } from 'lucide-react';
import { getListingGeneratorAgent, PulseListingTemplate } from '@/services/ai/listing-generator-agent';

export default function ListingBuilderPage() {
    const [topic, setTopic] = useState('Banksy Style Street Art');
    const [template, setTemplate] = useState<PulseListingTemplate | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const generate = async () => {
        setLoading(true);
        const agent = getListingGeneratorAgent();
        // Mock data for generation
        const res = await agent.generatePulseListing(null as any, topic, 185, 4.2);
        setTemplate(res);
        setLoading(false);
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                            <PenTool className="h-8 w-8 text-purple-500" />
                            AI Listing Builder
                        </h1>
                        <p className="text-gray-400">Generate high-conversion eBay listings powered by real-time Pulse data.</p>
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-widest">Target Subject/Keyword</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Abstract Ocean Painting"
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-lg"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={generate}
                                disabled={loading || !topic}
                                className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                            >
                                {loading ? 'Analyzing Pulse...' : (
                                    <>
                                        <Sparkles className="h-5 w-5" />
                                        Build Smart Listing
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {template && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Title Variants */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Layout className="h-5 w-5 text-blue-400" />
                                    Optimized Titles (Max 80 Chars)
                                </h3>
                                <div className="space-y-4">
                                    {template.title_variants.map((title, i) => (
                                        <div key={i} className="group relative">
                                            <div className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 pr-16 text-gray-200 text-sm font-medium">
                                                {title}
                                                <div className="mt-2 flex justify-between items-center">
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{title.length}/80 characters</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(title, i)}
                                                className="absolute right-3 top-4 p-2 bg-gray-700 hover:bg-blue-600 rounded-lg transition-all text-gray-400 hover:text-white"
                                            >
                                                {copiedIndex === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                                <h3 className="text-xl font-bold text-white mb-4">Pulse Keyword Stack</h3>
                                <div className="flex flex-wrap gap-2">
                                    {template.keyword_stack.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-purple-900/20 text-purple-400 border border-purple-900/50 rounded-lg text-sm font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Strategy Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-yellow-500" />
                                    Pricing Strategy
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Optimal Listing Price</p>
                                        <p className="text-3xl font-bold text-white">${template.price_advice.optimal}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Floor</p>
                                            <p className="text-sm font-bold text-white">${template.price_advice.min}</p>
                                        </div>
                                        <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Ceiling</p>
                                            <p className="text-sm font-bold text-white">${template.price_advice.max}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-xs text-blue-300 flex items-center gap-1">
                                            <Info className="h-3 w-3" /> Recommended Format: <strong>{template.format}</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Scissors className="h-5 w-5 text-blue-400" />
                                    Stencil Advice
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed italic">
                                    "{template.stencil_recommendation}"
                                </p>
                            </div>

                            <div className="bg-blue-600 hover:bg-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-all shadow-lg shadow-blue-500/20 group">
                                <span className="text-white font-bold text-sm block group-hover:scale-105 transition-all">Save to Portfolio</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
