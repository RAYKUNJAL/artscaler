
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const TOKEN = 'v^1.1#i^1#r^1#p^3#f^0#I^3#t^Ul4xMF80OjM0MzVGMUVDMzQwOEYzRTA3QzQ2MDBBNTY1OEM4M0Q0XzFfMSNFXjI2MA==';

async function testBrowseAPI() {
    console.log('🧪 Testing eBay Browse API (OAuth 2.0)...');

    // We'll try to search for something broad
    const options = {
        hostname: 'api.ebay.com',
        path: '/buy/browse/v1/item_summary/search?q=art&limit=1',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('📡 Status:', res.statusCode);
                const result = JSON.parse(data);
                console.log('📦 Response:', JSON.stringify(result, null, 2));
                resolve(true);
            });
        });
        req.on('error', (e) => {
            console.log('❌ Error:', e.message);
            resolve(false);
        });
        req.end();
    });
}

testBrowseAPI();
