
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findRayAndSeed() {
    const { data: profiles, error } = await supabase.from('user_profiles').select('id, email');
    let ray = profiles?.find(p => p.email === 'raykunjal@gmail.com');

    if (!ray) {
        // Fallback to searching in 'profiles'
        const { data: p2 } = await supabase.from('profiles').select('id, email');
        ray = p2?.find(p => p.email === 'raykunjal@gmail.com');
    }

    if (!ray) {
        console.error('Could not find user raykunjal@gmail.com');
        return;
    }

    console.log(`Found Ray with ID: ${ray.id}`);

    const liveItems = [
        { "Title": "Original ALEXANDER NEPOTE Mid-Century Modern ABSTRACT Watercolor MCM CALIFORNIA", "Price": 699.99 },
        { "Title": "8\"x30\" Original Oil Painting Abstract Impressionist-Oil on Wood", "Price": 0.99 },
        { "Title": "Gold Veins in Bloom Acrylic Pour Painting on Canvas", "Price": 1.04 },
        { "Title": "Abstract Jupiter Acrilic Painting", "Price": 2.08 },
        { "Title": "Art Original Oil Painting RM Mortensen \"Coal Barge\"", "Price": 39.99 },
        { "Title": "RARE EMIL KOSA JR PAINTING MID CENTURY MOD ABSTRACT CUBISM", "Price": 3240.00 },
        { "Title": "Vintage Mini Oil Painting On Copper Still Life Floral", "Price": 75.00 },
        { "Title": "original oil painting Lavender In A Pot 15х20cm Gift Wall Art", "Price": 50.00 },
        { "Title": "Corbellic Layered Rose 14x11 Original Abstract Gallery", "Price": 94.99 },
        { "Title": "FLOWERS DEEP THOUGHT WOMAN IMPRESSIONISM 9X12 PAINTING", "Price": 0.99 }
    ];

    const records = liveItems.map(item => ({
        user_id: ray.id,
        title: item.Title,
        sold_price: item.Price,
        shipping_price: 0,
        currency: 'USD',
        is_auction: false,
        bid_count: 0,
        sold_date: new Date().toISOString(),
        search_keyword: 'abstract oil painting',
        image_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=3348&auto=format&fit=crop'
    }));

    const { error: insertError } = await supabase.from('ebay_sold_listings').insert(records);

    if (insertError) {
        console.error('Insert Error:', insertError);
    } else {
        console.log(`✅ Seeded ${records.length} live listings for Ray!`);
    }
}

findRayAndSeed();
