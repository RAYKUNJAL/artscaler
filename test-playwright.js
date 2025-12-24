// Quick test to verify Playwright works
const { chromium } = require('playwright');

async function testPlaywright() {
    console.log('🧪 Testing Playwright installation...\n');

    let browser;
    try {
        console.log('1️⃣ Launching browser...');
        browser = await chromium.launch({ headless: true });
        console.log('✅ Browser launched successfully!\n');

        console.log('2️⃣ Creating page...');
        const page = await browser.newPage();
        console.log('✅ Page created!\n');

        console.log('3️⃣ Navigating to test URL...');
        await page.goto('https://httpbin.org/html', { timeout: 10000 });
        console.log('✅ Navigation successful!\n');

        console.log('4️⃣ Getting page title...');
        const title = await page.title();
        console.log(`✅ Page title: "${title}"\n`);

        console.log('5️⃣ Extracting text...');
        const text = await page.textContent('h1');
        console.log(`✅ Found H1: "${text}"\n`);

        console.log('═══════════════════════════════════════');
        console.log('✅ ALL TESTS PASSED!');
        console.log('Playwright is working correctly!');
        console.log('═══════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        console.error('\n💡 Solution:');
        console.error('Run: npx playwright install chromium');
        console.error('This will download the browser binaries.\n');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testPlaywright();
