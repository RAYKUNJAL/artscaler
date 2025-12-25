
const https = require('https');

async function scrapeEbaySearch(keyword) {
    console.log(`🔍 Scraping eBay for: ${keyword}`);
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedKeyword}&_sacat=0&LH_Sold=1&LH_Complete=1&_ipg=25`;

    return new Promise((resolve) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        };

        https.get(url, options, (res) => {
            let html = '';
            res.on('data', chunk => html += chunk);
            res.on('end', () => {
                const listings = [];
                // Simple regex extraction for titles and prices
                const titleRegex = /class="s-item__title">.*?<span>(.*?)<\/span>/g;
                const priceRegex = /class="s-item__price">.*?<span>\$(.*?)<\/span>/g;

                let titleMatch;
                let priceMatch;

                while ((titleMatch = titleRegex.exec(html)) !== null) {
                    priceMatch = priceRegex.exec(html);
                    if (priceMatch) {
                        listings.push({
                            title: titleMatch[1].replace('<!---->', ''),
                            price: priceMatch[1]
                        });
                    }
                }

                console.log(`✅ Scraped ${listings.length} listings.`);
                listings.slice(0, 5).forEach((l, i) => {
                    console.log(`${i + 1}. ${l.title} - $${l.price}`);
                });
                resolve(listings);
            });
        }).on('error', (e) => {
            console.error('❌ Scrape error:', e.message);
            resolve([]);
        });
    });
}

scrapeEbaySearch('abstract oil painting');
