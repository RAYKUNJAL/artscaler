import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export class ArtAdvisorAgent {
    /**
     * Main chat interface for the advisor
     */
    async chat(message: string, userId: string, history: any[] = []) {
        console.log(`🤖 Advisor Agent: Processing query from ${userId}...`);

        try {
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: `You are the ArtIntel Market Advisor. 
                Your goal is to help artists and resellers maximize their profit on eBay using our Global Art Intelligence database.
                
                Guidelines:
                1. Be data-driven. Use real stats from the database (WVS, median prices).
                2. Be encouraging but realistic. If a style is saturated, suggest a niche pivot.
                3. You have access to tools to fetch global market benchmarks.
                4. Keep responses concise and actionable.
                5. If you don't have specific data for a query, tell the user you'll monitor that keyword for them.`
            });

            // Fetch market context to provide in prompt (if specific keywords detected)
            const marketContext = await this.getRelevantMarketContext(message);

            const prompt = `
            User Message: ${message}
            
            Current Market Context: 
            ${JSON.stringify(marketContext)}
            
            Respond as the ArtIntel Advisor. If the user asks for pricing or demand, refer to the WVS (Watch Velocity Score) values in the context.
            `;

            const result = await model.generateContent(prompt);
            return result.response.text();

        } catch (error) {
            console.error('❌ Advisor Agent Error:', error);
            return "I'm having trouble accessing the market pulse right now. Please try again in a moment.";
        }
    }

    /**
     * Search for relevant global stats based on keywords in the message
     */
    private async getRelevantMarketContext(message: string) {
        const supabase = await createServerClient();
        const keywords = message.match(/\b(abstract|landscape|portrait|modern|contemporary|oil|acrylic|large|small)\b/gi) || [];

        if (keywords.length === 0) {
            // Default top performers context
            const { data } = await supabase
                .from('global_market_benchmarks')
                .select('*')
                .order('avg_wvs', { ascending: false })
                .limit(3);
            return { topGeneralStyles: data };
        }

        const stats = [];
        for (const kw of keywords) {
            const { data } = await supabase
                .from('global_market_benchmarks')
                .select('*')
                .ilike('term', `%${kw}%`)
                .limit(1);
            if (data && data[0]) stats.push(data[0]);
        }

        return { nicheData: stats };
    }
}

let advisorInstance: ArtAdvisorAgent | null = null;

export function getArtAdvisorAgent(): ArtAdvisorAgent {
    if (!advisorInstance) {
        advisorInstance = new ArtAdvisorAgent();
    }
    return advisorInstance;
}
