import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'playwright';

// Lazy init stealth plugin to avoid build side-effects
let stealthInitialized = false;

const initStealth = () => {
    if (!stealthInitialized) {
        chromium.use(stealthPlugin());
        stealthInitialized = true;
    }
};

export interface ScrapedListing {
    title: string;
    soldPrice: number;
    shippingPrice: number;
    currency: string;
    isAuction: boolean;
    bidCount: number;
    watcherCount: number;
    soldDate: string;
    itemUrl: string;
    imageUrl?: string;
}

export class EbayPulseScraper {
    /**
     * Scrape sold listings using Playwright (Robust Mode with Stealth)
     */
    static async scrapeSoldListings(
        keyword: string,
        maxPages: number = 2
    ): Promise<ScrapedListing[]> {
        console.log(`[eBay Pulse] Starting Playwright scrape for: "${keyword}"`);

        initStealth();

        let browser: Browser | null = null;
        const allListings: ScrapedListing[] = [];

        try {
            browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--window-size=1280,800',
                ]
            });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport: { width: 1280, height: 800 },
                locale: 'en-US',
                timezoneId: 'America/New_York',
                extraHTTPHeaders: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1'
                }
            });
            const page = await context.newPage();

            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(keyword)}&_sacat=550&LH_Sold=1&LH_Complete=1&_pgn=${pageNum}`;
                console.log(`[eBay Pulse] Navigating to page ${pageNum}...`);

                try {
                    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

                    // Wait for either selector
                    try {
                        await page.waitForSelector('.s-item, .s-card', { timeout: 10000 });
                    } catch (e) {
                        console.log('Timeout waiting for selector, checking for results...');
                        if (await page.isVisible('.srp-save-null-search__heading')) {
                            console.log('No results found for this keyword.');
                            break;
                        }
                    }

                    // Extract data from the page context
                    const pageListings = (await page.$$eval('.s-item, .s-card', (items) => {
                        return items.map(item => {
                            // Helper functions inside map to avoid closure issues

                            // Strategy 1: Classic .s-item
                            if (item.classList.contains('s-item')) {
                                const titleEl = item.querySelector('.s-item__title');
                                const title = titleEl?.textContent?.replace(/Shop on eBay/gi, '').trim() || '';
                                if (!title || title === 'Shop on eBay') return null;

                                const priceText = item.querySelector('.s-item__price')?.textContent || '';
                                const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
                                const soldPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

                                const shippingText = item.querySelector('.s-item__shipping')?.textContent || '';
                                const shipMatch = shippingText.match(/\+\s*\$?([\d,]+\.?\d*)/);
                                const shippingPrice = shipMatch ? parseFloat(shipMatch[1].replace(/,/g, '')) : 0;

                                const bidText = item.querySelector('.s-item__bids')?.textContent || '';
                                const bidMatch = bidText.match(/(\d+)\s+bids?/);
                                const bidCount = bidMatch ? parseInt(bidMatch[1]) : 0;
                                const isAuction = bidText.toLowerCase().includes('bid');

                                const dateText = item.querySelector('.s-item__caption--signal')?.textContent || '';
                                let soldDate = new Date().toISOString().split('T')[0];
                                const dateMatch = dateText.match(/Sold\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
                                if (dateMatch) soldDate = new Date(dateMatch[1]).toISOString().split('T')[0];

                                const linkEl = item.querySelector('a.s-item__link');
                                const imageEl = item.closest('.s-item')?.querySelector('img');

                                return {
                                    title,
                                    soldPrice,
                                    shippingPrice,
                                    currency: 'USD',
                                    isAuction,
                                    bidCount,
                                    watcherCount: 0,
                                    soldDate,
                                    itemUrl: linkEl?.getAttribute('href')?.split('?')[0] || '',
                                    imageUrl: imageEl?.getAttribute('src') || undefined
                                };
                            }

                            // Strategy 2: New .s-card
                            if (item.classList.contains('s-card') || item.querySelector('.s-card__title')) {
                                const titleEl = item.querySelector('.s-card__title');
                                const title = titleEl?.textContent?.replace(/Shop on eBay/gi, '').trim() || '';
                                if (!title) return null;

                                const priceText = item.querySelector('.s-card__price')?.textContent || '';
                                const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
                                const soldPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

                                const shippingText = item.querySelector('.s-card__shipping')?.textContent || '';
                                const shipMatch = shippingText.match(/\+\s*\$?([\d,]+\.?\d*)/);
                                const shippingPrice = shipMatch ? parseFloat(shipMatch[1].replace(/,/g, '')) : 0;

                                const infoEl = item.querySelector('.s-card__info');
                                const detailsEl = item.querySelector('.s-card__details');
                                const bidsEl = item.querySelector('.s-card__bids');

                                const infoText = (infoEl?.textContent || '') + (detailsEl?.textContent || '') + (bidsEl?.textContent || '');
                                const bidMatch = infoText.match(/(\d+)\s+bids?/);
                                const bidCount = bidMatch ? parseInt(bidMatch[1]) : 0;
                                const isAuction = infoText.toLowerCase().includes('bid');

                                const captionEl = item.querySelector('.s-card__caption');
                                const styledEl = item.querySelector('.su-styled-text');
                                const captionText = (captionEl?.textContent || '') + (styledEl?.textContent || '');

                                let soldDate = new Date().toISOString().split('T')[0];
                                const dateMatch = captionText.match(/Sold\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
                                if (dateMatch) soldDate = new Date(dateMatch[1]).toISOString().split('T')[0];

                                const linkEl = item.querySelector('.s-card__link');
                                const imageEl = item.querySelector('img');

                                return {
                                    title,
                                    soldPrice,
                                    shippingPrice,
                                    currency: 'USD',
                                    isAuction,
                                    bidCount,
                                    watcherCount: 0,
                                    soldDate,
                                    itemUrl: linkEl?.getAttribute('href')?.split('?')[0] || '',
                                    imageUrl: imageEl?.getAttribute('src') || undefined
                                };
                            }

                            return null;
                        }).filter(item => item !== null && item.soldPrice > 0) as any[]; // Type assertion for browser context
                    })) as unknown as ScrapedListing[];

                    console.log(`[eBay Pulse] Found ${pageListings.length} items on page ${pageNum}`);
                    allListings.push(...pageListings);

                } catch (pageError) {
                    console.error(`[eBay Pulse] Error on page ${pageNum}:`, pageError);
                }
            }

        } catch (error) {
            console.error('[eBay Pulse] Scraper critical error:', error);
        } finally {
            if (browser) await browser.close();
        }

        return allListings;
    }
}
