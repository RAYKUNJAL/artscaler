
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedBlog() {
    console.log('🌱 Seeding test blog post...');

    // check if it exists
    const { data: existing } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', 'test-blog-post')
        .single();

    if (existing) {
        console.log('✅ Test blog post already exists.');
        return;
    }

    const { error } = await supabase
        .from('blog_posts')
        .insert({
            title: 'Test Blog Post: The Future of AI Art',
            slug: 'test-blog-post',
            content: `
# The Future of AI in the Art Market

Artificial Intelligence is revolutionizing how we collect, value, and sell art.
In this post, we explore the *Watch Velocity Score* (WVS) and how it predicts trends.

## What is WVS?
It stands for Watch Velocity Score...
            `,
            meta_description: 'A test post about AI and Art.',
            keywords: ['AI', 'Art', 'Market'],
            is_published: true,
            published_at: new Date().toISOString(),
            wvs_topic_id: null // optional
        });

    if (error) {
        console.error('❌ Failed to seed blog post:', error.message);
    } else {
        console.log('✅ Successfully seeded "test-blog-post"');
    }
}

seedBlog();
