/**
 * Deep Commercial‑Grade Test – Market Scanner API
 * Executes both 'sold' and 'active' modes, validates listings, and prints a concise report.
 */

async function runTest(mode: 'sold' | 'active') {
    console.log(`\n🧪 Testing Market Scanner API – mode: ${mode}\n`);
    console.log('='.repeat(60));

    const keyword = 'abstract painting 9x12';
    console.log(`\n📋 Test Parameters:`);
    console.log(`   Keyword: \"${keyword}\"`);
    console.log(`   Mode: ${mode}`);

    const startTime = Date.now();
    try {
        const response = await fetch('http://127.0.0.1:3000/api/scrape/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword, mode }),
        });
        const elapsed = Date.now() - startTime;
        console.log(`\n⏱️  Response time: ${elapsed}ms`);
        const data = await response.json();
        if (response.ok) {
            console.log(`\n✅ SUCCESS`);
            console.log(`   Job ID: ${data.job?.id}`);
            console.log(`   Message: ${data.message}`);
            const listings = data.listings || [];
            console.log(`   Listings returned (preview): ${listings.length}`);
            if (listings.length > 0) {
                console.log('   Sample listing:');
                console.log(`     Title: ${listings[0].title}`);
                console.log(`     Image URL: ${listings[0].image_url}`);
                console.log(`     Price: ${listings[0].sold_price ?? listings[0].price}`);
            }
        } else {
            console.log(`\n❌ FAILED`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error}`);
            console.log(`   Details: ${JSON.stringify(data, null, 2)}`);
        }
    } catch (error: any) {
        console.log(`\n❌ ERROR`);
        console.log(`   ${error.message}`);
    }
    console.log('\n' + '='.repeat(60));
}

// Execute both modes sequentially
await runTest('sold');
await runTest('active');

/**
 * Quick Test - Market Scanner API
 * Tests the scrape / start endpoint directly
 */

async function testMarketScanner() {
    console.log('🧪 Testing Market Scanner API\n');
    console.log('='.repeat(60));

    const keyword = 'abstract painting 9x12';
    const mode = 'sold';

    console.log(`\n📋 Test Parameters:`);
    console.log(`   Keyword: "${keyword}"`);
    console.log(`   Mode: ${mode}`);

    console.log(`\n🚀 Calling /api/scrape/start...`);
    const startTime = Date.now();

    try {
        const response = await fetch('http://127.0.0.1:3000/api/scrape/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword, mode }),
        });

        const elapsed = Date.now() - startTime;
        console.log(`\n⏱️  Response time: ${elapsed}ms`);

        const data = await response.json();

        if (response.ok) {
            console.log(`\n✅ SUCCESS`);
            console.log(`   Job ID: ${data.job?.id}`);
            console.log(`   Status: ${data.job?.status}`);
            console.log(`   Message: ${data.message}`);
            const listings = data.listings || [];
            console.log(`   Listings returned: ${listings.length}`);
            if (listings.length > 0) {
                console.log('   Sample listing:');
                console.log(`     Title: ${listings[0].title}`);
                console.log(`     Image URL: ${listings[0].image_url}`);
                console.log(`     Price: ${listings[0].sold_price ?? listings[0].price}`);
            }
        } else {
            console.log(`\n❌ FAILED`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error}`);
            console.log(`   Details: ${JSON.stringify(data, null, 2)}`);
        }

    } catch (error: any) {
        console.log(`\n❌ ERROR`);
        console.log(`   ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
}

// Run test
testMarketScanner();

export { };
