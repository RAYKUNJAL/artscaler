/**
 * eBay API Service
 * Uses official eBay Finding API to search sold listings
 * Much faster and more reliable than web scraping!
 */

export interface EbayApiListing {
    title: string;
    soldPrice: number | null;
    shippingPrice: number | null;
    currency: string;
    isAuction: boolean;
    bidCount: number;
    soldDate: Date | null;
    itemUrl: string;
    searchKeyword: string;
    imageUrl?: string;
    condition?: string;
    location?: string;
}

export interface EbayApiOptions {
    keyword: string;
    maxResults?: number;
}

export class EbayApiService {
    private appId: string;
    private environment: string;
    private baseUrl: string;

    constructor() {
        this.appId = process.env.EBAY_APP_ID || '';
        this.environment = process.env.EBAY_ENVIRONMENT || 'SANDBOX';

        // Sandbox vs Production URLs
        this.baseUrl = this.environment === 'PRODUCTION'
            ? 'https://svcs.ebay.com/services/search/FindingService/v1'
            : 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1';

        if (!this.appId) {
            throw new Error('EBAY_APP_ID not configured in environment variables');
        }
    }

    /**
     * Search for sold listings using eBay Finding API
     */
    async searchSoldListings(options: EbayApiOptions): Promise<EbayApiListing[]> {
        const { keyword, maxResults = 100 } = options;

        console.log(`🔍 Searching eBay API for: "${keyword}"`);
        console.log(`   Environment: ${this.environment}`);
        console.log(`   Max results: ${maxResults}`);

        try {
            const url = this.buildApiUrl(keyword, maxResults);

            console.log('📡 Making API request...');
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`eBay API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Parse eBay API response
            const listings = this.parseApiResponse(data, keyword);

            console.log(`✓ Found ${listings.length} sold listings`);
            return listings;

        } catch (error: any) {
            console.error('❌ eBay API error:', error);
            throw new Error(`Failed to fetch from eBay API: ${error.message}`);
        }
    }

    /**
     * Build eBay Finding API URL
     */
    private buildApiUrl(keyword: string, maxResults: number): string {
        const params = new URLSearchParams({
            'OPERATION-NAME': 'findCompletedItems',
            'SERVICE-VERSION': '1.0.0',
            'SECURITY-APPNAME': this.appId,
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': '',
            'keywords': keyword,
            'paginationInput.entriesPerPage': maxResults.toString(),
            'sortOrder': 'EndTimeSoonest',
            // Filter for sold items only
            'itemFilter(0).name': 'SoldItemsOnly',
            'itemFilter(0).value': 'true',
            // Filter for completed listings
            'itemFilter(1).name': 'Condition',
            'itemFilter(1).value': 'Used',
        });

        return `${this.baseUrl}?${params.toString()}`;
    }

    /**
     * Search for active listings by a specific seller
     */
    async searchSellerListings(sellerName: string, maxResults: number = 20): Promise<EbayApiListing[]> {
        const params = new URLSearchParams({
            'OPERATION-NAME': 'findItemsAdvanced',
            'SERVICE-VERSION': '1.0.0',
            'SECURITY-APPNAME': this.appId,
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': '',
            'itemFilter(0).name': 'Seller',
            'itemFilter(0).value': sellerName,
            'paginationInput.entriesPerPage': maxResults.toString(),
            'sortOrder': 'StartTimeNewest'
        });

        const url = `${this.baseUrl}?${params.toString()}`;
        console.log(`📡 Fetching active listings for seller: ${sellerName}`);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`eBay API error: ${response.status}`);

        const data = await response.json();
        const searchResult = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0];
        const items = searchResult?.item || [];

        return items.map((item: any) => ({
            title: item.title?.[0] || '',
            soldPrice: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0'),
            shippingPrice: 0, // Simplified
            currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD',
            isAuction: item.listingInfo?.[0]?.listingType?.[0] === 'Auction',
            bidCount: parseInt(item.listingInfo?.[0]?.bidCount?.[0] || '0'),
            soldDate: null, // Active listing
            itemUrl: item.viewItemURL?.[0] || '',
            searchKeyword: `seller:${sellerName}`,
            imageUrl: item.galleryURL?.[0]
        }));
    }

    /**
     * Parse eBay API JSON response into our listing format
     */
    private parseApiResponse(data: any, keyword: string): EbayApiListing[] {
        try {
            const searchResult = data.findCompletedItemsResponse?.[0]?.searchResult?.[0];

            if (!searchResult || searchResult['@count'] === '0') {
                console.log('⚠️  No results found');
                return [];
            }

            const items = searchResult.item || [];

            return items.map((item: any) => {
                const sellingStatus = item.sellingStatus?.[0];
                const shippingInfo = item.shippingInfo?.[0];
                const listingInfo = item.listingInfo?.[0];

                return {
                    title: item.title?.[0] || '',
                    soldPrice: parseFloat(sellingStatus?.currentPrice?.[0]?.__value__ || '0'),
                    shippingPrice: parseFloat(shippingInfo?.shippingServiceCost?.[0]?.__value__ || '0'),
                    currency: sellingStatus?.currentPrice?.[0]?.['@currencyId'] || 'USD',
                    isAuction: listingInfo?.listingType?.[0] === 'Auction',
                    bidCount: parseInt(listingInfo?.bidCount?.[0] || '0'),
                    soldDate: item.listingInfo?.[0]?.endTime?.[0]
                        ? new Date(item.listingInfo[0].endTime[0])
                        : null,
                    itemUrl: item.viewItemURL?.[0] || '',
                    searchKeyword: keyword,
                    imageUrl: item.galleryURL?.[0] || undefined,
                    condition: item.condition?.[0]?.conditionDisplayName?.[0] || undefined,
                    location: item.location?.[0] || undefined,
                };
            }).filter((listing: EbayApiListing) =>
                listing.title && listing.soldPrice && listing.itemUrl
            );

        } catch (error: any) {
            console.error('❌ Error parsing eBay API response:', error);
            throw new Error(`Failed to parse eBay API response: ${error.message}`);
        }
    }

    /**
     * Test the API connection
     */
    async testConnection(): Promise<boolean> {
        try {
            console.log('🧪 Testing eBay API connection...');
            const results = await this.searchSoldListings({
                keyword: 'test',
                maxResults: 1,
            });
            console.log('✓ eBay API connection successful!');
            return true;
        } catch (error) {
            console.error('❌ eBay API connection failed:', error);
            return false;
        }
    }
}

// Singleton instance
let ebayApiInstance: EbayApiService | null = null;

export function getEbayApi(): EbayApiService {
    if (!ebayApiInstance) {
        ebayApiInstance = new EbayApiService();
    }
    return ebayApiInstance;
}
