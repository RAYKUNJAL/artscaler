/**
 * ListingGeneratorAgent - eBay Listing Generator (V2)
 * 
 * Generates eBay-ready titles and descriptions using Pulse Velocity (WVS) 
 * data from the marketplace.
 * 
 * Branding: eBay Art Pulse Pro
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface PulseListingTemplate {
    topic_label: string;
    title_variants: string[];
    description_snippet: string;
    keyword_stack: string[];
    price_advice: {
        min: number;
        max: number;
        optimal: number;
    };
    format: 'Auction' | 'Buy It Now' | 'Hybrid';
    stencil_recommendation?: string;
}

export class ListingGeneratorAgent {
    /**
     * Generate Pulse-optimized listing for a specific topic
     */
    async generatePulseListing(
        supabase: SupabaseClient,
        topicLabel: string,
        avgPrice: number,
        wvs: number
    ): Promise<PulseListingTemplate> {

        // 1. Determine optimal price and format
        let format: PulseListingTemplate['format'] = 'Buy It Now';
        if (wvs > 4) format = 'Auction'; // High demand = auction fuel
        else if (wvs > 2) format = 'Hybrid';

        const optimal = Math.round(avgPrice);
        const price_advice = {
            min: Math.round(avgPrice * 0.85),
            max: Math.round(avgPrice * 1.2),
            optimal
        };

        // 2. Mock attributes (in real app, query database for these clusters)
        const commonMediums = ['Acrylic', 'Oil', 'Spray Paint', 'Stencil Art'];
        const commonSizes = ['12x12', '16x20', '24x36'];

        // 3. Generate variants
        const title_variants = [
            `${topicLabel} Original ${commonMediums[0]} Painting Signed Wall Art`,
            `Original ${topicLabel} Art ${commonSizes[0]} Signed ${commonMediums[0]}`,
            `Hand Painted ${topicLabel} ${commonMediums[1]} Canvas Art signed`,
            `${commonSizes[1]} ${topicLabel} Painting Original Signed Wall Decor`
        ].map(t => t.substring(0, 80));

        // 4. Stencil recommendation (Exclusive Pro Feature)
        let stencil_recommendation = "No specific stencil recommended for this subject.";
        if (topicLabel.toLowerCase().includes('banksy') || topicLabel.toLowerCase().includes('street')) {
            stencil_recommendation = "Use 3-layer multi-color stencils for higher perceived value (Street Art Premium).";
        } else if (topicLabel.toLowerCase().includes('landscape')) {
            stencil_recommendation = "Use 'Cloud Pattern' or 'Mountain Ridge' edge stencils for depth.";
        }

        return {
            topic_label: topicLabel,
            title_variants,
            description_snippet: `Beautiful original ${topicLabel} art piece. Hand-signed by the artist. Professional grade materials used throughout.`,
            keyword_stack: [topicLabel, 'Original Art', 'Signed', 'Wall Decor', commonMediums[0]],
            price_advice,
            format,
            stencil_recommendation
        };
    }

    /**
     * Map size bucket to human text
     */
    private sizeBucketToText(bucket: string): string {
        const sizeMap: Record<string, string> = {
            small: 'Small',
            medium: 'Medium',
            large: 'Large',
            'extra-large': 'XL',
        };
        return sizeMap[bucket] || bucket;
    }
}

let listingGeneratorInstance: ListingGeneratorAgent | null = null;
export function getListingGeneratorAgent(): ListingGeneratorAgent {
    if (!listingGeneratorInstance) listingGeneratorInstance = new ListingGeneratorAgent();
    return listingGeneratorInstance;
}
