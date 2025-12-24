/**
 * Quick Test - Market Scanner API
 * Tests the scrape/start endpoint directly
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
        const response = await fetch('http://localhost:3000/api/scrape/start', {
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
