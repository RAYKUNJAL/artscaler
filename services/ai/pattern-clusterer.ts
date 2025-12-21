import { createServerClient } from '@/lib/supabase/server';

export interface PatternCluster {
    subjectType: string;
    sizeBucket: string;
    style: string;
    avgDemandScore: number;
    listingCount: number;
    topColors: string[];
}

export class DemandPatternClusterer {
    /**
     * Clusters active listings into high-demand patterns
     */
    async identifyClusters(): Promise<PatternCluster[]> {
        const supabase = await createServerClient();

        // 1. Fetch active listings with their patterns and demand scores
        const { data, error } = await supabase
            .from('active_listings')
            .select(`
                demand_score,
                width_in,
                height_in,
                art_patterns (
                    subject_type,
                    style,
                    dominant_colors
                )
            `)
            .eq('is_active', true)
            .gt('demand_score', 50); // Only cluster high-demand items

        if (error || !data) {
            console.error('❌ Error fetching listings for clustering:', error);
            return [];
        }

        const clusters: Record<string, PatternCluster> = {};

        for (const item of data) {
            const pattern = item.art_patterns?.[0];
            if (!pattern) continue;

            // Define size bucket
            const area = (item.width_in || 0) * (item.height_in || 0);
            let sizeBucket = 'Medium';
            if (area < 200) sizeBucket = 'Small';
            else if (area > 800) sizeBucket = 'Large';

            // Create unique cluster key
            const key = `${pattern.subject_type}|${sizeBucket}|${pattern.style}`;

            if (!clusters[key]) {
                clusters[key] = {
                    subjectType: pattern.subject_type,
                    sizeBucket,
                    style: pattern.style,
                    avgDemandScore: 0,
                    listingCount: 0,
                    topColors: []
                };
            }

            const c = clusters[key];
            c.avgDemandScore = (c.avgDemandScore * c.listingCount + item.demand_score) / (c.listingCount + 1);
            c.listingCount += 1;
            c.topColors = Array.from(new Set([...c.topColors, ...(pattern.dominant_colors || [])])).slice(0, 5);
        }

        // Return only clusters with significant data
        return Object.values(clusters)
            .filter(c => c.listingCount >= 2)
            .sort((a, b) => b.avgDemandScore - a.avgDemandScore);
    }
}
