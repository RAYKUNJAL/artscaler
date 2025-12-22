import { chromium, Browser, Page } from 'playwright';

export interface EbayListing {
    title: string;
    soldPrice: number | null;
    shippingPrice: number | null;
    currency: string;
    isAuction: boolean;
    bidCount: number;
    soldDate: Date | null;
    itemUrl: string;
    searchKeyword: string;
}

export interface ScrapeOptions {
    keyword: string;
    maxPages?: number;
    delayMs?: number;
}

let ebayScraperInstance: EbayScraper | null = null;

export function getEbayScraper(): EbayScraper {
    if (!ebayScraperInstance) {
        ebayScraperInstance = new EbayScraper();
    }
    return ebayScraperInstance;
}

export class EbayScraper {
    private browser: Browser | null = null;
    private context: any = null;
    private page: Page | null = null;

    async initialize() {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: true,
            });

            this.context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                viewport: { width: 1280, height: 800 }
            });

            this.page = await this.context.newPage();
        }
    }

    async scrape(options: ScrapeOptions): Promise<EbayListing[]> {
        const { keyword, maxPages = 5, delayMs = 2500 } = options;
        const listings: EbayListing[] = [];

        if (!this.page) {
            throw new Error('Scraper not initialized. Call initialize() first.');
        }

        try {
            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                console.log(`Scraping page ${pageNum} for keyword: ${keyword}`);

                const url = this.buildEbayUrl(keyword, pageNum);

                try {
                    // Navigate to the page - using domcontentloaded for speed and to avoid tracker hanging
                    console.log(`📡 Navigating to: ${url}`);
                    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });

                    // Wait for listings to load or some indication of the page content
                    await this.page.waitForSelector('.s-item, .s-card', { timeout: 10000 }).catch(() => {
                        console.log('⚠️  Warning: Timeout waiting for .s-item. Checking if page content exists...');
                    });

                    // Extract listing data
                    const pageListings = await this.extractListings(keyword);
                    listings.push(...pageListings);
                    console.log(`✓ Playwright found ${pageListings.length} listings on page ${pageNum}`);

                } catch (navError: any) {
                    console.warn(`⚠️  Playwright navigation failed: ${navError.message}. Attempting Headless Backup...`);
                    const fallbackListings = await this.scrapeFallback(keyword, pageNum);
                    listings.push(...fallbackListings);
                    console.log(`✓ Backup found ${fallbackListings.length} listings on page ${pageNum}`);
                }

                // Rate limiting delay
                if (pageNum < maxPages) {
                    const randomDelay = delayMs + Math.random() * 2000;
                    await this.delay(randomDelay);
                }
            }

            return listings;
        } catch (error) {
            console.error('Scraping error:', error);
            throw error;
        }
    }

    /**
     * Fallback scraping method using fetch + regex - very fast and harder to block 
     * but sometimes misses JS-rendered metadata.
     */
    private async scrapeFallback(keyword: string, page: number): Promise<EbayListing[]> {
        const url = this.buildEbayUrl(keyword, page);
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
                }
            });

            if (!response.ok) return [];
            const html = await response.text();

            // Extract titles and prices via regex for sold items
            const listings: EbayListing[] = [];
            const itemRegex = /class="s-item__link"\s+href="(https:\/\/www\.ebay\.com\/itm\/(\d+)[^"]*)".*?class="s-item__title".*?>(.*?)<\/span>.*?class="s-item__price".*?>(.*?)<\/span>/gs;

            let match;
            while ((match = itemRegex.exec(html)) !== null) {
                const itemUrl = match[1].split('?')[0];
                const title = match[3].replace(/<[^>]*>?/gm, '').trim();
                const priceText = match[4].replace(/<[^>]*>?/gm, '').replace(/[^0-9.]/g, '');
                const soldPrice = parseFloat(priceText);

                if (title && !isNaN(soldPrice)) {
                    listings.push({
                        title,
                        soldPrice,
                        shippingPrice: 0,
                        currency: 'USD',
                        isAuction: html.includes('bid'), // Rough guess
                        bidCount: 0,
                        soldDate: new Date(),
                        itemUrl,
                        searchKeyword: keyword
                    });
                }
            }
            return listings;
        } catch (e) {
            console.error('Fallback scraper error:', e);
            return [];
        }
    }

    private buildEbayUrl(keyword: string, page: number): string {
        const baseUrl = 'https://www.ebay.com/sch/i.html';
        const params = new URLSearchParams({
            '_nkw': keyword,
            '_sacat': '0',
            'LH_Sold': '1',
            'LH_Complete': '1',
            '_ipg': '240', // Items per page
            '_pgn': page.toString(),
            '_sop': '13', // Sort by recently sold
        });

        return `${baseUrl}?${params.toString()}`;
    }

    private async extractListings(keyword: string): Promise<EbayListing[]> {
        if (!this.page) return [];

        return await this.page.$$eval('.s-card, .s-item', (items, kw) => {
            return items.map((item) => {
                try {
                    // Title - check multiple potential classes
                    const titleEl = item.querySelector('.s-item__title, .s-card__title');
                    const title = titleEl?.textContent?.trim() || '';

                    // Skip if it's a header, ad, or empty
                    if (title.toLowerCase().includes('shop on ebay') || !title || title.toLowerCase().includes('results for')) {
                        return null;
                    }

                    // Price - sold price often has distinct classes or styling
                    const priceEl = item.querySelector('.s-item__price, .s-card__price');
                    const priceText = priceEl?.textContent?.trim() || '';
                    if (!priceText) return null;

                    const priceMatch = priceText.replace(/[^0-9.]/g, '');
                    const soldPrice = priceMatch ? parseFloat(priceMatch) : null;

                    // Shipping
                    const shippingEl = item.querySelector('.s-item__shipping, .s-card__shipping');
                    const shippingText = shippingEl?.textContent?.trim() || '';
                    const shippingMatch = shippingText.replace(/[^0-9.]/g, '');
                    const shippingPrice = shippingMatch ? parseFloat(shippingMatch) : 0;

                    // URL
                    const linkEl = item.querySelector('.s-item__link, .s-card__link') as HTMLAnchorElement;
                    const itemUrl = linkEl?.href || '';
                    if (!itemUrl) return null;

                    // Auction detection
                    const bidsText = item.querySelector('.s-item__bid-count, .s-card__bid-count, .s-item__bids')?.textContent?.toLowerCase() || '';
                    const isAuction = bidsText.includes('bid');

                    // Bid count
                    const bidMatch = bidsText.match(/(\d+)/);
                    const bidCount = bidMatch ? parseInt(bidMatch[1]) : 0;

                    // Sold date - usually in a tag or specific area for sold listings
                    const dateEl = item.querySelector('.s-item__title--tag, .s-item__caption, .s-item__sold-date');
                    const dateText = dateEl?.textContent?.trim() || '';
                    let soldDate: Date | null = null;

                    if (dateText.includes('Sold')) {
                        // Attempt to extract date from strings like "Sold Dec 20, 2024"
                        const datePart = dateText.replace(/Sold\s+/i, '');
                        const parsedDate = new Date(datePart);
                        if (!isNaN(parsedDate.getTime())) {
                            soldDate = parsedDate;
                        } else {
                            soldDate = new Date(); // Fallback to now
                        }
                    } else {
                        soldDate = new Date(); // Fallback if it's in the sold results
                    }

                    return {
                        title,
                        soldPrice,
                        shippingPrice,
                        currency: 'USD',
                        isAuction,
                        bidCount,
                        soldDate,
                        itemUrl,
                        searchKeyword: kw,
                    };
                } catch (err) {
                    return null;
                }
            }).filter((item): item is NonNullable<typeof item> => item !== null && item.soldPrice !== null);
        }, keyword);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async close() {
        if (this.page) {
            await this.page.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Singleton instance for reuse
let scraperInstance: EbayScraper | null = null;

export async function getScraperInstance(): Promise<EbayScraper> {
    if (!scraperInstance) {
        scraperInstance = new EbayScraper();
        await scraperInstance.initialize();
    }
    return scraperInstance;
}
