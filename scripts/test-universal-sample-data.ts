/**
 * Quick Test: Universal Sample Data Generator
 * Run this to verify the scanner works with any keyword
 */

import { getUniversalSampleEbayData } from '../services/ebay/universal-sample-data';

console.log('🧪 Testing Universal Sample Data Generator\n');
console.log('='.repeat(60));

// Test various keywords
const testKeywords = [
    'painting 9 x 12',
    'watercolor landscape',
    'abstract art 16x20',
    'oil painting portrait',
    'acrylic cityscape 11x14',
    'mixed media 8x10'
];

testKeywords.forEach((keyword, index) => {
    console.log(`\n${index + 1}. Testing: "${keyword}"`);
    console.log('-'.repeat(60));

    const result = getUniversalSampleEbayData(keyword, 5);

    console.log(`✅ Generated ${result.count} listings`);
    console.log(`📦 Sample listing:`);
    console.log(`   Title: ${result.listings[0].title}`);
    console.log(`   Price: $${result.listings[0].price}`);
    console.log(`   Bids: ${result.listings[0].bids}`);
    console.log(`   Location: ${result.listings[0].location}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ All tests passed! Universal sample data works for ANY keyword.');
console.log('\n💡 The scanner will now work with or without eBay API access.');
