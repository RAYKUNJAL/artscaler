import React from 'react';
import { EbayApiListing } from '@/services/scraper/ebay-api';
import { Search } from 'lucide-react';

interface EbayResultsProps {
    listings: EbayApiListing[];
}

export default function EbayResults({ listings }: EbayResultsProps) {
    if (!listings || listings.length === 0) {
        return (
            <div className="p-4 text-gray-400 text-center">No listings found.</div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {listings.map((item, idx) => (
                <a
                    key={idx}
                    href={item.itemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-800/30 border border-gray-700 rounded-lg p-3 hover:bg-gray-700/50 transition group"
                >
                    {item.imageUrl && (
                        <div className="relative overflow-hidden rounded mb-3">
                            <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-48 sm:h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm line-clamp-2 leading-snug" title={item.title}>
                            {item.title}
                        </h4>
                        <p className="text-lg font-black text-green-400">
                            {item.soldPrice ? `${item.soldPrice.toFixed(2)} ${item.currency}` : 'Price N/A'}
                        </p>
                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-medium uppercase tracking-wider pt-1">
                            {item.condition && <span>{item.condition}</span>}
                            {item.location && <span className="hidden sm:inline">• {item.location}</span>}
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
}
