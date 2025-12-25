
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const TOKEN = process.env.EBAY_USER_TOKEN;
const APP_ID = process.env.EBAY_APP_ID;

async function testActiveItems() {
    console.log('🧪 Testing Finding API (Active Items)...');

    const params = new URLSearchParams({
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'keywords': 'abstract art',
        'paginationInput.entriesPerPage': '5'
    });

    const options = {
        hostname: 'svcs.ebay.com',
        path: `/services/search/FindingService/v1?${params.toString()}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'X-EBAY-SOA-SECURITY-APPNAME': APP_ID,
            'X-EBAY-SOA-OPERATION-NAME': 'findItemsByKeywords',
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
                    const response = result.findItemsByKeywordsResponse?.[0];
                    console.log('📡 Status:', res.statusCode);
                    console.log('📡 Ack:', response?.ack?.[0]);

                    if (response?.ack?.[0] === 'Success') {
                        const items = response.searchResult[0].item || [];
                        console.log(`\n✅ SUCCESS! Found ${items.length} active listings.`);
                        items.forEach((item, i) => {
                            console.log(`   [${i + 1}] ${item.title[0]}`);
                        });
                    } else {
                        console.log('\n❌ FAILED');
                        console.log('Error:', JSON.stringify(response?.errorMessage || result, null, 2));
                    }
                } catch (e) {
                    console.log('❌ Parse error:', e.message);
                }
                resolve(true);
            });
        });
    });
}

testActiveItems();
