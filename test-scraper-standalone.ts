import { ArtdemandScraper } from './services/scraper/artdemand-scraper';
import { supabase } from './lib/supabase/client';

async function test() {
    console.log('🚀 Starting Scraper Test...');
    const scraper = new ArtdemandScraper();

    try {
        await scraper.initialize();
        console.log('✅ Scraper initialized');

        const keyword = 'abstract painting';
        console.log(`🔍 Scraping for: ${keyword}`);

        const listings = await scraper.scrapeActive(supabase, 'test-user-id', keyword, 1); // just 1 page

        console.log(`✅ Found ${listings.length} listings`);
        if (listings.length > 0) {
            console.log('Sample listing:', JSON.stringify(listings[0], null, 2));
            console.log('SUCCESS: Scraper is working!');
        } else {
            console.log('WARNING: No listings found. eBay might be blocking us or the selector changed.');
        }
    } catch (error) {
        console.error('❌ Scraper Test Failed:', error);
    } finally {
        await scraper.close();
        console.log('🏁 Test finished');
    }
}

test();
