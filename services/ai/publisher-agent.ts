/**
 * PublisherAgent - Opportunity Publisher
 * 
 * Publishes opportunities to the opportunity_feed table with strict guardrails:
 * - Each opportunity must have >= 5 evidence URLs (sold comps)
 * - Confidence must be >= 0.6
 * - Must have valid pricing and keyword data
 * 
 * This ensures users only see high-quality, data-backed opportunities.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { EmailService } from '../email/email-service';

export interface OpportunityToPublish {
    user_id: string;
    topic_id: string;
    topic_label: string;
    wvs_score: number;
    velocity_score: number;
    recommended_sizes: string[];
    recommended_mediums: string[];
    recommended_price_band: {
        min: number;
        max: number;
        median: number;
    };
    format_recommendation: string;
    keyword_stack: string[];
    title_variants: string[];
    evidence_urls: string[];
    confidence: number;
}

export class PublisherAgent {
    /**
     * Publish opportunities for a user
     */
    async publishOpportunities(
        supabase: SupabaseClient,
        runId: string,
        userId: string,
        date: string,
        topN: number = 10
    ): Promise<number> {
        try {
            // Get top scoring topics for this user's keywords
            const opportunities = await this.getTopOpportunities(supabase, userId, date, topN);

            if (opportunities.length === 0) {
                console.log('PublisherAgent: No opportunities to publish');
                return 0;
            }

            console.log(`PublisherAgent: Publishing ${opportunities.length} opportunities...`);

            // Validate and publish each opportunity
            const validOpportunities: any[] = [];

            for (let i = 0; i < opportunities.length; i++) {
                const opp = opportunities[i];

                // Apply guardrails
                if (!this.validateOpportunity(opp)) {
                    console.log(`PublisherAgent: Skipping opportunity ${opp.topic_label} - failed validation`);
                    continue;
                }

                validOpportunities.push({
                    run_id: runId,
                    user_id: userId,
                    date,
                    rank: i + 1,
                    topic_id: opp.topic_id,
                    topic_label: opp.topic_label,
                    wvs_score: opp.wvs_score,
                    velocity_score: opp.velocity_score,
                    recommended_sizes: opp.recommended_sizes,
                    recommended_mediums: opp.recommended_mediums,
                    recommended_price_band: opp.recommended_price_band,
                    format_recommendation: opp.format_recommendation,
                    keyword_stack: opp.keyword_stack,
                    title_variants: opp.title_variants,
                    evidence_urls: opp.evidence_urls,
                    confidence: opp.confidence,
                });
            }

            // Insert opportunities
            if (validOpportunities.length > 0) {
                const { error: insertError } = await supabase
                    .from('opportunity_feed')
                    .insert(validOpportunities);

                if (insertError) {
                    console.error('Error inserting opportunities:', insertError);
                    return 0;
                }

                // Send notifications to user
                await this.sendOpportunityNotifications(supabase, userId, validOpportunities.length, validOpportunities);
            }

            console.log(`PublisherAgent: Published ${validOpportunities.length} opportunities`);
            return validOpportunities.length;
        } catch (error) {
            console.error('PublisherAgent error:', error);
            return 0;
        }
    }

    /**
     * Get top opportunities for a user
     */
    private async getTopOpportunities(
        supabase: SupabaseClient,
        userId: string,
        date: string,
        topN: number
    ): Promise<OpportunityToPublish[]> {
        // Get user's keywords
        const { data: userKeywords, error: keywordsError } = await supabase
            .from('user_keywords')
            .select('keyword')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (keywordsError || !userKeywords || userKeywords.length === 0) {
            return [];
        }

        const keywords = userKeywords.map((k) => k.keyword);

        // Get topic scores that match user's keywords
        const { data: scores, error: scoresError } = await supabase
            .from('topic_scores_daily')
            .select(`
        topic_id,
        wvs_score,
        velocity_score,
        median_price,
        upper_quartile_price,
        auction_intensity,
        confidence,
        topic_clusters (
          topic_label
        )
      `)
            .eq('date', date)
            .gte('confidence', 0.6)
            .order('wvs_score', { ascending: false })
            .limit(topN * 2); // Get more than needed for filtering

        if (scoresError || !scores) {
            return [];
        }

        // Build opportunities
        const opportunities: OpportunityToPublish[] = [];

        for (const score of scores) {
            // Get listing template
            const template = await this.getListingTemplate(supabase, score.topic_id);

            if (!template) continue;

            // Get evidence URLs
            const evidenceUrls = await this.getEvidenceUrls(supabase, score.topic_id, userId);

            // topic_clusters is returned as array from join, get first element
            const topicCluster = Array.isArray(score.topic_clusters)
                ? score.topic_clusters[0]
                : score.topic_clusters;
            const topicLabel = topicCluster?.topic_label || 'Unknown';

            opportunities.push({
                user_id: userId,
                topic_id: score.topic_id,
                topic_label: topicLabel,
                wvs_score: score.wvs_score,
                velocity_score: score.velocity_score,
                recommended_sizes: template.recommended_sizes,
                recommended_mediums: template.recommended_mediums,
                recommended_price_band: {
                    min: Math.round(score.median_price * 0.8),
                    max: Math.round(score.upper_quartile_price * 1.1),
                    median: Math.round(score.median_price),
                },
                format_recommendation: this.determineFormat(score.auction_intensity),
                keyword_stack: template.keyword_stack,
                title_variants: template.title_variants,
                evidence_urls: evidenceUrls,
                confidence: score.confidence,
            });

            if (opportunities.length >= topN) break;
        }

        return opportunities;
    }

    /**
     * Get listing template for a topic
     */
    private async getListingTemplate(supabase: SupabaseClient, topicId: string): Promise<{
        keyword_stack: string[];
        title_variants: string[];
        recommended_sizes: string[];
        recommended_mediums: string[];
    } | null> {
        // Get top keywords
        const { data: keywords } = await supabase
            .from('keyword_metrics_daily')
            .select('keyword')
            .eq('topic_association', topicId)
            .order('price_lift', { ascending: false })
            .limit(10);

        // Get common attributes
        const { data: signals } = await supabase
            .from('topic_memberships')
            .select(`
        parsed_signals (
          size_bucket,
          medium
        )
      `)
            .eq('topic_id', topicId)
            .limit(50);

        if (!keywords || !signals) return null;

        // Extract sizes and mediums
        const sizeCounts: Record<string, number> = {};
        const mediumCounts: Record<string, number> = {};

        for (const s of signals) {
            const signal = (s as any).parsed_signals;
            if (signal) {
                if (signal.size_bucket) {
                    sizeCounts[signal.size_bucket] = (sizeCounts[signal.size_bucket] || 0) + 1;
                }
                if (signal.medium) {
                    mediumCounts[signal.medium] = (mediumCounts[signal.medium] || 0) + 1;
                }
            }
        }

        const sizes = Object.entries(sizeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([size]) => size);

        const mediums = Object.entries(mediumCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([medium]) => medium);

        return {
            keyword_stack: keywords.map((k) => k.keyword),
            title_variants: [], // Would be generated by ListingGeneratorAgent
            recommended_sizes: sizes,
            recommended_mediums: mediums,
        };
    }

    /**
     * Get evidence URLs (sold comps) for a topic
     */
    private async getEvidenceUrls(supabase: SupabaseClient, topicId: string, userId: string): Promise<string[]> {
        const { data: memberships } = await supabase
            .from('topic_memberships')
            .select(`
        sold_listings_clean (
          item_url
        )
      `)
            .eq('topic_id', topicId)
            .limit(10);

        if (!memberships) return [];

        const urls = memberships
            .map((m: any) => m.sold_listings_clean?.item_url)
            .filter((url): url is string => !!url)
            .slice(0, 10);

        return urls;
    }

    /**
     * Validate opportunity before publishing
     */
    private validateOpportunity(opp: OpportunityToPublish): boolean {
        // Must have at least 5 evidence URLs
        if (opp.evidence_urls.length < 5) {
            console.log(`Validation failed: Only ${opp.evidence_urls.length} evidence URLs`);
            return false;
        }

        // Must have confidence >= 0.6
        if (opp.confidence < 0.6) {
            console.log(`Validation failed: Confidence ${opp.confidence} < 0.6`);
            return false;
        }

        // Must have valid price band
        if (!opp.recommended_price_band || opp.recommended_price_band.median <= 0) {
            console.log('Validation failed: Invalid price band');
            return false;
        }

        // Must have keywords
        if (opp.keyword_stack.length === 0) {
            console.log('Validation failed: No keywords');
            return false;
        }

        return true;
    }

    /**
     * Determine listing format
     */
    private determineFormat(auctionIntensity: number): string {
        if (auctionIntensity > 0.6) return 'auction';
        if (auctionIntensity < 0.3) return 'bin';
        return 'hybrid';
    }

    /**
     * Send notifications to user about new opportunities
     */
    private async sendOpportunityNotifications(supabase: SupabaseClient, userId: string, count: number, opportunities?: any[]): Promise<void> {
        try {
            // 1. Create in-app notification
            await supabase.from('user_notifications').insert({
                user_id: userId,
                type: 'opportunity_alert',
                title: 'New Opportunities Available',
                message: `${count} new art opportunities have been identified based on your keywords.`,
                action_url: '/opportunities',
            });

            // 2. Send email alert if there are hot opportunities (WVS > 4.5)
            const hotOpps = opportunities?.filter(o => o.wvs_score >= 4.5) || [];

            if (hotOpps.length > 0) {
                // Fetch user email
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('id, user_id (email)') // Adjust based on join or fetch separately
                    .eq('id', userId)
                    .single();

                // Fetch separately for safety
                const { data: { user } } = await supabase.auth.admin.getUserById(userId);

                if (user?.email) {
                    await EmailService.sendPulseAlert(
                        user.email,
                        hotOpps.slice(0, 3).map(o => ({
                            topic: o.topic_label,
                            wvs: o.wvs_score,
                            evidence: `${process.env.NEXT_PUBLIC_APP_URL}/opportunities`
                        }))
                    );
                }
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
}

// Singleton instance
let publisherInstance: PublisherAgent | null = null;

export function getPublisherAgent(): PublisherAgent {
    if (!publisherInstance) {
        publisherInstance = new PublisherAgent();
    }
    return publisherInstance;
}
