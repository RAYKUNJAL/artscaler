import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface RawListingData {
    listingId: string;
    title: string;
    category: string;
    listingType: 'Auction' | 'FixedPrice';
    currentPrice: number;
    startingPrice?: number;
    buyItNowPrice?: number;
    currency: string;
    bidCount: number;
    watcherCount: number;
    timeRemaining: string;
    endDate?: string;
    isWatcherHidden: boolean;
}

export class ListingDataExtractor {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    async initialize() {
        this.browser = await chromium.launch({ headless: true });
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 }
        });
        this.page = await this.context.newPage();
    }

    async extract(url: string): Promise<RawListingData | null> {
        if (!this.page) throw new Error('Extractor not initialized');

        try {
            await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for price element as a signal of load
            await this.page.waitForSelector('.x-price-primary', { timeout: 5000 });

            const data = await this.page.evaluate(() => {
                const getText = (selector: string) => document.querySelector(selector)?.textContent?.trim() || '';

                // 1. Price Extraction
                const priceText = getText('.x-price-primary');
                const priceMatch = priceText.match(/[\d.,]+/);
                const currentPrice = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;
                const currency = priceText.includes('$') ? 'USD' : 'GBP';

                // 2. Watcher Count (Often in social proof area)
                let watcherCount = 0;
                const socialProof = document.body.innerText;
                const watcherMatch = socialProof.match(/(\d+)\s+watchers?/i);
                if (watcherMatch) {
                    watcherCount = parseInt(watcherMatch[1]);
                } else {
                    // Fallback to specific elements if exists
                    const socialText = getText('.non-semantic-label'); // e.g., "10 watching"
                    const fallbackMatch = socialText.match(/(\d+)/);
                    if (fallbackMatch) watcherCount = parseInt(fallbackMatch[1]);
                }

                // 3. Bid Count
                const bidsText = getText('.x-bid-count');
                const bidCount = bidsText ? parseInt(bidsText.match(/\d+/)?.[0] || '0') : 0;

                // 4. Listing Type
                const isAuction = document.querySelector('.x-bid-count') !== null;

                // 5. Time Remaining
                const timeRemaining = getText('.x-time-left');

                // 6. Title
                const title = getText('.x-item-title__mainTitle');

                // 7. Category (from Breadcrumbs)
                const category = Array.from(document.querySelectorAll('.seo-breadcrumb-text'))
                    .map(el => el.textContent?.trim())
                    .join(' > ');

                return {
                    title,
                    category,
                    currentPrice,
                    currency,
                    bidCount,
                    watcherCount,
                    timeRemaining,
                    listingType: (isAuction ? 'Auction' : 'FixedPrice') as 'Auction' | 'FixedPrice',
                    isWatcherHidden: watcherCount === 0 && !socialProof.includes('watching')
                };
            });

            // Extract Listing ID from URL
            const itmMatch = url.match(/\/itm\/(\d+)/);

            return {
                listingId: itmMatch ? itmMatch[1] : 'unknown',
                ...data
            };

        } catch (error) {
            console.error(`❌ Extraction failed for ${url}:`, error);
            return null;
        }
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}
