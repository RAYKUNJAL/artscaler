
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
    console.log('--- DEBUG INFO ---');
    console.log('EBAY_ENVIRONMENT:', process.env.EBAY_ENVIRONMENT);
    console.log('EBAY_APP_ID:', process.env.EBAY_APP_ID ? 'SET' : 'NOT SET');
    console.log('EBAY_CLIENT_ID:', process.env.EBAY_CLIENT_ID ? 'SET' : 'NOT SET');

    console.log('\n--- RECENT SCRAPE JOBS ---');
    const { data: jobs, error: jobError } = await supabase
        .from('scrape_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (jobError) {
        console.error('Error fetching jobs:', jobError);
    } else {
        console.table(jobs.map(j => ({
            id: j.id,
            status: j.status,
            keyword: j.keyword,
            error: j.error_message || 'None',
            items: j.items_found || 0,
            at: j.created_at
        })));
    }

    console.log('\n--- RECENT SOLD LISTINGS ---');
    const { data: listings, error: listError } = await supabase
        .from('ebay_sold_listings')
        .select('id, title, sold_price, image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (listError) {
        console.error('Error fetching listings:', listError);
    } else {
        console.table(listings);
    }
}

debug();
