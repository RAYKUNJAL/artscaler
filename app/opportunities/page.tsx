'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { TrendingUp, DollarSign, Tag, ExternalLink, Loader2, Info, Zap, ArrowRight, Package, Layout, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DEMO_MARKET_DATA, getDemoBadge } from '@/lib/demo-data';

interface Opportunity {
    id: string;
    topic_label: string;
    wvs_score: number;
    velocity_score: number;
    recommended_price_band: {
        min: number;
        max: number;
        median: number;
    };
    recommended_sizes: string[];
    recommended_mediums: string[];
    keyword_stack: string[];
    evidence_urls: string[];
    date: string;
}

export default function Opportunities() {
    const { session, loading: authLoading } = useAuth();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        if (!authLoading && session) {
            fetchOpportunities();
        }
    }, [session, authLoading]);

    const fetchOpportunities = async () => {
        try {
            const { data, error } = await supabase
                .from('opportunity_feed')
                .select('*')
                .eq('user_id', session?.user.id)
                .order('wvs_score', { ascending: false })
                .limit(20);

            if (error) throw error;

            if (data && data.length > 0) {
                setOpportunities(data);
                setIsDemo(false);
            } else {
                // Set demo data
                setOpportunities(DEMO_MARKET_DATA.slice(0, 4).map((item, i) => ({
                    id: `demo-${i}`,
                    topic_label: item.title,
                    wvs_score: item.wvs_score,
                    velocity_score: 1.5 + (Math.random()),
                    recommended_price_band: {
                        min: item.price * 0.9,
                        max: item.price * 1.5,
                        median: item.price * 1.2
                    },
                    recommended_sizes: [item.size],
                    recommended_mediums: ['Original Acrylic', 'Mixed Media'],
                    keyword_stack: ['original', 'signed', item.style.toLowerCase()],
                    evidence_urls: [item.item_url],
                    date: new Date().toISOString()
                })));
                setIsDemo(true);
            }
        } catch (error) {
            console.error('Error fetching opportunities:', error);
            setIsDemo(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading || authLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
                            <Zap className="h-10 w-10 text-amber-500" />
                            Hot Pulse Alerts
                        </h1>
                        <p className="text-gray-400 font-medium">Real-time demand signals identified from eBay buyer activity.</p>
                        {isDemo && (
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{getDemoBadge('Intelligence Feed')}</span>
                            </div>
                        )}
                    </div>
                    <Link
                        href="/market-scanner"
                        className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all border border-gray-700 flex items-center gap-2"
                    >
                        Scan New Subjects
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {opportunities.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-16 text-center shadow-2xl">
                        <div className="h-20 w-20 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Info className="h-10 w-10 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">No Pulse Alerts Triggered</h2>
                        <p className="text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
                            We haven't detected any high-velocity opportunities based on your current tracking.
                            Start a new scrape to discover what's pumping right now.
                        </p>
                        <Link
                            href="/market-scanner"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
                        >
                            Run Market Scan
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {opportunities.map((opp) => (
                            <div key={opp.id} className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden hover:border-amber-500/30 transition-all flex flex-col group shadow-xl">
                                {/* Top Banner/Score */}
                                <div className="p-8 pb-4 flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded">High Demand</span>
                                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{new Date(opp.date).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white capitalize group-hover:text-amber-400 transition-colors pt-2">{opp.topic_label}</h3>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-amber-500 leading-none">{opp.wvs_score.toFixed(1)}</div>
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mt-1">WVS Pulse</div>
                                    </div>
                                </div>

                                {/* Main Stats */}
                                <div className="px-8 py-6 grid grid-cols-2 gap-4">
                                    <div className="bg-gray-800/40 rounded-2xl p-4 border border-gray-800">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Target Price</p>
                                        <p className="text-lg font-black text-white">${opp.recommended_price_band?.median || 0}</p>
                                    </div>
                                    <div className="bg-gray-800/40 rounded-2xl p-4 border border-gray-800">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Velocity</p>
                                        <p className="text-lg font-black text-green-500">+{opp.velocity_score.toFixed(1)}x</p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="px-8 pb-8 space-y-6 flex-1">
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Package className="h-3 w-3" /> Recommended Specs
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {opp.recommended_sizes?.slice(0, 3).map(size => (
                                                <span key={size} className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-bold rounded-lg">{size}</span>
                                            ))}
                                            {opp.recommended_mediums?.slice(0, 2).map(med => (
                                                <span key={med} className="px-3 py-1 bg-blue-900/20 text-blue-400 border border-blue-900/40 text-xs font-bold rounded-lg">{med}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Tag className="h-3 w-3" /> Top Keywords
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {opp.keyword_stack?.slice(0, 4).map(kw => (
                                                <span key={kw} className="text-xs text-gray-400 font-medium">#{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="mt-auto p-4 bg-gray-800/50 border-t border-gray-800 flex gap-3">
                                    <Link
                                        href={`/listing-builder?topic=${encodeURIComponent(opp.topic_label)}`}
                                        className="flex-1 bg-white text-gray-900 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                                    >
                                        <Layout className="h-3.5 w-3.5" />
                                        Build Listing
                                    </Link>
                                    <a
                                        href={opp.evidence_urls?.[0] || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="View evidence on eBay"
                                        className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all border border-gray-700"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
