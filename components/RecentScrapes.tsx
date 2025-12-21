'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { EbayApiListing } from '@/services/scraper/ebay-api';
import EbayResults from '@/components/EbayResults';
import { Loader2 } from 'lucide-react';

export default function RecentScrapes() {
    const { session, loading: authLoading } = useAuth();
    const [listings, setListings] = useState<EbayApiListing[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchListings = async () => {
        if (!session) return;

        try {
            const res = await fetch('/api/scrape/results', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            const json = await res.json();
            if (res.ok && json.listings) {
                setListings(json.listings);
            }
        } catch (error) {
            console.error('Error fetching recent scrapes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && session) {
            fetchListings();
        } else if (!authLoading && !session) {
            setLoading(false);
        }
    }, [session, authLoading]);

    if (loading || authLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    if (listings.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Recent Finds</h3>
            <EbayResults listings={listings} />
        </div>
    );
}
