/**
 * CleanerAgent - Data Normalization
 * 
 * Normalizes raw scraped data into clean, structured records:
 * - Parse currency and numeric prices
 * - Extract shipping costs
 * - Detect auction vs Buy It Now
 * - Parse sold dates
 * - Deduplicate by URL
 */

import { supabase } from '@/lib/supabase/client';

export interface RawListing {
    id: string;
    run_id: string;
    search_keyword: string;
    item_url: string;
    title_raw: string;
    price_raw: string;
    shipping_raw: string;
    bids_raw: string;
    sold_date_raw: string;
}

export interface CleanListing {
    raw_id: string;
    run_id: string;
    user_id: string;
    search_keyword: string;
    item_url: string;
    title: string;
    currency: string;
    sold_price: number | null;
    shipping_price: number;
    is_auction: boolean;
    bid_count: number;
    sold_date: string | null;
    dedupe_hash: string;
}

export class CleanerAgent {
    /**
     * Clean a batch of raw listings
     */
    async cleanListings(runId: string, userId: string): Promise<number> {
        try {
            // Fetch raw listings for this run
            const { data: rawListings, error: fetchError } = await supabase
                .from('sold_listings_raw')
                .select('*')
                .eq('run_id', runId);

            if (fetchError || !rawListings) {
                console.error('Error fetching raw listings:', fetchError);
                return 0;
            }

            console.log(`CleanerAgent: Processing ${rawListings.length} raw listings...`);

            const cleanedListings: CleanListing[] = [];

            for (const raw of rawListings) {
                const cleaned = this.cleanSingleListing(raw, userId);
                if (cleaned) {
                    cleanedListings.push(cleaned);
                }
            }

            // Remove duplicates by URL
            const uniqueListings = this.deduplicateListings(cleanedListings);

            console.log(`CleanerAgent: ${uniqueListings.length} unique listings after deduplication`);

            // Insert cleaned listings
            if (uniqueListings.length > 0) {
                const { error: insertError } = await supabase
                    .from('sold_listings_clean')
                    .insert(uniqueListings);

                if (insertError) {
                    console.error('Error inserting clean listings:', insertError);
                    return 0;
                }
            }

            return uniqueListings.length;
        } catch (error) {
            console.error('CleanerAgent error:', error);
            return 0;
        }
    }

    /**
     * Clean a single raw listing
     */
    private cleanSingleListing(raw: RawListing, userId: string): CleanListing | null {
        try {
            // Parse price
            const soldPrice = this.parsePrice(raw.price_raw);

            // Parse shipping
            const shippingPrice = this.parseShipping(raw.shipping_raw);

            // Detect auction
            const isAuction = this.detectAuction(raw.bids_raw);

            // Parse bid count
            const bidCount = this.parseBidCount(raw.bids_raw);

            // Parse sold date
            const soldDate = this.parseSoldDate(raw.sold_date_raw);

            // Generate dedupe hash
            const dedupeHash = this.generateDedupeHash(raw.title_raw, soldPrice, soldDate);

            return {
                raw_id: raw.id,
                run_id: raw.run_id,
                user_id: userId,
                search_keyword: raw.search_keyword,
                item_url: raw.item_url,
                title: raw.title_raw.trim(),
                currency: 'USD',
                sold_price: soldPrice,
                shipping_price: shippingPrice,
                is_auction: isAuction,
                bid_count: bidCount,
                sold_date: soldDate,
                dedupe_hash: dedupeHash,
            };
        } catch (error) {
            console.error('Error cleaning listing:', error);
            return null;
        }
    }

    /**
     * Parse price from raw text
     */
    private parsePrice(priceRaw: string): number | null {
        if (!priceRaw) return null;

        // Remove currency symbols and commas
        const cleaned = priceRaw.replace(/[$,]/g, '');

        // Extract first number
        const match = cleaned.match(/[\d.]+/);
        if (!match) return null;

        const price = parseFloat(match[0]);
        return isNaN(price) ? null : price;
    }

    /**
     * Parse shipping cost
     */
    private parseShipping(shippingRaw: string): number {
        if (!shippingRaw) return 0;

        // Check for free shipping
        if (shippingRaw.toLowerCase().includes('free')) {
            return 0;
        }

        // Extract shipping cost
        const match = shippingRaw.match(/[\d.]+/);
        if (!match) return 0;

        const shipping = parseFloat(match[0]);
        return isNaN(shipping) ? 0 : shipping;
    }

    /**
     * Detect if listing was an auction
     */
    private detectAuction(bidsRaw: string): boolean {
        if (!bidsRaw) return false;
        return bidsRaw.toLowerCase().includes('bid');
    }

    /**
     * Parse bid count
     */
    private parseBidCount(bidsRaw: string): number {
        if (!bidsRaw) return 0;

        const match = bidsRaw.match(/(\d+)\s*bid/i);
        if (!match) return 0;

        const count = parseInt(match[1]);
        return isNaN(count) ? 0 : count;
    }

    /**
     * Parse sold date
     */
    private parseSoldDate(dateRaw: string): string | null {
        if (!dateRaw) return null;

        try {
            // Try to parse the date
            const date = new Date(dateRaw);
            if (isNaN(date.getTime())) {
                // If parsing fails, return null
                return null;
            }

            // Return ISO date string (YYYY-MM-DD)
            return date.toISOString().split('T')[0];
        } catch {
            return null;
        }
    }

    /**
     * Generate deduplication hash
     */
    private generateDedupeHash(title: string, price: number | null, date: string | null): string {
        const hashInput = `${title}-${price}-${date}`;

        // Simple hash function (for production, use crypto.createHash)
        let hash = 0;
        for (let i = 0; i < hashInput.length; i++) {
            const char = hashInput.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash).toString(36);
    }

    /**
     * Remove duplicate listings by URL
     */
    private deduplicateListings(listings: CleanListing[]): CleanListing[] {
        const seen = new Set<string>();
        const unique: CleanListing[] = [];

        for (const listing of listings) {
            if (!seen.has(listing.item_url)) {
                seen.add(listing.item_url);
                unique.push(listing);
            }
        }

        return unique;
    }
}

// Singleton instance
let cleanerInstance: CleanerAgent | null = null;

export function getCleanerAgent(): CleanerAgent {
    if (!cleanerInstance) {
        cleanerInstance = new CleanerAgent();
    }
    return cleanerInstance;
}
