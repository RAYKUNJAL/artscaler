/**
 * Pattern Miner - Style & Size Extraction Engine
 * 
 * Extracts and scores art styles, sizes, and mediums from eBay listings.
 * Uses regex patterns and fuzzy matching to identify:
 * - Art styles (abstract, impressionist, modern, etc.)
 * - Sizes (16x20, 24x36, etc.)
 * - Mediums (oil, acrylic, watercolor, etc.)
 * 
 * Each pattern is scored by WVS to identify high-demand combinations.
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface ExtractedPattern {
    styles: string[];
    sizes: SizeInfo[];
    mediums: string[];
    subjects: string[];
    colors: string[];
}

export interface SizeInfo {
    raw: string;
    width: number;
    height: number;
    cluster: string;
    orientation: 'landscape' | 'portrait' | 'square';
}

export interface PatternStats {
    term: string;
    count: number;
    avgWvs: number;
    avgPrice: number;
    trend: 'rising' | 'stable' | 'falling';
}

export interface MiningReport {
    generatedAt: string;
    listingsProcessed: number;
    stylesFound: PatternStats[];
    sizesFound: PatternStats[];
    mediumsFound: PatternStats[];
    topCombos: Array<{
        style: string;
        size: string;
        medium: string;
        count: number;
        avgWvs: number;
    }>;
}

// ============================================
// Pattern Definitions
// ============================================

const STYLE_PATTERNS: Record<string, RegExp> = {
    abstract: /\b(abstract|abstraction|non-?representational)\b/i,
    impressionist: /\b(impressionist|impressionism|impressionistic)\b/i,
    modern: /\b(modern|contemporary|modernist)\b/i,
    contemporary: /\b(contemporary)\b/i,
    minimalist: /\b(minimalist|minimal|minimalism)\b/i,
    expressionist: /\b(expressionist|expressionism|expressive)\b/i,
    'pop art': /\b(pop art|pop-art|popart)\b/i,
    realism: /\b(realism|realistic|realist|hyper-?realism)\b/i,
    surrealist: /\b(surreal|surrealism|surrealist)\b/i,
    'folk art': /\b(folk art|folk-art|folkart|naive art)\b/i,
    naive: /\b(naive|naif|primitive)\b/i,
    impasto: /\b(impasto|thick paint|heavy texture)\b/i,
    'palette knife': /\b(palette knife|palette-knife|knife painting)\b/i,
    photorealism: /\b(photo-?realism|photorealistic|hyperrealism)\b/i,
    cubist: /\b(cubist|cubism|geometric)\b/i,
    'art deco': /\b(art deco|art-deco|artdeco)\b/i,
    vintage: /\b(vintage|retro|antique|mid-?century)\b/i,
    'street art': /\b(street art|graffiti|urban art)\b/i,
    botanical: /\b(botanical|floral|flowers?|garden)\b/i,
    coastal: /\b(coastal|beach|ocean|sea|nautical)\b/i,
};

const MEDIUM_PATTERNS: Record<string, RegExp> = {
    oil: /\b(oil paint|oil on|oils on)\b/i,
    acrylic: /\b(acrylic|acrylics)\b/i,
    watercolor: /\b(watercolor|watercolour|aquarelle)\b/i,
    'mixed media': /\b(mixed media|mixed-media|multimedia)\b/i,
    pastel: /\b(pastel|pastels|soft pastel|oil pastel)\b/i,
    gouache: /\b(gouache)\b/i,
    encaustic: /\b(encaustic|wax painting)\b/i,
    tempera: /\b(tempera|egg tempera)\b/i,
    ink: /\b(ink|india ink|sumi)\b/i,
    charcoal: /\b(charcoal)\b/i,
    graphite: /\b(graphite|pencil|graphite pencil)\b/i,
    'spray paint': /\b(spray paint|spraypaint|aerosol)\b/i,
};

const SUBJECT_PATTERNS: Record<string, RegExp> = {
    landscape: /\b(landscape|scenery|vista|countryside|mountain|valley)\b/i,
    portrait: /\b(portrait|portraiture|face|figure)\b/i,
    'still life': /\b(still life|still-life|stilllife)\b/i,
    seascape: /\b(seascape|ocean|sea|beach|coastal|waves)\b/i,
    cityscape: /\b(cityscape|city|urban|skyline|street scene)\b/i,
    animal: /\b(animal|wildlife|dog|cat|horse|bird)\b/i,
    floral: /\b(floral|flower|flowers|botanical|rose|tulip)\b/i,
    figurative: /\b(figurative|figure|nude|body|human)\b/i,
    nature: /\b(nature|tree|forest|leaf|leaves|garden)\b/i,
    'still-life': /\b(still life|vase|bowl|fruit|wine)\b/i,
};

const COLOR_PATTERNS: Record<string, RegExp> = {
    blue: /\b(blue|navy|cobalt|azure|cerulean|teal|turquoise)\b/i,
    red: /\b(red|crimson|scarlet|vermillion|burgundy)\b/i,
    green: /\b(green|emerald|forest|olive|sage|mint)\b/i,
    yellow: /\b(yellow|gold|golden|amber|ochre)\b/i,
    orange: /\b(orange|tangerine|coral|peach)\b/i,
    purple: /\b(purple|violet|lavender|plum|magenta)\b/i,
    pink: /\b(pink|rose|blush|fuchsia)\b/i,
    black: /\b(black|noir|ebony|charcoal)\b/i,
    white: /\b(white|cream|ivory|pearl)\b/i,
    brown: /\b(brown|tan|beige|sepia|umber|sienna)\b/i,
    neutral: /\b(neutral|gray|grey|muted|earth tone)\b/i,
};

// Size extraction regex
const SIZE_REGEX = /(\d{1,3})\s*[xX×]\s*(\d{1,3})/g;
const SIZE_WITH_UNITS = /(\d{1,3})\s*[xX×]\s*(\d{1,3})\s*("|in|inch|inches|cm)?/gi;

// ============================================
// Pattern Miner Class
// ============================================

export class PatternMiner {
    /**
     * Extract all patterns from a listing title
     */
    extractFromTitle(title: string): ExtractedPattern {
        return {
            styles: this.extractStyles(title),
            sizes: this.extractSizes(title),
            mediums: this.extractMediums(title),
            subjects: this.extractSubjects(title),
            colors: this.extractColors(title),
        };
    }

    /**
     * Extract styles from text
     */
    extractStyles(text: string): string[] {
        const found: string[] = [];
        for (const [style, pattern] of Object.entries(STYLE_PATTERNS)) {
            if (pattern.test(text)) {
                found.push(style);
            }
        }
        return found;
    }

    /**
     * Extract sizes from text
     */
    extractSizes(text: string): SizeInfo[] {
        const found: SizeInfo[] = [];
        const matches = text.matchAll(SIZE_REGEX);

        for (const match of matches) {
            const width = parseInt(match[1], 10);
            const height = parseInt(match[2], 10);

            // Sanity check: reasonable art sizes (2" - 100")
            if (width >= 2 && width <= 100 && height >= 2 && height <= 100) {
                let orientation: SizeInfo['orientation'];
                if (width > height) orientation = 'landscape';
                else if (height > width) orientation = 'portrait';
                else orientation = 'square';

                found.push({
                    raw: match[0],
                    width,
                    height,
                    cluster: `${width}x${height}`,
                    orientation,
                });
            }
        }

        return found;
    }

    /**
     * Extract mediums from text
     */
    extractMediums(text: string): string[] {
        const found: string[] = [];
        for (const [medium, pattern] of Object.entries(MEDIUM_PATTERNS)) {
            if (pattern.test(text)) {
                found.push(medium);
            }
        }
        return found;
    }

    /**
     * Extract subjects from text
     */
    extractSubjects(text: string): string[] {
        const found: string[] = [];
        for (const [subject, pattern] of Object.entries(SUBJECT_PATTERNS)) {
            if (pattern.test(text)) {
                found.push(subject);
            }
        }
        return found;
    }

    /**
     * Extract colors from text
     */
    extractColors(text: string): string[] {
        const found: string[] = [];
        for (const [color, pattern] of Object.entries(COLOR_PATTERNS)) {
            if (pattern.test(text)) {
                found.push(color);
            }
        }
        return found;
    }

    /**
     * Process all active listings and extract patterns
     */
    async processAllListings(supabase: SupabaseClient): Promise<MiningReport> {
        console.log('PatternMiner: Processing all active listings...');

        const { data: listings, error } = await supabase
            .from('active_listings')
            .select('id, title, current_price, watcher_count, demand_score')
            .eq('is_active', true);

        if (error || !listings) {
            console.error('PatternMiner: Error fetching listings:', error);
            return this.emptyReport();
        }

        // Aggregate stats
        const styleStats = new Map<string, { count: number; totalWvs: number; totalPrice: number }>();
        const sizeStats = new Map<string, { count: number; totalWvs: number; totalPrice: number }>();
        const mediumStats = new Map<string, { count: number; totalWvs: number; totalPrice: number }>();
        const comboStats = new Map<string, { style: string; size: string; medium: string; count: number; totalWvs: number }>();

        for (const listing of listings) {
            const patterns = this.extractFromTitle(listing.title);
            const wvs = listing.demand_score || 0;
            const price = listing.current_price || 0;

            // Update style stats
            for (const style of patterns.styles) {
                const existing = styleStats.get(style) || { count: 0, totalWvs: 0, totalPrice: 0 };
                styleStats.set(style, {
                    count: existing.count + 1,
                    totalWvs: existing.totalWvs + wvs,
                    totalPrice: existing.totalPrice + price,
                });

                // Store in junction table
                await this.linkStyleToListing(supabase, listing.id, style);
            }

            // Update size stats
            for (const size of patterns.sizes) {
                const existing = sizeStats.get(size.cluster) || { count: 0, totalWvs: 0, totalPrice: 0 };
                sizeStats.set(size.cluster, {
                    count: existing.count + 1,
                    totalWvs: existing.totalWvs + wvs,
                    totalPrice: existing.totalPrice + price,
                });

                // Update listing with parsed size
                await supabase
                    .from('active_listings')
                    .update({
                        width_in: size.width,
                        height_in: size.height,
                        orientation: size.orientation,
                    })
                    .eq('id', listing.id);
            }

            // Update medium stats
            for (const medium of patterns.mediums) {
                const existing = mediumStats.get(medium) || { count: 0, totalWvs: 0, totalPrice: 0 };
                mediumStats.set(medium, {
                    count: existing.count + 1,
                    totalWvs: existing.totalWvs + wvs,
                    totalPrice: existing.totalPrice + price,
                });

                // Update listing with material
                await supabase
                    .from('active_listings')
                    .update({ material: medium })
                    .eq('id', listing.id);
            }

            // Track combos (style + size + medium)
            if (patterns.styles.length > 0 && patterns.sizes.length > 0) {
                const style = patterns.styles[0];
                const size = patterns.sizes[0].cluster;
                const medium = patterns.mediums[0] || 'unknown';
                const comboKey = `${style}|${size}|${medium}`;

                const existing = comboStats.get(comboKey) || { style, size, medium, count: 0, totalWvs: 0 };
                comboStats.set(comboKey, {
                    ...existing,
                    count: existing.count + 1,
                    totalWvs: existing.totalWvs + wvs,
                });
            }
        }

        // Convert to sorted arrays
        const stylesFound = this.statsToArray(styleStats);
        const sizesFound = this.statsToArray(sizeStats);
        const mediumsFound = this.statsToArray(mediumStats);

        const topCombos = Array.from(comboStats.values())
            .map((c) => ({
                ...c,
                avgWvs: c.count > 0 ? c.totalWvs / c.count : 0,
            }))
            .sort((a, b) => b.avgWvs - a.avgWvs)
            .slice(0, 10);

        // Update database tables with stats
        await this.updateStylesTable(supabase, styleStats);
        await this.updateSizesTable(supabase, sizeStats);
        await this.updateMediumsTable(supabase, mediumStats);

        console.log(`PatternMiner: Processed ${listings.length} listings`);
        console.log(`  - Found ${stylesFound.length} styles`);
        console.log(`  - Found ${sizesFound.length} sizes`);
        console.log(`  - Found ${mediumsFound.length} mediums`);

        return {
            generatedAt: new Date().toISOString(),
            listingsProcessed: listings.length,
            stylesFound,
            sizesFound,
            mediumsFound,
            topCombos,
        };
    }

    /**
     * Link a style to a listing via junction table
     */
    private async linkStyleToListing(supabase: SupabaseClient, listingId: string, styleTerm: string): Promise<void> {
        try {
            // Get or create style
            let { data: style } = await supabase
                .from('styles')
                .select('id')
                .eq('style_term', styleTerm)
                .single();

            if (!style) {
                const { data: newStyle } = await supabase
                    .from('styles')
                    .insert({ style_term: styleTerm })
                    .select('id')
                    .single();
                style = newStyle;
            }

            if (style) {
                await supabase
                    .from('listing_styles')
                    .upsert(
                        { listing_id: listingId, style_id: style.id },
                        { onConflict: 'listing_id,style_id' }
                    );
            }
        } catch (err) {
            // Ignore duplicate errors
        }
    }

    /**
     * Update styles table with aggregated stats
     */
    private async updateStylesTable(
        supabase: SupabaseClient,
        stats: Map<string, { count: number; totalWvs: number; totalPrice: number }>
    ): Promise<void> {
        for (const [term, data] of stats) {
            const avgWvs = data.count > 0 ? data.totalWvs / data.count : 0;
            const demandScore = Math.min(avgWvs, 100);

            await supabase
                .from('styles')
                .upsert(
                    {
                        style_term: term,
                        avg_wvs: avgWvs,
                        demand_score: demandScore,
                        listing_count: data.count,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'style_term' }
                );
        }
    }

    /**
     * Update sizes table with aggregated stats
     */
    private async updateSizesTable(
        supabase: SupabaseClient,
        stats: Map<string, { count: number; totalWvs: number; totalPrice: number }>
    ): Promise<void> {
        for (const [cluster, data] of stats) {
            const avgWvs = data.count > 0 ? data.totalWvs / data.count : 0;
            const avgPrice = data.count > 0 ? data.totalPrice / data.count : 0;
            const demandScore = Math.min(avgWvs, 100);

            // Parse cluster to get dimensions
            const match = cluster.match(/(\d+)x(\d+)/);
            const width = match ? parseInt(match[1], 10) : null;
            const height = match ? parseInt(match[2], 10) : null;

            await supabase
                .from('sizes')
                .upsert(
                    {
                        size_cluster: cluster,
                        width_inches: width,
                        height_inches: height,
                        avg_wvs: avgWvs,
                        avg_price: avgPrice,
                        demand_score: demandScore,
                        listing_count: data.count,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'size_cluster' }
                );
        }
    }

    /**
     * Update mediums table with aggregated stats
     */
    private async updateMediumsTable(
        supabase: SupabaseClient,
        stats: Map<string, { count: number; totalWvs: number; totalPrice: number }>
    ): Promise<void> {
        for (const [name, data] of stats) {
            const avgWvs = data.count > 0 ? data.totalWvs / data.count : 0;
            const avgPrice = data.count > 0 ? data.totalPrice / data.count : 0;
            const demandScore = Math.min(avgWvs, 100);

            await supabase
                .from('mediums')
                .upsert(
                    {
                        medium_name: name,
                        avg_wvs: avgWvs,
                        avg_price: avgPrice,
                        demand_score: demandScore,
                        listing_count: data.count,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'medium_name' }
                );
        }
    }

    /**
     * Convert stats map to sorted array
     */
    private statsToArray(
        stats: Map<string, { count: number; totalWvs: number; totalPrice: number }>
    ): PatternStats[] {
        return Array.from(stats.entries())
            .map(([term, data]) => ({
                term,
                count: data.count,
                avgWvs: data.count > 0 ? Math.round((data.totalWvs / data.count) * 100) / 100 : 0,
                avgPrice: data.count > 0 ? Math.round((data.totalPrice / data.count) * 100) / 100 : 0,
                trend: 'stable' as const, // TODO: Calculate from historical data
            }))
            .sort((a, b) => b.avgWvs - a.avgWvs);
    }

    /**
     * Empty report for errors
     */
    private emptyReport(): MiningReport {
        return {
            generatedAt: new Date().toISOString(),
            listingsProcessed: 0,
            stylesFound: [],
            sizesFound: [],
            mediumsFound: [],
            topCombos: [],
        };
    }

    /**
     * Get top styles by demand
     */
    async getTopStyles(supabase: SupabaseClient, limit = 10): Promise<PatternStats[]> {
        const { data, error } = await supabase
            .from('styles')
            .select('style_term, listing_count, avg_wvs, demand_score')
            .order('avg_wvs', { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return data.map((row) => ({
            term: row.style_term,
            count: row.listing_count || 0,
            avgWvs: row.avg_wvs || 0,
            avgPrice: 0,
            trend: 'stable' as const,
        }));
    }

    /**
     * Get top sizes by demand
     */
    async getTopSizes(supabase: SupabaseClient, limit = 10): Promise<PatternStats[]> {
        const { data, error } = await supabase
            .from('sizes')
            .select('size_cluster, listing_count, avg_wvs, avg_price')
            .order('avg_wvs', { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return data.map((row) => ({
            term: row.size_cluster,
            count: row.listing_count || 0,
            avgWvs: row.avg_wvs || 0,
            avgPrice: row.avg_price || 0,
            trend: 'stable' as const,
        }));
    }
}

// ============================================
// Singleton Instance
// ============================================

let patternMinerInstance: PatternMiner | null = null;

export function getPatternMiner(): PatternMiner {
    if (!patternMinerInstance) {
        patternMinerInstance = new PatternMiner();
    }
    return patternMinerInstance;
}

// ============================================
// Quick helper for single extraction
// ============================================

export function extractPatterns(title: string): ExtractedPattern {
    return getPatternMiner().extractFromTitle(title);
}
