
import { EbayApiService } from './services/scraper/ebay-api';

async function test() {
    process.env.EBAY_APP_ID = process.env.EBAY_APP_ID || '';

    if (!process.env.EBAY_APP_ID) {
        console.log('⚠️  EBAY_APP_ID is not set in environment.');
        // Try to check if we can skip this test or if we should fail
        // return;
    }

    console.log('🚀 Starting eBay API Test...');
    const api = new EbayApiService();

    try {
        const keyword = 'abstract painting';
        console.log(`🔍 Searching for: ${keyword}`);

        const listings = await api.searchSoldListings({ keyword, maxResults: 5 });

        console.log(`✅ Found ${listings.length} listings`);
        if (listings.length > 0) {
            console.log('Sample listing:', JSON.stringify(listings[0], null, 2));
            console.log('SUCCESS: eBay API is working!');
        } else {
            console.log('WARNING: No listings found. Check credentials.');
        }
    } catch (error: any) {
        console.error('❌ eBay API Test Failed:', error.message);
    } finally {
        console.log('🏁 Test finished');
    }
}

test();
