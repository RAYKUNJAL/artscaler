'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ExternalLink, Maximize2, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface ArtCardProps {
    listing: {
        id: string;
        title: string;
        sold_price: number;
        currency: string;
        sold_date: string;
        image_url: string;
        item_url: string;
        watchers?: number;
        bids?: number;
        visual_metadata?: {
            colors: string[];
            primary_style: string;
            orientation: string;
            mood: string;
        };
    };
    onQuickView: (listing: ArtCardProps['listing']) => void;
}

export default function ArtCard({ listing, onQuickView }: ArtCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const colors = listing.visual_metadata?.colors || [];

    return (
        <div
            className="group relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/10"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Price Badge */}
            <div className="absolute top-3 right-3 z-10">
                <div className="bg-green-600 text-white text-xs md:text-sm font-black px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    {listing.sold_price.toLocaleString()}
                </div>
            </div>

            {/* Live Pulse Signals */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                <div className="bg-black/60 backdrop-blur-md text-gray-200 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-widest">
                    Sold {new Date(listing.sold_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>

                {((listing.watchers || 0) > 0 || (listing.bids || 0) > 0) && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg shadow-lg animate-in fade-in slide-in-from-left duration-500">
                        <TrendingUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-wide">
                            {(listing.watchers || 0) > 0 ? `${listing.watchers} Watching` : `${listing.bids} Bids`}
                        </span>
                    </div>
                )}
            </div>

            {/* Image Container */}
            <div className="relative aspect-auto min-h-[200px] cursor-pointer" onClick={() => onQuickView(listing)}>
                <Image
                    src={listing.image_url}
                    alt={listing.title}
                    width={400}
                    height={300}
                    unoptimized
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Information Overlay on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 flex flex-col justify-end p-4 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <h3 className="text-white text-xs font-bold line-clamp-2 mb-2 leading-relaxed">
                        {listing.title}
                    </h3>

                    {/* Visual Attributes */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {listing.visual_metadata?.primary_style && (
                            <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-blue-500/30">
                                {listing.visual_metadata.primary_style}
                            </span>
                        )}
                        {listing.visual_metadata?.mood && (
                            <span className="bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-purple-500/30">
                                {listing.visual_metadata.mood}
                            </span>
                        )}
                    </div>

                    {/* Color Palette Swatches */}
                    <div className="flex items-center gap-1">
                        {colors.map((color, i) => (
                            <div
                                key={i}
                                className="w-4 h-4 rounded-full border border-white/20 shadow-sm dynamic-swatch"
                                // eslint-disable-next-line react/no-unknown-property
                                style={{ '--swatch-color': color } as React.CSSProperties}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between p-3 bg-gray-900 border-t border-gray-800">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onQuickView(listing)}
                        className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Quick View"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </button>
                </div>
                <a
                    href={listing.item_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs md:text-sm font-black text-blue-400 hover:text-blue-300 uppercase tracking-wide transition-colors px-3 py-1.5 hover:bg-blue-500/10 rounded-lg"
                >
                    View Listing
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
            </div>
        </div>
    );
}
