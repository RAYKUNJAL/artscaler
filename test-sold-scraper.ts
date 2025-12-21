
import { EbayScraper } from './services/scraper/ebay-scraper';

async function testSoldScraper() {
    console.log('🚀 Starting Sold Listing Scraper Test...');
    const scraper = new EbayScraper();

    try {
        await scraper.initialize();
        console.log('✅ Scraper initialized');

        const keyword = 'abstract painting';
        console.log(`🔍 Scraping SOLD listings for: ${keyword}`);

        // Test with max 1 page to be quick
        const listings = await scraper.scrape({ keyword, maxPages: 1 });

        console.log(`✅ Found ${listings.length} sold listings`);
        if (listings.length > 0) {
            console.log('Sample sold listing:', JSON.stringify(listings[0], null, 2));
            console.log('SUCCESS: Sold listing scraper is working!');
        } else {
            console.log('WARNING: No sold listings found. eBay might have changed selectors or is blocking.');
            // Let's log the page content if no listings found
        }
    } catch (error) {
        console.error('❌ Sold Scraper Test Failed:', error);
    } finally {
        await scraper.close();
        console.log('🏁 Test finished');
    }
}

testSoldScraper();
