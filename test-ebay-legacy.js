
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const EBAY_APP_ID = process.env.EBAY_APP_ID;

async function testLegacyFindingAPI(keywords = 'landscape painting') {
    console.log('🚀 Legacy Finding API Test (No OAuth)');

    const params = new URLSearchParams({
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': EBAY_APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'keywords': keywords,
        'paginationInput.entriesPerPage': '3',
        'itemFilter(0).name': 'SoldItemsOnly',
        'itemFilter(0).value': 'true'
    });

    // Use PRODUCTION endpoint directly
    const url = `https://svcs.ebay.com/services/search/FindingService/v1?${params.toString()}`;

    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    const response = result.findCompletedItemsResponse?.[0];
                    const items = response?.searchResult?.[0]?.item || [];

                    console.log('📡 Status:', response?.ack?.[0]);
                    console.log('📊 Count:', items.length);

                    if (items.length > 0) {
                        items.slice(0, 3).forEach((item, i) => {
                            console.log(`${i + 1}. ${item.title?.[0]}`);
                        });
                        console.log('\n✅ SUCCESS: eBay Data is Loading using Legacy Mode');
                    } else {
                        console.log('❌ Failed/No Results');
                        console.log('Error:', JSON.stringify(response?.errorMessage || result, null, 2));
                    }
                } catch (e) {
                    console.log('❌ Parse error');
                }
                resolve(true);
            });
        });
    });
}

testLegacyFindingAPI();
