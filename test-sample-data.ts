/**
 * Quick test to verify sample data works
 */

import { getSampleEbayData } from './services/ebay/sample-data';

const result = getSampleEbayData('painting 9 x 12');

console.log('✅ Sample Data Test');
console.log('═══════════════════════════════════════');
console.log('Success:', result.success);
console.log('Count:', result.count);
console.log('');

if (result.listings && result.listings.length > 0) {
    console.log('📦 Sample Listings:');
    result.listings.slice(0, 5).forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`);
        console.log(`   Price: $${item.price}`);
        console.log(`   Shipping: $${item.shipping}`);
        console.log('');
    });
    console.log(`✅ Total: ${result.count} listings`);
} else {
    console.log('❌ No listings found');
}

export { };
