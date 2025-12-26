
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listJobs() {
    console.log('--- RECENT SCRAPE JOBS ---');
    const { data: jobs, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    jobs?.forEach(job => {
        console.log(`ID: ${job.id}`);
        console.log(`Keyword: ${job.keyword}`);
        console.log(`Status: ${job.status}`);
        console.log(`Items: ${job.items_found}`);
        console.log(`Error: ${job.error_message || 'None'}`);
        console.log(`Created: ${job.created_at}`);
        console.log('-------------------');
    });
}

listJobs();
