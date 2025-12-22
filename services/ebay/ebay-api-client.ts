/**
 * Robust eBay API Client
 * Uses OAuth 2.0, Retry logic, and proper error handling.
 */

import { getEbayAccessToken } from '@/lib/ebay/oauth';
import { withRetry } from './retry-handler';
import { checkRateLimit, incrementApiUsage } from './rate-limiter';

export interface EbayListing {
    itemId: string;
    title: string;
    soldPrice: number;
    shippingPrice: number;
    currency: string;
    itemUrl: string;
    imageUrl?: string;
    soldDate?: string;
    condition?: string;
    location?: string;
    bidCount: number;
    watcherCount: number;
    listingType?: string;
}

export class EbayApiClient {
    private environment: string;
    private baseUrl: string;
    private cache = new Map<string, { data: EbayListing[], timestamp: number }>();
    private CACHE_TTL = 15 * 60 * 1000; // 15 minutes

    constructor() {
        this.environment = (process.env.EBAY_ENVIRONMENT || 'SANDBOX').toUpperCase();
        this.baseUrl = this.environment === 'PRODUCTION'
            ? 'https://svcs.ebay.com/services/search/FindingService/v1'
            : 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1';
    }

    private getCached(key: string): EbayListing[] | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        return null;
    }

    private setCached(key: string, data: EbayListing[]) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    /**
     * Search for completed (sold) items
     */
    async findCompletedItems(keyword: string, limit: number = 100): Promise<EbayListing[]> {
        const cacheKey = `sold:${keyword}:${limit}`;
        const cached = this.getCached(cacheKey);
        if (cached) {
            console.log(`[eBay API] Returning cached results for SOLD: ${keyword}`);
            return cached;
        }

        const rateStatus = await checkRateLimit();
        if (rateStatus.isBlocked) {
            throw new Error('Global eBay API rate limit reached for today.');
        }

        return withRetry(async () => {
            await incrementApiUsage();
            const token = await getEbayAccessToken();
            const appId = process.env.EBAY_APP_ID;

            const params = new URLSearchParams({
                'OPERATION-NAME': 'findCompletedItems',
                'SERVICE-VERSION': '1.0.0',
                'SECURITY-APPNAME': appId || '',
                'RESPONSE-DATA-FORMAT': 'JSON',
                'REST-PAYLOAD': '',
                'keywords': keyword,
                'paginationInput.entriesPerPage': limit.toString(),
                'sortOrder': 'EndTimeSoonest',
                'itemFilter(0).name': 'SoldItemsOnly',
                'itemFilter(0).value': 'true',
                'itemFilter(1).name': 'Condition',
                'itemFilter(1).value': '3000',
            });

            const url = `${this.baseUrl}?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    'X-EBAY-SOA-SECURITY-TOKEN': token,
                    'X-EBAY-SOA-OPERATION-NAME': 'findCompletedItems',
                    'X-EBAY-SOA-RESPONSE-DATA-FORMAT': 'JSON'
                }
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw {
                    status: response.status,
                    message: `eBay API error: ${response.status}`,
                    details: errorData
                };
            }

            const data = await response.json();
            const parsed = this.parseFindingResponse(data, 'findCompletedItemsResponse');
            this.setCached(cacheKey, parsed);
            return parsed;
        });
    }

    /**
     * Search for active items
     */
    async findActiveItems(keyword: string, limit: number = 20): Promise<EbayListing[]> {
        const cacheKey = `active:${keyword}:${limit}`;
        const cached = this.getCached(cacheKey);
        if (cached) {
            console.log(`[eBay API] Returning cached results for ACTIVE: ${keyword}`);
            return cached;
        }

        return withRetry(async () => {
            const token = await getEbayAccessToken();
            const appId = process.env.EBAY_APP_ID;

            const params = new URLSearchParams({
                'OPERATION-NAME': 'findItemsByKeywords',
                'SERVICE-VERSION': '1.0.0',
                'SECURITY-APPNAME': appId || '',
                'RESPONSE-DATA-FORMAT': 'JSON',
                'REST-PAYLOAD': '',
                'keywords': keyword,
                'paginationInput.entriesPerPage': limit.toString(),
                'sortOrder': 'BestMatch',
            });

            const url = `${this.baseUrl}?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    'X-EBAY-SOA-SECURITY-TOKEN': token,
                    'X-EBAY-SOA-OPERATION-NAME': 'findItemsByKeywords',
                    'X-EBAY-SOA-RESPONSE-DATA-FORMAT': 'JSON'
                }
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw {
                    status: response.status,
                    message: `eBay API error: ${response.status}`,
                    details: errorData
                };
            }

            const data = await response.json();
            const parsed = this.parseFindingResponse(data, 'findItemsByKeywordsResponse');
            this.setCached(cacheKey, parsed);
            return parsed;
        });
    }

    private parseFindingResponse(data: any, rootKey: string): EbayListing[] {
        const response = data[rootKey]?.[0];
        if (!response || response.ack?.[0] !== 'Success') {
            const errorMessage = response?.errorMessage?.[0]?.error?.[0]?.message?.[0] || 'Unknown eBay API error';
            throw new Error(errorMessage);
        }

        const items = response.searchResult?.[0]?.item || [];

        return items.map((item: any) => {
            const sellingStatus = item.sellingStatus?.[0];
            const shippingInfo = item.shippingInfo?.[0];
            const listingInfo = item.listingInfo?.[0];

            return {
                itemId: item.itemId?.[0],
                title: item.title?.[0],
                soldPrice: parseFloat(sellingStatus?.currentPrice?.[0]?.__value__ || '0'),
                shippingPrice: parseFloat(shippingInfo?.shippingServiceCost?.[0]?.__value__ || '0'),
                currency: sellingStatus?.currentPrice?.[0]?.['@currencyId'] || 'USD',
                itemUrl: item.viewItemURL?.[0],
                imageUrl: item.galleryURL?.[0],
                soldDate: listingInfo?.endTime?.[0],
                condition: item.condition?.[0]?.conditionDisplayName?.[0],
                location: item.location?.[0],
                bidCount: parseInt(listingInfo?.bidCount?.[0] || '0'),
                watcherCount: parseInt(listingInfo?.watchCount?.[0] || '0'),
                listingType: listingInfo?.listingType?.[0]
            };
        });
    }
}

export const ebayApiClient = new EbayApiClient();
