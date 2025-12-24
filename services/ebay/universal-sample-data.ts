/**
 * Universal Sample eBay Data Generator
 * Generates realistic sold listing data for ANY keyword
 * Use this while eBay API is in sandbox or having issues
 */

export interface SampleListing {
    itemId: string;
    title: string;
    price: number;
    currency: string;
    shipping: number;
    condition: string;
    soldDate: string;
    link: string;
    image: string;
    location: string;
    bids: number;
}

// Art-related terms for realistic title generation
const artStyles = ['Abstract', 'Modern', 'Contemporary', 'Impressionist', 'Expressionist', 'Minimalist', 'Vintage', 'Folk Art', 'Pop Art', 'Surrealist'];
const mediums = ['Oil Painting', 'Acrylic Painting', 'Watercolor', 'Mixed Media', 'Gouache', 'Pastel', 'Ink Drawing', 'Charcoal'];
const subjects = ['Landscape', 'Seascape', 'Cityscape', 'Portrait', 'Still Life', 'Floral', 'Abstract Design', 'Geometric', 'Nature Scene', 'Mountain View'];
const descriptors = ['Original', 'Signed', 'Framed', 'Unique', 'Hand-painted', 'Artist Signed', 'Gallery Quality', 'Museum Quality'];
const cities = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Miami, FL', 'Seattle, WA', 'San Diego, CA', 'Austin, TX', 'Boston, MA', 'Denver, CO', 'Portland, OR', 'San Francisco, CA', 'Atlanta, GA', 'Nashville, TN', 'Philadelphia, PA', 'Minneapolis, MN'];

/**
 * Generate a realistic item ID
 */
function generateItemId(): string {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

/**
 * Generate a realistic title based on keyword
 */
function generateTitle(keyword: string, index: number): string {
    const style = artStyles[index % artStyles.length];
    const medium = mediums[index % mediums.length];
    const subject = subjects[index % subjects.length];
    const descriptor = descriptors[index % descriptors.length];

    // If keyword contains size info, extract it
    const sizeMatch = keyword.match(/(\d+)\s*x\s*(\d+)/i);
    const size = sizeMatch ? `${sizeMatch[1]}x${sizeMatch[2]}` : '9x12';

    // Create variations
    const templates = [
        `${descriptor} ${style} ${medium} ${size} - ${subject}`,
        `${medium} ${size} ${subject} ${style} ${descriptor}`,
        `${style} ${subject} ${medium} ${size} ${descriptor}`,
        `${descriptor} ${medium} ${size} ${style} ${subject}`,
        `${size} ${style} ${medium} ${subject} Signed`,
    ];

    return templates[index % templates.length];
}

/**
 * Generate a realistic price based on index (creates variety)
 */
function generatePrice(index: number): number {
    const basePrices = [35, 42, 48, 55, 65, 72, 78, 85, 95, 110, 125, 135, 150, 175, 200];
    const price = basePrices[index % basePrices.length];
    // Add some randomness
    return price + (Math.random() * 20 - 10);
}

/**
 * Generate a sold date within the last 30 days
 */
function generateSoldDate(index: number): string {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30);
    const soldDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return soldDate.toISOString();
}

/**
 * Generate universal sample data for any keyword
 */
export function generateUniversalSampleData(keyword: string, count: number = 15): SampleListing[] {
    const listings: SampleListing[] = [];

    for (let i = 0; i < count; i++) {
        const itemId = generateItemId();
        const price = generatePrice(i);
        const shipping = [0, 7.50, 8.50, 9.95, 10.50, 12.00][i % 6];
        const bids = Math.floor(Math.random() * 25);

        listings.push({
            itemId,
            title: generateTitle(keyword, i),
            price: Math.round(price * 100) / 100,
            currency: 'USD',
            shipping,
            condition: i % 3 === 0 ? 'Used' : 'New',
            soldDate: generateSoldDate(i),
            link: `https://www.ebay.com/itm/${itemId}`,
            image: `https://i.ebayimg.com/images/g/placeholder-${i}/s-l500.jpg`,
            location: cities[i % cities.length],
            bids
        });
    }

    return listings;
}

/**
 * Enhanced getSampleEbayData that works for ANY keyword
 */
export function getUniversalSampleEbayData(keyword: string, count: number = 15) {
    console.log(`📦 Generating universal sample data for: "${keyword}"`);

    const listings = generateUniversalSampleData(keyword, count);

    return {
        success: true,
        count: listings.length,
        listings,
        source: 'universal-sample-generator',
        message: `Generated ${listings.length} sample listings for "${keyword}"`
    };
}
