/**
 * Demo Data System - ArtScaler v5.0
 * Provides sample datasets for new users to explore the platform.
 */

export interface DemoListing {
    id: string;
    title: string;
    price: number;
    image_url: string;
    bids: number;
    watchers: number;
    wvs_score: number;
    style: string;
    size: string;
    item_url: string;
    niche_tags?: string[];
}

export const DEMO_MARKET_DATA: DemoListing[] = [
    {
        id: 'demo-1',
        title: 'Frank KUPKA Oil Painting Frantisek Kupka Czech Cubism Abstract',
        price: 1225.00,
        image_url: 'https://images.unsplash.com/photo-1549887552-93f8efb87334?q=80&w=1500&auto=format&fit=crop',
        bids: 72,
        watchers: 124,
        wvs_score: 9.8,
        style: 'abstract',
        size: '16x20',
        item_url: 'https://www.ebay.com/itm/389380072383',
        niche_tags: ['abstract', 'cubism', 'modern']
    },
    {
        id: 'demo-2',
        title: 'Original Minecraft Artwork! Mountain Biome Landscape 11x14',
        price: 999.00,
        image_url: 'https://images.unsplash.com/photo-1620608034057-0742199f1873?q=80&w=1500&auto=format&fit=crop',
        bids: 45,
        watchers: 890,
        wvs_score: 9.9,
        style: 'landscape',
        size: '11x14',
        item_url: 'https://www.ebay.com/itm/286229249661',
        niche_tags: ['pop_art', 'landscape', 'minecraft']
    },
    {
        id: 'demo-3',
        title: 'BAHMAN MOHASSESS Oil Painting Italian Persian Avantgarde',
        price: 740.00,
        image_url: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1500&auto=format&fit=crop',
        bids: 69,
        watchers: 56,
        wvs_score: 8.5,
        style: 'portrait',
        size: '18x24',
        item_url: 'https://www.ebay.com/itm/389380039981',
        niche_tags: ['portrait', 'avantgarde', 'figurative']
    },
    {
        id: 'demo-4',
        title: 'Bob Ross Original Painting Signed Landscape Oil on Canvas',
        price: 50000.00,
        image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1500&auto=format&fit=crop',
        bids: 0,
        watchers: 450,
        wvs_score: 10.0,
        style: 'landscape',
        size: '18x24',
        item_url: 'https://www.ebay.com/itm/127515079787',
        niche_tags: ['landscape', 'traditional', 'impressionism']
    },
    {
        id: 'demo-5',
        title: 'Celestial Surrealist Map - Original Mixed Media',
        price: 450.00,
        image_url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=1500&auto=format&fit=crop',
        bids: 28,
        watchers: 112,
        wvs_score: 9.2,
        style: 'surrealism',
        size: '20x24',
        item_url: 'https://www.ebay.com/itm/389379836640',
        niche_tags: ['surrealism', 'mixed_media', 'celestial']
    }
];

export const DEMO_PRICING_DATA = {
    artwork: "16×20 Abstract Acrylic",
    recommended: 142,
    aggressive: 185,
    floor: 95,
    confidence: 91,
    liquidity: {
        recent_sold: 47,
        market_avg: 142,
        highest: 285,
        lowest: 68
    },
    trends: [110, 125, 120, 140, 135, 145, 142]
};

export const DEMO_PLANNER_RECS = [
    { subject: 'Large Scale Abstract', score: 9.4, demand: 'High', trend: 'Up' },
    { subject: 'Gold Leaf Landscapes', score: 8.7, demand: 'High', trend: 'Stable' },
    { subject: 'Minecraft/Fan Art Portraits', score: 9.6, demand: 'High', trend: 'Up' },
    { subject: 'Celestial Surrealist Maps', score: 8.9, demand: 'High', trend: 'Up' },
    { subject: 'Vibrant Pop Art Animals', score: 8.2, demand: 'High', trend: 'Stable' },
    { subject: 'Impressionist Garden Scenes', score: 7.8, demand: 'Medium', trend: 'Up' },
    { subject: 'Textured Mixed Media Collages', score: 7.5, demand: 'Medium', trend: 'Stable' },
    { subject: 'Neon Urban Portraits', score: 7.2, demand: 'Medium', trend: 'Up' },
    { subject: 'Minimalist Floral', score: 6.8, demand: 'Medium', trend: 'Stable' },
    { subject: 'Geometric 12x12s', score: 6.5, demand: 'Medium', trend: 'Down' }
];

export function getDemoBadge(toolName: string) {
    return `DEMO DATA - Run a real ${toolName} to see live Results`;
}
