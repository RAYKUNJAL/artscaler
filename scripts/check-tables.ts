
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

async function checkTables() {
    console.log('🔍 Checking for required tables...');

    const tables = [
        'user_profiles',
        'ebay_sold_listings',
        'scrape_jobs',
        'blog_posts',
        'styles',
        'sizes',
        'mediums',
        'opportunity_feed'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`❌ Table "${table}" error: ${error.message}`);
        } else {
            console.log(`✅ Table "${table}" exists.`);
        }
    }
}

checkTables();
