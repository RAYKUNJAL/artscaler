
const https = require('https');
require('dotenv').config({ path: '.env.local' });

// The user-provided production token
const TOKEN = 'v^1.1#i^1#r^1#p^3#f^0#I^3#t^Ul4xMF80OjM0MzVGMUVDMzQwOEYzRTA3QzQ2MDBBNTY1OEM4M0Q0XzFfMSNFXjI2MA==';
const EBAY_APP_ID = process.env.EBAY_APP_ID;

async function testFindingAPIWithToken(keywords = 'landscape painting') {
    console.log(`🧪 Testing Finding API with Manual Token...`);

    const params = new URLSearchParams({
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': EBAY_APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': keywords,
        'paginationInput.entriesPerPage': '5',
        'itemFilter(0).name': 'SoldItemsOnly',
        'itemFilter(0).value': 'true',
    });

    const hostname = 'svcs.ebay.com';
    const path = `/services/search/FindingService/v1?${params.toString()}`;

    const options = {
        hostname,
        path,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'X-EBAY-SOA-SECURITY-APPNAME': EBAY_APP_ID,
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
                    console.log('📡 Status Code:', res.statusCode);
                    console.log('📡 Ack:', response?.ack?.[0]);

                    if (response?.ack?.[0] === 'Success') {
                        const items = response.searchResult[0].item || [];
                        console.log(`✅ SUCCESS! Found ${items.length} live sold listings.`);
                        items.forEach((item, i) => {
                            console.log(`${i + 1}. ${item.title[0]} - $${item.sellingStatus[0].currentPrice[0].__value__}`);
                        });
                    } else {
                        console.log('❌ Error:', JSON.stringify(response?.errorMessage || result, null, 2));
                    }
                } catch (e) {
                    console.log('❌ Parse error:', e.message);
                    console.log('Raw data snippet:', data.substring(0, 200));
                }
                resolve(true);
            });
        }).on('error', (e) => {
            console.log('❌ Fetch error:', e.message);
            resolve(false);
        });
    });
}

testFindingAPIWithToken();
