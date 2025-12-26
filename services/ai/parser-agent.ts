/**
 * ParserAgent - Feature Extraction
 * 
 * Extracts art-specific features from listing titles:
 * - Size (width x height in inches)
 * - Medium (oil, acrylic, watercolor, etc.)
 * - Subject (abstract, landscape, portrait, etc.)
 * - Style (modern, contemporary, vintage, etc.)
 * 
 * Uses regex for common patterns, falls back to AI for ambiguous cases.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { generateResponse } from '@/lib/ai/vertexClient';

export interface ParsedSignal {
    listing_id: string;
    user_id: string;
    width_in: number | null;
    height_in: number | null;
    size_bucket: string | null;
    medium: string | null;
    subject: string | null;
    style: string | null;
    color_tags: string[];
    confidence: number;
    parser_model: string;
}

export class ParserAgent {
    /**
     * Parse features from clean listings
     */
    async parseListings(supabase: SupabaseClient, runId: string, userId: string): Promise<number> {
        try {
            // Fetch clean listings for this run
            const { data: cleanListings, error: fetchError } = await supabase
                .from('sold_listings_clean')
                .select('id, title')
                .eq('run_id', runId)
                .eq('user_id', userId);

            if (fetchError || !cleanListings) {
                console.error('Error fetching clean listings:', fetchError);
                return 0;
            }

            console.log(`ParserAgent: Processing ${cleanListings.length} listings...`);

            const parsedSignals: ParsedSignal[] = [];

            for (const listing of cleanListings) {
                const signal = await this.parseSingleListing(listing.id, listing.title, userId);
                if (signal) {
                    parsedSignals.push(signal);
                }
            }

            // Insert parsed signals
            if (parsedSignals.length > 0) {
                const { error: insertError } = await supabase
                    .from('parsed_signals')
                    .insert(parsedSignals);

                if (insertError) {
                    console.error('Error inserting parsed signals:', insertError);
                    return 0;
                }
            }

            console.log(`ParserAgent: Parsed ${parsedSignals.length} signals`);
            return parsedSignals.length;
        } catch (error) {
            console.error('ParserAgent error:', error);
            return 0;
        }
    }

    /**
     * Parse a single listing title
     */
    private async parseSingleListing(
        listingId: string,
        title: string,
        userId: string
    ): Promise<ParsedSignal | null> {
        try {
            // Extract size using regex
            const { width, height } = this.extractSize(title);

            // Extract medium, subject, style using regex
            const medium = this.extractMedium(title);
            const subject = this.extractSubject(title);
            const style = this.extractStyle(title);
            const colorTags = this.extractColors(title);

            // Calculate confidence based on what we found
            let confidence = 0.5;
            if (width && height) confidence += 0.2;
            if (medium) confidence += 0.1;
            if (subject) confidence += 0.1;
            if (style) confidence += 0.1;

            // If confidence is low, try AI parsing (optional, costs API credits)
            let parserModel = 'regex';
            if (confidence < 0.6 && process.env.OPENAI_API_KEY) {
                // For now, skip AI parsing to save costs
                // In production, you'd call GPT-4 here for ambiguous cases
                parserModel = 'regex_only';
            }

            // Calculate size bucket
            const sizeBucket = this.categorizeSizeBucket(width, height);

            return {
                listing_id: listingId,
                user_id: userId,
                width_in: width,
                height_in: height,
                size_bucket: sizeBucket,
                medium,
                subject,
                style,
                color_tags: colorTags,
                confidence: Math.min(confidence, 1.0),
                parser_model: parserModel,
            };
        } catch (error) {
            console.error('Error parsing listing:', error);
            return null;
        }
    }

    /**
     * Extract size from title (e.g., "16x20", "24 x 36")
     */
    private extractSize(title: string): { width: number | null; height: number | null } {
        // Common patterns: 16x20, 16 x 20, 16"x20", 16" x 20"
        const sizePattern = /(\d+)\s*[x×]\s*(\d+)/i;
        const match = title.match(sizePattern);

        if (match) {
            return {
                width: parseInt(match[1]),
                height: parseInt(match[2]),
            };
        }

        return { width: null, height: null };
    }

    /**
     * Extract medium from title
     */
    private extractMedium(title: string): string | null {
        const titleLower = title.toLowerCase();

        const mediums = [
            'oil',
            'acrylic',
            'watercolor',
            'watercolour',
            'pastel',
            'charcoal',
            'pencil',
            'ink',
            'mixed media',
            'gouache',
            'tempera',
            'spray paint',
            'digital',
            'print',
            'lithograph',
            'etching',
            'serigraph',
        ];

        for (const medium of mediums) {
            if (titleLower.includes(medium)) {
                return medium;
            }
        }

        return null;
    }

    /**
     * Extract subject from title
     */
    private extractSubject(title: string): string | null {
        const titleLower = title.toLowerCase();

        const subjects = [
            'abstract',
            'landscape',
            'portrait',
            'still life',
            'seascape',
            'cityscape',
            'floral',
            'animal',
            'wildlife',
            'figurative',
            'nude',
            'religious',
            'historical',
            'fantasy',
            'surreal',
            'geometric',
            'botanical',
        ];

        for (const subject of subjects) {
            if (titleLower.includes(subject)) {
                return subject;
            }
        }

        return null;
    }

    /**
     * Extract style from title
     */
    private extractStyle(title: string): string | null {
        const titleLower = title.toLowerCase();

        const styles = [
            'contemporary',
            'modern',
            'traditional',
            'impressionist',
            'expressionist',
            'cubist',
            'pop art',
            'minimalist',
            'realist',
            'surrealist',
            'abstract expressionist',
            'vintage',
            'mid-century',
            'folk art',
            'naive',
        ];

        for (const style of styles) {
            if (titleLower.includes(style)) {
                return style;
            }
        }

        return null;
    }

    /**
     * Extract color tags from title
     */
    private extractColors(title: string): string[] {
        const titleLower = title.toLowerCase();
        const colors: string[] = [];

        const colorList = [
            'red',
            'blue',
            'green',
            'yellow',
            'orange',
            'purple',
            'pink',
            'black',
            'white',
            'gray',
            'grey',
            'brown',
            'gold',
            'silver',
            'bronze',
            'turquoise',
            'teal',
            'navy',
            'maroon',
            'beige',
        ];

        for (const color of colorList) {
            if (titleLower.includes(color)) {
                colors.push(color);
            }
        }

        return colors;
    }

    /**
     * Categorize size into buckets
     */
    private categorizeSizeBucket(width: number | null, height: number | null): string | null {
        if (!width || !height) return null;

        const area = width * height;

        if (area < 200) return 'small';
        if (area < 600) return 'medium';
        if (area < 1200) return 'large';
        return 'extra-large';
    }

    /**
     * Use AI to parse ambiguous titles (Gemini 1.5 Flash for cost efficiency)
     */
    private async parseWithAI(title: string): Promise<Partial<ParsedSignal>> {
        try {
            const prompt = `You are an art expert. Extract the following from art listing titles:
- size (width and height in inches)
- medium (oil, acrylic, watercolor, etc.)
- subject (abstract, landscape, portrait, etc.)
- style (modern, contemporary, vintage, etc.)
- colors

Respond in JSON format: {"width": 16, "height": 20, "medium": "oil", "subject": "landscape", "style": "impressionist", "colors": ["blue", "green"]}

If you can't determine a field, use null.
Title: ${title}`;

            const text = await generateResponse(prompt);

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

            return {
                width_in: parsed.width,
                height_in: parsed.height,
                medium: parsed.medium,
                subject: parsed.subject,
                style: parsed.style,
                color_tags: parsed.colors || [],
                confidence: 0.8,
                parser_model: 'gemini-1.5-flash',
            };
        } catch (error) {
            console.error('Gemini parsing error:', error);
            return {};
        }
    }
}

// Singleton instance
let parserInstance: ParserAgent | null = null;

export function getParserAgent(): ParserAgent {
    if (!parserInstance) {
        parserInstance = new ParserAgent();
    }
    return parserInstance;
}
