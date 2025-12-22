import { chromium, Browser, Page } from 'playwright';
import { supabase } from '@/lib/supabase/client';
import { PatternMiner } from '@/services/ai/pattern-miner';
import { getWVSAgent } from '@/services/ai/wvs-agent';

export interface ArtdemandListing {
    listingId: string;
    title: string;
    itemUrl: string;
    price: number;
    currency: string;
    watcherCount: number;
    bidCount: number;
    imageUrl: string;
    listingType: 'Auction' | 'FixedPrice';
    timeLeft?: string;
    category?: string;
}

export class ArtdemandScraper {
    private browser: Browser | null = null;
    private miner: PatternMiner;
    private wvsAgent = getWVSAgent();

    constructor() {
        this.miner = new PatternMiner();
    }

    async initialize() {
        if (!this.browser) {
            this.browser = await chromium.launch({ headless: true });
        }
    }

    async scrapeActive(keyword: string, maxPages: number = 2): Promise<ArtdemandListing[]> {
        if (!this.browser) await this.initialize();
        const context = await this.browser!.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();
        const allListings: ArtdemandListing[] = [];

        try {
            for (let p = 1; p <= maxPages; p++) {
                const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(keyword)}&_pgn=${p}&_ipg=60`;
                console.log(`📡 Scraping active listings: ${url}`);

                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

                // Wait for any listing items
                await page.waitForSelector('.s-item', { timeout: 10000 }).catch(() => { });

                const listings = await page.$$eval('.s-card, .s-item', (items) => {
                    return items.map(item => {
                        const titleEl = item.querySelector('.s-card__title, .s-item__title');
                        const title = titleEl?.textContent?.trim() || '';
                        if (!title || title.toLowerCase().includes('shop on ebay')) return null;

                        const linkEl = item.querySelector('.s-card__link, .s-item__link') as HTMLAnchorElement;
                        const url = linkEl?.href || '';
                        const idMatch = url.match(/\/itm\/(\d+)/);
                        const id = idMatch ? idMatch[1] : '';

                        const priceEl = item.querySelector('.s-card__price, .s-item__price');
                        const priceText = priceEl?.textContent || '0';
                        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

                        const imgEl = item.querySelector('.s-card__image-img, .s-item__image-img') as HTMLImageElement;
                        const imageUrl = imgEl?.src || '';

                        // Watcher count extraction
                        let watcherCount = 0;
                        const potentialWatcherElements = item.querySelectorAll('.s-card__attribute-row, .s-item__hotness, .s-item__watch-count');
                        potentialWatcherElements.forEach(el => {
                            const text = el.textContent || '';
                            const watchMatch = text.match(/(\d+)\+?\s+watch/i);
                            if (watchMatch) watcherCount = parseInt(watchMatch[1]);
                        });

                        const bidsText = item.querySelector('.s-item__bid-count, .s-card__bid-count')?.textContent || '';
                        const bidCount = parseInt(bidsText.match(/\d+/)?.[0] || '0');

                        const isAuction = item.querySelector('.s-item__bid-count, .s-card__bid-count') !== null || bidsText.includes('bid');

                        return {
                            listingId: id,
                            title,
                            itemUrl: url,
                            price,
                            currency: 'USD',
                            watcherCount,
                            bidCount,
                            imageUrl,
                            listingType: isAuction ? 'Auction' : 'FixedPrice'
                        };
                    }).filter(l => l !== null && l.listingId !== '');
                });

                allListings.push(...(listings as ArtdemandListing[]));

                if (p < maxPages) {
                    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
                }
            }
        } finally {
            await context.close();
        }

        return allListings;
    }

    async processAndSave(listings: ArtdemandListing[], userId: string) {
        console.log(`⚙️ Processing ${listings.length} listings with AI in batch mode...`);

        // 1. Prepare all listings for batch upsert
        const listingsToUpsert = listings.map(l => {
            const sizes = this.miner.extractSizes(l.title);
            const mediums = this.miner.extractMediums(l.title);

            return {
                listing_id: l.listingId,
                user_id: userId,
                title: l.title,
                item_url: l.itemUrl,
                current_price: l.price,
                watcher_count: l.watcherCount,
                bid_count: l.bidCount,
                listing_type: l.listingType,
                is_active: true,
                last_updated_at: new Date().toISOString(),
                width_in: sizes.length > 0 ? sizes[0].width : null,
                height_in: sizes.length > 0 ? sizes[0].height : null,
                material: mediums.length > 0 ? mediums[0] : null
            };
        });

        // 2. Batch Upsert into active_listings
        const { data: savedListings, error: batchError } = await supabase
            .from('active_listings')
            .upsert(listingsToUpsert, { onConflict: 'listing_id' })
            .select('id, title, listing_id');

        if (batchError) {
            console.error('Batch upsert error:', batchError);
            return;
        }

        console.log(`✓ Batch saved ${savedListings?.length} listings`);

        // 3. Extract and Map Styles in bulk
        const styleJunctions: any[] = [];
        const allPossibleStyles = new Set<string>();

        listings.forEach(l => {
            const styles = this.miner.extractStyles(l.title);
            styles.forEach(s => allPossibleStyles.add(s));
        });

        if (allPossibleStyles.size > 0) {
            // Get all existing styles to map names to IDs
            const { data: styleMap } = await supabase
                .from('styles')
                .select('id, style_term')
                .in('style_term', Array.from(allPossibleStyles));

            if (styleMap && styleMap.length > 0) {
                const nameToId = Object.fromEntries(styleMap.map(s => [s.style_term, s.id]));

                savedListings?.forEach(saved => {
                    // Re-extract styles for this specific title
                    const styles = this.miner.extractStyles(saved.title);
                    styles.forEach(styleTerm => {
                        const styleId = nameToId[styleTerm];
                        if (styleId) {
                            styleJunctions.push({
                                listing_id: saved.id,
                                style_id: styleId,
                                confidence: 1.0
                            });
                        }
                    });
                });

                if (styleJunctions.length > 0) {
                    await supabase
                        .from('listing_styles')
                        .upsert(styleJunctions, { onConflict: 'listing_id,style_id' });
                    console.log(`✓ Batch saved ${styleJunctions.length} style relations`);
                }
            }
        }

        // 4. Trigger WVS Calculation
        console.log('📊 Recalculating WVS scores...');
        await this.wvsAgent.processPipeline(userId);
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}

export const getArtdemandScraper = () => new ArtdemandScraper();
