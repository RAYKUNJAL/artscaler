export interface SellerListing {
    listingId: string;
    url: string;
    title: string;
}

export class HeadlessScanner {
    /**
     * Scans a specific seller's eBay store using fetch (Vercel compatible)
     */
    static async scanStore(sellerName: string): Promise<SellerListing[]> {
        // Use the search URL with _ssn parameter for the seller
        const url = `https://www.ebay.com/sch/i.html?_ssn=${encodeURIComponent(sellerName)}&_ipg=60`;

        console.log(`📡 Headless scanning store: ${sellerName}`);

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });

            if (!response.ok) {
                console.error(`❌ Headless scan failed: ${response.status}`);
                return [];
            }

            const html = await response.text();

            // Extract listing containers using regex (as a fallback to a real parser)
            // eBay listings usually have class s-item__info
            const listings: SellerListing[] = [];

            // Regex to find all listing links and titles
            // <a class="s-item__link" href="https://www.ebay.com/itm/123456..."><div class="s-item__title">...</div></a>
            const itemRegex = /class="s-item__link"\s+href="(https:\/\/www\.ebay\.com\/itm\/(\d+)[^"]*)"/g;
            let match;

            while ((match = itemRegex.exec(html)) !== null) {
                const fullUrl = match[1].split('?')[0];
                const listingId = match[2];

                // Avoid duplicates
                if (!listings.find(l => l.listingId === listingId)) {
                    listings.push({
                        listingId,
                        url: fullUrl,
                        title: `Listing ${listingId}` // Title extraction is harder via regex, will be refined in extractor
                    });
                }
            }

            console.log(`✅ Headless scan found ${listings.length} listings for ${sellerName}`);
            return listings;
        } catch (e) {
            console.error('❌ Headless scan error:', e);
            return [];
        }
    }
}
