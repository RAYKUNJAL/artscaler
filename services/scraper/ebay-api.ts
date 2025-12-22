/**
 * eBay API Service
 * Uses official eBay Finding API to search sold listings
 * Much faster and more reliable than web scraping!
 */

import { getEbayAccessToken } from '@/lib/ebay/oauth';

export interface EbayApiListing {
    id: string; // Add ID for better tracking
    title: string;
    soldPrice: number | null;
    currentPrice: number | null; // Added for active listings
    shippingPrice: number | null;
    currency: string;
    isAuction: boolean;
    bidCount: number;
    watcherCount: number; // Added for active listings
    soldDate: Date | null;
    itemUrl: string;
    searchKeyword: string;
    imageUrl?: string;
    condition?: string;
    location?: string;
    listingType?: string;
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
        this.environment = (process.env.EBAY_ENVIRONMENT || 'SANDBOX').toUpperCase();

        // Sandbox vs Production URLs for Finding API
        this.baseUrl = this.environment === 'PRODUCTION'
            ? 'https://svcs.ebay.com/services/search/FindingService/v1'
            : 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1';

        if (!this.appId) {
            console.warn('⚠️ EBAY_APP_ID not configured. API calls will fail.');
        }
    }

    /**
     * Helper for fetching with retries and OAuth
     */
    private async fetchWithRetry(url: string, options: any = {}, retries = 3): Promise<any> {
        let lastError: any;

        for (let i = 0; i < retries; i++) {
            try {
                const token = await getEbayAccessToken();
                const mergedOptions = {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Authorization': `Bearer ${token}`,
                        'X-EBAY-SOA-SECURITY-APPNAME': this.appId,
                        'X-EBAY-SOA-RESPONSE-DATA-FORMAT': 'JSON',
                    }
                };

                const response = await fetch(url, mergedOptions);

                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    const wait = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;
                    console.log(`[eBay API] Rate limited. Retrying in ${wait}ms...`);
                    await new Promise(r => setTimeout(r, wait));
                    continue;
                }

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`eBay API error: ${response.status} ${response.statusText} - ${errorBody}`);
                }

                return await response.json();
            } catch (err: any) {
                lastError = err;
                console.error(`[eBay API] Attempt ${i + 1} failed:`, err.message);
                if (i < retries - 1) {
                    await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
                }
            }
        }
        throw lastError;
    }

    async searchSoldListings(options: EbayApiOptions): Promise<EbayApiListing[]> {
        const { keyword, maxResults = 100 } = options;

        console.log(`🔍 Searching eBay API for SOLD: "${keyword}" (Env: ${this.environment})`);

        try {
            const params = new URLSearchParams({
                'OPERATION-NAME': 'findCompletedItems',
                'SERVICE-VERSION': '1.0.0',
                'SECURITY-APPNAME': this.appId, // Still needed for some Finding API calls
                'RESPONSE-DATA-FORMAT': 'JSON',
                'REST-PAYLOAD': '',
                'keywords': keyword,
                'paginationInput.entriesPerPage': maxResults.toString(),
                'sortOrder': 'EndTimeSoonest',
                'itemFilter(0).name': 'SoldItemsOnly',
                'itemFilter(0).value': 'true',
                'itemFilter(1).name': 'Condition',
                'itemFilter(1).value': '3000', // "Used" category mapping, often better than string
            });

            const url = `${this.baseUrl}?${params.toString()}`;
            const data = await this.fetchWithRetry(url);

            const listings = this.parseApiResponse(data, 'findCompletedItemsResponse', keyword);
            console.log(`✓ Found ${listings.length} sold listings`);
            return listings;

        } catch (error: any) {
            console.error('❌ eBay API Sold Search Failed:', error);
            throw error;
        }
    }

    /**
     * Search for active listings using eBay Finding API
     */
    async searchActiveListings(options: EbayApiOptions): Promise<EbayApiListing[]> {
        const { keyword, maxResults = 100 } = options;

        console.log(`🔍 Searching eBay API for ACTIVE: "${keyword}" (Env: ${this.environment})`);

        try {
            const params = new URLSearchParams({
                'OPERATION-NAME': 'findItemsByKeywords',
                'SERVICE-VERSION': '1.0.0',
                'SECURITY-APPNAME': this.appId,
                'RESPONSE-DATA-FORMAT': 'JSON',
                'REST-PAYLOAD': '',
                'keywords': keyword,
                'paginationInput.entriesPerPage': maxResults.toString(),
                'sortOrder': 'BestMatch',
            });

            const url = `${this.baseUrl}?${params.toString()}`;
            const data = await this.fetchWithRetry(url);

            const listings = this.parseApiResponse(data, 'findItemsByKeywordsResponse', keyword);
            console.log(`✓ Found ${listings.length} active listings`);
            return listings;

        } catch (error: any) {
            console.error('❌ eBay API Active Search Failed:', error);
            throw error;
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

        const data = await this.fetchWithRetry(url);
        const searchResult = data.findItemsAdvancedResponse?.[0]?.searchResult?.[0];
        const items = searchResult?.item || [];

        return items.map((item: any) => ({
            id: item.itemId?.[0] || '',
            title: item.title?.[0] || '',
            soldPrice: null,
            currentPrice: parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0'),
            shippingPrice: parseFloat(item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || '0'),
            currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD',
            isAuction: item.listingInfo?.[0]?.listingType?.[0] === 'Auction',
            bidCount: parseInt(item.listingInfo?.[0]?.bidCount?.[0] || '0'),
            watcherCount: parseInt(item.listingInfo?.[0]?.watchCount?.[0] || '0'),
            soldDate: null,
            itemUrl: item.viewItemURL?.[0] || '',
            searchKeyword: `seller:${sellerName}`,
            imageUrl: item.galleryURL?.[0]
        }));
    }

    private parseApiResponse(data: any, rootKey: string, keyword: string): EbayApiListing[] {
        try {
            const response = data[rootKey]?.[0];
            const searchResult = response?.searchResult?.[0];

            if (!searchResult || searchResult['@count'] === '0') {
                console.log(`⚠️ No results found for rootKey: ${rootKey}`);
                return [];
            }

            const items = searchResult.item || [];

            return items.map((item: any) => {
                const sellingStatus = item.sellingStatus?.[0];
                const shippingInfo = item.shippingInfo?.[0];
                const listingInfo = item.listingInfo?.[0];

                const currentPrice = parseFloat(sellingStatus?.currentPrice?.[0]?.__value__ || '0');

                return {
                    id: item.itemId?.[0] || '',
                    title: item.title?.[0] || '',
                    soldPrice: rootKey.includes('Completed') ? currentPrice : null,
                    currentPrice: currentPrice,
                    shippingPrice: parseFloat(shippingInfo?.shippingServiceCost?.[0]?.__value__ || '0'),
                    currency: sellingStatus?.currentPrice?.[0]?.['@currencyId'] || 'USD',
                    isAuction: listingInfo?.listingType?.[0]?.includes('Auction') || false,
                    bidCount: parseInt(listingInfo?.bidCount?.[0] || '0'),
                    watcherCount: parseInt(listingInfo?.watchCount?.[0] || '0'),
                    soldDate: listingInfo?.endTime?.[0] ? new Date(listingInfo.endTime[0]) : null,
                    itemUrl: item.viewItemURL?.[0] || '',
                    searchKeyword: keyword,
                    imageUrl: item.galleryURL?.[0] || undefined,
                    condition: item.condition?.[0]?.conditionDisplayName?.[0] || undefined,
                    location: item.location?.[0] || undefined,
                    listingType: listingInfo?.listingType?.[0] || 'FixedPrice',
                };
            }).filter((listing: EbayApiListing) =>
                listing.title && listing.itemUrl
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
