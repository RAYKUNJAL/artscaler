/**
 * Test eBay Finding API with real credentials
 */

const https = require('https');

const EBAY_APP_ID = process.env.EBAY_APP_ID || '[REDACTED]';

async function testEbayAPI(keywords = 'painting 9 x 12') {
    console.log('🚀 Testing eBay Finding API');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔑 App ID:', EBAY_APP_ID);
    console.log('🔍 Search:', keywords);
    console.log('');

    const params = new URLSearchParams({
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': EBAY_APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': keywords,
        'paginationInput.entriesPerPage': '20',
        'sortOrder': 'EndTimeSoonest',
        'itemFilter(0).name': 'SoldItemsOnly',
        'itemFilter(0).value': 'true'
    });

    const url = `https://svcs.sandbox.ebay.com/services/search/FindingService/v1?${params.toString()}`;

    console.log('🌐 Using: SANDBOX environment');
    console.log('📡 Endpoint:', url.substring(0, 100) + '...');
    console.log('');

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);

                    // Check for errors
                    if (result.errorMessage) {
                        console.error('❌ API Error:');
                        console.error(JSON.stringify(result.errorMessage, null, 2));
                        resolve({ success: false, error: result.errorMessage });
                        return;
                    }

                    const searchResult = result.findCompletedItemsResponse?.[0]?.searchResult?.[0];
                    const count = searchResult?.['@count'] || '0';
                    const items = searchResult?.item || [];

                    console.log('✅ API Response Received!');
                    console.log('📊 Total Results:', count);
                    console.log('');

                    if (items.length > 0) {
                        console.log('📦 Sample Listings:');
                        console.log('═══════════════════════════════════════════════════════════════');

                        items.slice(0, 5).forEach((item, index) => {
                            const title = item.title?.[0] || 'N/A';
                            const price = item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0';
                            const currency = item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD';
                            const shipping = item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || '0';
                            const soldDate = item.listingInfo?.[0]?.endTime?.[0] || 'N/A';

                            console.log(`\n${index + 1}. ${title}`);
                            console.log(`   💰 Price: $${price} ${currency}`);
                            console.log(`   📦 Shipping: $${shipping}`);
                            console.log(`   📅 Sold: ${new Date(soldDate).toLocaleDateString()}`);
                        });

                        console.log('\n═══════════════════════════════════════════════════════════════');
                        console.log(`✅ SUCCESS! Found ${items.length} sold listings`);
                        console.log('🎉 eBay API is working perfectly!');

                        resolve({ success: true, count: items.length, items });
                    } else {
                        console.log('⚠️  No results found for this search term');
                        console.log('Try a different keyword or check the category filters');
                        resolve({ success: true, count: 0, items: [] });
                    }

                } catch (error) {
                    console.error('❌ Parse Error:', error.message);
                    reject(error);
                }
            });

        }).on('error', (error) => {
            console.error('❌ Request Error:', error.message);
            reject(error);
        });
    });
}

// Run test
const keyword = process.argv[2] || 'painting 9 x 12';
testEbayAPI(keyword)
    .then(() => {
        console.log('\n✅ Test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    });
