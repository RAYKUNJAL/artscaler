
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const liveItems = [
    {
        "Title": "Original ALEXANDER NEPOTE Mid-Century Modern ABSTRACT Watercolor MCM CALIFORNIA",
        "Price": "699.99",
        "Date Sold": "2025-12-24"
    },
    {
        "Title": "8\"x30\" Original Oil Painting Abstract Impressionist-Oil on Wood -\"6 Feet Apart\"",
        "Price": "0.99",
        "Date Sold": "2025-12-24"
    },
    {
        "Title": "Gold Veins in Bloom Acrylic Pour Painting on Canvas",
        "Price": "1.04",
        "Date Sold": "2025-12-24"
    },
    {
        "Title": "Abstract Jupiter Acrilic Painting",
        "Price": "2.08",
        "Date Sold": "2025-12-24"
    },
    {
        "Title": "Art Original Oil Painting RM Mortensen \"Coal Barge\" River Boat Houses New",
        "Price": "39.99",
        "Date Sold": "2025-12-24"
    },
    {
        "Title": "RARE EMIL KOSA JR PAINTING MID CENTURY MOD ABSTRACT CUBISM LARGE EXPRESSIONIST",
        "Price": "3240.00",
        "Date Sold": "2025-12-24"
    },
    {
        "Title": "Vintage Mini Oil Painting On Copper Still Life Floral Gold Oval Wood Frame Italy",
        "Price": "75.00",
        "Date Sold": "2025-12-24"
    },
    {
        "Title": "original oil painting Lavender In A Pot 15х20cm Gift Wall Art Semi-Abstract",
        "Price": "50.00",
        "Date Sold": "2025-12-24"
    },
    {
        "Title": "Corbellic Layered Rose 14x11 Original Abstract Gallery Thick PAPER Home Art",
        "Price": "94.99",
        "Date Sold": "2025-12-24"
    },
    {
        "Title": "FLOWERS DEEP THOUGHT WOMAN IMPRESSIONISM 9X12 PAINTING FINE ART HOME DECORATION",
        "Price": "0.99",
        "Date Sold": "2025-12-24"
    }
];

// We'll map these to a specific user or a global pool
const USER_ID = '384897f2-1f3a-4a87-a37a-7be85f756624'; // Using a placeholder or fetching first user

async function seedLiveData() {
    console.log('🌱 Seeding Live eBay Data into Supabase...');

    const records = liveItems.map(item => ({
        user_id: USER_ID,
        title: item.Title,
        sold_price: parseFloat(item.Price),
        shipping_price: 0,
        currency: 'USD',
        is_auction: false,
        bid_count: 0,
        sold_date: new Date(item["Date Sold"]).toISOString(),
        search_keyword: 'abstract oil painting',
        image_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=3348&auto=format&fit=crop'
    }));

    const { data, error } = await supabase
        .from('ebay_sold_listings')
        .insert(records);

    if (error) {
        console.error('❌ SEED ERROR:', error);
    } else {
        console.log(`✅ Successfully seeded ${records.length} live listings!`);
    }
}

seedLiveData();
