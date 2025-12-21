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
                    className="block bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-700/50 transition"
                >
                    {item.imageUrl && (
                        <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-32 object-cover rounded mb-2"
                        />
                    )}
                    <h4 className="font-semibold text-white mb-1 line-clamp-2" title={item.title}>
                        {item.title}
                    </h4>
                    <p className="text-sm text-gray-300">
                        {item.soldPrice ? `${item.soldPrice.toFixed(2)} ${item.currency}` : 'Price N/A'}
                    </p>
                    {item.condition && (
                        <p className="text-xs text-gray-400 mt-1">Condition: {item.condition}</p>
                    )}
                    {item.location && (
                        <p className="text-xs text-gray-400 mt-1">Location: {item.location}</p>
                    )}
                </a>
            ))}
        </div>
    );
}
