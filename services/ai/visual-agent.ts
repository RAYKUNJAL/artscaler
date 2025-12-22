/**
 * VisualAgent - Image Intelligence
 * 
 * Uses Gemini 1.5 Flash (Vision) to analyze sold artwork images:
 * - Dominant color palette extraction
 * - Visual style classification
 * - Composition analysis
 * - Brushwork/Texture detection
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export interface VisualMetadata {
    colors: string[]; // Hex codes
    primary_style: string;
    sub_styles: string[];
    composition: string;
    technique: string;
    mood: string;
    orientation: 'horizontal' | 'vertical' | 'square';
}

export class VisualAgent {
    /**
     * Process images for clean listings that don't have visual metadata yet
     */
    async processVisualIntelligence(supabase: SupabaseClient, userId: string, limit: number = 20): Promise<number> {
        try {
            // Fetch listings without visual metadata but WITH an image_url
            const { data: listings, error: fetchError } = await supabase
                .from('ebay_sold_listings')
                .select('id, image_url, title')
                .eq('user_id', userId)
                .not('image_url', 'is', null)
                .is('visual_metadata', null) // Only those not processed
                .limit(limit);

            if (fetchError || !listings) {
                console.error('VisualAgent: Fetch error:', fetchError);
                return 0;
            }

            if (listings.length === 0) return 0;

            console.log(`📸 VisualAgent: Analyzing ${listings.length} artwork images...`);

            let processedCount = 0;
            for (const listing of listings) {
                const metadata = await this.analyzeImage(listing.image_url, listing.title);
                if (metadata) {
                    const { error: updateError } = await supabase
                        .from('ebay_sold_listings')
                        .update({ visual_metadata: metadata })
                        .eq('id', listing.id);

                    if (!updateError) processedCount++;
                }
            }

            console.group(`✅ VisualAgent: Successfully processed ${processedCount} images`);
            return processedCount;

        } catch (error) {
            console.error('VisualAgent: Critical error:', error);
            return 0;
        }
    }

    /**
     * Analyze a single image using Gemini Vision
     */
    private async analyzeImage(imageUrl: string, title: string): Promise<VisualMetadata | null> {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            // Fetch image as base64
            const imageResponse = await fetch(imageUrl);
            const arrayBuffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(arrayBuffer).toString('base64');

            const prompt = `Analyze this artwork listing from eBay.
Title: ${title}

Extract visual metadata and respond in STRICT JSON format:
{
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "primary_style": "e.g. Abstract",
  "sub_styles": ["e.g. Minimalist", "Geometric"],
  "composition": "e.g. Horizontal, focal point in center",
  "technique": "e.g. Thick impasto, palette knife",
  "mood": "e.g. Calm, energetic, somber",
  "orientation": "horizontal|vertical|square"
}

Dominant colors should be 5 hex codes.
Primary style should be one of: Abstract, Landscape, Portrait, Street Art, Minimalist, Pop Art, Realism.`;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: 'image/jpeg'
                    }
                }
            ]);

            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as VisualMetadata;
            }

            return null;
        } catch (error) {
            console.error(`VisualAgent: Error analyzing image ${imageUrl}:`, error);
            return null;
        }
    }
}

// Singleton instance
let visualAgentInstance: VisualAgent | null = null;

export function getVisualAgent(): VisualAgent {
    if (!visualAgentInstance) {
        visualAgentInstance = new VisualAgent();
    }
    return visualAgentInstance;
}
