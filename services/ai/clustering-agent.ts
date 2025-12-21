/**
 * ClusteringAgent - Topic Discovery
 * 
 * Groups cleaned listings into topics (clusters) based on keywords and patterns.
 * For the initial version, we use the search_keyword as the primary clustering dimension,
 * enriched by parsing.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export class ClusteringAgent {
    /**
     * Cluster listings into topics
     */
    async clusterListings(supabase: SupabaseClient, runId: string, userId: string): Promise<number> {
        try {
            // Fetch clean listings for this run
            const { data: listings, error: fetchError } = await supabase
                .from('sold_listings_clean')
                .select('id, search_keyword, title')
                .eq('run_id', runId);

            if (fetchError || !listings || listings.length === 0) {
                console.error('ClusteringAgent: No listings to cluster');
                return 0;
            }

            console.log(`ClusteringAgent: Clustering ${listings.length} listings...`);

            // 1. Group by search_keyword (simple clustering)
            const topicGroups: Record<string, string[]> = {};
            for (const listing of listings) {
                const keyword = listing.search_keyword.toLowerCase().trim();
                if (!topicGroups[keyword]) {
                    topicGroups[keyword] = [];
                }
                topicGroups[keyword].push(listing.id);
            }

            let clustersCreated = 0;
            let membershipsCreated = 0;

            for (const [label, listingIds] of Object.entries(topicGroups)) {
                // 2. Discover or create topic cluster
                const topicSlug = label.replace(/\s+/g, '-');

                // Get or create topic
                let topicId: string;
                const { data: existingTopic } = await supabase
                    .from('topic_clusters')
                    .select('id')
                    .eq('topic_slug', topicSlug)
                    .single();

                if (existingTopic) {
                    topicId = existingTopic.id;
                } else {
                    const { data: newTopic, error: createError } = await supabase
                        .from('topic_clusters')
                        .insert({
                            topic_slug: topicSlug,
                            topic_label: label.charAt(0).toUpperCase() + label.slice(1),
                            run_id: runId
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('Error creating topic cluster:', createError);
                        continue;
                    }
                    topicId = newTopic.id;
                    clustersCreated++;
                }

                // 3. Create memberships
                const memberships = listingIds.map(listingId => ({
                    run_id: runId,
                    topic_id: topicId,
                    listing_id: listingId,
                    membership_score: 1.0 // Simple assignment
                }));

                const { error: memError } = await supabase
                    .from('topic_memberships')
                    .insert(memberships);

                if (memError) {
                    console.error('Error creating memberships:', memError);
                } else {
                    membershipsCreated += memberships.length;
                }
            }

            console.log(`ClusteringAgent: Created ${clustersCreated} new clusters and ${membershipsCreated} memberships`);
            return clustersCreated;
        } catch (error) {
            console.error('ClusteringAgent error:', error);
            return 0;
        }
    }
}

// Singleton instance
let clusteringInstance: ClusteringAgent | null = null;

export function getClusteringAgent(): ClusteringAgent {
    if (!clusteringInstance) {
        clusteringInstance = new ClusteringAgent();
    }
    return clusteringInstance;
}
