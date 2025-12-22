'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ArtGalleryGrid from '@/components/gallery/ArtGalleryGrid';
import { Search, SlidersHorizontal, LayoutGrid, List, Sparkles } from 'lucide-react';

export default function StyleGalleryPage() {
    const [selectedStyle, setSelectedStyle] = useState<string | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    const styles = [
        { name: 'All', value: undefined },
        { name: 'Abstract', value: 'Abstract' },
        { name: 'Landscape', value: 'Landscape' },
        { name: 'Portrait', value: 'Portrait' },
        { name: 'Minimalist', value: 'Minimalist' },
        { name: 'Pop Art', value: 'Pop Art' },
        { name: 'Street Art', value: 'Street Art' },
        { name: 'Modern', value: 'Modern' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">
                            Visual Style <span className="text-blue-500">Explorer</span>
                        </h1>
                        <p className="text-gray-400 font-medium">
                            Reverse-engineer the visual DNA of top-selling eBay canvas art.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search styles, colors, subjects..."
                                className="bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-all"
                            aria-label="Filter Styles"
                            title="Filter Styles"
                        >
                            <SlidersHorizontal className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Discovery Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {styles.map((style) => (
                        <button
                            key={style.name}
                            onClick={() => setSelectedStyle(style.value)}
                            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedStyle === style.value
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300'
                                }`}
                        >
                            {style.name}
                        </button>
                    ))}
                </div>

                {/* Main Gallery Area */}
                <div className="bg-gray-900/30 border border-gray-800/50 rounded-[2.5rem] p-6 md:p-10">
                    <ArtGalleryGrid
                        initialStyle={selectedStyle}
                        limit={40}
                        title={selectedStyle ? `${selectedStyle} Masterpieces` : "Global Visual Pulse"}
                        subtitle={`Analyzing visual compositions for ${selectedStyle || 'all styles'} with high velocity scores.`}
                    />
                </div>

                {/* AI Insight Bar */}
                <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Visual DNA Analysis</h3>
                            <p className="text-sm text-gray-400">Gemini is currently analyzing color trends in the {selectedStyle || 'Modern'} segment.</p>
                        </div>
                    </div>
                    <button className="px-8 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all">
                        Generate Visual Report
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
