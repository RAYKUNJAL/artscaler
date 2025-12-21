export class HeadlessExtractor {
    /**
     * Extracts deep data using simple HTML fetch (No browser required)
     * Robust for Vercel/Serverless
     */
    static async extract(url: string) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) return null;
            const html = await response.text();

            // 1. Watcher Count Regex
            const watcherMatch = html.match(/(\d+)\s+watchers?/i) || html.match(/(\d+)\s+watching/i);
            const watcherCount = watcherMatch ? parseInt(watcherMatch[1]) : 0;

            // 2. Bid Count
            const bidMatch = html.match(/(\d+)\s+bids?/i);
            const bidCount = bidMatch ? parseInt(bidMatch[1]) : 0;

            // 3. Price
            const priceMatch = html.match(/class="x-price-primary">.*?([\d.,]+)/);
            const currentPrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;

            return {
                watcherCount,
                bidCount,
                currentPrice
            };
        } catch (e) {
            console.error('Headless extraction failed:', e);
            return null;
        }
    }
}
