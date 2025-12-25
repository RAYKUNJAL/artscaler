
const https = require('https');
require('dotenv').config({ path: '.env.local' });

// The token provided by the user
const TOKEN = 'v^1.1#i^1#r^1#p^3#f^0#I^3#t^Ul4xMF80OjM0MzVGMUVDMzQwOEYzRTA3QzQ2MDBBNTY1OEM4M0Q0XzFfMSNFXjI2MA==';
const APP_ID = process.env.EBAY_APP_ID;

async function testUserToken() {
    console.log('🧪 Testing eBay User Token...');
    console.log('Token:', TOKEN);

    const options = {
        hostname: 'api.ebay.com',
        path: '/buy/browse/v1/item_summary/search?q=abstract+painting&limit=1',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('📡 Status:', res.statusCode);
                    console.log('📦 Response:', JSON.stringify(result, null, 2).substring(0, 500));

                    if (res.statusCode === 200) {
                        console.log('\n✅ SUCCESS: User Token is working with Buy API!');
                    } else {
                        console.log('\n❌ FAILED: User Token rejected.');
                    }
                } catch (e) {
                    console.log('❌ Parse error:', e.message);
                }
                resolve(true);
            });
        });

        req.on('error', (e) => {
            console.log('❌ Request error:', e.message);
            resolve(false);
        });

        req.end();
    });
}

testUserToken();
