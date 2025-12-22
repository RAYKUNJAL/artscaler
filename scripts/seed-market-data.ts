
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TOPICS = [
    { label: 'Japanese Woodblock', slug: 'japanese-woodblock', price: 580, wvs: 7.8 },
    { label: 'Mid-Century Modern', slug: 'mcm-art', price: 420, wvs: 6.2 },
    { label: 'Contemporary Abstract', slug: 'contemporary-abstract', price: 850, wvs: 8.9 },
    { label: 'Street Art / Urban', slug: 'street-art', price: 120, wvs: 9.5 },
    { label: 'Landscape Impressionism', slug: 'impressionism', price: 340, wvs: 5.4 },
    { label: 'Minimalist Line Art', slug: 'minimalist', price: 85, wvs: 8.1 },
    { label: 'Surrealist Oil', slug: 'surrealist', price: 1200, wvs: 4.8 }
];

const SIZES = ['8x10', '16x20', '24x36', '36x48'];

async function seedMarketData() {
    console.log('🚀 Starting Market Data Foundation Build...');

    // 1. Attempt to find a user to anchor user-specific data
    let userId = null;
    try {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        userId = users[0]?.id;
    } catch (e) {
        // Fallback: Check user_profiles
        const { data } = await supabase.from('user_profiles').select('id').limit(1);
        userId = data?.[0]?.id;
    }

    if (!userId) {
        console.warn('⚠️ No user found. Data will be seeded without association where possible.');
        // Note: Some tables require user_id. We'll skip those if no user is found.
    } else {
        console.log(`👤 Using User ID: ${userId} for data anchoring.`);
    }

    // 2. Seed Topic Clusters (Global)
    console.log('📂 Seeding Topic Clusters (Global)...');
    const topicIds: Record<string, string> = {};
    for (const topic of TOPICS) {
        const { data, error } = await supabase
            .from('topic_clusters')
            .upsert({
                topic_slug: topic.slug,
                topic_label: topic.label,
                topic_description: `Market sector for ${topic.label} art. High pulse velocity detected.`
            }, { onConflict: 'topic_slug' })
            .select()
            .single();

        if (data) topicIds[topic.label] = data.id;
    }

    // 3. Seed Daily Scores (Historical Heatmap - 90 Days)
    console.log('📈 Generating 90-Day Trend Heatmap...');
    const batchScores = [];
    const batchOpps = [];

    for (const topic of TOPICS) {
        const id = topicIds[topic.label];
        for (let i = 0; i < 90; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const trend = Math.sin((i + TOPICS.indexOf(topic)) / 5) * 2;
            const wvs = Math.max(1, topic.wvs + trend);

            batchScores.push({
                date: dateStr,
                topic_id: id,
                wvs_score: parseFloat(wvs.toFixed(2)),
                velocity_score: parseFloat((wvs * 0.8).toFixed(2)),
                median_price: Math.round(topic.price + (trend * 30))
            });

            if (i === 0 && userId) {
                batchOpps.push({
                    user_id: userId,
                    date: dateStr,
                    rank: TOPICS.indexOf(topic) + 1,
                    topic_id: id,
                    topic_label: topic.label,
                    wvs_score: parseFloat(wvs.toFixed(2)),
                    velocity_score: parseFloat(wvs.toFixed(2)),
                    median_price: topic.price,
                    upper_quartile_price: Math.round(topic.price * 1.4),
                    recommended_sizes: ['16x20', '24x36'],
                    confidence: 0.95
                });
            }
        }
    }

    await supabase.from('topic_scores_daily').insert(batchScores);
    if (userId) await supabase.from('opportunity_feed').upsert(batchOpps, { onConflict: 'user_id,date,rank' });

    // 4. Seed Sold Listings (Pricing Engine Foundation - 300+ records)
    if (userId) {
        console.log('💰 Injecting Historical Sold Records (Pricing Foundation)...');
        const soldListings = [];
        for (const topic of TOPICS) {
            for (let i = 0; i < 40; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 60));

                const price = topic.price + ((Math.random() - 0.5) * (topic.price * 0.4));
                const size = SIZES[Math.floor(Math.random() * SIZES.length)];

                soldListings.push({
                    user_id: userId,
                    title: `Original ${topic.label} Art - ${size} Gallery Wrapped`,
                    sold_price: parseFloat(price.toFixed(2)),
                    shipping_price: 18.50,
                    currency: 'USD',
                    is_auction: Math.random() > 0.4,
                    bid_count: Math.floor(Math.random() * 20),
                    sold_date: date.toISOString(),
                    item_url: `https://www.ebay.com/itm/sim-${topic.slug}-${i}`,
                    search_keyword: topic.label
                });
            }
        }
        await supabase.from('ebay_sold_listings').insert(soldListings);
        await supabase.from('sold_listings_clean').insert(soldListings.map(l => ({
            ...l,
            sold_date: l.sold_date.split('T')[0]
        })));
    }

    // 5. Aggregated Metrics
    console.log('📊 Updating Style and Size Aggregates...');
    for (const topic of TOPICS) {
        await supabase.from('styles').upsert({
            style_term: topic.label,
            avg_wvs: topic.wvs,
            listing_count: 150 + Math.floor(Math.random() * 50)
        }, { onConflict: 'style_term' });
    }

    for (const size of SIZES) {
        await supabase.from('sizes').upsert({
            size_cluster: size,
            avg_price: 100 + (SIZES.indexOf(size) * 200),
            avg_wvs: 3 + Math.random() * 5,
            listing_count: 300
        }, { onConflict: 'size_cluster' });
    }

    console.log('✨ Data Foundation Built! Market Intelligence is now LIVE.');
}

seedMarketData();
