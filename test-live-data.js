
const https = require('https');
require('dotenv').config({ path: '.env.local' });

// This script tests if the newly provided token can bypass the rate limit
const TOKEN = process.env.EBAY_USER_TOKEN;
const APP_ID = process.env.EBAY_APP_ID;

async function testLiveData() {
    console.log('🧪 Testing eBay Live Data with Manual Token...');

    const params = new URLSearchParams({
        'OPERATION-NAME': 'findCompletedItems', // Test for SOLD listings
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'keywords': 'original oil painting',
        'paginationInput.entriesPerPage': '10',
        'sortOrder': 'EndTimeSoonest',
        'itemFilter(0).name': 'SoldItemsOnly',
        'itemFilter(0).value': 'true'
    });

    const options = {
        hostname: 'svcs.ebay.com',
        path: `/services/search/FindingService/v1?${params.toString()}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'X-EBAY-SOA-SECURITY-APPNAME': APP_ID,
            'X-EBAY-SOA-OPERATION-NAME': 'findCompletedItems',
            'X-EBAY-SOA-RESPONSE-DATA-FORMAT': 'JSON'
        }
    };

    return new Promise((resolve) => {
        https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    const response = result.findCompletedItemsResponse?.[0];
                    console.log('📡 Status:', res.statusCode);
                    console.log('📡 Ack:', response?.ack?.[0]);

                    if (response?.ack?.[0] === 'Success') {
                        const items = response.searchResult[0].item || [];
                        console.log(`\n✅ SUCCESS! Found ${items.length} live sold listings.`);
                        items.forEach((item, i) => {
                            const price = item.sellingStatus[0].currentPrice[0];
                            console.log(`   [${i + 1}] ${item.title[0].substring(0, 50)}... -> ${price.__value__} ${price['@currencyId']}`);
                        });
                    } else {
                        console.log('\n❌ FAILED: Still hitting limit or error');
                        console.log('Error:', JSON.stringify(response?.errorMessage || result, null, 2));
                    }
                } catch (e) {
                    console.log('❌ Parse error:', e.message);
                }
                resolve(true);
            });
        }).on('error', (e) => {
            console.log('❌ Request error:', e.message);
            resolve(false);
        });
    });
}

testLiveData();
