'use client';

import { useState, useEffect } from 'react';
import ArtCard from './ArtCard';
import { Loader2, Sparkles, Filter, Grid3X3, Image as ImageIcon } from 'lucide-react';

interface ArtGalleryGridProps {
    initialStyle?: string;
    limit?: number;
    title?: string;
    subtitle?: string;
}

export default function ArtGalleryGrid({
    initialStyle,
    limit = 20,
    title = "Visual Sold Gallery",
    subtitle = "See exactly what compositions and styles are winning in the market."
}: ArtGalleryGridProps) {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchGallery();
    }, [initialStyle]);

    async function fetchGallery() {
        try {
            setLoading(true);
            const url = initialStyle
                ? `/api/gallery/sold?style=${initialStyle}&limit=${limit}`
                : `/api/gallery/sold?limit=${limit}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                setListings(data.listings || []);
            } else {
                setError(data.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading && listings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                <p className="text-gray-400 font-medium">Curating your visual feed...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 px-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">{title}</h2>
                    </div>
                    <p className="text-gray-400 font-medium text-sm">{subtitle}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:border-gray-700 transition-all">
                        <Filter className="h-3.5 w-3.5" />
                        Filters
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">
                        <Sparkles className="h-3.5 w-3.5" />
                        Analyze Style Trends
                    </button>
                </div>
            </div>

            {listings.length === 0 ? (
                <div className="bg-gray-900/50 border border-dashed border-gray-800 rounded-3xl p-20 text-center">
                    <div className="h-20 w-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Grid3X3 className="h-10 w-10 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No visuals found for this segment</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Try running a scan in the Market Scanner to collect more visual data.</p>
                </div>
            ) : (
                /* Simple Responsive Columns Masonry-like fallback */
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                    {listings.map((listing) => (
                        <div key={listing.id} className="break-inside-avoid">
                            <ArtCard
                                listing={listing}
                                onQuickView={(l) => console.log('Quick view:', l)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {listings.length > 0 && (
                <div className="flex justify-center mt-12">
                    <button className="px-10 py-4 bg-gray-900 border border-gray-800 rounded-2xl text-xs font-black text-white hover:border-gray-600 transition-all uppercase tracking-widest">
                        Explore Full Gallery
                    </button>
                </div>
            )}
        </div>
    );
}
