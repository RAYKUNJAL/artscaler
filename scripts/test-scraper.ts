import { EbayPulseScraper } from '../services/scraper/ebay-pulse-scraper';

async function testScraper() {
    const keyword = 'oil painting';
    console.log(`Testing EbayPulseScraper with keyword: "${keyword}"...`);

    try {
        const listings = await EbayPulseScraper.scrapeSoldListings(keyword, 1);

        console.log('---------------------------------------------------');
        console.log(`Successfully scraped ${listings.length} listings.`);
        console.log('---------------------------------------------------');

        if (listings.length > 0) {
            console.log('First listing found:');
            console.log(listings[0]);
        } else {
            console.warn('No listings found! Check debug logs or bot detection.');
        }

    } catch (error) {
        console.error('Scraper failed:', error);
    }
}

testScraper();
