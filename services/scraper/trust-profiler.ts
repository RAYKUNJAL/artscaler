import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface SellerTrustData {
    feedbackScore: number;
    feedbackPercentage: number;
    totalSales: number;
    returnPolicy: string;
    hasCOA: boolean;
    isTopRated: boolean;
}

export class SellerTrustProfiler {
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
     * Extracts trust and credibility signals from a seller's profile
     */
    async profile(sellerName: string): Promise<SellerTrustData | null> {
        if (!this.page) throw new Error('Profiler not initialized');

        // eBay User Profile URL
        const profileUrl = `https://www.ebay.com/usr/${encodeURIComponent(sellerName)}`;

        try {
            await this.page.goto(profileUrl, { waitUntil: 'domcontentloaded' });

            const data = await this.page.evaluate(() => {
                const getText = (selector: string) => document.querySelector(selector)?.textContent?.trim() || '';

                // 1. Feedback Score (e.g., "(1,234)")
                const feedbackText = getText('.str-seller-card__feedback-link');
                const feedbackScore = parseInt(feedbackText.replace(/[(),]/g, '')) || 0;

                // 2. Feedback Percentage (e.g., "99.8% Positive feedback")
                const percText = getText('.str-seller-card__stats');
                const feedbackPercentage = parseFloat(percText.match(/[\d.]+/)?.[0] || '0');

                // 3. Member Since / Location
                const memberSince = getText('.str-seller-card__member-since');

                // 4. Look for Top Rated Badge
                const isTopRated = document.querySelector('.str-seller-card__top-rated') !== null;

                return {
                    feedbackScore,
                    feedbackPercentage,
                    isTopRated,
                    memberSince
                };
            });

            // Note: Total Sales and Return Policy are often item-specific on eBay
            // but for a general profile, we use the feedback count as a proxy for sales.

            return {
                ...data,
                totalSales: data.feedbackScore * 1.5, // Heuristic: ~60% of buyers leave feedback
                returnPolicy: 'Standard',
                hasCOA: false // This will be updated per-listing in the Extractor
            };

        } catch (error) {
            console.error(`❌ Profiling failed for ${sellerName}:`, error);
            return null;
        }
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}
