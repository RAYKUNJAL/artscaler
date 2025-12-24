
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const EBAY_ENVIRONMENT = process.env.EBAY_ENVIRONMENT || 'PROD';

async function getAccessToken() {
    const auth = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');
    const tokenUrl = EBAY_ENVIRONMENT.toUpperCase() === 'PRODUCTION' || EBAY_ENVIRONMENT.toUpperCase() === 'PROD'
        ? 'api.ebay.com'
        : 'api.sandbox.ebay.com';

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: tokenUrl,
            path: '/identity/v1/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.access_token) resolve(result.access_token);
                    else reject(new Error('Failed to get token: ' + JSON.stringify(result)));
                } catch (e) {
                    reject(new Error('Failed to parse token response: ' + data));
                }
            });
        });
        req.on('error', reject);
        req.write('grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope');
        req.end();
    });
}

async function testEbayAPI(keywords = 'abstract painting') {
    console.log('🚀 eBay Data Loading Test');

    try {
        const token = await getAccessToken();
        console.log('🔑 Token: Success');

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

        const hostname = EBAY_ENVIRONMENT.toUpperCase() === 'PRODUCTION' || EBAY_ENVIRONMENT.toUpperCase() === 'PROD'
            ? 'svcs.ebay.com' : 'svcs.sandbox.ebay.com';

        const path = `/services/search/FindingService/v1?${params.toString()}`;

        return new Promise((resolve) => {
            https.get({
                hostname,
                path,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }, (res) => {
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
                            items.forEach((item, i) => {
                                console.log(`${i + 1}. ${item.title?.[0]} - $${item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__}`);
                            });
                            console.log('\n✅ eBay is WORKING');
                        } else {
                            console.log('❌ No results');
                            console.log('Response Detail:', JSON.stringify(result, null, 2).substring(0, 1000));
                        }
                    } catch (e) {
                        console.log('❌ Parse error:', e.message);
                        console.log('Raw Data:', data.substring(0, 500));
                    }
                    resolve(true);
                });
            });
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

testEbayAPI();
