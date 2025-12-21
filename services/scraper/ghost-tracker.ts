import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { createServerClient } from '@/lib/supabase/server';

export class GhostTracker {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    async initialize() {
        this.browser = await chromium.launch({ headless: true });
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        this.page = await this.context.newPage();
    }

    /**
     * Checks if tracked active listings have sold
     */
    async trackConversions() {
        const supabase = await createServerClient();

        // 1. Get listings that were active in our DB
        const { data: listings } = await supabase
            .from('active_listings')
            .select('id, listing_id, item_url, first_seen_at')
            .eq('is_active', true)
            .limit(20); // Batch limit

        if (!listings) return;

        for (const item of listings) {
            console.log(`🕵️ Checking ghost status for: ${item.listing_id}`);

            try {
                await this.page?.goto(item.item_url, { waitUntil: 'domcontentloaded' });

                const status = await this.page?.evaluate(() => {
                    const text = document.body.innerText.toLowerCase();
                    const isSold = text.includes('this item has been sold') || text.includes('sold for');
                    const isEnded = text.includes('this listing has ended') || text.includes('ended:');
                    return { isSold, isEnded };
                });

                if (status?.isSold || status?.isEnded) {
                    const soldAt = new Date();
                    const firstSeen = new Date(item.first_seen_at);
                    const velocityHours = (soldAt.getTime() - firstSeen.getTime()) / (1000 * 60 * 60);

                    await supabase
                        .from('active_listings')
                        .update({
                            is_active: false,
                            sold_at: soldAt.toISOString(),
                            conversion_velocity_hours: velocityHours,
                            last_updated_at: soldAt.toISOString()
                        })
                        .eq('id', item.id);

                    console.log(`✅ Listing ${item.listing_id} labeled as SOLD. Velocity: ${velocityHours.toFixed(1)}h`);
                }
            } catch (error) {
                console.error(`Failed to check ghost status for ${item.listing_id}:`, error);
            }
        }
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}
