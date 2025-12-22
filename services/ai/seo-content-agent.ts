import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseClient } from '@supabase/supabase-js';

export class SEOContentAgent {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    /**
     * Automatically generate and publish an SEO-optimized blog post based on market trends
     */
    async generateAutoPost(supabase: SupabaseClient): Promise<{ success: boolean; slug?: string; error?: string }> {
        try {
            console.log('🤖 SEO Agent: Analyzing global market benchmarks for content generation...');

            // 1. Fetch Top Benchmarks
            const { data: benchmarks, error: benchError } = await supabase
                .from('global_market_benchmarks')
                .select('*')
                .order('avg_wvs', { ascending: false })
                .limit(3);

            if (benchError || !benchmarks || benchmarks.length === 0) {
                return { success: false, error: 'Insufficient benchmark data to generate content.' };
            }

            const topNiche = benchmarks[0];
            const nicheLabel = topNiche.topic_label;
            const wvs = topNiche.avg_wvs.toFixed(1);

            console.log(`🤖 SEO Agent: Generating content for niche: ${nicheLabel} (WVS: ${wvs})`);

            // 2. Generate Content with Gemini
            const prompt = `
                You are an expert Art Market Analyst and SEO copywriter for ArtIntel.
                Write a high-ranking, 800-word blog post about the current demand for "${nicheLabel}" art.
                
                Market Context:
                - Target Topic: ${nicheLabel}
                - Demand Score (WVS): ${wvs} out of 10 (High Velocity)
                - Median Price: $${topNiche.median_price}
                
                Requirements:
                - Title: Catchy, SEO-optimized (e.g., "Market Pulse: Why ${nicheLabel} Art is Exploding in 2025")
                - Subheaders: Use H2 and H3 for structural SEO.
                - Tone: Professional, data-driven, yet accessible for artists and collectors.
                - Call to Action: Encourage readers to use ArtIntel to scan their own inventory.
                - Meta Description: A high-click-rate summary (max 160 chars).
                - Keywords: A list of 5-8 related SEO keywords.
                
                Format the output as a JSON object:
                {
                    "title": "...",
                    "slug": "...",
                    "content": "markdown_formatted_body",
                    "meta_description": "...",
                    "keywords": ["...", "..."]
                }
            `;

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            // Extract JSON from response (handling potential markdown code blocks)
            const jsonStr = responseText.includes('```json')
                ? responseText.split('```json')[1].split('```')[0].trim()
                : responseText.trim();

            const postData = JSON.parse(jsonStr);

            // 3. Save to Database
            const { data: post, error: saveError } = await supabase
                .from('blog_posts')
                .insert({
                    slug: postData.slug || postData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
                    title: postData.title,
                    content: postData.content,
                    meta_description: postData.meta_description,
                    keywords: postData.keywords,
                    is_published: true,
                    published_at: new Date().toISOString(),
                    wvs_topic_id: topNiche.id
                })
                .select()
                .single();

            if (saveError) throw saveError;

            console.log(`✅ SEO Agent: Published new post: ${post.title}`);
            return { success: true, slug: post.slug };

        } catch (error: any) {
            console.error('❌ SEO Agent Error:', error);
            return { success: false, error: error.message };
        }
    }
}

export function getSEOContentAgent() {
    return new SEOContentAgent();
}
