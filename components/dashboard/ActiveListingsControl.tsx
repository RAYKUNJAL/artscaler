'use client';

import { Layers, Eye, TrendingUp, Clock, DollarSign, ExternalLink, Settings2, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface ActiveListing {
    id: string;
    title: string;
    thumbnail: string;
    views: number;
    watchers: number;
    timeRemaining: string;
    currentBid: number;
    currency: string;
}

export default function ActiveListingsControl() {
    // Mock data for initial V6 display
    const listings: ActiveListing[] = [
        {
            id: '1',
            title: 'Abstract Expressionist Canvas 24x36 Original',
            thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=400&fit=crop',
            views: 245,
            watchers: 42,
            timeRemaining: '4h 12m',
            currentBid: 485.00,
            currency: 'USD'
        },
        {
            id: '2',
            title: 'Modern Portrait - Oil on Wood Panel 12x12',
            thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=400&fit=crop',
            views: 112,
            watchers: 15,
            timeRemaining: '2d 6h',
            currentBid: 125.00,
            currency: 'USD'
        }
    ];

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-[32px] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                        <Layers className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Active eBay Listings</h3>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sort: High Velocity</span>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="Listing Settings">
                        <Settings2 className="h-5 w-5 text-gray-400" />
                    </button>
                </div>
            </div>

            <div className="divide-y divide-white/5">
                {listings.map((listing) => (
                    <div key={listing.id} className="p-6 hover:bg-white/[0.02] transition-all group">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                            {/* Listing Info */}
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0">
                                    <Image
                                        src={listing.thumbnail}
                                        alt={listing.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2 line-clamp-1">{listing.title}</h4>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            <Eye className="h-3.5 w-3.5 text-blue-400" />
                                            {listing.views} Views
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                                            {listing.watchers} Watchers
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                                            {listing.timeRemaining} Left
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Price Intelligence */}
                            <div className="flex items-center justify-between lg:justify-end gap-8 lg:w-1/3">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 text-right">Current Bid</p>
                                    <p className="text-xl font-black text-white">${listing.currentBid.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all h-10">
                                        Insights
                                    </button>
                                    <button className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center rounded-xl transition-all shadow-lg shadow-blue-600/20" title="Promote Listing">
                                        <Sparkles className="h-4 w-4" />
                                    </button>
                                    <button className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center rounded-xl transition-all" title="View on eBay">
                                        <ExternalLink className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white/[0.02] p-4 text-center">
                <button className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
                    View All 42 Listings in Manager
                </button>
            </div>
        </div>
    );
}
