import { getSEOContentAgent } from './services/ai/seo-content-agent';

async function testSEOAgent() {
    console.log('🧪 Starting SEO Content Agent Smoke Test...');

    const agent = getSEOContentAgent();

    try {
        const result = await agent.generateAutoPost();

        if (result.success) {
            console.log('✅ SUCCESS: AI Agent generated and published a blog post!');
            console.log(`🔗 Slug: /blog/${result.slug}`);
        } else {
            console.log('❌ FAILED: SEO Agent could not generate post.');
            console.log(`Reason: ${result.error}`);

            if (result.error?.includes('Insufficient benchmark data')) {
                console.log('💡 TIP: Run the Global Intelligence scraper first to generate benchmarks.');
            }
        }
    } catch (error) {
        console.error('💥 CRITICAL ERROR during SEO testing:', error);
    }
}

testSEOAgent();
