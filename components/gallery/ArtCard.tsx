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
                <div className="bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {listing.sold_price}
                </div>
            </div>

            {/* Sold Date Badge */}
            <div className="absolute top-3 left-3 z-10">
                <div className="bg-black/60 backdrop-blur-md text-gray-300 text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 uppercase tracking-widest">
                    Sold {new Date(listing.sold_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
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
                    className="flex items-center gap-1 text-[10px] font-black text-gray-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                >
                    View Source
                    <ExternalLink className="h-3 w-3" />
                </a>
            </div>
        </div>
    );
}
