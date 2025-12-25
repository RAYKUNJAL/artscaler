
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const TOKEN = 'v^1.1#i^1#r^1#p^3#f^0#I^3#t^Ul4xMF80OjM0MzVGMUVDMzQwOEYzRTA3QzQ2MDBBNTY1OEM4M0Q0XzFfMSNFXjI2MA==';
const APP_ID = process.env.EBAY_APP_ID;

async function testTradingAPI() {
    console.log('🧪 Testing eBay Trading API with User Token...');

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<GeteBayOfficialTimeRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${TOKEN}</eBayAuthToken>
  </RequesterCredentials>
</GeteBayOfficialTimeRequest>`;

    const options = {
        hostname: 'api.ebay.com',
        path: '/ws/api.dll',
        method: 'POST',
        headers: {
            'X-EBAY-API-CALL-NAME': 'GeteBayOfficialTime',
            'X-EBAY-API-SITEID': '0',
            'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
            'X-EBAY-API-DEV-NAME': process.env.EBAY_DEV_ID,
            'X-EBAY-API-APP-NAME': process.env.EBAY_APP_ID,
            'X-EBAY-API-CERT-NAME': process.env.EBAY_CERT_ID,
            'Content-Type': 'text/xml',
            'Content-Length': Buffer.byteLength(xml)
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('📡 Status:', res.statusCode);
                console.log('📦 Response:', data);
                if (data.includes('Success')) {
                    console.log('\n✅ SUCCESS: User Token is a valid Trading API Token!');
                } else {
                    console.log('\n❌ FAILED: Token rejected by Trading API.');
                }
                resolve(true);
            });
        });
        req.on('error', (e) => {
            console.log('❌ Error:', e.message);
            resolve(false);
        });
        req.write(xml);
        req.end();
    });
}

testTradingAPI();
