import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface SellerListing {
    listingId: string;
    url: string;
    title: string;
}

export class SellerPortfolioScanner {
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
     * Scans a specific seller's eBay store for active listing URLs
     */
    async scanStore(sellerName: string): Promise<SellerListing[]> {
        if (!this.page) throw new Error('Scanner not initialized');

        // eBay User Storefront URL
        const storeUrl = `https://www.ebay.com/sch/i.html?_ssn=${encodeURIComponent(sellerName)}&_ipg=240`;

        console.log(`🔍 Scanning store for seller: ${sellerName}`);
        await this.page.goto(storeUrl, { waitUntil: 'domcontentloaded' });

        // Basic check if seller exists
        const noResults = await this.page.$('.srp-save-null-search');
        if (noResults) {
            console.log(`⚠️ No active listings found for seller: ${sellerName}`);
            return [];
        }

        const listings: SellerListing[] = await this.page.$$eval('.s-item', (items) => {
            return items.map(item => {
                const link = item.querySelector('.s-item__link') as HTMLAnchorElement;
                const title = item.querySelector('.s-item__title')?.textContent || '';

                // Extract listing ID from URL (e.g., /itm/12345678)
                const href = link?.href || '';
                const itmMatch = href.match(/\/itm\/(\d+)/);
                const listingId = itmMatch ? itmMatch[1] : '';

                if (!listingId || href.includes('ir.ebaystatic.com')) return null;

                return {
                    listingId,
                    url: href.split('?')[0], // Clean URL
                    title: title.replace('New Listing', '').trim()
                };
            }).filter(i => i !== null) as SellerListing[];
        });

        console.log(`✅ Found ${listings.length} active listings for ${sellerName}`);
        return listings;
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}
