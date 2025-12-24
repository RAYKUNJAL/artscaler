/**
 * eBay Finding API Service
 * Uses eBay's official Finding API to get sold listings data
 * No bot detection, fast and reliable!
 */

export interface EbayListing {
    itemId: string;
    title: string;
    price: number;
    currency: string;
    shipping: number;
    condition: string;
    soldDate: string;
    link: string;
    image: string;
    location: string;
    bids?: number;
}

export interface EbaySearchResult {
    success: boolean;
    count: number;
    listings: EbayListing[];
    error?: string;
}

export class EbayFindingAPIService {
    private appId: string;
    private baseUrl = 'https://svcs.ebay.com/services/search/FindingService/v1';

    constructor() {
        // Get from environment variables
        this.appId = process.env.EBAY_APP_ID || '[REDACTED]';
    }

    /**
     * Search for completed (sold) items
     */
    async findCompletedItems(
        keywords: string,
        options: {
            limit?: number;
            categoryId?: string;
            minPrice?: number;
            maxPrice?: number;
        } = {}
    ): Promise<EbaySearchResult> {
        try {
            const params = new URLSearchParams({
                'OPERATION-NAME': 'findCompletedItems',
                'SERVICE-VERSION': '1.0.0',
                'SECURITY-APPNAME': this.appId,
                'RESPONSE-DATA-FORMAT': 'JSON',
                'REST-PAYLOAD': '',
                'keywords': keywords,
                'paginationInput.entriesPerPage': String(options.limit || 100),
                'sortOrder': 'EndTimeSoonest',
            });

            // Add filters
            let filterIndex = 0;

            // Filter for sold items only
            params.append(`itemFilter(${filterIndex}).name`, 'SoldItemsOnly');
            params.append(`itemFilter(${filterIndex}).value`, 'true');
            filterIndex++;

            // Add category filter if provided
            if (options.categoryId) {
                params.append(`categoryId`, options.categoryId);
            }

            // Add price filters if provided
            if (options.minPrice !== undefined || options.maxPrice !== undefined) {
                params.append(`itemFilter(${filterIndex}).name`, 'MinPrice');
                params.append(`itemFilter(${filterIndex}).value`, String(options.minPrice || 0));
                filterIndex++;

                if (options.maxPrice !== undefined) {
                    params.append(`itemFilter(${filterIndex}).name`, 'MaxPrice');
                    params.append(`itemFilter(${filterIndex}).value`, String(options.maxPrice));
                    filterIndex++;
                }
            }

            const url = `${this.baseUrl}?${params.toString()}`;

            console.log('[eBay API] Fetching sold listings for:', keywords);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`eBay API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return this.parseResponse(data);

        } catch (error) {
            console.error('[eBay API] Error:', error);
            return {
                success: false,
                count: 0,
                listings: [],
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Parse eBay API response
     */
    private parseResponse(response: any): EbaySearchResult {
        try {
            const searchResult = response.findCompletedItemsResponse?.[0]?.searchResult?.[0];

            if (!searchResult || searchResult['@count'] === '0') {
                return {
                    success: true,
                    count: 0,
                    listings: [],
                    error: 'No items found'
                };
            }

            const items = searchResult.item || [];
            const listings: EbayListing[] = items.map((item: any) => {
                const sellingStatus = item.sellingStatus?.[0];
                const shippingInfo = item.shippingInfo?.[0];
                const listingInfo = item.listingInfo?.[0];

                return {
                    itemId: item.itemId?.[0] || '',
                    title: item.title?.[0] || 'N/A',
                    price: parseFloat(sellingStatus?.currentPrice?.[0]?.__value__ || '0'),
                    currency: sellingStatus?.currentPrice?.[0]?.['@currencyId'] || 'USD',
                    shipping: parseFloat(shippingInfo?.shippingServiceCost?.[0]?.__value__ || '0'),
                    condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'N/A',
                    soldDate: listingInfo?.endTime?.[0] || new Date().toISOString(),
                    link: item.viewItemURL?.[0] || '',
                    image: item.galleryURL?.[0] || item.pictureURLLarge?.[0] || '',
                    location: item.location?.[0] || 'N/A',
                    bids: parseInt(sellingStatus?.bidCount?.[0] || '0')
                };
            });

            console.log(`[eBay API] Found ${listings.length} sold listings`);

            return {
                success: true,
                count: listings.length,
                listings: listings
            };

        } catch (error) {
            console.error('[eBay API] Parse error:', error);
            return {
                success: false,
                count: 0,
                listings: [],
                error: error instanceof Error ? error.message : 'Parse error'
            };
        }
    }
}

// Export singleton instance
export const ebayAPI = new EbayFindingAPIService();
